/**
 * Gmail Messages tools
 * Cloudflare Workers compatible - uses REST API with fetch
 * 
 * Phase 1: Core email operations
 * - search_emails: Search/list emails
 * - read_email: Get email content (with PDF parsing support)
 * - send_email: Send email (with attachment support)
 * - draft_email: Create draft (with attachment support)
 * - modify_email: Add/remove labels
 * - delete_email: Delete email
 */

import { gmailRequest, getAttachment, GmailConfig, getAccessToken } from '../utils/gmail-client.js';
import { requiredParam, optionalParam, optionalIntParam } from '../utils/validation.js';
import { handleGmailError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Recursively extract email body content from MIME message parts
 * Handles complex email structures with nested parts
 */
function extractEmailContent(messagePart: any): { text: string; html: string } {
  let textContent = '';
  let htmlContent = '';

  // If the part has a body with data, process it based on MIME type
  if (messagePart.body && messagePart.body.data) {
    // Gmail API uses base64url encoding
    const content = atob(messagePart.body.data.replace(/-/g, '+').replace(/_/g, '/'));

    if (messagePart.mimeType === 'text/plain') {
      textContent = content;
    } else if (messagePart.mimeType === 'text/html') {
      htmlContent = content;
    }
  }

  // If the part has nested parts, recursively process them
  if (messagePart.parts && messagePart.parts.length > 0) {
    for (const part of messagePart.parts) {
      const { text, html } = extractEmailContent(part);
      if (text) textContent += text;
      if (html) htmlContent += html;
    }
  }

  return { text: textContent, html: htmlContent };
}

/**
 * Extract attachment information from message parts
 */
function extractAttachments(messagePart: any, path: string = ''): Array<{ id: string; filename: string; mimeType: string; size: number }> {
  const attachments: Array<{ id: string; filename: string; mimeType: string; size: number }> = [];

  if (messagePart.body && messagePart.body.attachmentId) {
    const filename = messagePart.filename || `attachment-${messagePart.body.attachmentId}`;
    attachments.push({
      id: messagePart.body.attachmentId,
      filename: filename,
      mimeType: messagePart.mimeType || 'application/octet-stream',
      size: messagePart.body.size || 0,
    });
  }

  if (messagePart.parts) {
    for (const subpart of messagePart.parts) {
      attachments.push(...extractAttachments(subpart, `${path}/parts`));
    }
  }

  return attachments;
}

/**
 * Build RFC822 email message
 * Supports plain text, HTML, and multipart with attachments
 */
function buildEmailMessage(args: {
  to: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  mimeType?: string;
  cc?: string[];
  bcc?: string[];
  threadId?: string;
  inReplyTo?: string;
  attachments?: Array<{ filename: string; content: string; mimeType: string }>;
}): string {
  // Encode subject for non-ASCII characters (RFC 2047)
  function encodeHeader(text: string): string {
    if (/[^\x00-\x7F]/.test(text)) {
      return `=?UTF-8?B?${btoa(text)}?=`;
    }
    return text;
  }

  const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;
  const hasAttachments = args.attachments && args.attachments.length > 0;
  const hasHtml = args.htmlBody && args.mimeType !== 'text/plain';
  const isMultipart = hasAttachments || hasHtml;

  const headers: string[] = [
    'From: me',
    `To: ${args.to.join(', ')}`,
    args.cc ? `Cc: ${args.cc.join(', ')}` : '',
    args.bcc ? `Bcc: ${args.bcc.join(', ')}` : '',
    `Subject: ${encodeHeader(args.subject)}`,
    args.inReplyTo ? `In-Reply-To: ${args.inReplyTo}` : '',
    args.inReplyTo ? `References: ${args.inReplyTo}` : '',
    'MIME-Version: 1.0',
  ].filter(Boolean);

  if (isMultipart) {
    headers.push(`Content-Type: multipart/${hasAttachments ? 'mixed' : 'alternative'}; boundary="${boundary}"`);
    headers.push('');
    
    // Add alternative part (text/html) if needed
    if (hasHtml) {
      headers.push(`--${boundary}`);
      headers.push('Content-Type: multipart/alternative; boundary="alt-${boundary}"');
      headers.push('');
      headers.push(`--alt-${boundary}`);
      headers.push('Content-Type: text/plain; charset=UTF-8');
      headers.push('Content-Transfer-Encoding: 7bit');
      headers.push('');
      headers.push(args.body);
      headers.push('');
      headers.push(`--alt-${boundary}`);
      headers.push('Content-Type: text/html; charset=UTF-8');
      headers.push('Content-Transfer-Encoding: 7bit');
      headers.push('');
      headers.push(args.htmlBody || args.body);
      headers.push('');
      headers.push(`--alt-${boundary}--`);
    } else {
      // Plain text part
      headers.push(`--${boundary}`);
      headers.push('Content-Type: text/plain; charset=UTF-8');
      headers.push('Content-Transfer-Encoding: 7bit');
      headers.push('');
      headers.push(args.body);
      headers.push('');
    }

    // Add attachments
    if (hasAttachments && args.attachments) {
      for (const attachment of args.attachments) {
        headers.push(`--${boundary}`);
        headers.push(`Content-Type: ${attachment.mimeType}`);
        headers.push('Content-Transfer-Encoding: base64');
        headers.push(`Content-Disposition: attachment; filename="${encodeHeader(attachment.filename)}"`);
        headers.push('');
        // Split base64 into 76-character lines (RFC 2045)
        const base64Content = attachment.content;
        for (let i = 0; i < base64Content.length; i += 76) {
          headers.push(base64Content.substring(i, i + 76));
        }
        headers.push('');
      }
    }

    headers.push(`--${boundary}--`);
  } else {
    // Simple email (plain text or HTML only)
    if (args.mimeType === 'text/html') {
      headers.push('Content-Type: text/html; charset=UTF-8');
      headers.push('Content-Transfer-Encoding: 7bit');
      headers.push('');
      headers.push(args.htmlBody || args.body);
    } else {
      headers.push('Content-Type: text/plain; charset=UTF-8');
      headers.push('Content-Transfer-Encoding: 7bit');
      headers.push('');
      headers.push(args.body);
    }
  }

  return headers.join('\r\n');
}

/**
 * Encode email message to base64url format (Gmail API requirement)
 */
function encodeBase64Url(message: string): string {
  // Convert to base64
  const base64 = btoa(message);
  // Convert to base64url (replace + with -, / with _, remove padding)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Search emails using Gmail search syntax
 */
export async function searchEmails(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const query = requiredParam<string>(args, 'query');
    const maxResults = optionalIntParam(args, 'maxResults', 10);

    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(maxResults, 100)), // Gmail API limit
    });

    const data = await gmailRequest(`/users/me/messages?${params}`, config);
    const messages = data.messages || [];

    if (messages.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No emails found matching the search query.',
        }],
      };
    }

    // Get metadata for each message
    const results = await Promise.all(
      messages.map(async (msg: any) => {
        const detail = await gmailRequest(
          `/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          config
        );
        const headers = detail.payload?.headers || [];
        return {
          id: msg.id,
          subject: headers.find((h: any) => h.name === 'Subject')?.value || '',
          from: headers.find((h: any) => h.name === 'From')?.value || '',
          date: headers.find((h: any) => h.name === 'Date')?.value || '',
        };
      })
    );

    const summary = results.map(r =>
      `ID: ${r.id}\nSubject: ${r.subject}\nFrom: ${r.from}\nDate: ${r.date}\n`
    ).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${results.length} email${results.length === 1 ? '' : 's'}:\n\n${summary}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Read email by ID with full content
 * Includes attachment information and PDF parsing support
 */
export async function readEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const messageId = requiredParam<string>(args, 'messageId');

    const data = await gmailRequest(
      `/users/me/messages/${messageId}?format=full`,
      config
    );

    const headers = data.payload?.headers || [];
    const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
    const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
    const to = headers.find((h: any) => h.name?.toLowerCase() === 'to')?.value || '';
    const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || '';
    const threadId = data.threadId || '';

    // Extract email content
    const { text, html } = extractEmailContent(data.payload || {});
    const body = text || html || '';

    const contentTypeNote = !text && html
      ? '[Note: This email is HTML-formatted. Plain text version not available.]\n\n'
      : '';

    // Extract attachment information
    const attachments = extractAttachments(data.payload || {});
    const attachmentInfo = attachments.length > 0
      ? `\n\nAttachments (${attachments.length}):\n` +
        attachments.map(a => `- ${a.filename} (${a.mimeType}, ${Math.round(a.size / 1024)} KB, ID: ${a.id})`).join('\n')
      : '';

    // TODO: Add PDF parsing for PDF attachments
    // For now, just list attachment info

    return {
      content: [{
        type: 'text' as const,
        text: `Thread ID: ${threadId}\nSubject: ${subject}\nFrom: ${from}\nTo: ${to}\nDate: ${date}\n\n${contentTypeNote}${body}${attachmentInfo}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Send email
 * Supports plain text, HTML, multipart, and attachments
 */
export async function sendEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  const emailId = crypto.randomUUID();
  const startTime = Date.now();
  console.log(`\n[EMAIL-SEND-${emailId}] ========== EMAIL SEND START ==========`);
  console.log(`[EMAIL-SEND-${emailId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[EMAIL-SEND-${emailId}] Config:`, {
    hasAccessToken: !!config.accessToken,
    oauthBrokerUrl: config.oauthBrokerUrl || 'not set',
    userId: config.userId || 'not set',
  });
  console.log(`[EMAIL-SEND-${emailId}] Raw args:`, JSON.stringify(args, null, 2));
  
  try {
    console.log(`[EMAIL-SEND-${emailId}] 📝 Extracting parameters...`);
    const to = requiredParam<string[]>(args, 'to');
    const subject = requiredParam<string>(args, 'subject');
    const body = requiredParam<string>(args, 'body');
    const htmlBody = optionalParam<string>(args, 'htmlBody');
    const mimeType = optionalParam<string>(args, 'mimeType', 'text/plain');
    const cc = optionalParam<string[]>(args, 'cc');
    const bcc = optionalParam<string[]>(args, 'bcc');
    const threadId = optionalParam<string>(args, 'threadId');
    const inReplyTo = optionalParam<string>(args, 'inReplyTo');
    const attachments = optionalParam<Array<{ filename: string; content: string; mimeType: string }>>(args, 'attachments');
    
    console.log(`[EMAIL-SEND-${emailId}] ✅ Parameters extracted:`);
    console.log(`[EMAIL-SEND-${emailId}]   To: ${JSON.stringify(to)}`);
    console.log(`[EMAIL-SEND-${emailId}]   Subject: "${subject}"`);
    console.log(`[EMAIL-SEND-${emailId}]   Body length: ${body.length} chars`);
    console.log(`[EMAIL-SEND-${emailId}]   HTML Body: ${htmlBody ? `yes (${htmlBody.length} chars)` : 'no'}`);
    console.log(`[EMAIL-SEND-${emailId}]   MIME Type: ${mimeType}`);
    console.log(`[EMAIL-SEND-${emailId}]   CC: ${cc ? JSON.stringify(cc) : 'none'}`);
    console.log(`[EMAIL-SEND-${emailId}]   BCC: ${bcc ? JSON.stringify(bcc) : 'none'}`);
    console.log(`[EMAIL-SEND-${emailId}]   Thread ID: ${threadId || 'none'}`);
    console.log(`[EMAIL-SEND-${emailId}]   In-Reply-To: ${inReplyTo || 'none'}`);
    console.log(`[EMAIL-SEND-${emailId}]   Attachments: ${attachments ? attachments.length : 0}`);

    console.log(`[EMAIL-SEND-${emailId}] 📧 Building RFC822 message...`);
    const buildStart = Date.now();
    const message = buildEmailMessage({
      to,
      subject,
      body,
      htmlBody,
      mimeType,
      cc,
      bcc,
      threadId,
      inReplyTo,
      attachments,
    });
    const buildDuration = Date.now() - buildStart;
    console.log(`[EMAIL-SEND-${emailId}] ✅ Message built in ${buildDuration}ms (length: ${message.length} chars)`);
    console.log(`[EMAIL-SEND-${emailId}] Message preview (first 500 chars):`, message.substring(0, 500));

    console.log(`[EMAIL-SEND-${emailId}] 🔐 Encoding to base64url...`);
    const encodeStart = Date.now();
    const encodedMessage = encodeBase64Url(message);
    const encodeDuration = Date.now() - encodeStart;
    console.log(`[EMAIL-SEND-${emailId}] ✅ Encoded in ${encodeDuration}ms (length: ${encodedMessage.length} chars)`);

    console.log(`[EMAIL-SEND-${emailId}] 📤 Preparing Gmail API request...`);
    const requestBody: any = {
      raw: encodedMessage,
    };
    if (threadId) {
      requestBody.threadId = threadId;
      console.log(`[EMAIL-SEND-${emailId}]   Thread ID added: ${threadId}`);
    }
    console.log(`[EMAIL-SEND-${emailId}] Request body size: ${JSON.stringify(requestBody).length} chars`);

    console.log(`[EMAIL-SEND-${emailId}] 🌐 Calling Gmail API: POST /users/me/messages/send`);
    console.log(`[EMAIL-SEND-${emailId}] Getting access token...`);
    const apiStart = Date.now();
    const result = await gmailRequest(
      '/users/me/messages/send',
      config,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );
    const apiDuration = Date.now() - apiStart;
    const totalDuration = Date.now() - startTime;
    console.log(`[EMAIL-SEND-${emailId}] ✅ Gmail API call completed in ${apiDuration}ms`);
    console.log(`[EMAIL-SEND-${emailId}] ✅✅✅ EMAIL SENT SUCCESSFULLY in ${totalDuration}ms ✅✅✅`);
    console.log(`[EMAIL-SEND-${emailId}] Message ID: ${result.id || 'unknown'}`);
    console.log(`[EMAIL-SEND-${emailId}] Thread ID: ${result.threadId || 'unknown'}`);
    console.log(`[EMAIL-SEND-${emailId}] Full result:`, JSON.stringify(result, null, 2));
    console.log(`[EMAIL-SEND-${emailId}] ========== END EMAIL SEND ==========\n`);

    return {
      content: [{
        type: 'text' as const,
        text: `Email sent successfully with ID: ${result.id}`,
      }],
    };
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[EMAIL-SEND-${emailId}] ❌❌❌ EMAIL SEND FAILED after ${totalDuration}ms ❌❌❌`);
    console.error(`[EMAIL-SEND-${emailId}] Error: ${error.message}`);
    console.error(`[EMAIL-SEND-${emailId}] Stack:`, error.stack);
    console.error(`[EMAIL-SEND-${emailId}] Error details:`, JSON.stringify(error.response || {}, null, 2));
    console.log(`[EMAIL-SEND-${emailId}] ========== END EMAIL SEND (ERROR) ==========\n`);
    return handleGmailError(error);
  }
}

/**
 * Create draft email
 * Supports same features as send_email
 */
export async function draftEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const to = requiredParam<string[]>(args, 'to');
    const subject = requiredParam<string>(args, 'subject');
    const body = requiredParam<string>(args, 'body');
    const htmlBody = optionalParam<string>(args, 'htmlBody');
    const mimeType = optionalParam<string>(args, 'mimeType', 'text/plain');
    const cc = optionalParam<string[]>(args, 'cc');
    const bcc = optionalParam<string[]>(args, 'bcc');
    const threadId = optionalParam<string>(args, 'threadId');
    const inReplyTo = optionalParam<string>(args, 'inReplyTo');
    const attachments = optionalParam<Array<{ filename: string; content: string; mimeType: string }>>(args, 'attachments');

    // Build RFC822 message
    const message = buildEmailMessage({
      to,
      subject,
      body,
      htmlBody,
      mimeType,
      cc,
      bcc,
      threadId,
      inReplyTo,
      attachments,
    });

    // Encode to base64url
    const encodedMessage = encodeBase64Url(message);

    // Create draft via Gmail API
    const messageRequest: any = {
      raw: encodedMessage,
    };
    if (threadId) {
      messageRequest.threadId = threadId;
    }

    const result = await gmailRequest(
      '/users/me/drafts',
      config,
      {
        method: 'POST',
        body: JSON.stringify({
          message: messageRequest,
        }),
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Email draft created successfully with ID: ${result.id}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Modify email labels (add/remove labels, move to folders)
 */
export async function modifyEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const messageId = requiredParam<string>(args, 'messageId');
    const addLabelIds = optionalParam<string[]>(args, 'addLabelIds');
    const removeLabelIds = optionalParam<string[]>(args, 'removeLabelIds');

    const requestBody: any = {};
    if (addLabelIds && addLabelIds.length > 0) {
      requestBody.addLabelIds = addLabelIds;
    }
    if (removeLabelIds && removeLabelIds.length > 0) {
      requestBody.removeLabelIds = removeLabelIds;
    }

    if (Object.keys(requestBody).length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No label changes specified. Provide addLabelIds or removeLabelIds.',
        }],
      };
    }

    await gmailRequest(
      `/users/me/messages/${messageId}/modify`,
      config,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Email ${messageId} labels updated successfully`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Archive email (remove from inbox)
 * Uses modify_email to remove INBOX label instead of permanent delete
 * This is safer and doesn't require the delete scope
 */
export async function deleteEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const messageId = requiredParam<string>(args, 'messageId');

    // Archive by removing INBOX label (safer than permanent delete)
    await gmailRequest(
      `/users/me/messages/${messageId}/modify`,
      config,
      {
        method: 'POST',
        body: JSON.stringify({
          removeLabelIds: ['INBOX'],
        }),
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Email ${messageId} archived successfully (removed from inbox)`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}


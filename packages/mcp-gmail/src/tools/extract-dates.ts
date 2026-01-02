/**
 * Extract dates from email content and attachments
 * Cloudflare Workers compatible - uses REST API with fetch
 * 
 * Supports:
 * - Email body text extraction
 * - PDF attachment parsing (using pdfjs-dist)
 * - Image attachment parsing (using Claude Vision API)
 * - Regex fallback for date extraction
 */

import { gmailRequest, GmailConfig, getAttachment } from '../utils/gmail-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleGmailError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

interface DateExtractionResult {
  email_data: {
    subject: string;
    from: string;
    date: string;
    has_attachments: boolean;
    attachment_count: number;
  };
  summary?: string;
  events?: Array<{
    date: string;
    end_date?: string;
    description: string;
    time?: string;
    location?: string;
  }>;
  important_dates?: Array<{
    date: string;
    description: string;
  }>;
  date_ranges?: Array<{
    start_date: string;
    end_date: string;
    description: string;
  }>;
  dates_found?: Array<{
    text: string;
    position: number;
  }>;
  extraction_method: 'claude_api' | 'claude_vision_api' | 'regex';
  fallback_used?: boolean;
  count?: number;
  searched_pdf_content?: boolean;
  searched_image_content?: boolean;
}

/**
 * Extract year from email date for context
 */
function extractYearFromDate(emailDate: string): string {
  try {
    if (emailDate.includes('T')) {
      const datePart = emailDate.split('T')[0];
      return datePart.split('-')[0];
    }
    return emailDate.split('-')[0];
  } catch {
    return new Date().getFullYear().toString();
  }
}

/**
 * Parse PDF content using pdfjs-dist (Workers-compatible)
 * Extracts text from PDF, similar to PyPDF2/pdfplumber in Python version
 */
async function parsePDFContent(pdfData: ArrayBuffer, maxPages: number = 10): Promise<string> {
  try {
    // Dynamic import for pdfjs-dist (Workers-compatible)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: 0, // Suppress warnings
    });
    
    const pdf = await loadingTask.promise;
    const textContent: string[] = [];
    
    // Limit pages for faster parsing (dates usually in first few pages)
    const pagesToParse = Math.min(pdf.numPages, maxPages);
    
    for (let i = 1; i <= pagesToParse; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      
      // Extract text from text items
      const pageText = text.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        textContent.push(pageText);
      }
      
      // Early stop if we have enough content (dates usually in first pages)
      const combined = textContent.join('\n\n');
      if (combined.length > 20000) {
        break;
      }
    }
    
    return textContent.join('\n\n');
  } catch (error: any) {
    // If parsing fails, return empty string (might be image-only PDF)
    console.error('PDF parsing failed:', error);
    return '';
  }
}

/**
 * Parse image using Claude Vision API
 */
async function parseImageWithClaude(
  imageDataBase64: string,
  mimeType: string,
  emailSubject: string,
  emailDate: string,
  config?: GmailConfig
): Promise<DateExtractionResult | { error: string }> {
  // Check config first (for Workers), then process.env (for local)
  const apiKey = config?.anthropicApiKey || 
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!apiKey) {
    return { error: 'ANTHROPIC_API_KEY not set in environment' };
  }

  const year = extractYearFromDate(emailDate);
  const yearContext = `\n\nIMPORTANT: This email was sent on ${emailDate}. Use the year ${year} when interpreting dates. For example, 'Dec 15' means December 15, ${year}, not a previous year.`;

  const prompt = `Analyze this school newsletter image and extract all dates, events, and important information.

Email Subject: ${emailSubject}
Email Date: ${emailDate || 'Not provided'}${yearContext}

Please extract:
1. A brief summary of the newsletter (1-2 sentences)
2. All events with their dates in structured format
3. Important dates and deadlines
4. Any recurring events or date ranges

Return your response as a JSON object with this structure:
{
  "summary": "Brief summary of the newsletter",
  "events": [
    {
      "date": "YYYY-MM-DD (use the email year for dates like 'Dec 15')",
      "end_date": "YYYY-MM-DD (if date range)",
      "description": "Event description",
      "time": "HH:MM (if specified)",
      "location": "location (if specified)"
    }
  ],
  "important_dates": [
    {
      "date": "YYYY-MM-DD (use the email year)",
      "description": "What happens on this date"
    }
  ],
  "date_ranges": [
    {
      "start_date": "YYYY-MM-DD (use the email year)",
      "end_date": "YYYY-MM-DD (use the email year)",
      "description": "What happens during this range"
    }
  ]
}

CRITICAL: Use the email date year when interpreting dates. If the email is from December 2025 and you see "Dec 15", interpret it as 2025-12-15, NOT 2024-12-15.
For dates, if you see "Dec 1-5" or "Dec 1 to Dec 5", create a date range using the email year.
Extract ALL dates mentioned, including those in event lists and tables.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageDataBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Claude API error: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    const responseText = data.content[0].text.trim();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (jsonText.includes('```json')) {
      const jsonStart = jsonText.indexOf('```json') + 7;
      const jsonEnd = jsonText.indexOf('```', jsonStart);
      if (jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd).trim();
      }
    } else if (jsonText.includes('```')) {
      const jsonStart = jsonText.indexOf('```') + 3;
      const jsonEnd = jsonText.indexOf('```', jsonStart);
      if (jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd).trim();
      }
    }

    // Find JSON object boundaries
    if (!jsonText || jsonText[0] !== '{') {
      const startIdx = jsonText.indexOf('{');
      const endIdx = jsonText.lastIndexOf('}');
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(jsonText);
    return {
      ...result,
      extraction_method: 'claude_vision_api' as const,
    };
  } catch (error: any) {
    return { error: `Claude Vision API error: ${error.message}` };
  }
}

/**
 * Parse PDF/text content using Claude API
 */
async function parseTextWithClaude(
  content: string,
  emailSubject: string,
  emailDate: string,
  config?: GmailConfig
): Promise<DateExtractionResult | { error: string }> {
  // Check config first (for Workers), then process.env (for local)
  const apiKey = config?.anthropicApiKey || 
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!apiKey) {
    return { error: 'ANTHROPIC_API_KEY not set in environment' };
  }

  const year = extractYearFromDate(emailDate);
  const yearContext = `\n\nIMPORTANT: This email was sent on ${emailDate}. Use the year ${year} when interpreting dates. For example, 'Dec 15' means December 15, ${year}, not a previous year.`;

  const prompt = `Analyze this school newsletter content and extract all dates, events, and important information.

Email Subject: ${emailSubject}
Email Date: ${emailDate || 'Not provided'}${yearContext}

Content:
${content.substring(0, 20000)}  # Limited to 20k chars

Please extract:
1. A brief summary of the newsletter (1-2 sentences)
2. All events with their dates in structured format
3. Important dates and deadlines
4. Any recurring events or date ranges

Return your response as a JSON object with this structure:
{
  "summary": "Brief summary of the newsletter",
  "events": [
    {
      "date": "YYYY-MM-DD (use the email year for dates like 'Dec 15')",
      "end_date": "YYYY-MM-DD (if date range)",
      "description": "Event description",
      "time": "HH:MM (if specified)",
      "location": "location (if specified)"
    }
  ],
  "important_dates": [
    {
      "date": "YYYY-MM-DD (use the email year)",
      "description": "What happens on this date"
    }
  ],
  "date_ranges": [
    {
      "start_date": "YYYY-MM-DD (use the email year)",
      "end_date": "YYYY-MM-DD (use the email year)",
      "description": "What happens during this range"
    }
  ]
}

CRITICAL: Use the email date year when interpreting dates. If the email is from December 2025 and you see "Dec 15", interpret it as 2025-12-15, NOT 2024-12-15.
If you see "Dec 1 to Dec 5", create a date range using the email year.
Extract ALL dates mentioned, including those in "Week At A Glance" tables.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Claude API error: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    let responseText = data.content[0].text.trim();

    // Extract JSON from response
    if (responseText.includes('```json')) {
      const jsonStart = responseText.indexOf('```json') + 7;
      const jsonEnd = responseText.indexOf('```', jsonStart);
      if (jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd).trim();
      }
    } else if (responseText.includes('```')) {
      const jsonStart = responseText.indexOf('```') + 3;
      const jsonEnd = responseText.indexOf('```', jsonStart);
      if (jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd).trim();
      }
    }

    if (!responseText || responseText[0] !== '{') {
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx >= 0 && endIdx > startIdx) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(responseText);
    return {
      ...result,
      extraction_method: 'claude_api' as const,
    };
  } catch (error: any) {
    return { error: `Claude API error: ${error.message}` };
  }
}

/**
 * Extract dates using regex patterns (fallback)
 */
function extractDatesWithRegex(text: string): Array<{ text: string; position: number }> {
  const datePatterns = [
    // Numeric formats
    /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g,  // MM/DD/YYYY or DD/MM/YYYY
    /\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g,  // YYYY-MM-DD or YYYY/MM/DD
    
    // Month name formats with year
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,  // Month DD, YYYY or Month DD YYYY
    /\b\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{4}\b/gi,  // DD Month YYYY
    
    // Month name formats without year (common in newsletters)
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,  // Month DD or Month DDth
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,  // Month. DD (with period)
    
    // Day of week + date
    /\b(?:Monday|Mon|Tuesday|Tue|Wednesday|Wed|Thursday|Thu|Friday|Fri|Saturday|Sat|Sunday|Sun),?\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,  // Day, Month DD
    /\b(?:Monday|Mon|Tuesday|Tue|Wednesday|Wed|Thursday|Thu|Friday|Fri|Saturday|Sat|Sunday|Sun),?\s+\d{1,2}[\/-]\d{1,2}\b/gi,  // Day, MM/DD
    
    // Date ranges
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s*[–\-–—]\s*(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,  // Month DD - Month DD
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s+to\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,  // Month DD to Month DD
    /\b\d{1,2}[\/-]\d{1,2}\s*[–\-–—]\s*\d{1,2}[\/-]\d{1,2}\b/g,  // MM/DD - MM/DD
    
    // Dates with times (common in event listings)
    /\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/gi,  // Month DD at HH:MM AM/PM
  ];

  const datesFound: Array<{ text: string; position: number }> = [];
  const seen = new Set<string>();

  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateText = match[0];
      const normalized = dateText.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        datesFound.push({
          text: dateText,
          position: match.index || 0,
        });
      }
    }
  }

  datesFound.sort((a, b) => a.position - b.position);
  return datesFound;
}

/**
 * Extract dates from email content and attachments
 */
export async function extractDatesFromEmail(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const messageId = requiredParam<string>(args, 'messageId');
    const parseAttachments = optionalParam<boolean>(args, 'parseAttachments', true);
    const useClaude = optionalParam<boolean>(args, 'useClaude', true);

    // Get email with full content
    const emailData = await gmailRequest(
      `/users/me/messages/${messageId}?format=full`,
      config
    );

    const headers = emailData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
    const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
    const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || '';

    // Extract email body text
    let text = '';
    const extractText = (part: any) => {
      if (part.body?.data) {
        const content = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        if (part.mimeType === 'text/plain') {
          text += content;
        }
      }
      if (part.parts) {
        part.parts.forEach(extractText);
      }
    };
    extractText(emailData.payload || {});

    // Process attachments
    const attachments: any[] = [];
    const extractAttachments = (part: any) => {
      if (part.body?.attachmentId) {
        attachments.push({
          filename: part.filename || `attachment-${part.body.attachmentId}`,
          mimeType: part.mimeType || 'application/octet-stream',
          attachmentId: part.body.attachmentId,
          size: part.body.size || 0,
        });
      }
      if (part.parts) {
        part.parts.forEach(extractAttachments);
      }
    };
    extractAttachments(emailData.payload || {});

    const imageAttachments: Array<{ filename: string; imageData: string; mimeType: string }> = [];
    const pdfTexts: string[] = [];

    if (parseAttachments) {
      for (const att of attachments) {
        const filename = att.filename.toLowerCase();
        
        // Handle images
        if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.gif') || filename.endsWith('.webp')) {
          try {
            const attachmentData = await getAttachment(messageId, att.attachmentId, config);
            // Convert base64url to standard base64 for Claude API
            // Gmail API returns base64url (uses - and _), Claude expects standard base64 (uses + and /)
            const base64Data = attachmentData.data.replace(/-/g, '+').replace(/_/g, '/');
            imageAttachments.push({
              filename: att.filename,
              imageData: base64Data,
              mimeType: att.mimeType,
            });
          } catch (error) {
            // Skip if attachment can't be fetched
            console.error(`Failed to fetch image attachment ${att.filename}:`, error);
          }
        }
        
        // Handle PDFs - extract text first, then send to Claude
        if (filename.endsWith('.pdf')) {
          try {
            const attachmentData = await getAttachment(messageId, att.attachmentId, config);
            // Decode base64url to ArrayBuffer
            const pdfData = Uint8Array.from(
              atob(attachmentData.data.replace(/-/g, '+').replace(/_/g, '/')),
              c => c.charCodeAt(0)
            ).buffer;
            
            // Extract text from PDF
            const pdfText = await parsePDFContent(pdfData);
            if (pdfText) {
              pdfTexts.push(pdfText);
              text += '\n\n' + pdfText;
            }
          } catch (error) {
            // Skip if attachment can't be fetched or parsed
            console.error(`Failed to parse PDF ${att.filename}:`, error);
          }
        }
      }
    }

    // Try Claude API first if available
    let claudeResult: DateExtractionResult | { error: string } | null = null;
    
    if (useClaude) {
      // Priority: Images first, then PDFs, then email body
      if (imageAttachments.length > 0) {
        const imageAtt = imageAttachments[0];
        claudeResult = await parseImageWithClaude(
          imageAtt.imageData,
          imageAtt.mimeType,
          subject,
          date,
          config
        );
      } else if (pdfTexts.length > 0) {
        const pdfContent = pdfTexts.join('\n\n---\n\n').substring(0, 20000);
        claudeResult = await parseTextWithClaude(pdfContent, subject, date, config);
      } else if (text && text.trim().length > 50) {
        const textLimited = text.substring(0, 20000);
        claudeResult = await parseTextWithClaude(textLimited, subject, date, config);
      }
    }

    // If Claude succeeded, return that result
    if (claudeResult && !('error' in claudeResult)) {
      const { email_data: _, ...claudeResultWithoutEmailData } = claudeResult;
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            email_data: {
              subject,
              from,
              date,
              has_attachments: attachments.length > 0,
              attachment_count: attachments.length,
            },
            ...claudeResultWithoutEmailData,
            fallback_used: false,
          }, null, 2),
        }],
      };
    }

    // Fallback to regex extraction
    const datesFound = extractDatesWithRegex(text);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          email_data: {
            subject,
            from,
            date,
            has_attachments: attachments.length > 0,
            attachment_count: attachments.length,
          },
          dates_found: datesFound,
          count: datesFound.length,
          searched_pdf_content: pdfTexts.length > 0,
          searched_image_content: imageAttachments.length > 0,
          extraction_method: 'regex' as const,
          fallback_used: true,
          claude_error: claudeResult && 'error' in claudeResult ? claudeResult.error : null,
        }, null, 2),
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}


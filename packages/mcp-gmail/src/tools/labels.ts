/**
 * Gmail Labels tools
 * Cloudflare Workers compatible - uses REST API with fetch
 * 
 * Phase 2: Label management
 * - list_labels: List all labels (system and user)
 * - create_label: Create a new label
 * - update_label: Update an existing label
 * - delete_label: Delete a user label
 * - get_or_create_label: Get existing label or create if not found
 */

import { gmailRequest, GmailConfig } from '../utils/gmail-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleGmailError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

/**
 * List all Gmail labels
 */
export async function listLabels(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const data = await gmailRequest('/users/me/labels', config);
    const labels = data.labels || [];

    // Group labels by type
    const systemLabels = labels.filter((label: GmailLabel) => label.type === 'system');
    const userLabels = labels.filter((label: GmailLabel) => label.type === 'user');

    const systemText = systemLabels.length > 0
      ? 'System Labels:\n' + systemLabels.map((l: GmailLabel) => `ID: ${l.id}\nName: ${l.name}\n`).join('\n')
      : 'No system labels';

    const userText = userLabels.length > 0
      ? '\n\nUser Labels:\n' + userLabels.map((l: GmailLabel) => `ID: ${l.id}\nName: ${l.name}\n`).join('\n')
      : '\n\nNo user labels';

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${labels.length} labels (${systemLabels.length} system, ${userLabels.length} user):\n\n${systemText}${userText}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Create a new Gmail label
 */
export async function createLabel(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const name = requiredParam<string>(args, 'name');
    const messageListVisibility = optionalParam<string>(args, 'messageListVisibility', 'show');
    const labelListVisibility = optionalParam<string>(args, 'labelListVisibility', 'labelShow');

    const requestBody: any = {
      name,
      messageListVisibility,
      labelListVisibility,
    };

    const result = await gmailRequest('/users/me/labels', config, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Label created successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
      }],
    };
  } catch (error: any) {
    // Handle duplicate labels more gracefully
    if (error.message && error.message.includes('already exists')) {
      return {
        content: [{
          type: 'text' as const,
          text: `Label "${args.name}" already exists. Please use a different name.`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Update an existing Gmail label
 */
export async function updateLabel(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const id = requiredParam<string>(args, 'id');
    const name = optionalParam<string>(args, 'name');
    const messageListVisibility = optionalParam<string>(args, 'messageListVisibility');
    const labelListVisibility = optionalParam<string>(args, 'labelListVisibility');

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (messageListVisibility !== undefined) updates.messageListVisibility = messageListVisibility;
    if (labelListVisibility !== undefined) updates.labelListVisibility = labelListVisibility;

    if (Object.keys(updates).length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No updates specified. Provide name, messageListVisibility, or labelListVisibility.',
        }],
      };
    }

    const result = await gmailRequest(`/users/me/labels/${id}`, config, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Label updated successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
      }],
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        content: [{
          type: 'text' as const,
          text: `Label with ID "${args.id}" not found.`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Delete a Gmail label
 */
export async function deleteLabel(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const id = requiredParam<string>(args, 'id');

    // First check if it's a system label
    const label = await gmailRequest(`/users/me/labels/${id}`, config);
    
    if (label.type === 'system') {
      return {
        content: [{
          type: 'text' as const,
          text: `Cannot delete system label "${label.name}". Only user-created labels can be deleted.`,
        }],
        isError: true,
      };
    }

    await gmailRequest(`/users/me/labels/${id}`, config, {
      method: 'DELETE',
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Label "${label.name}" deleted successfully.`,
      }],
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        content: [{
          type: 'text' as const,
          text: `Label with ID "${args.id}" not found.`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Find a label by name (case-insensitive)
 */
async function findLabelByName(
  config: GmailConfig,
  labelName: string
): Promise<GmailLabel | null> {
  try {
    const data = await gmailRequest('/users/me/labels', config);
    const labels = data.labels || [];
    
    // Case-insensitive match
    const foundLabel = labels.find(
      (label: GmailLabel) => label.name.toLowerCase() === labelName.toLowerCase()
    );
    
    return foundLabel || null;
  } catch (error: any) {
    return null;
  }
}

/**
 * Get existing label or create if not found
 */
export async function getOrCreateLabel(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const name = requiredParam<string>(args, 'name');
    const messageListVisibility = optionalParam<string>(args, 'messageListVisibility', 'show');
    const labelListVisibility = optionalParam<string>(args, 'labelListVisibility', 'labelShow');

    // First try to find an existing label
    const existingLabel = await findLabelByName(config, name);
    
    if (existingLabel) {
      return {
        content: [{
          type: 'text' as const,
          text: `Found existing label:\nID: ${existingLabel.id}\nName: ${existingLabel.name}\nType: ${existingLabel.type || 'user'}`,
        }],
      };
    }
    
    // If not found, create a new one
    const requestBody: any = {
      name,
      messageListVisibility,
      labelListVisibility,
    };

    const result = await gmailRequest('/users/me/labels', config, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Created new label:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}


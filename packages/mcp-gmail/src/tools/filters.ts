/**
 * Gmail Filters tools
 * Cloudflare Workers compatible - uses REST API with fetch
 * 
 * Phase 2: Filter management
 * - list_filters: List all filters
 * - create_filter: Create a new filter
 * - get_filter: Get a specific filter
 * - delete_filter: Delete a filter
 * - create_filter_from_template: Create filter using pre-defined templates
 */

import { gmailRequest, GmailConfig } from '../utils/gmail-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleGmailError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface GmailFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  query?: string;
  negatedQuery?: string;
  hasAttachment?: boolean;
  excludeChats?: boolean;
  size?: number;
  sizeComparison?: 'unspecified' | 'smaller' | 'larger';
}

export interface GmailFilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  forward?: string;
}

export interface GmailFilter {
  id?: string;
  criteria: GmailFilterCriteria;
  action: GmailFilterAction;
}

/**
 * List all Gmail filters
 */
export async function listFilters(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const data = await gmailRequest('/users/me/settings/filters', config);
    const filters = data.filters || [];

    if (filters.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No filters found.',
        }],
      };
    }

    const filtersText = filters.map((filter: GmailFilter) => {
      const criteriaEntries = Object.entries(filter.criteria || {})
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      const actionEntries = Object.entries(filter.action || {})
        .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(', ');

      return `ID: ${filter.id}\nCriteria: ${criteriaEntries}\nActions: ${actionEntries}\n`;
    }).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${filters.length} filters:\n\n${filtersText}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}

/**
 * Create a new Gmail filter
 */
export async function createFilter(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const criteria = requiredParam<GmailFilterCriteria>(args, 'criteria');
    const action = requiredParam<GmailFilterAction>(args, 'action');

    const filterBody: GmailFilter = {
      criteria,
      action,
    };

    const result = await gmailRequest('/users/me/settings/filters', config, {
      method: 'POST',
      body: JSON.stringify(filterBody),
    });

    // Format criteria for display
    const criteriaText = Object.entries(criteria)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    // Format actions for display
    const actionText = Object.entries(action)
      .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join(', ');

    return {
      content: [{
        type: 'text' as const,
        text: `Filter created successfully:\nID: ${result.id}\nCriteria: ${criteriaText}\nActions: ${actionText}`,
      }],
    };
  } catch (error: any) {
    if (error.status === 400) {
      return {
        content: [{
          type: 'text' as const,
          text: `Invalid filter criteria or action: ${error.message}`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Get a specific Gmail filter
 */
export async function getFilter(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const filterId = requiredParam<string>(args, 'filterId');

    const result = await gmailRequest(`/users/me/settings/filters/${filterId}`, config);

    const criteriaText = Object.entries(result.criteria || {})
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    const actionText = Object.entries(result.action || {})
      .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join(', ');

    return {
      content: [{
        type: 'text' as const,
        text: `Filter details:\nID: ${result.id}\nCriteria: ${criteriaText}\nActions: ${actionText}`,
      }],
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        content: [{
          type: 'text' as const,
          text: `Filter with ID "${args.filterId}" not found.`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Delete a Gmail filter
 */
export async function deleteFilter(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const filterId = requiredParam<string>(args, 'filterId');

    await gmailRequest(`/users/me/settings/filters/${filterId}`, config, {
      method: 'DELETE',
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Filter "${filterId}" deleted successfully.`,
      }],
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        content: [{
          type: 'text' as const,
          text: `Filter with ID "${args.filterId}" not found.`,
        }],
        isError: true,
      };
    }
    return handleGmailError(error);
  }
}

/**
 * Filter templates for common use cases
 */
export const filterTemplates = {
  /**
   * Filter emails from a specific sender
   */
  fromSender: (senderEmail: string, labelIds: string[] = [], archive: boolean = false): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { from: senderEmail },
    action: {
      addLabelIds: labelIds.length > 0 ? labelIds : undefined,
      removeLabelIds: archive ? ['INBOX'] : undefined,
    },
  }),

  /**
   * Filter emails with specific subject
   */
  withSubject: (subjectText: string, labelIds: string[] = [], markAsRead: boolean = false): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { subject: subjectText },
    action: {
      addLabelIds: labelIds.length > 0 ? labelIds : undefined,
      removeLabelIds: markAsRead ? ['UNREAD'] : undefined,
    },
  }),

  /**
   * Filter emails with attachments
   */
  withAttachments: (labelIds: string[] = []): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { hasAttachment: true },
    action: { addLabelIds: labelIds.length > 0 ? labelIds : undefined },
  }),

  /**
   * Filter large emails
   */
  largeEmails: (sizeInBytes: number, labelIds: string[] = []): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { size: sizeInBytes, sizeComparison: 'larger' },
    action: { addLabelIds: labelIds.length > 0 ? labelIds : undefined },
  }),

  /**
   * Filter emails containing specific text
   */
  containingText: (searchText: string, labelIds: string[] = [], markImportant: boolean = false): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { query: `"${searchText}"` },
    action: {
      addLabelIds: markImportant ? [...labelIds, 'IMPORTANT'] : (labelIds.length > 0 ? labelIds : undefined),
    },
  }),

  /**
   * Filter mailing list emails
   */
  mailingList: (listIdentifier: string, labelIds: string[] = [], archive: boolean = true): { criteria: GmailFilterCriteria, action: GmailFilterAction } => ({
    criteria: { query: `list:${listIdentifier} OR subject:[${listIdentifier}]` },
    action: {
      addLabelIds: labelIds.length > 0 ? labelIds : undefined,
      removeLabelIds: archive ? ['INBOX'] : undefined,
    },
  }),
};

/**
 * Create a filter using a pre-defined template
 */
export async function createFilterFromTemplate(
  config: GmailConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const template = requiredParam<string>(args, 'template');
    const params = requiredParam<Record<string, any>>(args, 'parameters');

    let filterConfig: { criteria: GmailFilterCriteria, action: GmailFilterAction };
    
    switch (template) {
      case 'fromSender':
        if (!params.senderEmail) {
          throw new Error('senderEmail is required for fromSender template');
        }
        filterConfig = filterTemplates.fromSender(
          params.senderEmail,
          params.labelIds || [],
          params.archive || false
        );
        break;
      case 'withSubject':
        if (!params.subjectText) {
          throw new Error('subjectText is required for withSubject template');
        }
        filterConfig = filterTemplates.withSubject(
          params.subjectText,
          params.labelIds || [],
          params.markAsRead || false
        );
        break;
      case 'withAttachments':
        filterConfig = filterTemplates.withAttachments(params.labelIds || []);
        break;
      case 'largeEmails':
        if (!params.sizeInBytes) {
          throw new Error('sizeInBytes is required for largeEmails template');
        }
        filterConfig = filterTemplates.largeEmails(
          params.sizeInBytes,
          params.labelIds || []
        );
        break;
      case 'containingText':
        if (!params.searchText) {
          throw new Error('searchText is required for containingText template');
        }
        filterConfig = filterTemplates.containingText(
          params.searchText,
          params.labelIds || [],
          params.markImportant || false
        );
        break;
      case 'mailingList':
        if (!params.listIdentifier) {
          throw new Error('listIdentifier is required for mailingList template');
        }
        filterConfig = filterTemplates.mailingList(
          params.listIdentifier,
          params.labelIds || [],
          params.archive !== undefined ? params.archive : true
        );
        break;
      default:
        throw new Error(`Unknown template: ${template}`);
    }

    const filterBody: GmailFilter = {
      criteria: filterConfig.criteria,
      action: filterConfig.action,
    };

    const result = await gmailRequest('/users/me/settings/filters', config, {
      method: 'POST',
      body: JSON.stringify(filterBody),
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Filter created from template '${template}':\nID: ${result.id}\nTemplate used: ${template}`,
      }],
    };
  } catch (error: any) {
    return handleGmailError(error);
  }
}


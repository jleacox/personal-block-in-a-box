

/**
 * Gmail MCP Handler
 */
export class GmailMCP {
  private config: GmailConfig;

  constructor(
    accessToken?: string,
    oauthBrokerUrl?: string,
    userId?: string,
    anthropicApiKey?: string
  ) {
    this.config = {
      accessToken,
      oauthBrokerUrl,
      userId,
      anthropicApiKey,
    };
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      { name: 'search_emails', description: 'Search for emails using Gmail search syntax', inputSchema: { type: 'object', properties: { query: { type: 'string' }, maxResults: { type: 'number', default: 10 } }, required: ['query'] } },
      { name: 'read_email', description: 'Retrieves the content of a specific email by its ID', inputSchema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] } },
      { name: 'send_email', description: 'Sends a new email immediately', inputSchema: { type: 'object', properties: { to: { type: 'array', items: { type: 'string' } }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'draft_email', description: 'Creates a draft email without sending it', inputSchema: { type: 'object', properties: { to: { type: 'array', items: { type: 'string' } }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'modify_email', description: 'Modifies email labels', inputSchema: { type: 'object', properties: { messageId: { type: 'string' }, addLabelIds: { type: 'array', items: { type: 'string' } }, removeLabelIds: { type: 'array', items: { type: 'string' } } }, required: ['messageId'] } },
      { name: 'list_labels', description: 'Retrieves all available Gmail labels', inputSchema: { type: 'object', properties: {} } },
      { name: 'create_label', description: 'Creates a new Gmail label', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      { name: 'update_label', description: 'Updates an existing Gmail label', inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id'] } },
      { name: 'delete_label', description: 'Deletes a Gmail label', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'get_or_create_label', description: 'Gets an existing label by name or creates it', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      { name: 'list_filters', description: 'Retrieves all Gmail filters', inputSchema: { type: 'object', properties: {} } },
      { name: 'create_filter', description: 'Creates a new Gmail filter', inputSchema: { type: 'object', properties: { criteria: { type: 'object' }, action: { type: 'object' } }, required: ['criteria', 'action'] } },
      { name: 'get_filter', description: 'Gets details of a specific Gmail filter', inputSchema: { type: 'object', properties: { filterId: { type: 'string' } }, required: ['filterId'] } },
      { name: 'delete_filter', description: 'Deletes a Gmail filter', inputSchema: { type: 'object', properties: { filterId: { type: 'string' } }, required: ['filterId'] } },
      { name: 'create_filter_from_template', description: 'Creates a filter using a pre-defined template', inputSchema: { type: 'object', properties: { template: { type: 'string' }, parameters: { type: 'object' } }, required: ['template', 'parameters'] } },
      { name: 'extract_dates_from_email', description: 'Extract dates and events from email content and PDF/image attachments', inputSchema: { type: 'object', properties: { messageId: { type: 'string' }, required: ['messageId'] } } },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'search_emails': return await gmailMessages.searchEmails(this.config, args);
        case 'read_email': return await gmailMessages.readEmail(this.config, args);
        case 'send_email': return await gmailMessages.sendEmail(this.config, args);
        case 'draft_email': return await gmailMessages.draftEmail(this.config, args);
        case 'modify_email': return await gmailMessages.modifyEmail(this.config, args);
        case 'list_labels': return await gmailLabels.listLabels(this.config, args);
        case 'create_label': return await gmailLabels.createLabel(this.config, args);
        case 'update_label': return await gmailLabels.updateLabel(this.config, args);
        case 'delete_label': return await gmailLabels.deleteLabel(this.config, args);
        case 'get_or_create_label': return await gmailLabels.getOrCreateLabel(this.config, args);
        case 'list_filters': return await gmailFilters.listFilters(this.config, args);
        case 'create_filter': return await gmailFilters.createFilter(this.config, args);
        case 'get_filter': return await gmailFilters.getFilter(this.config, args);
        case 'delete_filter': return await gmailFilters.deleteFilter(this.config, args);
        case 'create_filter_from_template': return await gmailFilters.createFilterFromTemplate(this.config, args);
        case 'extract_dates_from_email': return await gmailExtractDates.extractDatesFromEmail(this.config, args);
        default: return { content: [{ type: 'text', text: Unknown Gmail tool:  }], isError: true };
      }
    } catch (error: any) {
      return { content: [{ type: 'text', text: Gmail tool error:  }], isError: true };
    }
  }
}


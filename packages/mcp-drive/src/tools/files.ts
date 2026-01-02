/**
 * Google Drive Files tools
 * Cloudflare Workers compatible - uses REST API with fetch
 * 
 * Minimal implementation following consolidation philosophy:
 * - read_file: Read .md file from Drive
 * - write_file: Write/update .md file to Drive
 * - list_files: List files in a folder (for finding context docs)
 * - search: Search across all Drive (not just a folder)
 * - createFolder: Create folders for organizing context docs
 * - moveItem: Move files/folders between folders (for organization)
 * - renameItem: Rename files/folders
 */

import { driveRequest, downloadFile, uploadFile, DriveConfig, getAccessToken } from '../utils/drive-client.js';
import { requiredParam, optionalParam } from '../utils/validation.js';
import { handleDriveError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Read file from Google Drive
 * Supports both regular files and Google Docs (exports to markdown)
 */
export async function readFile(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const fileId = requiredParam<string>(args, 'fileId');
    
    // First, get file metadata to determine MIME type
    const fileMetadata = await driveRequest(`/files/${fileId}?fields=id,name,mimeType`, config);
    const mimeType = fileMetadata.mimeType;

    // Determine export format based on MIME type
    let content: string;
    let exportMimeType: string | undefined;

    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Doc - export as markdown
      exportMimeType = 'text/markdown';
      content = await downloadFile(fileId, config, exportMimeType);
    } else if (mimeType === 'text/markdown' || mimeType === 'text/plain') {
      // Regular text/markdown file - download directly
      content = await downloadFile(fileId, config);
    } else {
      // Try to export as text if it's a Google Workspace file
      if (mimeType.startsWith('application/vnd.google-apps.')) {
        exportMimeType = 'text/plain';
        content = await downloadFile(fileId, config, exportMimeType);
      } else {
        // For other file types, try to download as-is
        content = await downloadFile(fileId, config);
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `File: ${fileMetadata.name}\n\n${content}`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * Write or update file in Google Drive
 * Creates new file if fileId not provided, updates existing file if fileId provided
 */
export async function writeFile(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const fileName = requiredParam<string>(args, 'fileName');
    const content = requiredParam<string>(args, 'content');
    const fileId = optionalParam<string>(args, 'fileId'); // Optional - if provided, updates existing file
    const parentFolderId = optionalParam<string>(args, 'parentFolderId'); // Optional - folder to place file in

    // Determine MIME type from file extension
    let mimeType = 'text/plain';
    if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      mimeType = 'text/markdown';
    } else if (fileName.endsWith('.txt')) {
      mimeType = 'text/plain';
    }

    const result = await uploadFile(fileId, fileName, content, mimeType, config, parentFolderId);

    const action = fileId ? 'updated' : 'created';
    return {
      content: [{
        type: 'text' as const,
        text: `File ${action} successfully.\n\nFile ID: ${result.id}\nFile Name: ${result.name}\nView: https://drive.google.com/file/d/${result.id}/view`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * List files in a folder
 * Supports listing root folder (if folderId not provided) or specific folder
 * Also supports search query to find files by name
 */
export async function listFiles(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const folderId = optionalParam<string>(args, 'folderId'); // Optional - defaults to root if not provided
    const query = optionalParam<string>(args, 'query'); // Optional - search query
    const pageSize = optionalParam<number>(args, 'pageSize', 50); // Optional - max 100

    // Build query string
    let q = 'trashed=false';
    
    if (folderId) {
      // List files in specific folder
      q += ` and '${folderId}' in parents`;
    } else {
      // List files in root (not in any folder)
      q += " and 'root' in parents";
    }

    if (query) {
      // Add search query (searches in file name)
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    // Add file type filter - only show files (not folders) and markdown/text files
    q += " and mimeType != 'application/vnd.google-apps.folder'";
    q += " and (mimeType = 'text/markdown' or mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.document')";

    const params = new URLSearchParams({
      q,
      pageSize: String(Math.min(pageSize || 50, 100)), // Max 100
      fields: 'files(id,name,mimeType,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
    });

    const data = await driveRequest(`/files?${params}`, config);
    const files = data.files || [];

    if (files.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No files found',
        }],
      };
    }

    const summary = files.map((file: any) => {
      const size = file.size ? ` (${(parseInt(file.size) / 1024).toFixed(1)} KB)` : '';
      const modified = file.modifiedTime ? ` - Modified: ${new Date(file.modifiedTime).toLocaleDateString()}` : '';
      const type = file.mimeType === 'application/vnd.google-apps.document' ? ' [Google Doc]' : '';
      return `- ${file.name}${type} (ID: ${file.id})${size}${modified}`;
    }).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${files.length} file${files.length === 1 ? '' : 's'}:\n\n${summary}`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * Search for files across Google Drive
 * Searches across entire Drive (not limited to a folder)
 * Uses full-text search to find files by name and content
 */
export async function search(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const query = requiredParam<string>(args, 'query');
    const pageSize = optionalParam<number>(args, 'pageSize', 50);
    const pageToken = optionalParam<string>(args, 'pageToken');

    // Escape single quotes in query
    const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    // Build search query - fullText search across all Drive
    const q = `fullText contains '${escapedQuery}' and trashed = false`;

    const params = new URLSearchParams({
      q,
      pageSize: String(Math.min(pageSize || 50, 100)), // Max 100
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const data = await driveRequest(`/files?${params}`, config);
    const files = data.files || [];

    if (files.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No files found',
        }],
      };
    }

    const summary = files.map((file: any) => {
      const size = file.size ? ` (${(parseInt(file.size) / 1024).toFixed(1)} KB)` : '';
      const modified = file.modifiedTime ? ` - Modified: ${new Date(file.modifiedTime).toLocaleDateString()}` : '';
      const type = file.mimeType === 'application/vnd.google-apps.document' ? ' [Google Doc]' : 
                   file.mimeType === 'application/vnd.google-apps.folder' ? ' [Folder]' : '';
      return `- ${file.name}${type} (ID: ${file.id})${size}${modified}`;
    }).join('\n');

    let response = `Found ${files.length} file${files.length === 1 ? '' : 's'}:\n\n${summary}`;
    if (data.nextPageToken) {
      response += `\n\nMore results available. Use pageToken: ${data.nextPageToken}`;
    }

    return {
      content: [{
        type: 'text' as const,
        text: response,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * Create a new folder in Google Drive
 * Creates folder in root if parentFolderId not provided
 */
export async function createFolder(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const name = requiredParam<string>(args, 'name');
    const parentFolderId = optionalParam<string>(args, 'parentFolderId'); // Optional - defaults to root

    const token = await getAccessToken(config);

    if (!token) {
      throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
    }

    // Create folder metadata
    const metadata: any = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const url = 'https://www.googleapis.com/drive/v3/files';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      
      const error: any = new Error(`Google Drive API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }

    const result = await response.json();

    return {
      content: [{
        type: 'text' as const,
        text: `Folder created successfully.\n\nFolder ID: ${result.id}\nFolder Name: ${result.name}\nView: https://drive.google.com/drive/folders/${result.id}`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * Move a file or folder to a different location
 * Useful for organizing files after upload or reorganizing folder structure
 */
export async function moveItem(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const itemId = requiredParam<string>(args, 'itemId');
    const destinationFolderId = optionalParam<string>(args, 'destinationFolderId'); // Optional - defaults to root

    const token = await getAccessToken(config);

    if (!token) {
      throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
    }

    // Get current file/folder info to find parent folders
    const item = await driveRequest(`/files/${itemId}?fields=id,name,parents`, config);
    const currentParents = item.parents || [];

    // Determine destination (root if not provided)
    const targetParentId = destinationFolderId || 'root';

    // Can't move a folder into itself
    if (targetParentId === itemId) {
      throw new Error('Cannot move a folder into itself');
    }

    // Move the item: add new parent, remove old parents
    const url = `https://www.googleapis.com/drive/v3/files/${itemId}?addParents=${targetParentId}&removeParents=${currentParents.join(',')}&fields=id,name,parents`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      
      const error: any = new Error(`Google Drive API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }

    const result = await response.json();

    // Get destination folder name for better response
    let destinationName = 'root';
    if (targetParentId !== 'root') {
      try {
        const destFolder = await driveRequest(`/files/${targetParentId}?fields=name`, config);
        destinationName = destFolder.name;
      } catch {
        destinationName = 'folder';
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Successfully moved "${result.name}" to "${destinationName}"`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}

/**
 * Rename a file or folder
 * Useful when file names need to change or be corrected
 */
export async function renameItem(
  config: DriveConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const itemId = requiredParam<string>(args, 'itemId');
    const newName = requiredParam<string>(args, 'newName');

    const token = await getAccessToken(config);

    if (!token) {
      throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
    }

    // Get current name for response
    const currentItem = await driveRequest(`/files/${itemId}?fields=id,name`, config);

    // Update the name
    const url = `https://www.googleapis.com/drive/v3/files/${itemId}?fields=id,name`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      
      const error: any = new Error(`Google Drive API error: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }

    const result = await response.json();

    return {
      content: [{
        type: 'text' as const,
        text: `Successfully renamed "${currentItem.name}" to "${result.name}"`,
      }],
    };
  } catch (error: any) {
    return handleDriveError(error);
  }
}


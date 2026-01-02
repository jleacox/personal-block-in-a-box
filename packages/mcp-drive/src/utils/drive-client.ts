/**
 * Google Drive API client using REST API (Cloudflare Workers compatible)
 * Uses fetch instead of googleapis package
 * 
 * Authentication priority:
 * 1. OAuth broker (recommended) - No local credentials needed!
 * 2. Direct access token (temporary fallback for local dev)
 * 
 * Note: OAuth broker handles refresh tokens automatically, so you don't need
 * to store client_id, client_secret, or refresh_token locally.
 */

export interface DriveConfig {
  accessToken?: string;
  oauthBrokerUrl?: string;
  userId?: string;
}

/**
 * Get access token from OAuth broker or direct token
 * 
 * OAuth broker is recommended - it handles refresh tokens automatically
 * and stores credentials securely in Cloudflare KV (not in local files).
 */
export async function getAccessToken(
  config: DriveConfig
): Promise<string | undefined> {
  // Priority 1: OAuth broker (recommended - no local credentials needed!)
  if (config.oauthBrokerUrl && config.userId) {
    try {
      const response = await fetch(`${config.oauthBrokerUrl}/token/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: config.userId }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else {
        console.error(`OAuth broker error: ${response.status} ${response.statusText}`);
        // Fall through to direct token for local dev
      }
    } catch (error) {
      console.error('Failed to fetch token from OAuth broker:', error);
      // Fall through to direct token for local dev
    }
  }

  // Priority 2: Direct access token (temporary fallback for local dev)
  // Note: This requires manual token refresh. Use OAuth broker for production!
  return config.accessToken || (typeof process !== 'undefined' ? process.env.GOOGLE_ACCESS_TOKEN : undefined);
}

/**
 * Make authenticated request to Google Drive API
 */
export async function driveRequest(
  endpoint: string,
  config: DriveConfig,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAccessToken(config);

  if (!token) {
    throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  const url = `https://www.googleapis.com/drive/v3${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
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

  return response.json();
}

/**
 * Download file content from Google Drive
 * Handles both regular files and Google Workspace files (Docs, Sheets, etc.)
 */
export async function downloadFile(
  fileId: string,
  config: DriveConfig,
  mimeType?: string
): Promise<string> {
  const token = await getAccessToken(config);

  if (!token) {
    throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  // For Google Workspace files, use export endpoint
  if (mimeType) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
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

    return response.text();
  }

  // For regular files, use download endpoint
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
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

  return response.text();
}

/**
 * Upload file content to Google Drive
 * Creates or updates a file
 */
export async function uploadFile(
  fileId: string | undefined,
  fileName: string,
  content: string,
  mimeType: string,
  config: DriveConfig,
  parentFolderId?: string
): Promise<any> {
  const token = await getAccessToken(config);

  if (!token) {
    throw new Error('No Google Drive access token available. Configure OAuth broker (recommended) or set GOOGLE_ACCESS_TOKEN for local dev.');
  }

  // If fileId exists, update the file
  if (fileId) {
    // Update metadata
    const metadata: any = {
      name: fileName,
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    // Update file content
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    
    // Create multipart body
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const metadataPart = JSON.stringify(metadata);
    const contentPart = content;
    
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadataPart,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      contentPart,
      `--${boundary}--`,
    ].join('\r\n');

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
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

    return response.json();
  } else {
    // Create new file
    const metadata: any = {
      name: fileName,
      mimeType: mimeType,
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
    
    // Create multipart body
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const metadataPart = JSON.stringify(metadata);
    const contentPart = content;
    
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadataPart,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      contentPart,
      `--${boundary}--`,
    ].join('\r\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
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

    return response.json();
  }
}


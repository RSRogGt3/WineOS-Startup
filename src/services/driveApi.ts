import { getAccessToken, googleSignIn } from './auth';

export interface DriveUploadResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  size?: string;
}

/**
 * Uploads a file (Blob or File) to Google Drive using multipart upload.
 * If user is not signed in or token expired, attempts sign-in.
 */
export async function uploadZipToDrive(
  blob: Blob,
  fileName: string,
  description: string = 'Arch Wine OS ISO Configuration Kit generated via Arch Wine OS Studio'
): Promise<DriveUploadResponse> {
  let token = await getAccessToken();

  if (!token) {
    const authResult = await googleSignIn();
    if (!authResult || !authResult.accessToken) {
      throw new Error('Google authentication required to upload to Google Drive.');
    }
    token = authResult.accessToken;
  }

  const metadata = {
    name: fileName,
    description: description,
    mimeType: 'application/zip',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Convert Blob to ArrayBuffer
  const fileBuffer = await blob.arrayBuffer();

  const metadataHeader =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/zip\r\n\r\n';

  const metadataUint8 = new TextEncoder().encode(metadataHeader);
  const closeUint8 = new TextEncoder().encode(closeDelimiter);
  const bodyUint8 = new Uint8Array(metadataUint8.byteLength + fileBuffer.byteLength + closeUint8.byteLength);

  bodyUint8.set(metadataUint8, 0);
  bodyUint8.set(new Uint8Array(fileBuffer), metadataUint8.byteLength);
  bodyUint8.set(closeUint8, metadataUint8.byteLength + fileBuffer.byteLength);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyUint8,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      // Try one re-login if token expired
      const authResult = await googleSignIn();
      if (authResult?.accessToken) {
        return uploadZipToDrive(blob, fileName, description);
      }
      throw new Error('Google Drive session expired or unauthorized. Please re-authenticate.');
    }
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Google Drive upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List previously uploaded Arch Wine OS kits from the user's Drive.
 */
export async function listUploadedKits(): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const query = encodeURIComponent("name contains 'arch-' and (mimeType = 'application/zip' or mimeType = 'application/x-zip-compressed') and trashed = false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=10&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,size)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (e) {
    console.error('Error fetching drive files:', e);
    return [];
  }
}

import fs from "fs";
import { getDriveClient } from "./googleDriveOAuth.js";

export async function uploadToGoogleDrive(filePath, remotePath, parentFolderId = null) {
  const driveClient = await getDriveClient();
  const rootFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  try {
    // Parse the path to get folders and filename
    const parts = remotePath.split('/');
    const fileName = parts.pop();
    const folderPath = parts;

    // Create nested folder structure if no parentFolderId provided
    let targetFolderId = rootFolderId;
    
    if (!parentFolderId && folderPath.length > 0) {
      for (const folderName of folderPath) {
        if (!folderName) continue;
        
        // Check if folder already exists
        const folderSearchResponse = await driveClient.files.list({
          q: `name='${folderName}' and '${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id)',
        });

        if (folderSearchResponse.data.files && folderSearchResponse.data.files.length > 0) {
          // Folder exists, use it
          targetFolderId = folderSearchResponse.data.files[0].id;
        } else {
          // Create the folder
          const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [targetFolderId],
          };

          const folderResponse = await driveClient.files.create({
            requestBody: folderMetadata,
            fields: 'id',
          });

          targetFolderId = folderResponse.data.id;
        }
      }
    }

    // Now upload the file to the target folder
    const searchResponse = await driveClient.files.list({
      q: `name='${fileName}' and '${targetFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    let fileId;

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      fileId = searchResponse.data.files[0].id;
    } else {
      const fileMetadata = {
        name: fileName,
        parents: [targetFolderId],
      };

      const media = {
        mimeType: getMimeType(remotePath),
        body: fs.createReadStream(filePath),
      };

      const response = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      fileId = response.data.id;
    }

    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${backendUrl}/proxy/drive/${fileId}`;
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw new Error("Google Drive upload failed: " + error.message);
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

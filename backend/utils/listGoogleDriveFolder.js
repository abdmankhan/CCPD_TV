import { getDriveClient } from "./googleDriveOAuth.js";

export async function listGoogleDriveFolder(folderPath) {
  const driveClient = await getDriveClient();
  let currentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  try {
    const parts = folderPath.split('/');
    
    // Navigate through each folder in the path
    for (const folderName of parts) {
      if (!folderName) continue;
      
      const folderResponse = await driveClient.files.list({
        q: `name='${folderName}' and '${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });

      if (!folderResponse.data.files || folderResponse.data.files.length === 0) {
        return [];
      }

      currentFolderId = folderResponse.data.files[0].id;
    }

    // Now list files in the final folder
    const filesResponse = await driveClient.files.list({
      q: `'${currentFolderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      orderBy: 'name',
    });

    if (!filesResponse.data.files) {
      return [];
    }

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return filesResponse.data.files.map(file => 
      `${backendUrl}/proxy/drive/${file.id}`
    );
  } catch (error) {
    console.error("Google Drive list folder error:", error);
    throw new Error("Failed to list Google Drive folder");
  }
}

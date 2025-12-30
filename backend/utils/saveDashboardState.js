import fs from "fs-extra";
import { createGoogleDriveFolder } from "./createGoogleDriveFolder.js";
import { getDriveClient } from "./googleDriveOAuth.js";

const DRIVE_FOLDER_NAME = "CCPD_Dashboard_Backup";
const DRIVE_STATE_FILENAME = "dashboard-state.json";

/**
 * Download a file from Google Drive
 */
async function downloadFromDrive(fileId) {
  const drive = await getDriveClient();
  
  const response = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  
  return JSON.parse(Buffer.from(response.data).toString('utf-8'));
}

/**
 * Find the dashboard state file in Google Drive
 */
async function findDriveStateFile() {
  try {
    const drive = await getDriveClient();
    const folderId = await createGoogleDriveFolder(DRIVE_FOLDER_NAME);
    
    const response = await drive.files.list({
      q: `name='${DRIVE_STATE_FILENAME}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 1
    });
    
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error finding Drive state file:", error.message);
    return null;
  }
}

/**
 * Upload JSON directly to Google Drive
 */
async function uploadJsonToDrive(jsonData, folderId) {
  const drive = await getDriveClient();
  const { Readable } = await import('stream');
  
  // Check if file exists
  const searchResponse = await drive.files.list({
    q: `name='${DRIVE_STATE_FILENAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)'
  });
  
  const fileMetadata = {
    name: DRIVE_STATE_FILENAME,
    mimeType: 'application/json'
  };
  
  const media = {
    mimeType: 'application/json',
    body: Readable.from([JSON.stringify(jsonData, null, 2)])
  };
  
  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    // Update existing file
    const fileId = searchResponse.data.files[0].id;
    await drive.files.update({
      fileId: fileId,
      media: media
    });
  } else {
    // Create new file
    fileMetadata.parents = [folderId];
    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
  }
}

/**
 * Save dashboard state to Google Drive only
 */
export async function saveDashboardState(dashboardState) {
  try {
    const folderId = await createGoogleDriveFolder(DRIVE_FOLDER_NAME);
    await uploadJsonToDrive(dashboardState, folderId);
    console.log("✓ Dashboard state saved to Google Drive");
    return { success: true };
  } catch (error) {
    console.error("Failed to save dashboard state to Drive:", error);
    throw error;
  }
}

/**
 * Load dashboard state from Google Drive only
 */
export async function loadDashboardState() {
  try {
    console.log("Checking Google Drive for dashboard state...");
    const driveFile = await findDriveStateFile();
    
    if (driveFile) {
      const driveState = await downloadFromDrive(driveFile.id);
      console.log("✓ Dashboard state loaded from Google Drive");
      return driveState;
    }

    console.log("No dashboard state found on Google Drive");
    return null;
  } catch (error) {
    console.error("Failed to load dashboard state:", error);
    return null;
  }
}

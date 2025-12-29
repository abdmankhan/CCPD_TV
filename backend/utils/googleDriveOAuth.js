import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, '../google-drive-token.json');

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/oauth2callback'
  );
}

console.log('GOOGLE_OAUTH_CLIENT_ID:', process.env.GOOGLE_OAUTH_CLIENT_ID);

export function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export function saveToken(token) {
  // Save to file for local development
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  
  // Log token for production (copy to env vars)
  if (process.env.NODE_ENV === 'production') {
    console.log('📋 COPY THIS TO RENDER ENVIRONMENT VARIABLES:');
    console.log('GOOGLE_DRIVE_TOKEN=' + JSON.stringify(token));
  }
}

export function loadToken() {
  // Try environment variable first (production)
  if (process.env.GOOGLE_DRIVE_TOKEN) {
    try {
      return JSON.parse(process.env.GOOGLE_DRIVE_TOKEN);
    } catch (error) {
      console.error('Error parsing GOOGLE_DRIVE_TOKEN:', error);
    }
  }
  
  // Fall back to file (local development)
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading token:', error);
  }
  return null;
}

export async function getDriveClient() {
  const oauth2Client = createOAuth2Client();
  const token = loadToken();

  if (!token) {
    throw new Error('No token found. Please authorize first by visiting /auth/google');
  }

  oauth2Client.setCredentials(token);
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      saveToken(tokens);
    }
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

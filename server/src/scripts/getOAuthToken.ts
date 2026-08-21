import { google } from 'googleapis';
import http from 'http';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

async function generateOAuthToken() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error('Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment configuration.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'http://localhost'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });

  console.log('=======================================================');
  console.log('Google Drive OAuth Refresh Token Generator');
  console.log('=======================================================');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Authorize access with your Google account.');

  // Create temporary HTTP callback listener on http://localhost (Port 80)
  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://localhost');
      const code = reqUrl.searchParams.get('code');

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #10b981;">✓ Authorization Successful!</h1>
            <p style="color: #4b5563;">Your Google Drive Refresh Token has been generated and saved to your project .env file.</p>
            <p>You can close this browser tab now.</p>
          </div>
        `);

        await processAuthCode(code.trim());
        server.close();
        process.exit(0);
      }
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to process authorization code.');
    }
  });

  server.listen(80, () => {
    console.log('\nWaiting for Google authorization callback on http://localhost ...');
  }).on('error', () => {
    // Port 80 might be in use by XAMPP/Apache, fallback to terminal input prompt
    console.log('\n(Port 80 busy. Paste authorization code manually from browser URL parameter if redirected)');
    promptManualInput(oauth2Client);
  });
}

async function processAuthCode(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'http://localhost'
  );

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    console.warn('Warning: Refresh token not returned. Ensure to revoke app access in Google Account security settings.');
  } else {
    console.log('\nSUCCESS! Google OAuth refresh token received successfully.');

    const envPath = path.resolve(__dirname, '../../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GOOGLE_REFRESH_TOKEN=.*/,
          `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
        );
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('✓ Successfully updated GOOGLE_REFRESH_TOKEN in .env!');
    }
  }
}

function promptManualInput(oauth2Client: any) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\nEnter authorization code here: ', async (code) => {
    rl.close();
    try {
      await processAuthCode(code.trim());
      process.exit(0);
    } catch (err: any) {
      console.error('Failed to retrieve refresh token:', err.message);
      process.exit(1);
    }
  });
}

generateOAuthToken();

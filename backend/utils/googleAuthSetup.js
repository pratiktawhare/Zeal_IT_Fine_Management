/**
 * ===========================================
 * Google OAuth2 Setup Script
 * ===========================================
 * 
 * RUN THIS ONCE to get your Google Drive refresh token.
 * 
 * PREREQUISITES:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable "Google Drive API" in APIs & Services > Library
 * 4. Go to APIs & Services > Credentials
 * 5. Click "Create Credentials" > "OAuth client ID"
 * 6. Choose "Desktop app" as application type
 * 7. Download the credentials JSON or copy Client ID & Client Secret
 * 8. Go to APIs & Services > OAuth consent screen
 *    - Choose "External" user type
 *    - Add your email as a test user
 *    - Add scope: https://www.googleapis.com/auth/drive.file
 * 9. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file
 * 10. Run this script: node utils/googleAuthSetup.js
 * 11. It will open a browser for you to authorize
 * 12. Copy the refresh token and add it to .env as GOOGLE_REFRESH_TOKEN
 * 
 * USAGE: node utils/googleAuthSetup.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('child_process').exec;
const dotenv = require('dotenv');

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('\n❌ ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
    console.error('\nSteps to get these:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Create/select a project');
    console.error('3. Enable Google Drive API');
    console.error('4. Create OAuth 2.0 credentials (Desktop app type)');
    console.error('5. Copy Client ID and Client Secret to .env\n');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
});

// Create a temporary server to catch the callback
const server = http.createServer(async (req, res) => {
    const queryParams = url.parse(req.url, true).query;

    if (queryParams.code) {
        try {
            const { tokens } = await oauth2Client.getToken(queryParams.code);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #f0f4f8;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="color: #059669;">✅ Authorization Successful!</h1>
                        <p>Your refresh token has been generated. Add this to your <code>.env</code> file:</p>
                        <div style="background: #1f2937; color: #10b981; padding: 20px; border-radius: 8px; text-align: left; word-break: break-all; font-family: monospace; font-size: 12px;">
                            GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
                        </div>
                        <p style="color: #6b7280; margin-top: 20px;">You can close this window now.</p>
                    </div>
                </body>
                </html>
            `);

            console.log('\n===========================================');
            console.log('✅ Authorization successful!');
            console.log('===========================================');
            console.log('\nAdd this to your .env file:\n');
            console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log('\n===========================================\n');

            server.close();
            process.exit(0);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error: ${error.message}</h1>`);
            console.error('Error exchanging code for tokens:', error);
            server.close();
            process.exit(1);
        }
    }
});

server.listen(3000, () => {
    console.log('\n===========================================');
    console.log('🔐 Google Drive Authorization Setup');
    console.log('===========================================');
    console.log('\nOpening browser for authorization...');
    console.log('If the browser does not open, manually go to:\n');
    console.log(authUrl);
    console.log('\n===========================================\n');

    // Open the browser
    const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    open(`${startCmd} "${authUrl}"`);
});

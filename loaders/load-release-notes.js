/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = './token.json';
const DOCUMENT_ID = process.env.GDRIVE_RELEASE_NOTED_DOC_ID

const logInfo = (message) => {
  console.log('\x1b[36m%s\x1b[0m', `\n>>>> RELEASE NOTES INFO: ${message}`);
};

const logWaring = (message) => {
  console.log('\x1b[31m', `\n>>>> RELEASE NOTES WARNING`);
  console.log('\x1b[31m', message);
};

const getCredentials = () => {
  logInfo('getCredentials NEW');

  return {
    clientId: process.env.GDRIVE_CLIENT_ID,
    clientSecret: process.env.GDRIVE_CLIENT_SECRET,
    redirectUri: process.env.GDRIVE_REDIRECT_URI,
  };
};

const getAccessToken = async (oAuth2Client) => {
  logInfo('getAccessToken');
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    logWaring('Authorize this app by visiting this url:');
    logWaring(authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          logWaring('Error retrieving access token');
          reject(err);
          return;
        }

        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) {
            logWaring(`Cannot write file: ${TOKEN_PATH}`);
            reject(err);
            return;
          }
          logInfo(`Token stored to ${TOKEN_PATH}`);
          resolve(token);
        });
      });
    });
  });
};

const authorize = async (credentials) => {
  logInfo('authorize');

  return new Promise((resolve, reject) => {
    let oAuth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) {
        token = await getAccessToken(oAuth2Client);
      } else {
        token = JSON.parse(token);
      }

      oAuth2Client.setCredentials(token);
      logInfo('oAuth2Client IS READY');
      resolve(oAuth2Client);
    });
  });
};

const getDocContent = async (auth) => {
  logInfo('getDocContent');

  return new Promise((resolve, reject) => {
    /* SHEET */
    const docId = DOCUMENT_ID;
    const mimeType = 'text/csv';

    const drive = google.drive({version: 'v3', auth});

    drive.files.export({
      fileId: docId,
      mimeType: mimeType,
    }, (err, res) => {
      if (err) {
        logWaring('"drive.files.export" API returned an error:');
        logWaring(err);
        reject(err);
        return;
      }

      logInfo(res.data);
      resolve(res.data);
    });
  });
};

const loadCSV = async () => {
  const oAuth2Client = await authorize(getCredentials());
  return getDocContent(oAuth2Client);
};

module.exports = (content) => {
  logInfo('load-release-notes MODULE. content length: ' + content.length);


  return new Promise((resolve, reject) => {
    loadCSV().then((data) => {
      logInfo(data);

      resolve(content);
    });
  });
};

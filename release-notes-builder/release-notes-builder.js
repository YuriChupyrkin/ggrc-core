/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const fs = require('fs');
const request = require('request');
const {GoogleToken} = require('gtoken');

const ENV = process.env;
const DOCUMENT_ID = ENV.GDRIVE_RELEASE_NOTED_DOC_ID;
const GDRIVE_SERVICE_USER_KEY = ENV.GDRIVE_SERVICE_USER_KEY;
const GDRIVE_SERVICE_USER_EMAIL = ENV.GDRIVE_SERVICE_USER_EMAIL;
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const RELEASE_NOTES_PATH = './release-notes-builder/release-notes-body.html';

const getUserToken = async () => {
  // escape symbols
  const userKey = GDRIVE_SERVICE_USER_KEY.replace(/\\n/g, '\n');

  const googleToken = new GoogleToken({
    key: userKey,
    email: GDRIVE_SERVICE_USER_EMAIL,
    scope: SCOPES,
  });

  return new Promise((resolve, reject) => {
    googleToken.getToken((err, token) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(`${token.token_type} ${token.access_token}`);
    });
  });
};

const getDocumentContent = async (authToken) => {
  const mimeType = 'text/html';

  const url = 'https://www.googleapis.com/drive/v3/files/'
    + DOCUMENT_ID
    + '/export'
    + '?mimeType='
    + mimeType;

  const headers = {
    authorization: authToken,
  };

  const options = {
    url,
    headers,
    method: 'GET',
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (!response) {
        reject('Document export has empty response');
        return;
      }
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(response.statusCode);
      }
    });
  });
};

const saveHtmlToFile = (html) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(RELEASE_NOTES_PATH, html, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

const cleanUpHtml = (html) => {
  let body = html.match(/<body.*<\/body>/g);
  if (!body.length) {
    return html;
  }

  // remove style attributes
  body = body[0].replace(/style="[^"]*"/g, '');
  return body;
};

const log = (message, isError) => {
  const logType = isError ? 'ERROR' : 'INFO';
  console.log(`\n ${logType} >>> ${message}\n`);
};

(async function main() {
  log('THE "RELEASE NOTES" BUILD IS STARTED');

  try {
    const token = await getUserToken();
    let html = await getDocumentContent(token);

    if (!html) {
      throw new Error('Document content is empty');
    }

    html = cleanUpHtml(html);
    await saveHtmlToFile(html);

    log('"RELEASE NOTES" IS SUCCESSFULLY BUILT');

    return Promise.resolve();
  } catch (error) {
    log('THE "RELEASE NOTES" BUILD IS FAILED:', true);
    console.dir(error);

    return Promise.reject(error);
  }
})();

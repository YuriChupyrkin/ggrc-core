/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const request = require('request');
const {GoogleToken} = require('gtoken');
const csv = require('csv-parser');

const DOCUMENT_ID = process.env.GDRIVE_RELEASE_NOTED_DOC_ID;
const GDRIVE_SERVICE_USER_KEY = process.env.GDRIVE_SERVICE_USER_KEY;
const GDRIVE_SERVICE_USER_EMAIL = process.env.GDRIVE_SERVICE_USER_EMAIL;
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const getUserToken = async () => {
  // escape symbols
  const userKey = GDRIVE_SERVICE_USER_KEY.replace(/\\n/g, '\n');

  const gtoken = new GoogleToken({
    key: userKey,
    email: GDRIVE_SERVICE_USER_EMAIL,
    scope: SCOPES,
  });

  return new Promise((resolve, reject) => {
    gtoken.getToken((err, token) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(`${token.token_type} ${token.access_token}`);
    });
  });
};

const getDocumentContent = async (authToken) => {
  const mimeType = 'text/csv';

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
    const results = [];

    request(options)
      .on('response', (response) => {
        if (response.statusCode !== 200) {
          reject('Cannot load content: ' + response.statusCode);
        }
      })
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject('Cannot load content: ' + error);
      });
  });
};

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getUserToken();
      const documentContent = await getDocumentContent(token);
      resolve(documentContent);
    } catch (error) {
      reject(error);
    }
  });
};

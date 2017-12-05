const { it, describe } = require('mocha');
const { expect } = require('chai');
const { get } = require('axios');
const express = require('express');
const { join } = require('path');
const proxyquire = require('proxyquire');

let bingApiStub = null;
proxyquire('../lib/server', {
  'node-bing-api': (...args) => bingApiStub(...args),
});
const makeApp = require('../lib/server');

const testPort = 4000;
const testBaseURL = `http://localhost:${testPort}`;
const dataPort = 5000;
const dataBaseURL = `http://localhost:${dataPort}`;

function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, err => (err && reject(err)) || resolve(server));
  });
}

function makeSuccessfulBingImageApiStub(body) {
  return () => ({
    images: (q, options, callback) => {
      setTimeout(() => {
        callback(null, { body: JSON.stringify(body) }, body);
      }, 0);
    },
  });
}

describe('lib/server.js', () => {
  const url = `${testBaseURL}/`;
  const apiKey = 'API KEY STUB';

  let server;
  let dataServer;

  beforeEach(async () => {
    const app = makeApp({ apiKey });
    server = await listen(app, testPort);

    const dataApp = express();
    dataApp.use(express.static(join(__dirname, 'data')));
    dataServer = await listen(dataApp, dataPort);
  });

  describe('when API returns one jpeg image', () => {
    beforeEach(() => {
      bingApiStub = makeSuccessfulBingImageApiStub({
        value: [{
          contentUrl: `${dataBaseURL}/kitten.jpg`,
          encodingFormat: 'jpeg',
          thumbnail: {},
        }],
      });
    });

    it('should return 200', async () => {
      const { status } = await get(url);
      expect(status).to.equal(200);
    });

    it('should set a Content-Type header', async () => {
      const { headers } = await get(url);
      expect(headers['content-type']).to.equal('image/jpeg');
    });
  });

  afterEach(() => {
    dataServer.close();
    server.close();
  });
});

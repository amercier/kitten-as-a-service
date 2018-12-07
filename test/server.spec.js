const { it, describe } = require('mocha');
const { expect } = require('chai');
const { get } = require('axios');
const express = require('express');
const { join } = require('path');

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

describe('kitten-as-a-service', () => {
  const bingApiStub = {};

  let server;
  let dataServer;

  beforeEach(async () => {
    const app = makeApp({ bingApi: () => bingApiStub, apiKey: 'API KEY STUB' });
    server = await listen(app, testPort);

    const dataApp = express();
    dataApp.use(express.static(join(__dirname, 'data')));
    dataServer = await listen(dataApp, dataPort);
  });

  describe('/kitten-huge.jpg', () => {
    const url = `${testBaseURL}/kitten-huge.jpg`;

    describe('when API returns one jpeg image', () => {
      beforeEach(() => {
        const body = {
          value: [{
            contentUrl: `${dataBaseURL}/kitten-huge.jpg`,
            encodingFormat: 'jpeg',
            thumbnail: {},
          }],
        };

        bingApiStub.images = (q, options, callback) => {
          setTimeout(() => {
            callback(null, { body: JSON.stringify(body) }, body);
          }, 0);
        };
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
  });

  afterEach(() => {
    dataServer.close();
    server.close();
  });
});

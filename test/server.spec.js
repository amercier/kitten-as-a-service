const { it, describe } = require('mocha');
const { expect } = require('chai');
const { get } = require('axios');
const startServer = require('../server');

const port = 4000;
const baseURL = `http://localhost:${port}`;

describe('server.js', function() {
  const url = `${baseURL}/`;

  let server;

  beforeEach(function() {
    server = startServer();
    server.listen(port);
  });

  it('should return 200', async function() {
    const { status } = await get(url);
    expect(status).to.equal(200);
  });

  it('should say "Hello World"', async function() {
    const { data } = await get(url);
    expect(data).to.equal('Hello World\n');
  });

  afterEach(function() {
    server.close();
  });
});

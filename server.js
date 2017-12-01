const { createServer } = require('http');

module.exports = function startServer() {
  return createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
  });
};

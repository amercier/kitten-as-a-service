const startServer = require('./server');

const hostname = '127.0.0.1';
const port = 3000;

startServer().listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

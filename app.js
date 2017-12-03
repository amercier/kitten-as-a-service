const startServer = require('./server');

const port = process.env.PORT || 3000;

startServer().listen(port, () => {
  console.log(`Server running on port ${port}`);
});

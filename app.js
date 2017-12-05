const startServer = require('./lib/server');

const port = process.env.PORT || 3000;
const config = {
  apiKey: process.env.MICROSOFT_AZURE_API_KEY,
};

startServer(config).listen(port, () => {
  console.log(`Server running on port ${port}`);
});

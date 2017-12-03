const startServer = require('./server');

const port = process.env.PORT || 3000;
const config = {
  cx: process.env.GOOGLE_CX,
  apiKey: process.env.GOOGLE_API_KEY,
};

startServer(config).listen(port, () => {
  console.log(`Server running on port ${port}`);
});

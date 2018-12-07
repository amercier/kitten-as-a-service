const pictureConfigs = {
  small: {
    minWidth: 640,
    minHeight: 480,
    minFileSize: 30000,
    maxFileSize: 100000,
  },
  medium: {
    minWidth: 960,
    minHeight: 720,
    minFileSize: 50000,
    maxFileSize: 300000,
  },
  large: {
    minWidth: 1980,
    minHeight: 1080,
    minFileSize: 100000,
    maxFileSize: 1000000,
  },
  huge: {
    minWidth: 3840,
    minHeight: 2160,
    minFileSize: 500000,
    maxFileSize: 5000000,
  },
};

module.exports = { pictureConfigs };

const express = require('express');
const filesize = require('filesize');
const { customsearch } = require('googleapis');
const { get } = require('request');
const promiseRetry = require('promise-retry');
const randomInt = require('random-int');
const { inspect, promisify } = require('util');

const environment = process.env.NODE_ENV || 'development';

const listImages = promisify(customsearch('v1').cse.list);

/**
 * @return {Promise} Return a Promise
 */
function searchRandomImages(cx, apiKey, q, lowRange, count = 10) {
  return listImages({
    cx,
    auth: apiKey,
    q,
    searchType: 'image',
    imgType: 'photo',
    imgSize: 'huge',
    filetype: 'jpg',
    lowRange,
    count,
  });
}

function log(message) {
  if (environment !== 'production') {
    process.stdout.write(`${message}\n`);
  }
}

function fetchAndStreamJpegImage(url, onData) {
  return new Promise((resolve, reject) => {
    get(url).on('response', (response) => {
      const { statusCode, headers } = response;
      const contentType = headers['content-type'];
      if (statusCode !== 200) {
        reject(new Error(`Status code = ${statusCode}`));
      } else if (!/image\/jpe?g/.test(contentType)) {
        reject(new Error(`Content type = ${contentType}`));
      } else {
        log('   [ OK ] Waiting for data');
        response.setEncoding('binary');
        response.on('data', onData);
        response.on('end', resolve);
        response.on('error', reject);
      }
    });
  });
}

function fetchAndStreamRandomJpegImage(cx, apiKey, q, onData) {
  return promiseRetry(async (retry) => {
    const lowRange = randomInt(0, 1000);
    log(`GET ${lowRange}`);

    // 1. Get image URLs from Google Search
    const results = await searchRandomImages(cx, apiKey, q, lowRange);

    // 2. Look for a good candidate
    if (!results.items) {
      log('   [FAIL] Got no results');
      return retry();
    }
    log(`   [ OK ] Got ${results.items.length} results`);
    const index = results.items.findIndex((item, i) => {
      const { height, width, byteSize } = item.image;
      const ratio = width / height;
      if (ratio < 0.5) {
        log(`   [INFO] Ratio for result #${i} is too low (${ratio})`);
      } else if (width < 1080 || height < 720) {
        log(`   [INFO] Image #${i} is too small (${width}x${height})`);
      } else if (byteSize < 250000) {
        log(`   [INFO] Image #${i} is too small (${filesize(byteSize)})`);
      } else if (item.mime !== 'image/jpeg') {
        log(`   [INFO] Image #${i} is not in JPEG format (${item.mime})`);
      } else {
        log(`   [ OK ] Found good candidate: ${item.link}`);
        return true;
      }
      return false;
    });
    if (index === -1) {
      log(`   [FAIL] Could not find any good candidate in ~${lowRange}`);
      return retry();
    }
    const result = results.items[index];
    const searchIndex = lowRange + index;

    // 3. Fetch image data
    const imageRequest = await fetchAndStreamJpegImage(
      result.link,
      chunk => onData(result, searchIndex, chunk),
    ).catch((err) => {
      log(`   [FAIL] ${err}`);
      retry();
    });

    return imageRequest;
  });
}

module.exports = function makeApp({ cx, apiKey }) {
  const app = express();

  app.get('/', (request, response) => {
    const q = 'kitten';
    let headersSent = false;
    let totalBytesSent = 0;

    function onData(result, searchIndex, chunk) {
      if (!headersSent) {
        log(`   [ OK ] Sending headers, image size is ${result.image.byteSize} bytes`);
        response.status(200);
        response.set('Content-Type', 'image/jpeg');
        response.set('Content-Length', result.image.byteSize);
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('Expires', '0');
        response.set('X-Image-URL', result.link);
        response.set('X-Image-Width', result.image.width);
        response.set('X-Image-Height', result.image.height);
        response.set('X-Google-CSE-Query', q);
        response.set('X-Google-CSE-Index', searchIndex);
        response.set('X-Google-CSE-ContextLink', result.image.contextLink);
        response.set('X-Google-CSE-Thumbnail', result.image.thumbnailLink);
        response.set('X-Google-CSE-ThumbnailWidth', result.image.thumbnailWidth);
        response.set('X-Google-CSE-ThumbnailHeight', result.image.thumbnailHeight);
        response.set('X-Google-CSE-Mime', result.mime);
        headersSent = true;
      }
      response.write(chunk, 'binary');
      const byteLength = chunk.length;
      totalBytesSent += byteLength;
      const percentage = Math.round(100 * (totalBytesSent / result.image.byteSize));
      log(`   [ OK ] Sent ${filesize(byteLength)}, total ${filesize(totalBytesSent)} (${percentage}%)`);
    }

    fetchAndStreamRandomJpegImage(cx, apiKey, q, onData)
      .then(() => {
        log('   [ OK ] Done');
        response.end();
      })
      .catch((err) => {
        response.status(500);
        response.set('Content-Type', 'application/json');
        response.end(inspect(err).replace(apiKey, '[secure]').replace(cx, '[secure]'));
      });
  });

  return app;
};

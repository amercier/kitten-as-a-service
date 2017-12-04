const express = require('express');
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
function searchRandomImage(cx, apiKey, q, index) {
  return listImages({
    cx,
    auth: apiKey,
    q,
    searchType: 'image',
    imgType: 'photo',
    imgSize: 'huge',
    num: 1,
    filetype: 'jpg',
    // rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
    lowRange: index,
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
        log(`   [FAIL] Status code = ${statusCode}`);
        reject(new Error(statusCode));
      } else if (contentType !== 'image/jpeg' && contentType !== 'image/jpeg') {
        log(`   [FAIL] Content type = ${contentType}`);
        reject(new Error(406));
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
    const searchIndex = randomInt(0, 1000);
    log(`GET ${searchIndex}`);

    // 1. Get image URL from Google Search
    const results = await searchRandomImage(cx, apiKey, q, searchIndex);
    const result = results.items[0];
    log(`   [ OK ] URL is ${result.link}`);

    const ratio = result.image.width / result.image.height;
    if (ratio < 0.5) {
      log(`   [FAIL] Image ratio is ${ratio}`);
      retry();
    }

    // 2. Fetch image data
    const imageRequest = await fetchAndStreamJpegImage(
      result.link,
      chunk => onData(result, searchIndex, chunk),
    ).catch((err) => {
      log(`   [FAIL] Error: ${err}`);
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

    function onData(result, searchIndex, chunk) {
      if (!headersSent) {
        log('   [ OK ] Sending headers');
        response.status(200);
        response.set('Content-Type', 'image/jpeg');
        response.set('Content-Length', result.image.byteSize);
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
      log(`   [ OK ] Sending ${Buffer.byteLength(chunk)} bytes`);
      response.write(chunk, 'binary');
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

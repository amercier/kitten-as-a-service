const express = require('express');
const bingApi = require('node-bing-api');
const { join } = require('path');
const ProgressBar = require('progress');
const promiseRetry = require('promise-retry');
const randomInt = require('random-int');
const { get } = require('request');
const { inspect, promisify } = require('util');

const environment = process.env.NODE_ENV || 'development';
const debug = environment === 'development' || process.env.DEBUG === 'true';
const displayProgressBar = debug && environment === 'development';

function secure(message, sensitiveInfo = message) {
  return message.replace(
    sensitiveInfo,
    sensitiveInfo.replace(/.(?=.{4,}$)/g, '*'),
  );
}

function log(message) {
  if (debug) {
    process.stdout.write(`${message}\n`);
  }
}

async function searchImages(accKey, q, searchIndex, count) {
  const bing = bingApi({
    rootUri: 'https://api.cognitive.microsoft.com/bing/v7.0/',
    accKey,
  });
  const bingImages = promisify(bing.images.bind(bing));
  const rawResponse = await bingImages(q, {
    count,
    offset: searchIndex,
    imageType: 'Photo',
    minFileSize: 500000,
    minWidth: 1980,
    minHeight: 1080,
    aspect: 'Wide',
  });

  const response = JSON.parse(rawResponse.body);
  if (!response) {
    throw new Error('Query empty response');
  }

  const results = response.value;
  if (!results) {
    throw new Error('Query returned no results');
  }
  if (!results.length) {
    throw new Error(`Query returned empty results: ${inspect(results)}`);
  }

  return results;
}

function isValidCandidate({ encodingFormat }, index) {
  if (encodingFormat !== 'jpeg') {
    log(`   [INFO] Excluding result #${index} because of wrong encoding format: ${encodingFormat}`);
  } else {
    log(`   [ OK ] Found good candidate: #${index}`);
    return true;
  }
  return false;
}

function fetchAndStreamJpegImage(url, onData) {
  return new Promise((resolve, reject) => {
    try {
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
    } catch (err) {
      reject(err);
    }
  });
}

function fetchAndStreamRandomJpegImage(accKey, q, onData, onAbort) {
  let startedSendingData = false;

  return promiseRetry(async (retry) => {
    // 1. Get images from Bing API
    const searchIndex = randomInt(0, 500);
    const count = 10; // max: 50
    log(`Querying Bing API for range ${searchIndex}..${searchIndex + count} using key ${secure(accKey)}`);
    const candidates = await searchImages(accKey, q, searchIndex, count)
      .catch((err) => {
        log(`   [FAIL] Bing image query failed: ${err}`);
        retry();
      });
    log(`   [ OK ] Found ${candidates.length} images`);

    // 2. Select 1 candidate from results
    const image = candidates.find(isValidCandidate);
    if (!image) {
      log(`   [FAIL] Could not find any good candidate in range ${searchIndex}..${searchIndex + count}, retry`);
      return retry();
    }

    // 3. Fetch image data
    log(`   [ OK ] Fetching ${image.contentUrl}`);
    const imageRequest = await fetchAndStreamJpegImage(
      image.contentUrl,
      (chunk) => {
        startedSendingData = true;
        onData(image, searchIndex, chunk);
      },
    ).catch((err) => {
      log(`   [FAIL] ${err}, ${startedSendingData ? 'aborting' : 'retrying'}`);
      return (startedSendingData ? onAbort : retry)();
    });

    return imageRequest;
  });
}

module.exports = function makeApp({ apiKey }) {
  const app = express();

  const staticDir = join(__dirname, '..', 'dist');
  app.use(express.static(staticDir));
  app.get('/', (req, res) => res.sendFile('index.html', { root: staticDir }));

  // const testDataDir = join(__dirname, '..', 'test', 'data');
  // app.get('/kitten.jpg', (req, res) => res.sendFile('kitten.jpg', { root: testDataDir }));
  app.get('/kitten.jpg', (request, response) => {
    const q = 'kitten';
    let bar;
    let headersSent = false;

    function onData(image, searchIndex, chunk) {
      const imageSize = parseInt(image.contentSize, 10);
      if (!headersSent) {
        response.status(200);
        response.set('Content-Type', `image/${image.encodingFormat}`);
        response.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.set('Pragma', 'no-cache');
        response.set('Expires', '0');
        response.set('X-Image-URL', image.contentUrl);
        response.set('X-Image-Width', image.width);
        response.set('X-Image-Height', image.height);
        response.set('X-Image-Query', q);
        response.set('X-Image-Bing-Index', searchIndex);
        response.set('X-Image-HostPageUrl', image.hostPageUrl);
        response.set('X-Image-ThumbnailUrl', image.thumbnailUrl);
        response.set('X-Image-ThumbnailWidth', image.thumbnail.width);
        response.set('X-Image-ThumbnailHeight', image.thumbnail.height);
        response.set('X-Image-PublishDate', image.datePublished);
        response.set('X-Image-HostPageUrl', image.hostPageUrl);
        response.set('X-Image-HostPageUrl', image.hostPageUrl);
        response.set('X-Image-HostPageUrl', image.hostPageUrl);
        response.set('X-Image-HostPageUrl', image.hostPageUrl);
        headersSent = true;
        log(`   [ OK ] Sent headers, expected size is ${image.contentSize}`);
        if (displayProgressBar) {
          bar = new ProgressBar('   [ OK ] Transferring data :bar :percent :etas', { total: imageSize });
        }
      }
      response.write(chunk, 'binary');
      const byteLength = chunk.length;
      if (displayProgressBar) {
        bar.tick(byteLength);
      } else {
        log(`   [ OK ] Sent ${byteLength} bytes of data`);
      }
    }

    fetchAndStreamRandomJpegImage(apiKey, q, onData, () => response.end())
      .then(() => {
        log('   [ OK ] Done');
        response.end();
      })
      .catch((err) => {
        response.status(500);
        response.set('Content-Type', 'application/json');
        response.end(secure(inspect(err), apiKey));
      });
  });

  return app;
};

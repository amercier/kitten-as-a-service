const { get } = require('axios');
const express = require('express');
const { customsearch } = require('googleapis');
const promiseRetry = require('promise-retry');
const randomInt = require('random-int');
const { inspect, promisify } = require('util');

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

function fetchRandomImage(cx, apiKey, q) {
  return promiseRetry(async (retry) => {
    const index = randomInt(0, 1000);

    // 1. Get image URL from Google Search
    const results = await searchRandomImage(cx, apiKey, q, index);
    const result = results.items[0];
    if (result.image.width / result.image.height < 0.5) {
      retry();
    }

    // 2. Fetch image data
    const { headers, data } = await get(result.link, { responseType: 'arraybuffer' }).catch(retry);
    if (headers['content-type'] !== 'image/jpeg' && headers['content-type'] !== 'image/jpg') {
      retry();
    }

    return [index, result, data];
  });
}

module.exports = function makeApp({ cx, apiKey }) {
  const app = express();

  app.get('/', (request, response) => {
    const q = 'kitten';
    fetchRandomImage(cx, apiKey, q)
      .then(([index, result, data]) => {
        response.status(200);
        response.set('Content-Type', 'image/jpeg');
        response.set('Content-Length', result.image.byteSize);
        response.set('X-Image-URL', result.link);
        response.set('X-Image-Width', result.image.width);
        response.set('X-Image-Height', result.image.height);
        response.set('X-Google-CSE-Query', q);
        response.set('X-Google-CSE-Index', index);
        response.set('X-Google-CSE-ContextLink', result.image.contextLink);
        response.set('X-Google-CSE-Thumbnail', result.image.thumbnailLink);
        response.set('X-Google-CSE-ThumbnailWidth', result.image.thumbnailWidth);
        response.set('X-Google-CSE-ThumbnailHeight', result.image.thumbnailHeight);
        response.set('X-Google-CSE-Mime', result.mime);
        response.end(data, 'binary');
      })
      .catch((err) => {
        response.status(500);
        response.set('Content-Type', 'application/json');
        response.end(inspect(err).replace(apiKey, '[secure]').replace(cx, '[secure]'));
      });
  });

  return app;
};

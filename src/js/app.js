import domready from 'domready';
import debounce from 'lodash.debounce';
import screenfull from 'screenfull';

domready(() => {
  // Fullscreen
  const html = document.documentElement;
  const { body } = document;

  if (screenfull.enabled) {
    body.classList.add('fullscreen-enabled');
    document.getElementById('btn-fullscreen').addEventListener('click', (event) => {
      event.stopPropagation();
      screenfull.toggle(html);
    });
    screenfull.on('change', () => html.classList[screenfull.isFullscreen ? 'add' : 'remove']('fullscreen'));
  }

  // Picture
  const img = document.getElementById('img');

  body.classList.add('loading');

  function loadNewPictureNow() {
    img.src = `${img.getAttribute('data-src')}?time=${new Date().getTime()}`;
  }

  const loadNewPicture = debounce(loadNewPictureNow, 300);

  img.addEventListener('load', () => {
    body.classList.remove('loading');
  });

  img.addEventListener('error', () => {
    if (img.src !== '') {
      body.classList.remove('loading');
      body.classList.add('failed');
    }
  });

  body.addEventListener('click', () => {
    if (!body.classList.contains('loading')) {
      body.classList.remove('failed');
      body.classList.add('loading');
      loadNewPicture();
    }
  });

  loadNewPictureNow();
});

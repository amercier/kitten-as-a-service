import domready from 'domready';
import debounce from 'lodash.debounce';
import screenfull from 'screenfull';
import Hammer from 'hammerjs';

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

  let ticking = false;

  const startX = 0; // Math.round((window.innerWidth - body.offsetWidth) / 2);
  let translateX = startX;

  const reqAnimationFrame =
    window[Hammer.prefixed(window, 'requestAnimationFrame')]
    || (callback => window.setTimeout(callback, 1000 / 60));

  function updateElementTransform() {
    const value = `translate3d(${translateX}px, 0, 0)`;
    body.style.webkitTransform = value;
    body.style.mozTransform = value;
    body.style.transform = value;
    ticking = false;
  }

  function requestElementUpdate() {
    if (!ticking) {
      ticking = true;
      reqAnimationFrame(updateElementTransform);
    }
  }

  function resetElement() {
    body.classList.add('animated');
    translateX = startX;
    requestElementUpdate();
  }

  const isAvailable = () => !body.classList.contains('loading');

  const hammer = new Hammer(body);
  hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });
  hammer.on('panstart panmove', ({ deltaX }) => {
    if (isAvailable()) {
      body.classList.remove('animated');
      translateX = startX + deltaX;
      requestElementUpdate();
    }
  });
  hammer.on('pancancel panend', resetElement);
  hammer.on('swipe', () => {
    if (isAvailable()) {
      body.classList.remove('failed');
      body.classList.add('loading');
      resetElement();
      loadNewPicture();
    }
  });

  loadNewPictureNow();
});

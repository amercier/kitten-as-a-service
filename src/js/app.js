import domready from 'domready';
import debounce from 'lodash.debounce';
import screenfull from 'screenfull';
import Hammer from 'hammerjs';

domready(() => {
  // Picture
  const { body } = document;
  const img = document.getElementById('img');

  body.classList.add('loading');

  function getPictureSize() {
    const { downlink } = (
      navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}
    );
    if (!downlink) {
      return 'medium';
    }
    if (downlink > 16) {
      return 'huge';
    }
    if (downlink > 4) {
      return 'large';
    }
    if (downlink > 1) {
      return 'medium';
    }
    return 'small';
  }

  function loadNewPictureNow() {
    const src = img.getAttribute('data-src').replace('{size}', getPictureSize());
    img.src = `${src}?time=${new Date().getTime()}`;
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
  const { abs, min } = Math;
  const totalWidth = body.offsetWidth;

  const reqAnimationFrame = (
    window[Hammer.prefixed(window, 'requestAnimationFrame')]
    || (callback => window.setTimeout(callback, 1000 / 60))
  );

  function updateElementTransform() {
    const value = `translate3d(${translateX}px, 0, 0)`;
    body.style.opacity = min(1 - (abs(translateX) / totalWidth), 1);
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

  // Fullscreen
  const html = document.documentElement;
  hammer.on('tap', () => {
    if (html.classList.contains('fullscreen')) {
      html.classList.remove('fullscreen');
      screenfull.exit();
    } else {
      html.classList.add('fullscreen');
      screenfull.request();
    }
  });
});

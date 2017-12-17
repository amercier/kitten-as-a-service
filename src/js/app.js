/* eslint-disable */

import domready from 'domready';

function debounce(fn, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) fn.apply(context, args);
    }, wait);
    if (immediate && !timeout) fn.apply(context, args);
  };
}

function doubleClickHandler(delay, onClick, onDoubleClick) {
  var lastTap = Date.now();
  var tapTimeout;

  function clearTapTimeout() {
    clearTimeout(tapTimeout);
    tapTimeout = null;
  }

  return function handleClickOrDoubleClick(event) {
    event.preventDefault();

    // Double-click
    if (tapTimeout) {
      clearTapTimeout();
      onDoubleClick(event);
    }
    else { // Otherwise, simple click
      tapTimeout = setTimeout(function() {
        clearTapTimeout();
        onClick(event);
      }, delay);
    }
  }
}

function toggleFullscreen(el) {
  var doc = el.ownerDocument;
  var never = function() { return false };
  var fullscreen = doc.fullscreen || doc.webkitIsFullScreen || doc.mozFullScreen || !!doc.msFullscreenElement || false;
  var requestFullscreen = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen || never;
  var exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen || never;

  fullscreen ? exitFullscreen.call(doc) : requestFullscreen.call(el);
}

domready(function() {
  var body = document.body;
  body.classList.add('loading');

  var img = document.getElementById('img');

  function loadNewPictureNow() {
    img.src = img.getAttribute('data-src') + '?time=' + new Date().getTime();
  }

  var loadNewPicture = debounce(loadNewPictureNow, 300);

  img.addEventListener('load', function() {
    body.classList.remove('loading');
  });

  img.addEventListener('error', function() {
    if (img.src !== '') {
      body.classList.remove('loading');
      body.classList.add('failed');
    }
  });

  var lastClickTime;
  body.addEventListener('click', doubleClickHandler(
    200,
    function() {
      if (!body.classList.contains('loading')) {
        body.classList.remove('failed');
        body.classList.add('loading');
        loadNewPicture();
      }
    },
    function() {
      toggleFullscreen(document.documentElement);
      body.classList.toggle('fullscreen');
    }
  ));

  loadNewPictureNow();
});

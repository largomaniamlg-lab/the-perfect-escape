/* Andalusian Dreams — djovan. Optional playback, started only by a tap. */
(() => {
  'use strict';
  const button = document.getElementById('music-toggle');
  const audio = new Audio('assets/andalusian-dreams.mp3');
  audio.loop = true; audio.preload = 'none';
  const VOLUME = .22;
  audio.volume = VOLUME;
  let enabled = false, pending = false, fadeFrame = 0, restoreTimer = 0, hiddenPause = false;
  function render() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Pause music' : 'Play music');
    button.title = enabled ? 'Pause music' : 'Play music';
  }
  function fadeTo(target, duration = 450) {
    cancelAnimationFrame(fadeFrame);
    const start = performance.now(), initial = audio.volume;
    function frame(time) {
      const progress = Math.min(1, (time - start) / duration);
      audio.volume = initial + (target - initial) * progress;
      if (progress < 1) fadeFrame = requestAnimationFrame(frame);
    }
    fadeFrame = requestAnimationFrame(frame);
  }
  function failed() {
    enabled = false; hiddenPause = false; audio.pause(); render();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = "Music couldn't start. Please try again."; toast.hidden = false;
      setTimeout(() => { toast.hidden = true; }, 3200);
    }
  }
  async function toggle() {
    if (pending) return;
    pending = true; button.disabled = true;
    try {
      if (enabled) {
        enabled = false; hiddenPause = false; audio.pause();
        cancelAnimationFrame(fadeFrame); clearTimeout(restoreTimer);
      } else {
        audio.volume = 0; await audio.play();
        enabled = true; fadeTo(VOLUME, 750);
      }
    } catch (_) { failed(); }
    finally { pending = false; button.disabled = false; render(); }
  }
  button.addEventListener('click', toggle);
  audio.addEventListener('error', failed);
  window.addEventListener('pe-audio-effect', event => {
    if (!enabled || audio.paused) return;
    clearTimeout(restoreTimer); fadeTo(.065, 130);
    const duration = Math.max(0, Number(event.detail?.duration) || 2);
    restoreTimer = setTimeout(() => { if (enabled) fadeTo(VOLUME, 650); }, (duration + .2) * 1000);
  });
  document.addEventListener('visibilitychange', async () => {
    if (!enabled || pending) return;
    if (document.hidden) {
      hiddenPause = true; audio.pause();
      cancelAnimationFrame(fadeFrame); clearTimeout(restoreTimer);
    } else if (hiddenPause) {
      hiddenPause = false;
      try { audio.volume = 0; await audio.play(); fadeTo(VOLUME, 500); }
      catch (_) { failed(); }
    }
  });
  const sound = document.getElementById('sound-toggle');
  const updateColor = () => button.classList.toggle('on-light', sound.classList.contains('on-light'));
  new MutationObserver(updateColor).observe(sound, { attributes:true, attributeFilter:['class'] });
  updateColor(); render();
})();

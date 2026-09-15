/* Copycat — landing page behaviour.
   Everything here is progressive: with JS off the page still reads and the
   form still posts, it just does it the browser's way. */

(function () {
  'use strict';

  /* Formspree takes a JSON POST directly, so there is no library to load.
     Swapping projects is a matter of changing this one line. */
  var ENDPOINT = 'https://formspree.io/f/mzebnwqk';

  var isLive = /^https?:\/\//.test(ENDPOINT);
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (calm || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        // a small stagger so a row of cards arrives in order, not as a block
        setTimeout(function () { entry.target.classList.add('is-in'); }, i * 70);
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { seen.observe(el); });
  }

  /* ---------- nav hairline and glow drift, on one scroll read ---------- */
  var nav = document.getElementById('nav');
  var glows = document.querySelectorAll('.glow');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle('is-stuck', y > 8);

    if (!calm) {
      glows.forEach(function (g) {
        var rate = parseFloat(g.dataset.par || '0');
        g.style.transform = 'translate3d(0,' + (y * rate).toFixed(1) + 'px,0)';
      });
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- the demo: drag to compare ---------- */
  var compare = document.getElementById('compare');
  if (compare) {
    var dragging = false;

    function setSplit(pct) {
      pct = Math.max(0, Math.min(100, pct));
      compare.style.setProperty('--split', pct + '%');
      compare.setAttribute('aria-valuenow', Math.round(pct));
    }

    function splitFromEvent(e) {
      var box = compare.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - box.left;
      setSplit((x / box.width) * 100);
    }

    compare.addEventListener('pointerdown', function (e) {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      splitFromEvent(e);
    });
    compare.addEventListener('pointermove', function (e) {
      if (dragging) splitFromEvent(e);
    });
    ['pointerup', 'pointercancel'].forEach(function (type) {
      compare.addEventListener(type, function () { dragging = false; });
    });

    // keyboard, because a slider that only takes a mouse is not a slider
    compare.addEventListener('keydown', function (e) {
      var now = parseFloat(compare.getAttribute('aria-valuenow')) || 52;
      var step = e.shiftKey ? 10 : 3;
      if (e.key === 'ArrowLeft')  { setSplit(now - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setSplit(now + step); e.preventDefault(); }
      if (e.key === 'Home')       { setSplit(0);   e.preventDefault(); }
      if (e.key === 'End')        { setSplit(100); e.preventDefault(); }
    });

    // one unprompted sweep the first time it scrolls into view, so nobody
    // has to guess that the card is draggable
    if (!calm && 'IntersectionObserver' in window) {
      var teased = false;
      var tease = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || teased) return;
        teased = true;
        var start = performance.now();
        (function sweep(now) {
          var t = Math.min((now - start) / 1600, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          setSplit(52 + Math.sin(eased * Math.PI) * 26);
          if (t < 1) requestAnimationFrame(sweep);
        })(start);
        tease.disconnect();
      }, { threshold: 0.5 });
      tease.observe(compare);
    }
  }

  /* ---------- a small 3D tilt on the demo card ---------- */
  var tilt = document.querySelector('[data-tilt]');
  if (tilt && !calm && window.matchMedia('(hover: hover)').matches) {
    var wrap = tilt.parentElement;
    wrap.addEventListener('pointermove', function (e) {
      var box = wrap.getBoundingClientRect();
      var dx = (e.clientX - box.left) / box.width - 0.5;
      var dy = (e.clientY - box.top) / box.height - 0.5;
      // deliberately shallow — it should read as depth, not as a toy
      tilt.style.transform =
        'rotateY(' + (dx * 5).toFixed(2) + 'deg) rotateX(' + (-dy * 5).toFixed(2) + 'deg)';
    });
    wrap.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  /* ---------- where they came from ----------
     Instagram's in-app browser strips the referrer, so a tag on the link is
     the only reliable way to tell a bio visit from a story or a given post.
     Kept for the session so a trip to the privacy page doesn't lose it. */
  var SOURCE = (function () {
    var key = 'cc_src';
    var q = new URLSearchParams(location.search);
    var tag = q.get('src') || q.get('utm_source') || '';
    try {
      if (tag) sessionStorage.setItem(key, tag);
      else tag = sessionStorage.getItem(key) || '';
    } catch (e) { /* private browsing; the tag just won't survive the hop */ }
    return tag || 'direct';
  })();

  /* ---------- sign-up ---------- */
  function send(payload) {
    if (!isLive) {
      console.info('[copycat] endpoint not set yet — would have sent:', payload);
      return Promise.resolve();
    }
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('rejected');
    });
  }

  document.querySelectorAll('.signup').forEach(function (form) {
    var input = form.querySelector('input[type=email]');
    var button = form.querySelector('button');
    var error = form.querySelector('.signup-error');
    // each form is followed by its own thank-you block
    var thanks = form.parentElement.querySelector('[data-thanks]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      error.textContent = '';

      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        error.textContent = 'That address does not look right — check it once more?';
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Sending…';

      send({ email: email, source: 'landing', came_from: SOURCE, page: location.pathname })
        .then(function () {
          form.style.display = 'none';
          if (thanks) {
            thanks.classList.add('is-on');
            thanks.dataset.email = email;
            var h = thanks.querySelector('h3');
            if (h) h.setAttribute('tabindex', '-1'), h.focus();
          }
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = 'Get early access';
          error.textContent = 'That did not go through. Try once more, or email us directly.';
        });
    });
  });

  /* ---------- tapping away from the field should close the keyboard ----------
     A desktop click anywhere blurs the input on its own. A touch does not:
     on iOS, tapping a plain element leaves the field focused and the keyboard
     up, with no obvious way down. So dismiss it by hand. */
  document.addEventListener('pointerdown', function (e) {
    var active = document.activeElement;
    if (!active || active.tagName !== 'INPUT') return;
    var form = active.closest('.signup');
    if (form && form.contains(e.target)) return;   // still inside its own form
    active.blur();
  }, true);

  /* ---------- the two optional questions ---------- */
  document.querySelectorAll('[data-thanks]').forEach(function (thanks) {
    var done = thanks.querySelector('[data-thanks-done]');
    var answers = {};
    var pending = null;

    function flush() {
      send({
        email: thanks.dataset.email || '',
        source: 'survey',
        came_from: SOURCE,
        role: answers.role || '',
        volume: answers.volume || ''
      });
      if (done) done.textContent = 'Saved. Thank you — that genuinely helps.';
    }

    thanks.querySelectorAll('.q').forEach(function (q) {
      q.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          q.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-on'); });
          chip.classList.add('is-on');
          answers[q.dataset.q] = chip.textContent.trim();

          // one submission per person, not one per tap — the answers are
          // batched a moment after the last change
          clearTimeout(pending);
          pending = setTimeout(flush, 1600);
          if (done) done.textContent = 'Saving…';
        });
      });
    });

    // if they answer and leave straight away, still send what they gave
    window.addEventListener('pagehide', function () {
      if (pending) { clearTimeout(pending); flush(); }
    });
  });
})();

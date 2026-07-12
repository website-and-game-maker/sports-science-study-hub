/* Study hub interactions: dropdown nav, slideshow decks, PDF modal,
   audio chapter seek, and the guided tour engine. */
(function () {
  "use strict";

  /* ---------------- Shared helpers ---------------- */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  // Left/right swipe on touch devices for carousel-like surfaces (deck viewer, tour).
  // Skips touches starting on media/controls so video scrubbing and thumbnail/dot taps
  // aren't hijacked, and requires a clearly horizontal drag so vertical page scroll
  // still works normally.
  function addSwipe(el, onSwipeLeft, onSwipeRight) {
    var sx = 0, sy = 0, tracking = false;
    el.addEventListener("touchstart", function (e) {
      var t = e.target;
      if (e.touches.length !== 1 || (t.closest && t.closest("video,audio,button,a,input,.thumbs,.tour-dots"))) {
        tracking = false; return;
      }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft(); else onSwipeRight();
      }
    }, { passive: true });
  }

  // Keep Tab focus inside an open overlay (dialog/tour).
  function trapTab(e, container) {
    if (!container) return;
    var nodes = container.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
    );
    var f = Array.prototype.filter.call(nodes, function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- Dropdown navigation ---------------- */
  var menus = Array.prototype.slice.call(document.querySelectorAll(".menu"));
  function syncMenuAria() {
    menus.forEach(function (m) {
      var b = m.querySelector("[data-menu-btn]");
      if (b) b.setAttribute("aria-expanded", m.classList.contains("open") ? "true" : "false");
    });
  }
  menus.forEach(function (menu) {
    var btn = menu.querySelector("[data-menu-btn]");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = menu.classList.contains("open");
      menus.forEach(function (m) { m.classList.remove("open"); });
      if (!wasOpen) menu.classList.add("open");
      syncMenuAria();
    });
  });
  document.addEventListener("click", function () {
    menus.forEach(function (m) { m.classList.remove("open"); });
    syncMenuAria();
  });
  var hb = document.querySelector("[data-hamburger]");
  var navLinks = document.querySelector(".nav-links");
  function syncHamburgerAria() {
    if (hb && navLinks) hb.setAttribute("aria-expanded", navLinks.classList.contains("open") ? "true" : "false");
  }
  // close menus + mobile nav when a menu link is clicked
  document.querySelectorAll(".menu-item, .nav-flat").forEach(function (a) {
    a.addEventListener("click", function () {
      menus.forEach(function (m) { m.classList.remove("open"); });
      if (navLinks) navLinks.classList.remove("open");
      syncHamburgerAria();
    });
  });
  if (hb) hb.addEventListener("click", function () {
    if (navLinks) navLinks.classList.toggle("open");
    syncHamburgerAria();
  });

  /* ---------------- Slideshow decks ---------------- */
  function initDeck(stage) {
    var id = stage.getAttribute("data-deck");
    var data = (window.DECKS || {})[id];
    if (!data) return;
    var slides = data.slides, thumbSrcs = data.thumbs;
    var img = stage.querySelector("[data-slideimg]");
    var intro = stage.querySelector("[data-intro]");
    var introVideo = intro ? intro.querySelector("video") : null;
    var counter = stage.querySelector("[data-counter]");
    var thumbBar = stage.parentElement.querySelector("[data-thumbs]");
    // Decks with no companion-video intro (e.g. the tour-embedded mini deck, which has no
    // [data-intro] block because the video already gets its own separate tour stop) should
    // open straight on slide 1 instead of an empty "Intro" state.
    var idx = intro ? -1 : 0;

    thumbSrcs.forEach(function (src, i) {
      var t = document.createElement("img");
      t.src = src; t.loading = "lazy"; t.alt = "Go to slide " + (i + 1);
      t.setAttribute("role", "button"); t.setAttribute("tabindex", "0");
      t.addEventListener("click", function () { go(i); });
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); } });
      thumbBar.appendChild(t);
    });
    var thumbEls = Array.prototype.slice.call(thumbBar.querySelectorAll("img"));

    function render() {
      if (idx < 0) {
        if (intro) intro.classList.add("show");
        img.style.display = "none"; counter.textContent = "Intro";
      } else {
        if (intro) intro.classList.remove("show");
        if (introVideo) { try { introVideo.pause(); } catch (e) {} }
        img.src = slides[idx]; img.style.display = "block";
        counter.textContent = (idx + 1) + " / " + slides.length;
      }
      thumbEls.forEach(function (el, i) { el.classList.toggle("active", i === idx); });
    }
    function go(i) { var min = intro ? -1 : 0; idx = Math.max(min, Math.min(slides.length - 1, i)); render(); }
    stage.querySelector("[data-next]").addEventListener("click", function () { go(idx + 1); });
    stage.querySelector("[data-prev]").addEventListener("click", function () { go(idx - 1); });
    addSwipe(stage, function () { go(idx + 1); }, function () { go(idx - 1); });
    stage.setAttribute("tabindex", "0");
    stage.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === "VIDEO" || tag === "AUDIO") return; // let the intro video handle arrow keys
      // Escape is handled separately below (fullscreen exit) so it isn't fought over here.
      if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); }
    });

    /* ---- Fullscreen mode ---- */
    // Works generically for every deck (playbook + blueprint share this initDeck() call).
    var fsBtn = stage.querySelector("[data-fullscreen]");
    var deckFoot = stage.parentElement.querySelector(".deck-foot");
    var footParent = deckFoot ? deckFoot.parentNode : null;   // where to put deckFoot back on exit
    var footNext = deckFoot ? deckFoot.nextSibling : null;    // ...and before which sibling
    var manualFs = false;  // true only when the real Fullscreen API is unavailable/rejected
    var wasFs = false;     // last state we applied, so unrelated fullscreenchange events are ignored
    var prevOverflow = null;

    function nativeFsEl() {
      return document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement || null;
    }
    function isFsActive() { return manualFs || nativeFsEl() === stage; }
    function setFsState(active) {
      if (active === wasFs) return;
      wasFs = active;
      stage.classList.toggle("is-fullscreen", active);
      if (fsBtn) {
        fsBtn.setAttribute("aria-pressed", active ? "true" : "false");
        fsBtn.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
      }
      // The thumbnail strip normally lives in .deck-foot, outside .stage — reparent it in
      // so it's still reachable while the stage is fullscreened, then put it back on exit.
      if (deckFoot) {
        if (active && deckFoot.parentNode !== stage) stage.appendChild(deckFoot);
        else if (!active && deckFoot.parentNode === stage && footParent) footParent.insertBefore(deckFoot, footNext);
      }
      if (active) { prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
      else { document.body.style.overflow = prevOverflow || ""; prevOverflow = null; }
      // Land focus on the toggle both entering (so keyboard/screen-reader users aren't stranded
      // inside the stage) and exiting (restoring focus to the control that changed state).
      if (fsBtn) fsBtn.focus();
    }
    function enterFs() {
      var fn = stage.requestFullscreen || stage.webkitRequestFullscreen ||
        stage.mozRequestFullScreen || stage.msRequestFullscreen;
      if (!fn) { manualFs = true; setFsState(true); return; }
      var settled = false;
      // Some embedding contexts (e.g. a restrictive iframe/webview) neither resolve nor reject
      // the request — it just hangs — instead of rejecting outright. Don't leave the toggle
      // inert forever waiting on a promise that may never settle: fall back to the manual mode
      // if nothing happened after a short beat.
      var fallbackTimer = setTimeout(function () {
        if (!settled && nativeFsEl() !== stage) { manualFs = true; setFsState(true); }
      }, 400);
      var res;
      try { res = fn.call(stage); } catch (err) { res = null; }
      if (res && typeof res.catch === "function") {
        res.then(
          function () { settled = true; clearTimeout(fallbackTimer); /* fullscreenchange syncs state */ },
          function () { settled = true; clearTimeout(fallbackTimer); manualFs = true; setFsState(true); }
        );
      } else {
        // Synchronous throw, or a non-Promise legacy vendor-prefixed API — no need to wait.
        settled = true; clearTimeout(fallbackTimer);
        manualFs = true; setFsState(true);
      }
    }
    function exitFs() {
      if (nativeFsEl() === stage) {
        var fn = document.exitFullscreen || document.webkitExitFullscreen ||
          document.mozCancelFullScreen || document.msExitFullscreen;
        if (fn) { try { fn.call(document); } catch (err) {} }
        return;
      }
      if (manualFs) { manualFs = false; setFsState(false); }
    }
    if (fsBtn) {
      fsBtn.addEventListener("click", function () { if (isFsActive()) exitFs(); else enterFs(); });
    }
    ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach(function (evt) {
      document.addEventListener(evt, function () {
        if (nativeFsEl() === stage) { manualFs = false; setFsState(true); }
        else if (!manualFs) { setFsState(false); }
      });
    });
    // Native fullscreen already exits itself on Escape (which fires the listener above); this
    // covers the manual fallback mode, which has no browser-level fullscreen to auto-exit.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isFsActive()) exitFs();
    });

    slides.forEach(function (s) { var im = new Image(); im.src = s; });
    render();
  }
  document.querySelectorAll(".stage[data-deck]").forEach(initDeck);

  /* ---------------- PDF modal ---------------- */
  var modal = document.getElementById("pdfModal");
  if (modal) {
    var frame = modal.querySelector("[data-modal-frame]");
    var mTitle = modal.querySelector("[data-modal-title]");
    var modalBox = modal.querySelector(".box");
    var modalClose = modal.querySelector("[data-close]");
    var modalLastFocus = null;
    var openModal = function (src, title) {
      modalLastFocus = document.activeElement;
      frame.src = src; mTitle.textContent = title || "Document";
      modal.classList.add("show"); document.body.style.overflow = "hidden";
      if (modalClose) modalClose.focus();
    };
    var closeModal = function () {
      modal.classList.remove("show"); frame.src = ""; document.body.style.overflow = "";
      if (modalLastFocus && modalLastFocus.focus) { try { modalLastFocus.focus(); } catch (e) {} }
    };
    document.querySelectorAll("[data-pdf]").forEach(function (b) {
      b.addEventListener("click", function () { openModal(b.getAttribute("data-pdf"), b.getAttribute("data-title")); });
    });
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("show")) return;
      if (e.key === "Escape") closeModal();
      else if (e.key === "Tab") trapTab(e, modalBox);
    });
  }

  /* ---------------- Audio/video chapter seeking ---------------- */
  document.querySelectorAll("a[data-seek]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var mediaId = a.getAttribute("data-audio") || a.getAttribute("data-video");
      var media = document.getElementById(mediaId);
      if (!media) return;
      var t = parseFloat(a.getAttribute("data-seek"));
      // Start playback synchronously so the click gesture isn't lost (Safari autoplay policy),
      // then move the playhead once metadata is available.
      try { media.play(); } catch (err) {}
      var seek = function () { try { media.currentTime = t; } catch (err) {} };
      if (media.readyState >= 1) seek();
      else media.addEventListener("loadedmetadata", seek, { once: true });
      media.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });
  });

  /* ---------------- Guided tour engine ---------------- */
  var TOURS = window.TOURS || {};
  var tourEl = document.getElementById("tour");
  if (tourEl) {
    var stage = tourEl.querySelector("[data-tour-stage]");
    var titleEl = tourEl.querySelector("[data-tour-title]");
    var progEl = tourEl.querySelector("[data-tour-progress]");
    var dotsEl = tourEl.querySelector("[data-tour-dots]");
    var prevBtn = tourEl.querySelector("[data-tour-prev]");
    var nextBtn = tourEl.querySelector("[data-tour-next]");
    var current = null, at = 0, lastFocus = null;
    var closeBtn = tourEl.querySelector("[data-tour-close]");

    function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

    function renderStep() {
      var tour = TOURS[current]; if (!tour) return;
      var step = tour.steps[at];
      titleEl.textContent = tour.title;
      progEl.textContent = "Stop " + (at + 1) + " / " + tour.steps.length;
      var h = "";
      if (step.type === "cover") {
        var ctaBtn = "";
        if (step.cta === "deep") ctaBtn = '<button class="btn primary lg" data-tour-cta="deep" style="margin-top:20px">🔬 Launch the Deep Dive →</button>';
        else if (step.cta === "close") ctaBtn = '<button class="btn primary lg" data-tour-cta="close" style="margin-top:20px">Browse the hub →</button>';
        h = '<div class="tslide cover"><span class="k">' + esc(step.meta || "") + '</span>' +
            '<h3>' + esc(step.title) + '</h3><p>' + esc(step.sub || "") + '</p>' + ctaBtn + '</div>';
      } else if (step.type === "audio") {
        h = '<div class="tslide"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<div class="audio-shell' + (step.shell === "warm" ? " warm" : "") + '">' +
            '<audio controls preload="none" src="' + step.src + '"></audio></div></div>';
      } else if (step.type === "video") {
        h = '<div class="tslide"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<video controls preload="none" poster="' + (step.poster || "") + '" src="' + step.src + '"></video></div>';
      } else if (step.type === "image") {
        h = '<div class="tslide"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<img src="' + step.src + '" alt="' + esc(step.title) + '"></div>';
      } else if (step.type === "deck") {
        // One tour stop = one fully interactive mini deck viewer (prev/next, thumbnail strip,
        // fullscreen) — same markup shape as the main-page decks, minus the companion-video
        // intro slide (that video already gets its own separate tour stop). initDeck() is
        // reused as-is below once this markup is in the DOM.
        var deckData = (window.DECKS || {})[step.deckId] || { slides: [] };
        var initialCounter = deckData.slides.length ? ("1 / " + deckData.slides.length) : "";
        h = '<div class="tslide deck"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<div class="deck tour-deck">' +
              '<div class="stage" data-deck="' + esc(step.deckId) + '">' +
                '<img data-slideimg alt="' + esc(step.title) + ' slide" style="display:none">' +
                '<button class="nav-btn prev" data-prev aria-label="Previous slide">‹</button>' +
                '<button class="nav-btn next" data-next aria-label="Next slide">›</button>' +
                '<div class="counter"><span data-counter>' + esc(initialCounter) + '</span></div>' +
                '<button class="nav-btn fs-btn" data-fullscreen aria-label="Enter fullscreen" aria-pressed="false">⛶</button>' +
              '</div>' +
              '<div class="deck-foot"><div class="thumbs" data-thumbs></div></div>' +
            '</div></div>';
      } else if (step.type === "doc") {
        // Full inline PDF, same iframe-embedding pattern as #pdfModal — plus an explicit
        // fallback link since some strict file:// setups block iframed local PDFs.
        h = '<div class="tslide doc-embed"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<div class="doc-frame"><iframe src="' + step.pdf + '" title="' + esc(step.title) + '"></iframe></div>' +
            '<div class="doc-fallback">' +
              '<a class="btn primary" href="' + step.pdf + '" target="_blank" rel="noopener">Open in new tab ↗</a>' +
              '<a class="btn" href="' + step.pdf + '" download>⬇ Download PDF</a>' +
            '</div></div>';
      }
      stage.innerHTML = h;
      stage.scrollTop = 0;
      if (step.type === "deck") {
        var deckStageEl = stage.querySelector(".stage[data-deck]");
        if (deckStageEl) initDeck(deckStageEl);
      }
      var ctaEl = stage.querySelector("[data-tour-cta]");
      if (ctaEl) ctaEl.addEventListener("click", function () {
        var t = ctaEl.getAttribute("data-tour-cta");
        if (t === "deep") open("deep"); else close();
      });
      prevBtn.disabled = at === 0;
      // Keep Next enabled on a final cover step that carries a CTA, so the → arrow can trigger it.
      nextBtn.disabled = (at === tour.steps.length - 1) && !step.cta;
      Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle("active", i === at); });
    }
    function buildDots() {
      var tour = TOURS[current]; dotsEl.innerHTML = "";
      tour.steps.forEach(function (_, i) {
        var d = document.createElement("i");
        d.setAttribute("role", "button"); d.setAttribute("tabindex", "0");
        d.setAttribute("aria-label", "Go to stop " + (i + 1));
        d.addEventListener("click", function () { go(i); });
        d.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); } });
        dotsEl.appendChild(d);
      });
    }
    function stopMedia() {
      stage.querySelectorAll("video,audio").forEach(function (m) { try { m.pause(); } catch (e) {} });
    }
    function go(i) {
      var tour = TOURS[current];
      at = Math.max(0, Math.min(tour.steps.length - 1, i));
      stopMedia(); renderStep();
    }
    function open(name) {
      if (!tourEl.classList.contains("show")) lastFocus = document.activeElement;
      current = name; at = 0; buildDots(); renderStep();
      tourEl.classList.add("show"); tourEl.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      stopMedia(); tourEl.classList.remove("show"); tourEl.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }

    document.querySelectorAll(".tour-launch").forEach(function (b) {
      b.addEventListener("click", function () { open(b.getAttribute("data-tour")); });
    });
    prevBtn.addEventListener("click", function () { go(at - 1); });
    nextBtn.addEventListener("click", function () {
      var step = TOURS[current].steps[at];
      // handle cover CTA on the final step
      if (step && step.cta === "deep") { open("deep"); return; }
      if (step && step.cta === "close") { close(); return; }
      go(at + 1);
    });
    tourEl.querySelector("[data-tour-close]").addEventListener("click", close);
    // Swiping left/right on the stage itself steps through the tour, same as the arrows —
    // .click() is a no-op on a disabled button, so swiping past either end just stops there.
    addSwipe(stage, function () { nextBtn.click(); }, function () { prevBtn.click(); });
    // True while an embedded deck (inside a "deck"-type tour stop) is fullscreen, whether via
    // the real Fullscreen API or the manual .is-fullscreen fallback — so a stray Escape press
    // that's really meant to back out of fullscreen doesn't also close the whole tour.
    function embeddedDeckIsFullscreen() {
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement;
      if (fsEl && tourEl.contains(fsEl)) return true;
      return !!tourEl.querySelector(".stage.is-fullscreen");
    }
    // clicking a cover CTA via the Next button is handled above; also allow CTA cover to advance
    document.addEventListener("keydown", function (e) {
      if (!tourEl.classList.contains("show")) return;
      if (e.key === "Escape") {
        if (embeddedDeckIsFullscreen()) return; // let the deck's own fullscreen-exit handle this press
        close(); return;
      }
      if (e.key === "Tab") { trapTab(e, tourEl.querySelector(".tour-box")); return; }
      var tag = e.target && e.target.tagName;
      if (tag === "VIDEO" || tag === "AUDIO") return; // let media handle arrow keys
      // An embedded deck (prev/next buttons, thumbnails, fullscreen toggle) has its own
      // arrow-key handling (see initDeck) — don't let the tour's own arrows fight with it.
      if (e.target && e.target.closest && e.target.closest(".tslide.deck")) return;
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    });
    tourEl.addEventListener("click", function (e) { if (e.target === tourEl) close(); });
  }
})();

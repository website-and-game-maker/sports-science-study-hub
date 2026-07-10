/* Study hub interactions: dropdown nav, slideshow decks, PDF modal,
   audio chapter seek, and the guided tour engine. */
(function () {
  "use strict";

  /* ---------------- Shared helpers ---------------- */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
  // close menus + mobile nav when a menu link is clicked
  document.querySelectorAll(".menu-item, .nav-flat").forEach(function (a) {
    a.addEventListener("click", function () {
      menus.forEach(function (m) { m.classList.remove("open"); });
      var nl = document.querySelector(".nav-links"); if (nl) nl.classList.remove("open");
    });
  });
  var hb = document.querySelector("[data-hamburger]");
  if (hb) hb.addEventListener("click", function () {
    document.querySelector(".nav-links").classList.toggle("open");
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
    var idx = -1;

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
    function go(i) { idx = Math.max(-1, Math.min(slides.length - 1, i)); render(); }
    stage.querySelector("[data-next]").addEventListener("click", function () { go(idx + 1); });
    stage.querySelector("[data-prev]").addEventListener("click", function () { go(idx - 1); });
    stage.setAttribute("tabindex", "0");
    stage.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === "VIDEO" || tag === "AUDIO") return; // let the intro video handle arrow keys
      if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); }
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

  /* ---------------- Audio chapter seeking ---------------- */
  document.querySelectorAll("a[data-seek]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var audio = document.getElementById(a.getAttribute("data-audio"));
      if (!audio) return;
      var t = parseFloat(a.getAttribute("data-seek"));
      // Start playback synchronously so the click gesture isn't lost (Safari autoplay policy),
      // then move the playhead once metadata is available.
      try { audio.play(); } catch (err) {}
      var seek = function () { try { audio.currentTime = t; } catch (err) {} };
      if (audio.readyState >= 1) seek();
      else audio.addEventListener("loadedmetadata", seek, { once: true });
      audio.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
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
      } else if (step.type === "doc") {
        h = '<div class="tslide"><h3>' + esc(step.title) + '</h3><p class="cap">' + esc(step.cap) + '</p>' +
            '<div class="doc-tour"><img src="' + step.thumb + '" alt="">' +
            '<a class="btn primary lg" href="' + step.pdf + '" target="_blank" rel="noopener">Open the report →</a></div></div>';
      }
      stage.innerHTML = h;
      stage.scrollTop = 0;
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
    // clicking a cover CTA via the Next button is handled above; also allow CTA cover to advance
    document.addEventListener("keydown", function (e) {
      if (!tourEl.classList.contains("show")) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") { trapTab(e, tourEl.querySelector(".tour-box")); return; }
      var tag = e.target && e.target.tagName;
      if (tag === "VIDEO" || tag === "AUDIO") return; // let media handle arrow keys
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    });
    tourEl.addEventListener("click", function (e) { if (e.target === tourEl) close(); });
  }
})();

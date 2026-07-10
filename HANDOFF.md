# Sports Science Careers — Study Hub · Handoff / Debug Guide

A single-page static website that organizes NotebookLM-generated study material
(2 videos, 2 audio files, 2 slide decks, 3 PDF reports) about **B.Sc. Sports &
Exercise Science careers in India** into an easy-to-digest hub.

Built to be opened directly from disk (`file://`) — no server or build step required
to *view* it. There is an optional Python generator for regenerating the HTML.

---

## 1. How to open / preview

- Just open `index.html` in a browser (double-click, or `file://…/Website/index.html`).
- Everything is relative-path based, so the whole `Website/` folder is portable **as long
  as it stays next to the original media files** (see §4).

---

## 2. File map

```
Career Bachelor Thing/                ← parent folder (the user's originals live here)
├─ Sports Science Overview.mp4        ← referenced by the site via ../
├─ Career Path Stuff.mp4
├─ Explaining Sports Science short (1 min).m4a
├─ Explaining Sports Science long (50 min).m4a
├─ Sports_Science_Career_Playbook.pptx
├─ Modern_Sports_Science_Career_Blueprint.pptx
├─ (3 source PDFs)
└─ Website/                           ← THE SITE
   ├─ index.html                      ← generated page (structure + embedded transcripts + TOURS data)
   ├─ HANDOFF.md                      ← this file
   ├─ _source/                        ← reproducibility: generator + transcripts
   │  ├─ build_site.py                ← regenerates index.html
   │  └─ transcripts/                 ← whisper transcripts (txt + json w/ timestamps)
   └─ assets/
      ├─ css/style.css                ← all styling (design tokens at top under :root)
      ├─ js/app.js                    ← all interactivity (no framework, vanilla JS)
      ├─ pdf/                         ← copies of the 3 reports (embedded via modal iframe)
      ├─ thumbs/                      ← PDF first-page thumbs + video posters
      └─ slides/
         ├─ blueprint/  s-01..s-12.png (+ tn/ thumbnails)
         └─ playbook/   s-01..s-11.png (+ tn/ thumbnails)
```

---

## 3. Architecture (what to know before editing)

**No framework.** Plain HTML + one CSS file + one JS file (IIFE). Safe to refactor.

- **`index.html`** is emitted by `_source/build_site.py`. If you change page *structure* or
  *copy*, prefer editing the generator and re-running it (`python3 _source/build_site.py`)
  so transcripts/tours stay in sync — but editing `index.html` directly is fine too if you
  don't plan to regenerate.
- **Transcripts** are embedded inline in `index.html` (inside `<details>` panels). They were
  produced with faster-whisper (`tiny` model) — good but not perfect; fix typos if you spot them
  (e.g. "Pro-Cobody" → "Pro Kabaddi", "canyzeology" → "kinesiology").
- **`window.DECKS`** (inline `<script>` per deck) holds slide image paths for the slideshow viewer.
- **`window.TOURS`** (inline `<script>` near the bottom) holds the guided-tour step data.
- **`app.js`** wires five things: dropdown nav, slideshow decks, PDF modal, audio chapter-seek,
  and the guided tour engine. Each is a clearly-commented block.

### Key interactions
- **Dropdown menu nav** — sections group by depth and *mix media* (Overviews = short audio +
  video + deck; Deep Dives = long audio + video + deck; Reports; Reference).
- **Guided tours** (`Tours` menu / hero buttons) — full-screen overlay that steps through the
  same files with ← → arrows. Quick = 5 stops (~10 min), Deep = 8 stops (~90 min). A "deck"-type
  stop embeds a full interactive mini slideshow (own prev/next + thumbnails + fullscreen); a
  "doc"-type stop embeds the full PDF inline via an iframe. The final cover step has an in-slide
  CTA button (Quick → launches Deep; Deep → closes).
- **Slideshow decks** — first "slide" is the companion video (themed to the deck), then the
  rendered PNG slides. Arrows + keyboard + thumbnail strip.

---

## 4. Gotchas / things to watch

1. **Large media is referenced via `../`** (not copied) to avoid duplicating ~170 MB. If the
   `Website/` folder is moved away from the originals, videos/audio/`.pptx` downloads break.
   Fix: either keep them together, or copy the originals into `assets/media/` and update paths.
2. **Filenames with spaces/parens** are URL-encoded in the HTML (`%20`, `%28`, `%29`). Keep that
   if you rename anything.
3. **PDF inline view** uses an `<iframe>` to a local file — works in Chrome/Safari/Firefox from
   `file://`. Some strict setups block it; the ⬇ PDF button is the fallback.
4. **Emoji in menu labels** render fine on macOS; they showed as boxes only in the headless test
   environment (missing emoji font) — not a real issue.

---

## 5. Fact-check status (done July 2026 via web search)

The source documents were AI-generated and contained errors. The site's **Reference** section
was corrected; the original videos/audio/decks/PDFs were **not** altered (they're source
artifacts), and the Reference notes call out the discrepancies. Corrections applied:

| Item | Source said | Corrected to | Note |
|------|-------------|--------------|------|
| MAHE Manipal eligibility | "Bio or Math" | **Requires PCB (Biology mandatory)** | verified on manipal.edu |
| MAHE fee | ₹1,36,000/yr | ≈ ₹1,85,000/yr | |
| IISM Mumbai fee | ₹5,40,000/yr | ≈ ₹2,70,000/yr (₹8.1 L / 3 yr) | ~2× overstated in source |
| Woxsen fee | ₹5,80,000/yr | ≈ ₹6,50,000/yr | |
| IGIPESS fee | ₹14,600/yr | ≈ ₹10,000–13,000/yr | govt-affiliated, low |
| Entry salaries | ₹6–14 L "entry" | Entry ₹2.5–6.8 L; ₹10–18 L w/ experience | source figures were mid-career/top-tier |
| "No biology required" framing | universal | institution-specific (Jain, Symbiosis, Somaiya, SGT) | NEP enables it, not yet standard |

Everything else (institution/program/exam names, NEP 2020, NSCA-CSCS & ACSM-EP requirements,
IPL/ISL/PKL, JSW/Inspire Institute, VICON/GPS tech) verified **TRUE**.

Fees change yearly — treat all ₹ figures as directional and re-verify before relying on them.

### Independent re-verification (2026-07-09)
A second, independent web fact-check re-checked a broad representative sample and found **no errors**
— every corrected figure held up:
- **Fees (exact matches):** MAHE ₹5.56 L/3 yr ≈ ₹1.85 L/yr · IISM ₹8,09,508/3 yr ≈ ₹2.7 L/yr ·
  Somaiya ₹7.05 L/3 yr ≈ ₹2.35 L/yr · SGT ₹4.8 L tuition/4 yr ≈ ₹1.2 L/yr · Symbiosis ₹6.65 L
  total-academic ≈ ₹1.66 L/yr. Woxsen ≈ ₹6.5–7 L/yr, Jain ~₹1–2.3 L/yr — both in range.
- **Eligibility:** MAHE / IISM / SRIHER require PCB (Biology) ✓; Jain *Bachelor of Sports Sciences*,
  Somaiya, Symbiosis, SGT admit any stream + bridge ✓. (Nuance: Jain *also* has a separate
  Biology-requiring "B.Sc. Sports Science" under Allied Health; SGT phrasing is "PCM or relevant
  subjects", so its any-stream framing is marketing-forward but defensible.)
- **IGIPESS 5% quota** for >60% Class-12 Physical Education — **confirmed true** (official DU rule).
- **Certs:** CSCS = any-field bachelor's + CPR/AED now, CASCE-accredited S&C-related degree from
  **Jan 1 2030** ✓; ACSM-EP = exercise-science/physiology/kinesiology degree ✓ (CAAHEP-accredited
  from Aug 2027); NSNIS Patiala = academic wing of SAI, Diploma in Sports Coaching ✓.
- **Salaries:** 2026 India data confirms Sports Scientist fresher ₹4.5–6.8 L and S&C ₹3–6 L — the
  source docs' "₹6–14 L entry" was indeed mid-career/top-tier, as the site's note says. ✓

---

## 6. Independent code review — applied vs. remaining

A fresh subagent reviewed `index.html` / `style.css` / `app.js`. Result: **no blocking bugs,
no broken asset paths.** Fixes already applied from that review:

- ✅ `aria-haspopup` + live-toggled `aria-expanded` on the dropdown menu buttons.
- ✅ `aria-live="polite"` on the tour stage so step changes are announced.
- ✅ `aria-label` on the PDF-modal close button.
- ✅ Tour dots **and** deck thumbnails are now keyboard-operable (`role="button"`,
  `tabindex`, Enter/Space handlers).
- ✅ Tour overlay focus management: focuses the close button on open, restores focus on close.
- ✅ Video chapter timestamps restyled (muted) so they no longer *look* clickable like the
  audio ones (audio chapters seek; video chapters are labels only).
- ✅ Removed dead `.paths` CSS (leftover from the previous layout) and corrected stale tour
  stop-counts.
- ✅ `-webkit-backdrop-filter` fallbacks added.

## 7. Second review pass — code, a11y & design (2026-07-09)

An independent code/a11y review + a design pass were run. **Applied:**

- ✅ **Focus trap** in both the tour and PDF-modal overlays (`trapTab()` in `app.js`); both boxes
  now carry `role="dialog"` + `aria-modal="true"`.
- ✅ **PDF modal focus management** — stores the trigger, moves focus to the close button on open,
  restores it on close (previously the tour did this but the modal didn't).
- ✅ **`prefers-reduced-motion`** honored — smooth-scroll, tour fade, and hover transforms are all
  gated (CSS media query + a JS `prefersReducedMotion()` branch for `scrollIntoView`).
- ✅ **Visible keyboard focus** everywhere — single amber `:focus-visible` ring that reads on both
  the dark nav and white body (custom thumbnails/tour-dots previously had none).
- ✅ **CSS specificity bug fixed** — `.nav-links a` was overriding the dropdown `.menu-item`
  anchors (giving them pill radius + an invisible hover); scoped to `.nav-links > a`.
- ✅ **Audio chapter-seek** now calls `play()` synchronously to preserve the click gesture
  (Safari autoplay), then seeks on `loadedmetadata` — previously deferred `play()` into a callback.
- ✅ **Arrow keys** inside the tour/deck no longer hijack a focused `<video>`/`<audio>`.
- ✅ **Dead code removed** — the tour "Next" arrow now actually fires the final-step CTA
  (launch Deep Dive / close) instead of being disabled with the branch unreachable.
- ✅ Guarded the modal's global Escape handler behind an `is-open` check.

**Design pass — a "performance-lab telemetry" type system** (subject-driven, replaces the
Inter-for-everything default):
- **Space Grotesk** (display) for headlines/brand · **Space Mono** for all *measurements & labels*
  (eyebrows, ⏱ time badges, chapter timestamps, slide counter, tour progress, deck meta, and the
  ₹ fee/pay columns via `td.num`) · **Inter** retained for body/transcripts.
- Softened the hero grid so it reads as an intentional measurement grid, not the generic AI tell.
- Fonts loaded from Google Fonts (same `<link>` as before, `&family=` appended).

**Content:** fixed the clearest ASR proper-noun garbles in the two short transcripts
("Pro-Cobody/Pro-Cabody"→"Pro Kabaddi", "canyzeology"→"kinesiology", "any P20"→"NEP 2020",
"NCA CSCS"→"NSCA-CSCS", "P-Cumen"→"human", "Jane/Somaya/symbiosis"→"Jain/Somaiya/Symbiosis").
Source media/decks/PDFs left untouched.

### Still deferred
- Optional: `<track>` captions, dark-mode, lazy-loading the long inline transcript.

## 8. Completeness pass (2026-07-10)

A follow-up pass verified every "✅ Applied" bullet in §6/§7 against the actual code (all held up)
and closed out the two items that were "Still deferred" above, plus a separate bug in the generator:

- ✅ **Video chapter timestamps now seek** — both `<video>` cards (`v-overview`, `v-career`) got
  `id="vid-overview"` / `id="vid-career"`, and their chapter lists now use the same
  `<a data-seek data-video="...">` pattern the audio chapters already used. `app.js`'s seek handler
  was generalized (`data-audio || data-video` → one shared `media` element) so both audio and
  video chapters play synchronously on click and seek once `loadedmetadata` fires (Safari-safe).
  `build_site.py`'s `chap_html()` gained a `video_id` param so regeneration stays in sync.
- ✅ **50-minute deep-dive transcript (`a-long`) ASR garbles fixed** — ~45 clear proper-noun/word
  garbles corrected in both `index.html` and `_source/transcripts/long.txt` (kept in sync), e.g.
  "broco body league"→"Pro Kabaddi league", "Granchized"→"Franchised", "Jane University"→"Jain
  University", "Somaya"→"Somaiya", "S-Rire"→"SRIHER", "STGT"→"SGT", "IPO"→"IPL" (cricket context),
  "six-lact/14-lact"→"six lakh/14 lakh", "ACSMEP"→"ACSM-EP", "W-Op"→"WHOOP", "Orra"→"Oura",
  "Tajisupha's National Institute"→"Netaji Subhas National Institute", among others. Content
  otherwise preserved verbatim.
- 🔧 **`_source/build_site.py` hardcoded sandbox paths fixed** — `OUT`/`TR` were absolute paths from
  a different machine (`/sessions/trusting-eager-turing/...`); now derived from the script's own
  location (`Website/_source/build_site.py` → writes `Website/index.html`, reads
  `Website/_source/transcripts/`), so the generator actually runs on this machine.
- 🔧 While fixing the generator, found it had drifted from the hand-edited `index.html` (the design
  pass and code-review fixes were applied directly to `index.html` but never back-ported): the
  Space Grotesk/Space Mono font `<link>`, `class="num"` on the fee/pay table cells, and
  `role="dialog" aria-modal="true"` on the tour box and PDF modal were all missing from the
  generator's template. All three are now added to `build_site.py` so regeneration matches the
  shipped page.
- ⚠️ **Known remaining staleness (not fixed, flagging only):** `_source/transcripts/short.txt` and
  `overview.txt` still contain the *pre-fix* garbled text (e.g. "Pro-Cobody", "any P20", "canyzeology",
  "Jane"/"Somaya") even though the corresponding transcripts in `index.html` were already corrected
  during the second review pass — that correction was never written back to the source `.txt`
  files. Regenerating from `build_site.py` today will therefore revert `a-short` and `v-overview`'s
  transcripts to the old garbled text. Was intentionally left alone this pass (out of the
  authorized scope of touching those two files); worth a follow-up to sync them from `index.html`.
  Also spotted but left untouched (same reason — out of scope, and/or low confidence): "Coca-Labin"
  (a-short) is very likely a garbled clinic name; `v-career`'s transcript still has the same class
  of institution-name garbles as the old `a-long` (e.g. "Mahay and Manapal", "Jane University",
  "Samaya Sports Academy"); and in `a-long`, "beat elegance"/"beat logic" (rowing biomechanics tool)
  and "mission pitch vision" (cricket ball-tracking) could not be confidently identified.

## 9. Explore→Tours rename + transcript-staleness follow-up (2026-07-10)

- ✅ Nav dropdown renamed "Explore" → "Tours" in `index.html` and `_source/build_site.py` (the
  two tour-launch buttons inside it are unchanged — only the visible label moved).
- ✅ Closed the staleness gap flagged in §8: `_source/transcripts/short.txt` and `overview.txt`
  now carry the same corrections already applied to `index.html` ("Pro-Cobody"/"Pro-Cabody"→
  "Pro Kabaddi", "any P20"→"NEP 2020", "NCA CSCS"→"NSCA-CSCS", "ACSM EP"→"ACSM-EP", "P-Cumen"→
  "human", "symbiosis, Jane University, Somaya"→"Symbiosis, Jain University, Somaiya",
  "canyzeology"→"kinesiology"). Regenerating from `build_site.py` no longer reverts these two
  transcripts.

## 10. Fullscreen deck viewer (2026-07-10)

- ✅ Added a fullscreen toggle (⛶ button, top-right of the stage) to the slideshow deck viewer —
  applies to **both** decks (Playbook and Tactical Blueprint) since they share one `initDeck()`
  function in `app.js`. Uses the real Fullscreen API (`requestFullscreen`/`exitFullscreen`, with
  vendor-prefixed fallbacks for older engines) and falls back to a manual `.is-fullscreen` CSS
  class when the API is unavailable, rejected, or hangs (some embedded/`file://` contexts never
  resolve the promise — a 400ms fallback timer catches that instead of leaving the button inert).
  While fullscreen, the thumbnail strip (`.deck-foot`, normally outside `.stage`) is reparented
  inside the stage as a bottom overlay so slide navigation stays reachable; it's moved back on
  exit. Escape exits (native fullscreen already does this; the manual fallback mode gets its own
  Escape handler since there's no browser-level fullscreen to auto-exit). Focus lands on the
  toggle button both entering and exiting so keyboard/screen-reader users aren't stranded.
  `prefers-reduced-motion` covers the new hover-scale transition. `_source/build_site.py`'s
  `deck()` template was updated to match, so regeneration doesn't lose the button.

## 11. Tour: embedded decks + inline PDF reports (2026-07-10)

Changed how the guided tours (`window.TOURS`, `renderStep()` in `app.js`) present slideshows and
reports, per explicit request — previously each "image" step showed one static slide PNG as its
own separate tour stop, and each "doc" step showed a thumbnail + an "Open the report →" link that
left the tour to view the PDF in a new tab.

- ✅ **Slideshows collapsed to one stop per deck.** Quick tour's four `image` steps (playbook
  s-01/s-03/s-05/s-11) and Deep tour's five `image` steps (blueprint s-01/s-03/s-06/s-08/s-10) are
  now each a single new `"type":"deck"` step (`{"type":"deck","deckId":"playbook"|"blueprint",...}`)
  that embeds the **entire interactive deck viewer** inline — same prev/next buttons, thumbnail
  strip, and fullscreen toggle as the main-page decks. This reuses `initDeck()` as-is rather than
  forking a separate implementation: `initDeck(stage)` already only depends on the `stage` element
  passed to it plus its DOM ancestor structure (`.deck > .stage[data-deck] + .deck-foot > .thumbs`),
  so `renderStep()` just builds that same markup shape inside the tour stage and calls
  `initDeck(deckStageEl)` on it. One tweak was needed for reuse: the tour-embedded deck has no
  companion-video intro slide (that video already has its own separate tour stop right before it),
  so `initDeck()`'s starting index and `go()` clamp are now `intro ? -1 : 0` instead of always `-1`
  — decks with a `[data-intro]` block (main page) behave exactly as before; decks without one (the
  tour embed) open straight on slide 1.
- ✅ **PDFs embedded inline via `<iframe>`.** Each `doc` step (still one stop per report — 3 in the
  Deep tour) now renders `<iframe src="…pdf">` sized to `62vh` inside the tour stage (which already
  scrolls — `.tour-stage{overflow:auto}` — so a long report just scrolls the dialog), the same
  embedding pattern `#pdfModal`/`[data-modal-frame]` already uses elsewhere on the page. Kept an
  explicit "Open in new tab ↗" + "⬇ Download PDF" fallback alongside it, since (per the gotchas in
  §4) some strict `file://` setups block iframed local PDFs. Dropped the now-unused `thumb` field
  from the doc steps' data.
- ✅ **Stop counts updated.** Quick tour: 8 → **5 stops** (`≈ 10 minutes · 5 stops`, cover-step copy
  "8 short stops" → "5 short stops"). Deep tour: 12 → **8 stops** (`≈ 90 minutes · 8 stops`); its
  three doc steps were renumbered 8/9/10 → 4/5/6 to match. The "Stop X / Y" progress counter itself
  needed no change — it's computed from `steps.length` automatically.
- ✅ **Keyboard: no fighting between tour arrows and the embedded deck.** The tour's own
  document-level ArrowLeft/ArrowRight handler now also bails out when the event target is inside
  `.tslide.deck` (the embedded deck's stage, its prev/next buttons, or its thumbnails) — same idea
  as the pre-existing guard that already let a focused `<video>`/`<audio>` keep its own arrow keys.
  The embedded deck's own prev/next buttons and thumbnail strip remain the way to navigate within
  it; the tour's ← → still move between tour stops otherwise. Also added an Escape-key guard
  (`embeddedDeckIsFullscreen()`): if the embedded deck is fullscreen (native Fullscreen API or the
  manual `.is-fullscreen` fallback) when Escape is pressed, the tour no longer also closes itself
  on that same keypress — Escape just backs the deck out of fullscreen first, as expected.
- ✅ **CSS** — new `.tslide.deck` / `.tslide.doc-embed` rules following the existing `.tslide.*`
  convention in the "tour slide content" section. `.tslide.deck` nests the same `.deck`/`.stage`/
  `.deck-foot` classes the main-page decks use (so it inherits all of that component's styling for
  free — card chrome, nav buttons, counter, thumbnails, fullscreen), just capping `.stage`'s height
  to `52vh` so it fits comfortably in the tour dialog. Removed the now-dead `.tslide .doc-tour`
  rules (replaced by `.tslide.doc-embed .doc-frame`/`.doc-fallback`).
- ✅ `_source/build_site.py`'s `tours` dict was updated to match `index.html` exactly — verified by
  running `python3 _source/build_site.py` and diffing: only the `window.TOURS = {...}` line changed
  (no unrelated reversions to transcripts or other generator inputs).
- ⚠️ **Known minor limitation, not fixed:** each time a tour "deck" step is (re-)rendered (e.g. the
  user navigates away and back to it), `renderStep()` rebuilds the stage's markup from scratch and
  calls `initDeck()` again on the fresh element. `initDeck()`'s fullscreen handling registers a few
  `document`-level listeners (`fullscreenchange` variants + Escape) per call, which aren't torn
  down — they just become inert once their captured `stage` element is discarded (the old listeners
  check `nativeFsEl() === stage` against a detached node, so they no-op harmlessly), but they do
  accumulate for the life of the page. Not a problem for realistic use (a person clicking through a
  tour a handful of times per session), so left alone rather than reworking `initDeck()`'s fullscreen
  lifecycle to add cleanup — flagging in case it matters for a future refactor.

_Last updated after the tour embedded-deck / inline-PDF pass (2026-07-10)._

# Sports Science Careers — Study Hub · Handoff / Debug Guide

A multi-page static website that organizes NotebookLM-generated study material
(2 videos, 2 audio files, 2 slide decks, 3 PDF reports) about **B.Sc. Sports &
Exercise Science careers in India** into an easy-to-digest hub. Originally built as a
single scrolling page, then split into separate pages (§9 in the changelog below) and
made fully self-contained for deployment (§13).

Built to be opened directly from disk (`file://`) or served as a static site (e.g.
GitHub Pages) — no build step required to *view* it. There is an optional Python
generator for regenerating `index.html`, but it currently only knows how to produce the
**old single-page layout** — see the note in §3.

---

## 1. How to open / preview

- **Live:** https://website-and-game-maker.github.io/sports-science-study-hub/
- Or open `index.html` in a browser (double-click, or `file://…/Website/index.html`), or serve
  the `Website/` folder with any static file server (`python3 -m http.server`) and open it.
- Repo: https://github.com/website-and-game-maker/sports-science-study-hub (public, so free
  GitHub Pages works on a personal account — the content itself isn't sensitive). Pages is
  configured to build from the `main` branch root, which is this `Website/` folder itself
  (the git repo's root *is* `Website/`, not the parent folder).
- All 7 pages and all media are self-contained inside `Website/` — the folder no longer needs
  to sit next to the original source media (see §4, gotcha 1 — this used to be a real
  requirement and no longer is).

---

## 2. File map

```
Career Bachelor Thing/                       ← parent folder (the user's originals live here,
│                                                untouched — Website/ has its own copies now)
├─ Sports Science Overview.mp4
├─ Career Path Stuff.mp4
├─ Explaining Sports Science short (1 min).m4a
├─ Explaining Sports Science long (50 min).m4a
├─ Sports_Science_Career_Playbook.pptx
├─ Modern_Sports_Science_Career_Blueprint.pptx
├─ (3 source PDFs)
└─ Website/                                  ← THE SITE (self-contained, deployable as-is)
   ├─ index.html                             ← Home: hero + "where to go next" link-cards
   ├─ tours.html                             ← Tours: Quick Digest / Deep Dive launch cards
   ├─ overviews.html                         ← Overviews: 60-sec brief, overview video, Playbook deck
   ├─ deepdives.html                         ← Deep Dives: 50-min audio, Career Path video, Blueprint deck
   ├─ reports.html                           ← Reports: 3 PDF report cards + PDF modal
   ├─ library.html                           ← Media Library: browse everything by format
   ├─ reference.html                         ← Reference: fact-checked cheat-sheet tables
   ├─ HANDOFF.md                             ← this file
   ├─ _source/                               ← reproducibility: generator + transcripts
   │  ├─ build_site.py                       ← regenerates the OLD single-page index.html only (§3)
   │  └─ transcripts/                        ← whisper transcripts (txt + json w/ timestamps)
   └─ assets/
      ├─ css/style.css                       ← all styling (design tokens at top under :root)
      ├─ js/app.js                           ← all interactivity (no framework, vanilla JS)
      ├─ media/                              ← local copies of the 6 large source files (§13) —
      │                                         videos, audio, .pptx decks, referenced by all 7 pages
      ├─ pdf/                                ← copies of the 3 reports (embedded via modal iframe)
      ├─ thumbs/                             ← PDF first-page thumbs + video posters
      └─ slides/
         ├─ blueprint/  s-01..s-12.png (+ tn/ thumbnails)
         └─ playbook/   s-01..s-11.png (+ tn/ thumbnails)
```

---

## 3. Architecture (what to know before editing)

**No framework.** Plain HTML + one CSS file + one JS file (IIFE), 7 pages. Safe to refactor.

- **⚠️ `_source/build_site.py` is out of sync with the real site.** It still only generates the
  *old single-page* `index.html` layout (pre-split). The 7-page structure, the fullscreen deck
  toggle, the embedded tour decks/PDFs, the Media Library section, and the localized
  `assets/media/` paths were all added/changed by hand across `index.html` and the 6 other page
  files without updating the generator (a full multi-page rewrite of `build_site.py` was judged
  out of scope for that pass). **Do not run `build_site.py` expecting it to regenerate the current
  site** — it will only produce a stale single-page version. If you want generator parity back,
  that's a real follow-up task: teach it to emit `tours.html`/`overviews.html`/`deepdives.html`/
  `reports.html`/`library.html`/`reference.html` plus the localized media paths.
- Until that rewrite happens, **edit the 7 HTML files directly** for any structural/copy changes,
  and keep the shared nav/footer markup byte-for-byte identical across all 7 (see any page for
  the current canonical nav block).
- **Transcripts** are embedded inline in `overviews.html` / `deepdives.html` (inside `<details>`
  panels). They were produced with faster-whisper (`tiny` model) — good but not perfect; fix
  typos if you spot them (e.g. "Pro-Cobody" → "Pro Kabaddi", "canyzeology" → "kinesiology").
- **`window.DECKS`** (inline `<script>` per deck) holds slide image paths for the slideshow
  viewer — lives on `overviews.html` (playbook) and `deepdives.html` (blueprint).
- **`window.TOURS`** (inline `<script>`) holds the guided-tour step data — present on both
  `index.html` (hero CTA buttons) and `tours.html` (its own launch cards); identical on both.
- **`app.js`** wires: dropdown nav, slideshow decks (+ fullscreen), the PDF modal, audio/video
  chapter-seek, and the guided tour engine (with embedded deck/PDF stops). Every block is guarded
  (`if (element) {...}`) so it's safe to include `app.js` on every page even though most pages
  only use a subset of its features — a page missing a given element (e.g. no `#tour` on
  `overviews.html`) just makes that block a no-op, it doesn't error.

### Key interactions
- **Nav** — `Tours`, `Media Library`, and `Reference` are flat links straight to their own page;
  `Overviews`, `Deep Dives`, and `Reports` are dropdowns whose items link to an anchor on their
  respective page (e.g. `overviews.html#playbook`). The brand/logo links to `index.html` from
  every page.
- **Guided tours** (`Tours` page / hero buttons on `index.html`) — full-screen overlay that steps through the
  same files with ← → arrows. Quick = 5 stops (~10 min), Deep = 8 stops (~90 min). A "deck"-type
  stop embeds a full interactive mini slideshow (own prev/next + thumbnails + fullscreen); a
  "doc"-type stop embeds the full PDF inline via an iframe. The final cover step has an in-slide
  CTA button (Quick → launches Deep; Deep → closes).
- **Slideshow decks** — first "slide" is the companion video (themed to the deck), then the
  rendered PNG slides. Arrows + keyboard + thumbnail strip.

---

## 4. Gotchas / things to watch

1. ~~Large media is referenced via `../` (not copied)~~ — **fixed (§13):** all 6 large source
   files now live in `assets/media/` inside `Website/`, so the folder is fully self-contained
   and portable. If you ever add new source media, copy it into `assets/media/` too rather than
   reaching outside `Website/` again — a deployed static host (GitHub Pages, etc.) has no access
   to anything outside the repo it's given.
2. **Filenames with spaces/parens** are URL-encoded in the HTML (`%20`, `%28`, `%29`). Keep that
   if you rename anything.
3. **Case sensitivity on real hosting.** This was built on macOS, which is case-insensitive, but
   GitHub Pages (and most static hosts) run case-sensitive filesystems. A path that "works" locally
   with mismatched case will silently 404 once deployed — if you rename or add an asset, make sure
   every reference matches the on-disk filename's case exactly.
4. **PDF inline view** uses an `<iframe>` to a local file — works in Chrome/Safari/Firefox from
   `file://`. Some strict setups block it; the ⬇ PDF button is the fallback. The guided tour's
   embedded PDF stops use the same iframe approach with the same fallback link.
5. **Emoji in menu labels** render fine on macOS; they showed as boxes only in the headless test
   environment (missing emoji font) — not a real issue.
6. **`app.js` is one shared file across all 7 pages** but every feature block guards on
   `document.getElementById`/`querySelector` existing first — a page that doesn't have, say, the
   `#pdfModal` element just skips that block harmlessly. If you add a new interactive feature,
   keep this guard pattern so the shared script stays safe to include everywhere.

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

## 12. Media Library — browse by format (2026-07-10)

A direct user follow-up, distinct from the original nav-restructuring request: the site
already organizes content by **depth** (Overviews = shallow, Deep Dives = long-form — each
tier holding one video, one audio file and one deck), but there was no way to browse
**across tiers by format** — e.g. jump straight to "just the videos" regardless of which
depth-tier they belong to. The user explicitly asked for this as a separate, additional way
to browse: *"make it easy to view by media type... this is separate from the tours and the
overviews and the reports."*

- ✅ Added a new flat nav entry, **"Media Library"** (`index.html` + `_source/build_site.py`,
  next to the existing `Tours` / `Overviews` / `Deep Dives` / `Reports` dropdowns and the
  `Reference` flat link — placed between `Reports` and `Reference`).
- ✅ Added a new page section, `id="library"` (`Section 04 · Browse by format`), inserted
  between the existing `#reports` and `#reference` sections, with four clearly-labeled
  groups: **🎬 Videos**, **🎧 Audio**, **🖼️ Slideshows**, **📄 Reports**.
- **Design decision — link-through cards, not duplicated players:** every card in the new
  section reuses the site's existing `.card` / `.body` / `.badges` / `.badge` / `.doc` /
  `.media-frame` / `.row-actions` component classes (no new CSS, no new visual language), but
  instead of re-embedding a second `<video>`/`<audio>`/deck-viewer instance, each card is a
  lightweight summary (thumbnail + badges + one-line description) with a "Jump to the
  player/deck/report →" button that anchors straight to the existing `#v-overview`,
  `#v-career`, `#a-short`, `#a-long`, `#playbook`, `#blueprint`, `#doc-academic`,
  `#doc-evolution`, `#doc-strategic` elements where the real interactive widget already
  lives. This was a deliberate choice over duplicating the full players: the audio/video
  elements have unique `id`s that the chapter-seek JS (`data-seek` + `getElementById`) and
  the deck JS (`window.DECKS["playbook"|"blueprint"]`) key off of — a second `<audio
  id="aud-short">` or a second `initDeck()` instance on the same page would either collide
  on duplicate IDs or double the heavy deck/slide assets for no real benefit. A find-it-fast
  link-through card gets someone to the right format just as quickly without that risk, and
  keeping the same approach across all four groups (rather than duplicating some and
  linking others) keeps the section predictable to scan.
- Slideshow cards use the deck's own thumbnail (`assets/slides/playbook/tn/s-01.png` /
  `.../blueprint/tn/s-01.png`) inside `.media-frame`; report cards reuse the exact existing
  `.doc` thumb+meta+actions markup from the Reports section (same PDF first-page thumbnails).
  Badge choices (`easy`/`medium`/`deep`, `⏱` time or slide count) mirror the badges already
  used on each item's home card.
- `_source/build_site.py`'s page template was updated with the identical nav entry and
  section (verified via `python3 _source/build_site.py` + `git diff` — regeneration produces
  only this section/nav addition, nothing else reverted).
- Scope note: this section only adds a browse-by-format entry point; it does not touch the
  deck viewer's fullscreen toggle (§10) or the guided tour's internals — those were being
  worked on concurrently on other branches.

## 13. Split into 7 pages + localized media for deployment (2026-07-10)

Two more explicit user follow-ups: "Everything is still on the same webpage. The 5 dropdown
sections should be their own webpage," and separately, "Put this on a GitHub Pages, and give me
that as a final product."

**Page split:**
- The single scrolling `index.html` was divided into 7 files, all siblings directly inside
  `Website/`: `index.html` (now just Home — hero + a new "where to go next" link-card section),
  `tours.html` (new — the two tour-launch cards promoted from a small nav dropdown into real page
  content), `overviews.html`, `deepdives.html`, `reports.html`, `library.html`, `reference.html`
  (each a verbatim copy of its old same-named section's content).
- Nav is byte-for-byte identical across all 7 pages: `Tours` / `Media Library` / `Reference` are
  flat links to their own page; `Overviews` / `Deep Dives` / `Reports` stay dropdowns but their
  items now link to `page.html#anchor` instead of an in-page `#anchor`.
- Only `index.html` and `tours.html` include the tour overlay markup + `window.TOURS` script
  (they're the only pages with tour-launch triggers); only `reports.html` includes the PDF modal
  (its "Read inline" buttons need it). Every other page just includes `app.js`, whose feature
  blocks no-op harmlessly when their target element isn't present (see §3, gotcha 6).
- `library.html`'s "Jump to..." links were rewritten from same-page anchors to cross-page ones
  (e.g. `#v-overview` → `overviews.html#v-overview`) since the content they point at moved to a
  different file.
- Built via 7 parallel agents, each writing to a distinct new file (only `index.html` was an
  edit to an existing file) so there was no shared-file contention; each verified its own page
  byte-for-byte against a frozen pre-split snapshot before it was deleted.
- ⚠️ `_source/build_site.py` was **not** updated for the multi-page structure — see the warning
  in §3. It still only regenerates the old single-page layout.

**Media localized for deployment:**
- The 6 large source files (2 videos, 2 audio, 2 `.pptx` decks — previously referenced via `../`
  from outside `Website/`) were copied into `Website/assets/media/`, and every reference across
  `index.html`, `tours.html`, `overviews.html`, and `deepdives.html` (the only 4 pages that had
  any) was rewritten from `../Filename` to `assets/media/Filename`, preserving the existing
  URL-encoding for spaces/parens. Verified zero outward `../` references remain anywhere in the
  site. Originals in the parent folder were copied, never modified or moved.
- Total `Website/` size ≈ 247 MB; largest single file ≈ 93 MB (the 50-minute audio) — comfortably
  under GitHub's 100 MB hard per-file limit, so no Git LFS is needed (a routine "large file"
  warning on push is expected and harmless).

## 14. Mobile optimization pass (2026-07-12)

A general "optimize for mobile" request. The site already had solid mobile fundamentals
(viewport meta, a hamburger nav, a single 900px breakpoint collapsing all grids to one
column, 44px+ touch targets on the deck/tour controls, `prefers-reduced-motion` support),
so this pass focused on auditing real rendered behavior at a 375px width via the browser
preview rather than assuming the existing responsive CSS was sufficient — and found two
genuine narrow-viewport-only overlap bugs plus two affordance gaps:

- ✅ **Deck intro caption vs. nav buttons/fullscreen toggle** (`assets/css/style.css`,
  `.intro-wrap .cap` mobile rule): the two on-page slideshow decks (Playbook, Blueprint)
  open on a companion-video "intro" slide with a caption overlay pinned to the top of
  `.stage`. At desktop widths the caption comfortably clears the vertically-centered
  prev/next circles and the fullscreen button (measured ~165px of clearance). But
  `.stage` uses `aspect-ratio: 16/9`, so its pixel height shrinks fast on a phone while the
  caption's two-line wrapped text stays just as tall — at 375px width they measurably
  overlapped (caption bottom 357px vs. button top 307px). Fixed by truncating the caption
  to a single ellipsized line and hiding the secondary sub-caption span under the existing
  900px breakpoint, with right-padding reserved so the ellipsis stops before reaching the
  fullscreen button. Verified via exact `getBoundingClientRect()` measurements before/after,
  not just visual inspection.
- ✅ **Guided tour arrows vs. cover-slide text** (`assets/css/style.css`, `.tour-arrow` /
  `.tour-stage` mobile rules): same root cause in the tour overlay — the 50px arrow circles
  sit at 50% of `.tour-stage` regardless of content length, and a cover slide's sub-copy
  wraps to 3 lines on a phone, running directly under the "next" arrow (confirmed
  overlapping rects both horizontally and vertically). Fixed by shrinking the arrows to
  40px, tucking them to the stage's outer 6px edge, and widening `.tour-stage`'s side
  padding to 52px on mobile so slide text never reaches that column, regardless of how
  much it wraps.
- ✅ **Touch swipe for the deck viewer and guided tour** (`assets/js/app.js`, new
  `addSwipe()` helper wired into `initDeck()` and the tour engine): neither carousel had
  any touch gesture support — a phone user had to tap the small arrow circles repeatedly.
  Added a shared touchstart/touchend swipe detector (left = next, right = prev) that
  ignores touches starting on `video`, `audio`, `button`, `a`, `input`, `.thumbs`, or
  `.tour-dots` (so scrubbing a video/audio progress bar or tapping a thumbnail/dot isn't
  hijacked), and requires a clearly horizontal drag (`|dx| > 40` and `|dx| > |dy| * 1.5`)
  so vertical page-scroll gestures pass through untouched. Verified with synthetic
  `TouchEvent`/`Touch` dispatches: a drag starting on a `<video>` element didn't navigate,
  a mostly-vertical drag didn't navigate, and a genuine horizontal drag on the stage
  background did.
- ✅ **Reference table scroll affordance** (`assets/css/style.css`, `.tablewrap`): the
  institutions table (`min-width: 620px` inside an `overflow-x: auto` wrapper) has no
  scrollbar on touch devices and no visual hint that it scrolls horizontally — easy to
  miss the right-hand columns on a phone. Added the classic dual-`background-attachment`
  (`local` + `scroll`) shadow-fade trick: a subtle dark fade appears at whichever edge
  still has more content, and disappears once you've scrolled to that side. Applies at
  every viewport width, not just mobile, but is inert (invisible) whenever the table
  already fits without scrolling — confirmed by screenshot at both a 375px and an
  ~800px+ width.
- Verified all four fixes live in the browser preview (a local `http.server` serving
  `Website/` directly, since media is now localized under `assets/media/` per §13) at a
  375×812 viewport, not just by reading the CSS — including before/after
  `getBoundingClientRect()` measurements for the two overlap bugs and synthetic touch-event
  dispatches for the swipe gesture, since the preview tool's pointer is mouse-based and
  can't itself simulate a touch drag.
- Scope note: did not touch `_source/build_site.py` — per §13 it only regenerates the old
  single-page layout and isn't part of the current 7-page site, and neither CSS nor JS is
  templated by it regardless.

## 15. Homepage redesign code review — 24 findings, 13 fixed (2026-07-12)

A separate Claude Design session proposed a homepage refresh (chips moved beside the hero's
"big idea" box into a new `.hero-top` row; a new "Start here" section with a real embedded
video + audio between the hero and "Explore the hub"), which landed as commit `020197b`.
Ran an xhigh-effort review (10 finder angles + 1-vote verify + gap sweep) against that diff,
focused on the user's explicit priority — is the new homepage design consistent with the rest
of the site? All 24 candidates survived verification; fixed the ones worth fixing:

- ✅ **`.start-here-grid` had no `align-items`** — default grid stretch forced the shorter
  audio column to match the taller video column's height, leaving ~168px of dead space under
  the audio player. Added `align-items: start`.
- ✅ **`.start-here-card .badge` was dead code** — tied in specificity with `.badge.type`/
  `.badge.time` (declared later in the file), so the intended translucent dark-card badge
  style never applied; the "Video"/"Audio" pills rendered in their default `--ink` styling,
  nearly invisible against the card's own dark gradient. Retargeted to
  `.start-here-card .badge.type, .start-here-card .badge.time` to win on specificity.
- ✅ **Inserting `#start-here` silently flipped `#next`'s background** — shifting `#next`
  from `<body>`'s 3rd (odd) to 4th (even) child newly matched the pre-existing
  `.section:nth-child(even)` zebra rule, turning "Explore the hub" from grey to white and
  erasing the section-alternation seam (the only page where that rule's parity math is ever
  exercised across multiple sections). Gave both sections an explicit background
  (`#start-here` / `#next`) instead of leaving it to sibling-position math.
- ✅ **`.audio-shell`'s ink gradient nearly invisible on the card's own `--grad-hero`** —
  both are similar dark navy, so the audio player didn't read as a distinct panel. Reused
  the hero's own translucent glass-panel treatment (`rgba(255,255,255,.06)` + `.14` border —
  the same one `.tldr`/`.chip` already use) instead of inventing a new one.
- ✅ **Missing difficulty badges** — the two Start Here teasers showed only `type + time`,
  while the identical items on `overviews.html`/`library.html` show `type + easy/medium/deep
  + time`. Added the (already-accurate) "Easy" badge to both for consistency.
  Also fixed a heading-size fallback (new `<h3>`s weren't inside `.card` so missed the
  site-wide `1.22rem` sizing) and an ambiguous copy edit ("or" implied either/or when the
  "7 minutes" claim needs both watched back to back — changed to "and").
- ✅ **Cleanup**: removed the redundant set-then-unset `margin-top` on `.tldr`/`.chips` (their
  only call site is now `.hero-top`, which already provides the spacing); replaced four
  scattered inline `style="margin-top:..."` attributes with one `.start-here-grid > div`
  flex rule (mirrors the existing `.card .body { gap }` convention); merged the identical
  static parts of `.hero::after`/`.start-here-card::after` (two near-duplicate decorative
  grid-texture overlays) into one combined selector, keeping only their differing numbers
  separate; made `.start-here-grid` reuse `.grid`'s shared `display:grid`/gap instead of
  redeclaring both, keeping just its own `1.3fr 1fr` column ratio.
- Not fixed (deliberately): a few findings about factoring the whole "dark hero-style
  surface" (gradient + grid-texture + light text) into a reusable modifier class, since only
  two instances of it exist site-wide so far — worth doing if a third ever shows up, not
  before. Also left the mask-size-vs-card-size proportion as-is after visual inspection
  looked fine at multiple viewports. Did not touch `assets/js/app.js`'s swipe-gesture code
  (§14) even though the review's gap sweep flagged a possible double-fire between the outer
  tour stage and the nested embedded-deck stage sharing `addSwipe()` — that's the other
  in-progress feature's concern, out of scope for this homepage-only review.
- Verified all fixes live in the browser (computed-style checks for the badge/grid fixes,
  full-page screenshots at desktop and 375px) and spot-checked `overviews.html` and
  `reference.html` to confirm the shared CSS changes didn't regress any other page.

_Last updated after the homepage redesign review (2026-07-12)._

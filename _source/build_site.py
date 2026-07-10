#!/usr/bin/env python3
# Generates index.html for the Sports Science Careers study hub.
# Structure: dropdown-menu nav (Overviews / Deep Dives / Reports) mixing media,
# two guided arrow-tours (Quick / Deep), and a cheat-sheet reference on the main page.
# Facts corrected after web verification (see HANDOFF.md).
import json, html, re, os

OUT = "/sessions/trusting-eager-turing/mnt/Career Bachelor Thing/Website/index.html"
TR  = "/sessions/trusting-eager-turing/mnt/outputs/transcripts"

def esc(s): return html.escape(s)
def read(p): return open(os.path.join(TR, p)).read().strip()

def paras(text, n=3):
    text = re.sub(r'\s+', ' ', text).strip()
    sents = re.split(r'(?<=[.!?]) +', text)
    out, buf = [], []
    for s in sents:
        buf.append(s)
        if len(buf) >= n:
            out.append(' '.join(buf)); buf = []
    if buf: out.append(' '.join(buf))
    return ''.join(f"<p>{esc(p)}</p>" for p in out)

short_t    = read("short.txt")
overview_t = read("overview.txt")
career_t   = read("career.txt")
long_t     = read("long.txt")

# ---- media paths (relative to Website/, originals live one level up) ----
OVERVIEW_VID  = "../Sports%20Science%20Overview.mp4"
CAREER_VID    = "../Career%20Path%20Stuff.mp4"
SHORT_AUD     = "../Explaining%20Sports%20Science%20short%20%281%20min%29.m4a"
LONG_AUD      = "../Explaining%20Sports%20Science%20long%20%2850%20min%29.m4a"
PLAYBOOK_PPTX = "../Sports_Science_Career_Playbook.pptx"
BLUEPRINT_PPTX= "../Modern_Sports_Science_Career_Blueprint.pptx"

# ---- chapters ----
career_chapters = [("0:00","The sports science boom"),("2:10","Busting the eligibility myths"),
    ("3:55","Inside the curriculum (NEP-aligned STEM)"),("5:30","Labs, fields & internships"),
    ("6:55","High-performance careers & salaries")]
overview_chapters = [("0:00","The hidden engine behind elite sport"),("1:30","High-performance athletic roles"),
    ("4:20","Clinical & rehab positions"),("5:30","Pathways to the pros — the degree")]
long_chapters = [("0:00","The hidden science behind the spectacle"),("2:42","Two career tracks & the boom"),
    ("5:36","Busting the biology myth"),("6:24","How NEP 2020 opened the doors"),
    ("8:33","The first-semester bridge module"),("11:30","Flexible vs rigid institutions"),
    ("14:06","Wearables, GPS & the data revolution"),("25:00","On-field tech & biomechanics"),
    ("30:40","Internships: JSW & Inspire Institute"),("36:00","Career roles & compensation"),
    ("41:49","Global certifications (CSCS, ACSM)"),("44:57","Master's degrees & long-term growth")]

def chap_html(chs, audio_id=None):
    rows = []
    for t, label in chs:
        m, s = t.split(":"); secs = int(m)*60 + int(s)
        if audio_id:
            rows.append(f'<li><span class="t"><a href="#" data-seek="{secs}" data-audio="{audio_id}">{t}</a></span><span>{esc(label)}</span></li>')
        else:
            rows.append(f'<li><span class="t">{t}</span><span>{esc(label)}</span></li>')
    return '<ul class="chaplist">' + ''.join(rows) + '</ul>'

def wave(n=42):
    import random; random.seed(n)
    return '<div class="wave">' + ''.join(f'<i style="height:{random.randint(20,100)}%"></i>' for _ in range(n)) + '</div>'

# ---- slideshow builder ----
def slides_json(folder, count):
    return "[" + ",".join(f'"assets/slides/{folder}/s-{i:02d}.png"' for i in range(1, count+1)) + "]"
def thumbs_json(folder, count):
    return "[" + ",".join(f'"assets/slides/{folder}/tn/s-{i:02d}.png"' for i in range(1, count+1)) + "]"

def deck(deck_id, theme, title, count, folder, meta, intro_video, cap, cap_sub, poster):
    return f"""
<div class="deck" id="{deck_id}">
  <div class="deck-head {theme}">
    <h3>{esc(title)}</h3><div class="meta">{esc(meta)}</div>
  </div>
  <div class="stage" data-deck="{deck_id}">
    <div class="intro show" data-intro>
      <div class="intro-wrap">
        <video src="{intro_video}" poster="{poster}" controls preload="none"></video>
        <div class="cap">{esc(cap)}<span>{esc(cap_sub)}</span></div>
      </div>
    </div>
    <img data-slideimg alt="{esc(title)} slide" style="display:none">
    <button class="nav-btn prev" data-prev aria-label="Previous slide">‹</button>
    <button class="nav-btn next" data-next aria-label="Next slide">›</button>
    <div class="counter"><span data-counter>Intro</span></div>
  </div>
  <div class="deck-foot"><div class="thumbs" data-thumbs></div></div>
  <script>window.DECKS=window.DECKS||{{}};window.DECKS["{deck_id}"]={{slides:{slides_json(folder,count)},thumbs:{thumbs_json(folder,count)}}};</script>
</div>"""

playbook_deck = deck("playbook","playbook","The High-Performance Playbook",11,"playbook","11 slides · vibrant",
    OVERVIEW_VID,"Companion video: Sports Science Overview","6-min explainer · plays before the slides","assets/thumbs/overview_poster.png")
blueprint_deck = deck("blueprint","blueprint","Tactical Blueprint: Engineering a Career",12,"blueprint","12 slides · technical",
    CAREER_VID,"Companion video: The Career Path deep-dive","8-min explainer · plays before the slides","assets/thumbs/career_poster.png")

# ---- guided tour data ----
tours = {
  "quick": {
    "title":"Quick Digest","meta":"≈ 10 minutes · 8 stops","accent":"quick",
    "steps":[
      {"type":"cover","title":"Quick Digest","sub":"The fastest way to get the whole picture. Use the arrows (or ← →) to move through 8 short stops.","meta":"≈ 10 minutes"},
      {"type":"audio","title":"1 · The 60-second brief","cap":"The entire field in one breath — why it matters, the roles, and how to get in.","src":SHORT_AUD,"shell":"cool"},
      {"type":"video","title":"2 · Sports Science Overview","cap":"A friendly 6-minute intro to the people behind elite performance.","src":OVERVIEW_VID,"poster":"assets/thumbs/overview_poster.png"},
      {"type":"image","title":"3 · The pitch","cap":"The Playbook opens by reframing what a sports career means today.","src":"assets/slides/playbook/s-01.png"},
      {"type":"image","title":"4 · Why now — NEP 2020","cap":"Policy change opened the door to non-biology students at many universities.","src":"assets/slides/playbook/s-03.png"},
      {"type":"image","title":"5 · Where to apply","cap":"The 'draft board' of flexible vs traditional institutions.","src":"assets/slides/playbook/s-05.png"},
      {"type":"image","title":"6 · The playcall","cap":"A four-step action plan to break in.","src":"assets/slides/playbook/s-11.png"},
      {"type":"cover","title":"That's the digest","sub":"Want the full story — institutions, salaries, certifications and the 50-minute deep dive? Launch the Deep Dive tour.","meta":"Next: Deep Dive","cta":"deep"},
    ]},
  "deep": {
    "title":"Deep Dive","meta":"≈ 90 minutes · 12 stops","accent":"deep",
    "steps":[
      {"type":"cover","title":"Deep Dive","sub":"The complete walkthrough: the long-form audio, the detailed video, the technical deck, and all three reports.","meta":"≈ 90 minutes · settle in"},
      {"type":"audio","title":"1 · The 50-minute conversation","cap":"A two-host deep dive covering every angle. Press play and let it run.","src":LONG_AUD,"shell":"warm"},
      {"type":"video","title":"2 · The Career Path (detailed)","cap":"8.5 minutes, five chapters — the boom, myths, curriculum, labs and careers.","src":CAREER_VID,"poster":"assets/thumbs/career_poster.png"},
      {"type":"image","title":"3 · The blueprint","cap":"A tactical roadmap for interdisciplinary high-school profiles.","src":"assets/slides/blueprint/s-01.png"},
      {"type":"image","title":"4 · NEP reconfigures the field","cap":"How the policy dismantled the old stream silos.","src":"assets/slides/blueprint/s-03.png"},
      {"type":"image","title":"5 · The eligibility matrix","cap":"Exactly which institutions accept non-biology students — and which don't.","src":"assets/slides/blueprint/s-06.png"},
      {"type":"image","title":"6 · The curriculum escalator","cap":"How a four-year B.Sc. builds from foundations to honours research.","src":"assets/slides/blueprint/s-08.png"},
      {"type":"image","title":"7 · Careers & compensation","cap":"Roles, employers and the certifications that unlock them.","src":"assets/slides/blueprint/s-10.png"},
      {"type":"doc","title":"8 · Report — Academic Pathways","cap":"Admission frameworks, curriculum architecture and career roles.","pdf":"assets/pdf/academic-pathways.pdf","thumb":"assets/thumbs/academic-pathways-1.png"},
      {"type":"doc","title":"9 · Report — Evolution of Education","cap":"Flexible vs rigid pathways and the 'premier lab' differentiator.","pdf":"assets/pdf/evolution-education.pdf","thumb":"assets/thumbs/evolution-education-1.png"},
      {"type":"doc","title":"10 · Report — Strategic Roadmap","cap":"The full playbook: subjects → expertise, certifications, and a checklist.","pdf":"assets/pdf/strategic-roadmap.pdf","thumb":"assets/thumbs/strategic-roadmap-1.png"},
      {"type":"cover","title":"You've seen it all","sub":"Everything above is also browsable any time from the menu. Head to the Reference cheat-sheet to keep the key facts handy.","meta":"Done","cta":"close"},
    ]},
}
tours_json = json.dumps(tours)

# ============================ PAGE ============================
page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sports Science Careers in India — Study Hub</title>
<meta name="description" content="An organized, easy-to-digest hub of videos, audio, slideshows and reports on B.Sc. Sports &amp; Exercise Science careers in India, including flexible pathways for students without Class XII Biology.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="wrap">
    <a class="brand" href="#top"><span class="dot"></span> Sports Science Careers · India</a>
    <div class="nav-links" data-menu>

      <div class="menu">
        <button class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">Explore <span class="caret">▾</span></button>
        <div class="menu-panel">
          <button class="menu-item tour-launch" data-tour="quick"><b>⚡ Quick Digest tour</b><span>≈ 10 min · guided walkthrough</span></button>
          <button class="menu-item tour-launch" data-tour="deep"><b>🔬 Deep Dive tour</b><span>≈ 90 min · the full walkthrough</span></button>
        </div>
      </div>

      <div class="menu">
        <button class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">Overviews <span class="caret">▾</span></button>
        <div class="menu-panel">
          <a class="menu-item" href="#a-short"><b>🎧 The 60-second brief</b><span>Listen · 1 min</span></a>
          <a class="menu-item" href="#v-overview"><b>🎬 Sports Science Overview</b><span>Watch · 6 min</span></a>
          <a class="menu-item" href="#playbook"><b>🖼️ The High-Performance Playbook</b><span>Skim · 11 slides</span></a>
        </div>
      </div>

      <div class="menu">
        <button class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">Deep Dives <span class="caret">▾</span></button>
        <div class="menu-panel">
          <a class="menu-item" href="#a-long"><b>🎧 The 50-minute deep dive</b><span>Listen · 50 min</span></a>
          <a class="menu-item" href="#v-career"><b>🎬 The Career Path (detailed)</b><span>Watch · 8.5 min</span></a>
          <a class="menu-item" href="#blueprint"><b>🖼️ The Tactical Blueprint</b><span>Skim · 12 slides</span></a>
        </div>
      </div>

      <div class="menu">
        <button class="menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">Reports <span class="caret">▾</span></button>
        <div class="menu-panel">
          <a class="menu-item" href="#doc-academic"><b>📄 Academic Pathways</b><span>Read · overview</span></a>
          <a class="menu-item" href="#doc-evolution"><b>📄 Evolution of Education</b><span>Read · analysis</span></a>
          <a class="menu-item" href="#doc-strategic"><b>📄 Strategic Roadmap</b><span>Read · strategy</span></a>
        </div>
      </div>

      <a class="nav-flat" href="#reference">Reference</a>
    </div>
    <button class="hamburger" data-hamburger aria-label="Menu">☰</button>
  </div>
</nav>

<!-- HERO -->
<header class="hero" id="top">
  <div class="wrap">
    <div class="eyebrow">A study hub · B.Sc. Sports &amp; Exercise Science</div>
    <h1>The hidden engine behind elite sport — and how to build a career in it.</h1>
    <p class="lede">Everything from a 1-minute brief to a 50-minute deep dive, organized so you can pick exactly how deep you want to go.</p>
    <div class="tldr">
      <b>The big idea:</b> India's sports sector is shifting from experience-based coaching to <b>data-driven sports science</b>. Franchise leagues (IPL, ISL, Pro Kabaddi) have created a shortage of biomechanists, analysts and strength coaches. Thanks to <b>NEP 2020</b>, a growing set of flexible universities — Jain, Symbiosis, Somaiya, SGT — now admit students from <b>any stream</b> and use first-semester <b>bridge modules</b> to level the field (though many mainstream programs still expect Biology). Pair the degree with internships and global certifications (NSCA-CSCS, ACSM-EP) and you're on a path that scales from <b>~₹4–6 L at entry to ₹12–18 L+</b> with experience.
    </div>
    <div class="hero-cta">
      <button class="btn primary lg tour-launch" data-tour="quick">⚡ Take the 10-min tour</button>
      <button class="btn ghost lg tour-launch" data-tour="deep">🔬 Deep Dive tour</button>
    </div>
    <div class="chips">
      <span class="chip">🎧 1 min <b>→</b> 50 min audio</span>
      <span class="chip">🎬 2 explainer videos</span>
      <span class="chip">🖼️ 2 slideshows</span>
      <span class="chip">📄 3 in-depth reports</span>
      <span class="chip">🎓 Biology-optional pathways</span>
    </div>
  </div>
</header>

<!-- OVERVIEWS -->
<section class="section" id="overviews">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Section 01 · Start light</div>
      <h2>Overviews</h2>
      <p>The accessible layer — a mix of listening, watching and skimming that covers the whole story fast.</p>
    </div>
    <div class="grid cols-2">

      <div class="card audio-card" id="a-short">
        <div class="body">
          <div class="badges"><span class="badge type">Audio</span><span class="badge easy">Easy</span><span class="badge time">⏱ 1 min</span></div>
          <h3>The 60-Second Brief</h3>
          <p>The whole field in one breath: why it matters, the roles, and how to get in.</p>
          <div class="audio-shell">{wave(3)}<audio id="aud-short" controls preload="none" src="{SHORT_AUD}"></audio></div>
          <details class="disclosure"><summary>Read transcript</summary><div class="content">{paras(short_t)}</div></details>
        </div>
      </div>

      <div class="card" id="v-overview">
        <div class="media-frame"><video controls preload="none" poster="assets/thumbs/overview_poster.png" src="{OVERVIEW_VID}"></video></div>
        <div class="body">
          <div class="badges"><span class="badge type">Video</span><span class="badge easy">Easy</span><span class="badge time">⏱ 6 min</span></div>
          <h3>Sports Science Overview</h3>
          <p>The friendly introduction: the team behind the athletes, high-performance vs clinical roles, and your pathway in.</p>
          <details class="disclosure"><summary>Chapters</summary><div class="content">{chap_html(overview_chapters)}</div></details>
          <details class="disclosure"><summary>Read transcript</summary><div class="content">{paras(overview_t,4)}</div></details>
        </div>
      </div>
    </div>

    <div style="margin-top:34px">{playbook_deck}
      <div class="row-actions"><a class="btn" href="{PLAYBOOK_PPTX}" download>⬇ Download Playbook (.pptx)</a></div>
    </div>
  </div>
</section>

<!-- DEEP DIVES -->
<section class="section" id="deepdives">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Section 02 · Go deeper</div>
      <h2>Deep Dives</h2>
      <p>The full-length layer — the long-form audio, the detailed video and the technical deck, for when you want everything.</p>
    </div>
    <div class="grid cols-2">

      <div class="card audio-card" id="a-long">
        <div class="body">
          <div class="badges"><span class="badge type">Audio</span><span class="badge deep">Deep</span><span class="badge time">⏱ 50 min</span></div>
          <h3>The Full Deep Dive</h3>
          <p>A two-host conversation covering the myths, NEP 2020, bridge modules, institutions, on-field tech, salaries and certifications.</p>
          <div class="audio-shell warm">{wave(9)}<audio id="aud-long" controls preload="none" src="{LONG_AUD}"></audio></div>
          <details class="disclosure"><summary>Chapters</summary><div class="content">{chap_html(long_chapters,"aud-long")}</div></details>
          <details class="disclosure"><summary>Read full transcript</summary><div class="content">{paras(long_t,4)}</div></details>
        </div>
      </div>

      <div class="card" id="v-career">
        <div class="media-frame"><video controls preload="none" poster="assets/thumbs/career_poster.png" src="{CAREER_VID}"></video></div>
        <div class="body">
          <div class="badges"><span class="badge type">Video</span><span class="badge medium">In-depth</span><span class="badge time">⏱ 8.5 min</span></div>
          <h3>The Career Path (detailed)</h3>
          <p>Five chapters: the boom, eligibility myths, the curriculum, labs &amp; internships, and lucrative careers.</p>
          <details class="disclosure"><summary>Chapters</summary><div class="content">{chap_html(career_chapters)}</div></details>
          <details class="disclosure"><summary>Read transcript</summary><div class="content">{paras(career_t,4)}</div></details>
        </div>
      </div>
    </div>

    <div style="margin-top:34px">{blueprint_deck}
      <div class="row-actions"><a class="btn" href="{BLUEPRINT_PPTX}" download>⬇ Download Blueprint (.pptx)</a></div>
    </div>
  </div>
</section>

<!-- REPORTS -->
<section class="section" id="reports">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Section 03 · Read</div>
      <h2>In-depth reports</h2>
      <p>Three written analyses, each ~4 pages. Open inline or download.</p>
    </div>
    <div class="grid cols-3">

      <div class="card" id="doc-academic"><div class="body">
        <div class="doc"><div class="thumb"><img src="assets/thumbs/academic-pathways-1.png" alt=""></div>
          <div class="meta"><div class="badges"><span class="badge easy">Overview</span></div><h3>Academic Pathways &amp; Career Integration</h3></div></div>
        <p>Admission frameworks, an institution comparison matrix, curriculum architecture and career roles.</p>
        <div class="actions"><button class="btn primary" data-pdf="assets/pdf/academic-pathways.pdf" data-title="Academic Pathways &amp; Career Integration">Read inline</button>
          <a class="btn" href="assets/pdf/academic-pathways.pdf" download>⬇ PDF</a></div>
      </div></div>

      <div class="card" id="doc-evolution"><div class="body">
        <div class="doc"><div class="thumb"><img src="assets/thumbs/evolution-education-1.png" alt=""></div>
          <div class="meta"><div class="badges"><span class="badge medium">Analysis</span></div><h3>The Evolution of Sports Science Education</h3></div></div>
        <p>Flexible vs rigid pathways, selection weightages, and the “premier lab” differentiator (VICON, altitude chambers).</p>
        <div class="actions"><button class="btn primary" data-pdf="assets/pdf/evolution-education.pdf" data-title="The Evolution of Sports Science Education">Read inline</button>
          <a class="btn" href="assets/pdf/evolution-education.pdf" download>⬇ PDF</a></div>
      </div></div>

      <div class="card" id="doc-strategic"><div class="body">
        <div class="doc"><div class="thumb"><img src="assets/thumbs/strategic-roadmap-1.png" alt=""></div>
          <div class="meta"><div class="badges"><span class="badge deep">Strategy</span></div><h3>Strategic Career Development Roadmap</h3></div></div>
        <p>The full playbook: mapping school subjects to expertise, the 4-year honours bridge, certifications and a strategic checklist.</p>
        <div class="actions"><button class="btn primary" data-pdf="assets/pdf/strategic-roadmap.pdf" data-title="Strategic Career Development Roadmap">Read inline</button>
          <a class="btn" href="assets/pdf/strategic-roadmap.pdf" download>⬇ PDF</a></div>
      </div></div>
    </div>
  </div>
</section>

<!-- REFERENCE -->
<section class="section" id="reference">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">Cheat sheet</div>
      <h2>Quick reference</h2>
      <p>A synthesized snapshot, <b>fact-checked against the web</b> (July 2026). Figures are approximate and change yearly — always confirm on the official site.</p>
    </div>

    <h3 style="margin-bottom:12px">Institutions — flexible vs rigid</h3>
    <div class="tablewrap" style="margin-bottom:16px">
      <table class="ref">
        <thead><tr><th>Institution</th><th>Program</th><th>Non-Biology?</th><th>Selection</th><th>Approx. fee / yr*</th></tr></thead>
        <tbody>
          <tr><td>Jain University (Bangalore)</td><td>B.Sc. Sports Sciences</td><td><span class="pill yes">Eligible</span></td><td>JET Exam + Interview; bridge modules</td><td>≈ ₹1,00,000</td></tr>
          <tr><td>Somaiya Sports Academy (Mumbai)</td><td>B.Sc. Sports &amp; Exercise Science</td><td><span class="pill yes">Eligible</span></td><td>SVUET + Fitness Test + Interview</td><td>₹2,35,000</td></tr>
          <tr><td>Symbiosis (SSSS, Pune)</td><td>B.Sc. Sports &amp; Exercise Science</td><td><span class="pill yes">Eligible</span></td><td>SET Exam + Field Test + PIWAT</td><td>≈ ₹1,66,000</td></tr>
          <tr><td>SGT University (Gurgaon)</td><td>B.Sc. Sports &amp; Exercise Sciences</td><td><span class="pill yes">Eligible</span></td><td>10+2 Merit or CUET</td><td>₹1,20,000</td></tr>
          <tr><td>IGIPESS (Delhi University)</td><td>B.Sc. Sports Science</td><td><span class="pill yes">Eligible</span></td><td>CUET + Physical Test (45% agg.)</td><td>≈ ₹10,000–13,000</td></tr>
          <tr><td>Woxsen University (Hyderabad)</td><td>B.Sc. Sports Science</td><td><span class="pill yes">Eligible</span></td><td>WAT or CUET + Interview</td><td>≈ ₹6,50,000</td></tr>
          <tr><td>MAHE (Manipal)</td><td>B.Sc. Exercise &amp; Sports Science</td><td><span class="pill no">Requires PCB (Biology)</span></td><td>MET Exam + Interview</td><td>≈ ₹1,85,000</td></tr>
          <tr><td>SRIHER (Chennai)</td><td>B.Sc. (Hons) Sports &amp; Exercise Science</td><td><span class="pill no">Requires PCB / PCBM 70%</span></td><td>10+2 Science merit + Interview</td><td>≈ ₹75,000</td></tr>
          <tr><td>IISM (Mumbai)</td><td>Bachelor of Sports Science</td><td><span class="pill no">Requires PCB (Biology)</span></td><td>SSAT + SOP + Video Interview</td><td>≈ ₹2,70,000</td></tr>
        </tbody>
      </table>
    </div>
    <p class="note">*Fees verified against official sites / aggregators in July 2026 and rounded. IGIPESS is low because it's government-affiliated. Corrected from the source documents: MAHE requires <b>Biology (PCB)</b> — not “Bio or Math”; IISM ≈ ₹2.7 L/yr (source said ₹5.4 L); Woxsen ≈ ₹6.5 L/yr.</p>

    <div class="grid cols-2" style="align-items:start;margin-top:22px">
      <div>
        <h3 style="margin-bottom:12px">Careers &amp; realistic pay</h3>
        <div class="tablewrap">
          <table class="ref">
            <thead><tr><th>Role</th><th>Entry (0–2 yr)</th><th>With experience</th><th>Key credential</th></tr></thead>
            <tbody>
              <tr><td>Sports Biomechanist / Movement Analyst</td><td>₹3–6 L</td><td>₹12–14 L</td><td>B.Sc. Hons + VICON 3D</td></tr>
              <tr><td>High-Performance Sports Scientist</td><td>₹4.5–6.8 L</td><td>₹10–18 L</td><td>ACSM-EP + Python/SQL</td></tr>
              <tr><td>Strength &amp; Conditioning Coach</td><td>₹3–6 L</td><td>up to ₹10 L</td><td>NSCA-CSCS</td></tr>
              <tr><td>Corporate Wellness (Coach → Mgr)</td><td>₹4–6 L</td><td>₹10–16 L</td><td>ACSM-EP</td></tr>
              <tr><td>Rehab / Sports Physiotherapist</td><td>₹2.5–4 L</td><td>₹5–6 L+</td><td>MPT / Cert. Athletic Trainer</td></tr>
            </tbody>
          </table>
        </div>
        <p class="note">The source videos, audio and decks quote higher “entry” figures (e.g. ₹6–14 L). Independent 2026 data puts true entry-level pay lower, as shown; the bigger numbers are reachable with 2–3+ years or top-tier IPL/ISL roles.</p>
      </div>
      <div>
        <h3 style="margin-bottom:12px">The essentials</h3>
        <div class="tablewrap">
          <table class="ref">
            <thead><tr><th>Thing</th><th>Why it matters</th></tr></thead>
            <tbody>
              <tr><td><b>NEP 2020</b></td><td>Enabled flexible, any-stream entry at a growing set of universities (Jain, Symbiosis, Somaiya, SGT) — not yet universal.</td></tr>
              <tr><td><b>Bridge modules</b></td><td>Non-credit Sem-1 crash course (cell biology, anatomy) that levels non-science students.</td></tr>
              <tr><td><b>4-yr Honours</b></td><td>The “research bridge” to a Master's and senior roles.</td></tr>
              <tr><td><b>NSCA-CSCS</b></td><td>Gold standard for franchise-league S&amp;C jobs; needs any bachelor's + CPR/AED (related-field degree from 2030).</td></tr>
              <tr><td><b>ACSM-EP</b></td><td>Clinical exercise prescription &amp; corporate wellness; needs an exercise-science degree.</td></tr>
              <tr><td><b>Software</b></td><td>VICON, Python, SQL — the data skills pro teams actually pay for.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TOUR OVERLAY -->
<div class="tour" id="tour" aria-hidden="true">
  <div class="tour-box">
    <div class="tour-top">
      <span class="tour-title" data-tour-title></span>
      <span class="tour-progress" data-tour-progress></span>
      <button class="tour-x" data-tour-close aria-label="Close tour">×</button>
    </div>
    <div class="tour-stage" data-tour-stage aria-live="polite"></div>
    <button class="tour-arrow prev" data-tour-prev aria-label="Previous">‹</button>
    <button class="tour-arrow next" data-tour-next aria-label="Next">›</button>
    <div class="tour-dots" data-tour-dots></div>
  </div>
</div>

<!-- PDF MODAL -->
<div class="modal" id="pdfModal">
  <div class="box">
    <header><h3 data-modal-title>Document</h3><button class="x" data-close aria-label="Close document">×</button></header>
    <iframe data-modal-frame title="PDF viewer"></iframe>
  </div>
</div>

<!-- FOOTER -->
<footer class="footer">
  <div class="wrap">
    <div><b>Sports Science Careers in India</b> — a NotebookLM-sourced study hub, organized for easy digest and fact-checked July 2026.</div>
    <div class="src"><span>2 videos · 2 audio · 2 decks · 3 reports</span></div>
  </div>
</footer>

<script>window.TOURS = {tours_json};</script>
<script src="assets/js/app.js"></script>
</body>
</html>"""

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w").write(page)
print("wrote", OUT, len(page), "bytes")

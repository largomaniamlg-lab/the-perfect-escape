/* ==========================================================================
   THE PERFECT ESCAPE — interactive travel gift
   Vanilla JS. No backend, no libraries. The PDF voucher is generated in the browser.

   ✏️  EDIT HERE: names, places, dates, messages and photos all live in CONFIG.
   ========================================================================== */
const CONFIG = {
  passenger: "Mamasita",

  // Birthday introduction (first screen). Plain text only.
  birthday: {
    title: "Happy Birthday",
    subtitle: "A little something for you.",
    openButton: "Open your letter",
    letterTitle: "Happy Birthday",
    letter: [
      "I hope you have a wonderful day, full of good moments, good company, and plenty of reasons to smile. Wishing you all the best today and for the year ahead.",
      "You know I would have loved to be there with you on such a special day. It wasn’t possible this time, but we’ll have plenty of time to celebrate together.",
      "Have an extra glass of wine for me. I’ll return the favour when we celebrate. 😉",
      "And before you go… I have a little surprise for you."
    ],
    surpriseButton: "Discover your surprise →"
  },

  // The map route is drawn for Oslo → Málaga. Changing these names updates every label and the
  // ticket, but NOT the map geometry (that path lives in index.html, #route-path).
  from: { code: "OSL", city: "Oslo", country: "Norway" },
  to:   { code: "AGP", city: "Málaga", country: "Spain", region: "Costa del Sol", coords: "36.72° N · 4.42° W" },
  transport: "Airplane",
  departure: "To be decided",
  returnDate: "To be decided",
  boats: "Absolutely none 😂",
  status: "Adventure awaits",
  statusAccepted: "Adventure accepted",
  footer: "Good company, great memories, and a little sunshine.",
  acceptTitle: "Excellent choice.",
  acceptLine: "I was hoping you'd say yes. 😉",
  distanceKm: 2797,               // Oslo → Málaga, great-circle

  // Photos (relative paths). Set one to null to use the illustration instead.
  images: {
    welcome: "img/welcome.jpg",
    wine: "img/q-wine.jpg",
    sun: "img/q-sun.jpg",
    food: "img/q-food.jpg",        // set to null to use the steak illustration instead (no seafood, please)
    beach: "img/q-beach.jpg",
    reveal: "img/reveal.jpg",
    g1: "img/g-port.jpg",
    g2: "img/g-alcazaba.jpg",
    g3: "img/g-beach.jpg"
  },

  questions: [
    { id: "wine",  theme: "Wine",     text: "Do you enjoy a good glass of wine?",
      yes: "Excellent. Noted for later.", no: "More for me, then. Kidding. Mostly.", stampYes: "Cheers", stampNo: "Noted" },
    { id: "sun",   theme: "Sunshine", text: "Do you love feeling the sunshine on your skin?",
      yes: "Good. There's plenty where we're going.", no: "Bold. We'll find you some shade.", stampYes: "Sun-kissed", stampNo: "Shade mode" },
    { id: "food",  theme: "Food",     text: "Are you a fan of delicious food?",
      yes: "A person of taste.", no: "I'm going to change your mind.", stampYes: "Bon appétit", stampNo: "Challenge on" },
    { id: "beach", theme: "Beach",    text: "Could you spend an entire day by the beach?",
      yes: "Towel: packed.", no: "We'll mix in a few long walks.", stampYes: "Towel ready", stampNo: "Walks it is" },
    { id: "boat",  theme: "Boats",    text: "Do you enjoy travelling by boat?",
      yes: "Hmm. Interesting.", no: "Thought so.", stampYes: "Hmm…", stampNo: "Denied" }
  ],

  // Boat scene dialogue. Line 1 shows with the boat; lines 2 and 3 once the airplane has arrived.
  boatNo:  ["Oh, I thought about that. 😉", "Don't worry. I had a Plan B all along. ✈️", "Good news... we're flying!"],
  boatYes: ["Interesting choice! 😉", "But I think you'll like my Plan B even more...", ""]
};

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = (ms) => (reduceMotion ? Math.min(ms, 250) : ms);
  const wait = (ms) => new Promise((r) => setTimeout(r, T(ms)));          // waits for motion: shortened with reduced motion
  const hold = (ms) => new Promise((r) => setTimeout(r, ms));             // reading time: never shortened
  const $ = (id) => document.getElementById(id);
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const QUESTIONS = CONFIG.questions;

  /* ---------- Apply CONFIG to the page ---------- */
  const cfgText = {
    passenger: CONFIG.passenger,
    fromCode: CONFIG.from.code, fromCity: CONFIG.from.city, fromCountry: CONFIG.from.country,
    toCode: CONFIG.to.code, toCity: CONFIG.to.city, toCountry: CONFIG.to.country,
    transport: CONFIG.transport, boats: CONFIG.boats, departure: CONFIG.departure, returnDate: CONFIG.returnDate
  };
  document.querySelectorAll("[data-cfg]").forEach((el) => { const v = cfgText[el.dataset.cfg]; if (v != null) el.textContent = v; });
  document.querySelectorAll("[data-img]").forEach((el) => {
    const src = CONFIG.images[el.dataset.img];
    if (src) { el.style.backgroundImage = `url("${src}")`; el.parentElement.classList.add("has-photo"); }
    else el.remove();
  });
  document.querySelector(".t-footer").textContent = CONFIG.footer;
  document.querySelector(".ac-title").textContent = CONFIG.acceptTitle;
  document.querySelector(".ac-line").textContent = CONFIG.acceptLine;
  document.querySelector(".r-region").textContent = (CONFIG.to.country + " · " + CONFIG.to.region).toUpperCase();
  setText(document.querySelector(".r-sign"), document.querySelector(".r-sign").textContent);
  setText(document.querySelector(".ac-line"), CONFIG.acceptLine);
  $("map-label-from").textContent = CONFIG.from.city.toUpperCase();
  $("hero-coords").textContent = CONFIG.to.coords;
  (function buildReveal() {
    const city = CONFIG.to.city.toUpperCase();
    const letters = $("r-city-letters");
    letters.textContent = "";
    [...city].forEach((ch, i) => { const sp = document.createElement("span"); sp.style.setProperty("--i", i); sp.textContent = ch; letters.appendChild(sp); });
    $("reveal-title").setAttribute("aria-label", CONFIG.to.city);
    const going = $("r-going");
    going.textContent = "WE'RE GOING TO ";
    const nw = document.createElement("span"); nw.className = "nw"; nw.textContent = city + "! ☀️🇪🇸";
    going.appendChild(nw);
  })();
  // Warm the browser cache for later photos once the welcome screen is up
  window.addEventListener("load", () => {
    Object.values(CONFIG.images).forEach((src) => { if (src) { const i = new Image(); i.decoding = "async"; i.src = src; } });
  });

  /* ---------- State ---------- */
  const state = { answers: {}, index: 0, accepted: false, run: 0 };
  window.perfectEscape = state; // handy for debugging in the console
  try { state.accepted = localStorage.getItem("pe-accepted") === "1"; } catch (e) { /* storage unavailable */ }

  /* ---------- Sound (synthesised, off by default) ---------- */
  const Sound = (() => {
    let ctx = null, on = false, noiseBuf = null;
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function ready() { return on && ensure(); }
    function tone(freq, t0, dur, type = "sine", gain = 0.06) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise() {
      if (!noiseBuf) {
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
    }
    return {
      get on() { return on; },
      set(v) { on = v; if (v) ensure(); },
      click() { if (!ready()) return; tone(880, ctx.currentTime, 0.08, "sine", 0.04); },
      yes() { if (!ready()) return; const t = ctx.currentTime; tone(660, t, 0.14, "sine", 0.05); tone(990, t + 0.08, 0.22, "sine", 0.05); },
      no() { if (!ready()) return; const t = ctx.currentTime; tone(330, t, 0.16, "triangle", 0.05); tone(247, t + 0.09, 0.22, "triangle", 0.045); },
      stamp() {
        if (!ready()) return;
        const t = ctx.currentTime, n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = "lowpass"; f.frequency.value = 700;
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        n.connect(f).connect(g).connect(ctx.destination); n.start(t); n.stop(t + 0.16);
      },
      tick() { if (!ready()) return; tone(1320, ctx.currentTime, 0.04, "square", 0.012); },
      bell() { if (!ready()) return; const t = ctx.currentTime; tone(523.25, t, 0.7, "sine", 0.06); tone(1046.5, t, 0.4, "sine", 0.02); },
      whoosh(dur = 2.2) {
        if (!ready()) return;
        window.dispatchEvent(new CustomEvent("pe-audio-effect", { detail: { duration: dur } }));
        const t = ctx.currentTime, n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = "bandpass"; f.Q.value = 0.9;
        f.frequency.setValueAtTime(220, t);
        f.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.55);
        f.frequency.exponentialRampToValueAtTime(320, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        n.connect(f).connect(g).connect(ctx.destination); n.start(t); n.stop(t + dur + 0.05);
      },
      chime() {
        if (!ready()) return;
        const t = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.11, 1.1, "triangle", 0.05));
        [261.63, 392].forEach((f) => tone(f, t, 1.8, "sine", 0.035));
      }
    };
  })();

  const soundBtn = $("sound-toggle");
  function renderSound() {
    soundBtn.setAttribute("aria-pressed", String(Sound.on));
    soundBtn.setAttribute("aria-label", Sound.on ? "Turn sound off" : "Turn sound on");
  }
  soundBtn.addEventListener("click", () => {
    Sound.set(!Sound.on);
    renderSound();
    Sound.click();
  });
  renderSound();

  /* ---------- Screen manager ---------- */
  let current = $("s-envelope");
  function show(id) {
    const next = $(id);
    if (next === current) return;
    current.classList.remove("is-active");
    next.scrollTop = 0;
    next.classList.add("is-active");
    current = next;
    // the sound button reads best light-on-dark everywhere; dim it a little on ivory screens
    soundBtn.classList.toggle("on-light", !next.classList.contains("dark"));
  }

  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

  function toast(msg, ms = 3200) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, ms);
  }

  /* Set text so the last word and any trailing emoji never end up alone on a line */
  function setText(el, text) {
    el.textContent = "";
    if (!text) return;
    const m = text.match(/^(.*\s)?(\S+\s+\S+)$/s);
    if (!m) { el.textContent = text; return; }
    if (m[1]) el.appendChild(document.createTextNode(m[1]));
    const sp = document.createElement("span"); sp.className = "nw"; sp.textContent = m[2];
    el.appendChild(sp);
  }

  /* Resolve when a CSS animation on el finishes (or after a safety timeout) */
  function animDone(el, ms) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; el.removeEventListener("animationend", onEnd); resolve(); };
      const onEnd = (e) => { if (e.target === el) finish(); };
      el.addEventListener("animationend", onEnd);
      setTimeout(finish, T(ms) + 120);
    });
  }

  const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  /* Split-flap style text scramble. Settles letter by letter, left to right. */
  function scramble(final, dur, onFrame) {
    return new Promise((resolve) => {
      if (reduceMotion) { onFrame(final); resolve(); return; }
      const len = final.length;
      const stops = Array.from({ length: len }, (_, i) => dur * 0.35 + dur * 0.65 * (i / Math.max(1, len - 1)));
      const t0 = performance.now();
      let last = 0;
      function frame(t) {
        const e = t - t0;
        if (t - last > 45 || e >= dur) {
          last = t;
          let s = "";
          for (let i = 0; i < len; i++) {
            const c = final[i];
            s += (e >= stops[i] || c === " " || c === "·") ? c : FLAP_CHARS[(Math.random() * 26) | 0];
          }
          onFrame(s);
        }
        if (e < dur) requestAnimationFrame(frame);
        else { onFrame(final); resolve(); }
      }
      requestAnimationFrame(frame);
    });
  }

  /* Number tween with ease-out */
  function tween(from, to, dur, onStep) {
    return new Promise((resolve) => {
      if (reduceMotion) { onStep(to); resolve(); return; }
      const t0 = performance.now();
      function f(t) {
        const k = Math.min(1, (t - t0) / dur);
        onStep(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(f); else resolve();
      }
      requestAnimationFrame(f);
    });
  }

  /* ---------- Screen 0: birthday envelope + letter ---------- */
  const B = CONFIG.birthday;
  setText($("env-title"), B.title);
  $("env-sub").textContent = B.subtitle;
  setText($("btn-open"), B.openButton);
  $("envelope").setAttribute("aria-label", B.openButton);
  setText($("letter-title"), B.letterTitle);
  B.letter.forEach((para) => { const p = document.createElement("p"); setText(p, para); $("letter-body").appendChild(p); });
  setText($("btn-surprise"), B.surpriseButton);

  let envelopeOpening = false;
  function resetEnvelope() {
    envelopeOpening = false;
    $("envelope").classList.remove("opening");
    $("env-stage").classList.remove("gone", "is-opening");
    $("env-stage").hidden = false;
    $("letter").hidden = true;
    $("btn-open").disabled = false;
    $("envelope").removeAttribute("aria-disabled");
  }
  async function openEnvelope() {
    if (envelopeOpening) return;                 // ignore repeated taps
    envelopeOpening = true;
    $("btn-open").disabled = true;
    $("envelope").setAttribute("aria-disabled", "true");
    const run = state.run;
    Sound.click();
    vibrate(12);
    $("env-stage").classList.add("is-opening");  // title steps aside so the opening flap never covers it
    $("envelope").classList.add("opening");      // seal lifts, flap opens, letter slides out
    await wait(1500); if (run !== state.run) return;
    $("env-stage").classList.add("gone");
    await wait(220); if (run !== state.run) return;
    $("env-stage").hidden = true;
    $("letter").hidden = false;
    $("s-envelope").scrollTop = 0;
    $("letter").focus({ preventScroll: true });
    Sound.chime();
  }
  // Both the envelope and the button open the letter (mouse, touch or keyboard)
  $("btn-open").addEventListener("click", openEnvelope);
  $("envelope").addEventListener("click", openEnvelope);
  $("envelope").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
  });
  $("btn-surprise").addEventListener("click", () => {
    Sound.click();
    vibrate(10);
    show("s-welcome");
    setTimeout(() => $("welcome-title").focus({ preventScroll: true }), 50);
  });

  /* ---------- Screen 1: welcome ---------- */
  $("btn-start").addEventListener("click", () => {
    vibrate(10);
    Sound.click();
    state.run++;
    state.index = 0;
    state.answers = {};
    renderQuestion(true);
    show("s-questions");
  });

  /* ---------- Screen 2: questions ---------- */
  const qScreen = $("s-questions");
  const card = $("q-card");
  const btnYes = $("btn-yes");
  const btnNo = $("btn-no");
  const stamp = $("q-stamp");
  const stops = [...document.querySelectorAll(".progress .stop")];
  let busy = false;

  function setProgress(done) {
    const ratio = done / QUESTIONS.length;
    $("progress-fill").style.transform = `scaleX(${ratio})`;
    $("progress-plane").style.left = ratio * 100 + "%";
    $("progress").setAttribute("aria-valuenow", String(done));
    stops.forEach((s, i) => s.classList.toggle("done", i < done));
  }

  function setGhosts() {
    const remaining = QUESTIONS.length - state.index - 1;
    $("ghost-1").classList.toggle("gone", remaining < 1);
    $("ghost-2").classList.toggle("gone", remaining < 2);
  }

  function renderQuestion(first) {
    const q = QUESTIONS[state.index];
    qScreen.dataset.q = q.id;
    $("q-count").textContent = `Question ${state.index + 1} of ${QUESTIONS.length}`;
    $("q-num").textContent = String(state.index + 1).padStart(2, "0");
    $("q-theme").textContent = q.theme;

    const qt = $("q-text");
    qt.textContent = "";
    q.text.split(" ").forEach((word, i, arr) => {
      const w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--i", i);
      w.textContent = word + (i < arr.length - 1 ? " " : "");
      qt.appendChild(w);
    });
    qt.setAttribute("aria-label", q.text);

    const r = $("q-reaction");
    r.textContent = "";
    r.classList.remove("show");
    stamp.className = "q-stamp";
    stamp.textContent = "";
    $("burst").textContent = "";
    card.className = "q-card";
    void card.offsetWidth;
    card.classList.add("in");
    setGhosts();
    setProgress(state.index);
    btnYes.disabled = btnNo.disabled = false;
    btnYes.classList.remove("dim"); btnNo.classList.remove("dim");
    if (!first) btnYes.focus({ preventScroll: true });
  }

  function sparkle() {
    if (reduceMotion) return;
    const burst = $("burst");
    burst.textContent = "";
    const m = $("medallion");
    burst.style.setProperty("--burst-y", (m.offsetTop + m.offsetHeight / 2) + "px");
    const colors = ["#D7A85E", "#F1DDB3", "#5DB3D3", "#087EAD"];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("i");
      if (i % 2) s.className = "line";
      s.style.setProperty("--a", (i * (360 / 14) + (Math.random() * 10 - 5)) + "deg");
      s.style.setProperty("--r", (48 + Math.random() * 30) + "px");
      s.style.setProperty("--c", colors[i % colors.length]);
      s.style.setProperty("--d", (Math.random() * 60) + "ms");
      burst.appendChild(s);
    }
  }

  async function answer(isYes) {
    if (busy || current.id !== "s-questions") return;
    busy = true;
    const run = state.run;
    btnYes.disabled = btnNo.disabled = true;
    const q = QUESTIONS[state.index];
    state.answers[q.id] = isYes;
    vibrate(isYes ? 14 : [10, 40, 10]);
    isYes ? Sound.yes() : Sound.no();

    const btn = isYes ? btnYes : btnNo;
    restart(btn, "pop");
    (isYes ? btnNo : btnYes).classList.add("dim");

    card.classList.remove("in");
    card.classList.add(isYes ? "said-yes" : "said-no");
    if (isYes) sparkle();

    stamp.textContent = isYes ? q.stampYes : q.stampNo;
    stamp.className = "q-stamp" + (isYes ? "" : " no");
    void stamp.offsetWidth;
    stamp.classList.add("slam");
    setTimeout(() => Sound.stamp(), 180);

    const r = $("q-reaction");
    setText(r, isYes ? q.yes : q.no);
    r.classList.add("show");
    setProgress(state.index + 1);

    await hold(1300);
    if (run !== state.run) { busy = false; return; }
    card.classList.add(isYes ? "out-yes" : "out-no");
    await wait(480);
    if (run !== state.run) { busy = false; return; }

    state.index += 1;
    busy = false;
    if (state.index < QUESTIONS.length) renderQuestion();
    else runBoatScene(state.answers.boat);
  }
  btnYes.addEventListener("click", () => answer(true));
  btnNo.addEventListener("click", () => answer(false));

  /* ---------- Screen 3: boat → plane ----------
     NO:  "Oh, I thought about that." → boat sails away → plane arrives → Plan B lines → plane flies on
     YES: shorter version with its own two lines. Continues automatically into the analysis. */
  async function runBoatScene(likesBoats) {
    const run = state.run;
    const alive = () => run === state.run;
    const lines = (likesBoats ? CONFIG.boatYes : CONFIG.boatNo).slice();
    const els = [$("boat-line-1"), $("boat-line-2"), $("boat-line-3")];
    const boat = $("boat"), plane = $("plane-in");

    // Fill every line first so the layout never jumps; reveal them one by one.
    els.forEach((el, i) => { setText(el, lines[i] || ""); el.classList.remove("show"); el.hidden = !lines[i]; });
    boat.classList.remove("leave", "quick");
    plane.classList.remove("arrive", "quick", "depart");

    show("s-boat");
    await wait(500); if (!alive()) return;
    els[0].classList.add("show");
    await hold(likesBoats ? 1300 : 1600); if (!alive()) return;          // time to read line 1

    boat.classList.add("leave");
    if (likesBoats) boat.classList.add("quick");
    await animDone(boat, likesBoats ? 1100 : 1800); if (!alive()) return; // boat is fully gone before the plane enters

    plane.classList.add("arrive");
    if (likesBoats) plane.classList.add("quick");
    Sound.whoosh(likesBoats ? 1.4 : 2);
    await wait(likesBoats ? 900 : 1300); if (!alive()) return;

    els[1].classList.add("show");
    await hold(1700); if (!alive()) return;                              // time to read line 2
    if (lines[2]) {
      els[2].classList.add("show");
      vibrate(15);
      await hold(1500); if (!alive()) return;                            // time to read line 3
    }

    plane.classList.add("depart");                                       // flies on, leaving its white trail
    Sound.whoosh(1.3);
    await animDone(plane, 1300); if (!alive()) return;
    runAnalyse();
  }

  /* ---------- Screen 4: analysis ---------- */
  const ANALYSE_STEPS = [
    { msg: "Analysing your answers...",    city: "REYKJAVIK",  note: () => "Reykjavík? Too chilly for you.", pct: 18 },
    { msg: "Searching for sunshine...",    city: "LONDON",     note: () => "London: sunshine not found.", pct: 41 },
    { msg: "Checking the food...",         city: "VENICE",     note: () => "Venice: lovely, but far too many boats.", pct: 63 },
    { msg: "Finding the perfect beach...", city: "SANTORINI",  note: () => (state.answers.boat ? "Santorini: ferry required. Plan B says fly." : "Santorini: ferry required. Absolutely not."), pct: 86 },
    { msg: "Destination found!",           city: "CLASSIFIED", note: () => "100% match. Plotting the route…", pct: 100 }
  ];
  const FLAP_LEN = 10;
  const flap = $("flap");
  const flapCells = [];
  for (let i = 0; i < FLAP_LEN; i++) { const c = document.createElement("span"); c.textContent = " "; flap.appendChild(c); flapCells.push(c); }
  const padCenter = (w) => { const total = FLAP_LEN - w.length; const left = Math.floor(total / 2); return " ".repeat(left) + w + " ".repeat(total - left); };
  const renderFlap = (s) => { for (let i = 0; i < FLAP_LEN; i++) { const ch = s[i] || " "; if (flapCells[i].textContent !== ch) flapCells[i].textContent = ch; } };

  async function runAnalyse() {
    const run = state.run;
    const msg = $("analyse-msg"), note = $("flap-note"), bar = $("match-bar");
    const items = [...document.querySelectorAll("#checklist li")];
    items.forEach((li) => li.classList.remove("done"));
    msg.classList.remove("found");
    flap.classList.remove("final");
    renderFlap(padCenter(""));
    $("match-pct").textContent = "0";
    bar.style.transform = "scaleX(0)";
    $("lounge-state").textContent = "Scanning coastlines";
    note.textContent = "Reading your answers…";
    msg.textContent = ANALYSE_STEPS[0].msg;
    show("s-analyse");

    await wait(250);
    let pct = 0;
    for (let i = 0; i < ANALYSE_STEPS.length; i++) {
      if (run !== state.run) return;
      const step = ANALYSE_STEPS[i];
      const last = i === ANALYSE_STEPS.length - 1;
      msg.textContent = step.msg;
      restart(msg, "swap");
      if (last) { msg.classList.add("found"); flap.classList.add("final"); $("lounge-state").textContent = "Match confirmed"; }
      tween(pct, step.pct, 800, (v) => { $("match-pct").textContent = Math.round(v); bar.style.transform = `scaleX(${v / 100})`; });
      pct = step.pct;
      Sound.tick();
      await scramble(padCenter(step.city), 560, renderFlap);
      note.textContent = step.note();
      restart(note, "swap");
      items[i].classList.add("done");
      if (last) { vibrate([20, 40, 20]); Sound.bell(); }
      await hold(last ? 750 : (reduceMotion ? 700 : 380));
    }
    if (run !== state.run) return;
    runRoute();
  }

  /* ---------- Screen 5: flight route (Oslo → ???) ---------- */
  const routePath = $("route-path"), mapPlane = $("map-plane");
  function placePlane(pct) {
    routePath.style.strokeDashoffset = String(100 - pct);
    try {
      const L = routePath.getTotalLength();
      const p = routePath.getPointAtLength(L * pct / 100);
      const p2 = routePath.getPointAtLength(Math.min(L, L * pct / 100 + 1));
      const ang = pct >= 100 ? 200 : Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI + 90;
      mapPlane.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang})`);
    } catch (e) { /* the line still draws */ }
  }

  async function runRoute() {
    const run = state.run;
    $("route-title").firstChild.textContent = "Heading south";
    $("pin-to").classList.remove("lit");
    $("map-label-to").textContent = "? ? ?";
    $("route-to").textContent = "???";
    $("km").textContent = "0";
    placePlane(0);
    show("s-route");
    await wait(700); if (run !== state.run) return;
    Sound.whoosh(3.2);
    await tween(0, 100, 3200, (v) => {
      placePlane(v);
      $("km").textContent = Math.round(CONFIG.distanceKm * v / 100).toLocaleString("en-GB");
    });
    if (run !== state.run) return;
    $("pin-to").classList.add("lit");
    $("route-title").firstChild.textContent = "Destination ahead";
    vibrate(20);
    Sound.bell();
    await hold(900); if (run !== state.run) return;
    runReveal();
  }

  /* ---------- Screen 6: cinematic countdown + reveal ---------- */
  async function runReveal() {
    const run = state.run;
    const cd = $("countdown"), num = $("count-num"), sub = $("cd-sub"), ring = $("cd-ring"), reveal = $("reveal"), flash = $("flash");
    reveal.classList.remove("show");
    cd.classList.remove("on", "done");
    cd.hidden = false;
    num.textContent = "";
    sub.textContent = "";
    show("s-reveal");
    await wait(250);
    cd.classList.add("on");
    await wait(650);

    const lines = { "3": "Fasten your seatbelt", "2": "Sunglasses on", "1": "Here we go" };
    for (const n of ["3", "2", "1"]) {
      if (run !== state.run) return;
      num.textContent = n;
      sub.textContent = lines[n];
      restart(num, "tick");
      restart(sub, "swap");
      restart(ring, "run");
      vibrate(25);
      Sound.bell();
      await hold(1000);
    }
    if (run !== state.run) return;
    restart(flash, "go");
    cd.classList.add("done");
    await wait(180);
    reveal.classList.add("show");
    vibrate([30, 40, 80]);
    Sound.chime();
    setTimeout(() => { if (run === state.run && current.id === "s-reveal") confetti({ gold: true }); }, T(1100));
    await wait(800);
    cd.hidden = true;
  }
  $("btn-pass").addEventListener("click", (e) => {
    vibrate(10);
    Sound.click();
    restart(e.currentTarget, "shine");
    show("s-pass");
    renderAccepted(false);
  });

  /* Elegant paper confetti: champagne gold, ivory and sea tones that drift down */
  let confettiRaf = 0;
  function confetti(opts = {}) {
    if (reduceMotion) return;
    const canvas = $("confetti");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cancelAnimationFrame(confettiRaf);

    const colors = opts.gold
      ? ["#D7A85E", "#F1DDB3", "#C08F45", "#FFFCF5", "#E6A77B"]
      : ["#D7A85E", "#F1DDB3", "#A9792F", "#FFFCF5", "#5DB3D3", "#087EAD"];
    const count = opts.count || (w < 500 ? 72 : 120);
    const ox = opts.x != null ? opts.x : w / 2;
    const oy = opts.y != null ? opts.y : h * 0.3;
    const pieces = [];
    for (let i = 0; i < count; i++) {
      const fromBurst = opts.burstOnly || i < count * 0.45;
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 6;
      pieces.push({
        x: fromBurst ? ox : Math.random() * w,
        y: fromBurst ? oy : -20 - Math.random() * h * 0.5,
        vx: fromBurst ? Math.cos(ang) * spd : (Math.random() - .5) * 1.2,
        vy: fromBurst ? Math.sin(ang) * spd - 3 : 1 + Math.random() * 1.5,
        w: 4 + Math.random() * 4, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .12,
        ph: Math.random() * Math.PI * 2, vph: .08 + Math.random() * .1,
        c: colors[(Math.random() * colors.length) | 0],
        dot: Math.random() < .18
      });
    }
    const dur = opts.duration || 5200;
    const t0 = performance.now();
    function frame(t) {
      const e = t - t0;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = e > dur - 1200 ? Math.max(0, (dur - e) / 1200) : 1;
      for (const p of pieces) {
        p.vy = Math.min(p.vy + .09, 2.6);
        p.vx *= .985;
        p.ph += p.vph;
        p.x += p.vx + Math.sin(p.ph) * .7;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.dot) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.scale(1, Math.cos(p.ph)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      if (e < dur) confettiRaf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    confettiRaf = requestAnimationFrame(frame);
  }

  /* ---------- Screen 7: ticket ---------- */
  function renderAccepted(animate) {
    const pass = $("pass"), btn = $("btn-accept");
    if (state.accepted) {
      if (animate) { pass.classList.remove("accepted"); void pass.offsetWidth; }
      pass.classList.add("accepted");
      $("pass-status").textContent = CONFIG.statusAccepted;
      btn.textContent = "ADVENTURE ACCEPTED ✓";
      btn.classList.add("is-done");
      $("accept-card").hidden = false;
    } else {
      pass.classList.remove("accepted");
      $("pass-status").textContent = CONFIG.status;
      btn.textContent = "ACCEPT THIS ADVENTURE ✈️";
      btn.classList.remove("is-done");
      $("accept-card").hidden = true;
    }
  }

  $("btn-accept").addEventListener("click", () => {
    if (state.accepted) { toast("Already accepted. No take-backs. ✈️"); return; }
    state.accepted = true;
    try { localStorage.setItem("pe-accepted", "1"); } catch (e) { /* ignore */ }
    vibrate([20, 30, 60]);
    Sound.chime();
    renderAccepted(true);
    const r = $("pass").getBoundingClientRect();
    confetti({ gold: true, count: 70, burstOnly: true, x: r.left + r.width / 2, y: r.top + r.height * 0.45, duration: 3400 });
    setTimeout(() => $("accept-card").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }), 400);
    // Nothing is sent anywhere: accepting only updates this page (and is remembered on this phone).
  });

  // Print-friendly fallback (works when opened from the website or the file; not inside the Claude preview)
  if (typeof window.print === "function" && !window.claude) {
    $("btn-print").hidden = false;
    $("btn-print").addEventListener("click", () => window.print());
  }

  // Replay goes back to the closed birthday envelope. The remembered acceptance is kept.
  $("btn-replay").addEventListener("click", () => {
    state.run++;
    state.index = 0;
    state.answers = {};
    busy = false;
    Sound.click();
    resetEnvelope();
    show("s-envelope");
  });

  /* ---------- PDF voucher ----------
     A tiny built-in PDF writer (no libraries, works offline).
     Coordinates are in millimetres from the top-left corner. Uses the standard PDF fonts. */
  function MiniPDF(wMM, hMM) {
    const K = 72 / 25.4;
    let H = hMM;
    let ops = [];
    const pages = [{ w: wMM, h: hMM, ops }];
    const images = [];
    const n = (v) => (Math.round(v * 1000) / 1000).toString();
    const P = (x, y) => n(x * K) + " " + n((H - y) * K);
    const rgb = (c) => c.map((v) => n(v / 255)).join(" ");
    const FONTS = {
      helv: "Helvetica", helvB: "Helvetica-Bold", times: "Times-Roman", timesB: "Times-Bold",
      timesI: "Times-Italic", mono: "Courier", monoB: "Courier-Bold"
    };
    const fontKeys = Object.keys(FONTS);
    // Widths (1/1000 em) for alignment. Courier is monospaced; Times-Bold uppercase for the big codes.
    const TB = { A:722,B:667,C:722,D:722,E:667,F:611,G:778,H:778,I:389,J:500,K:778,L:667,M:944,N:722,O:778,P:611,Q:778,R:722,S:556,T:667,U:722,V:722,W:1000,X:722,Y:722,Z:667," ":250 };
    function width(str, font, size) {
      let u = 0;
      for (const ch of str) {
        if (font === "mono" || font === "monoB") u += 600;
        else if (font === "timesB") u += TB[ch] || 600;
        else u += 556; // rough fallback
      }
      return (u / 1000) * size / K; // mm
    }
    function esc(str) {
      // WinAnsi: Latin-1 range maps 1:1; replace anything else.
      let out = "";
      for (const ch of str) {
        const c = ch.charCodeAt(0);
        if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
        else if (c < 256) out += ch;
        else if (ch === "’") out += "'";
        else out += "?";
      }
      return out;
    }
    const api = {
      fill(c) { ops.push(rgb(c) + " rg"); return api; },
      addPage(w, h) { ops = []; H = h; pages.push({ w, h, ops }); return api; },
      // JPEG passed through untouched (binary string), drawn into the box x, y, w, h (mm)
      image(binary, pxW, pxH, x, y, w, h) {
        images.push({ binary, pxW, pxH });
        ops.push(`q ${n(w * K)} 0 0 ${n(h * K)} ${n(x * K)} ${n((H - y - h) * K)} cm /Im${images.length} Do Q`);
        return api;
      },
      save() { ops.push("q"); return api; },
      restore() { ops.push("Q"); return api; },
      clip(x, y, w, h) { ops.push(`${n(x * K)} ${n((H - y - h) * K)} ${n(w * K)} ${n(h * K)} re W n`); return api; },
      stroke(c) { ops.push(rgb(c) + " RG"); return api; },
      lineWidth(w) { ops.push(n(w * K) + " w"); return api; },
      dash(on, off) { ops.push(on ? `[${n(on * K)} ${n(off * K)}] 0 d` : "[] 0 d"); return api; },
      rect(x, y, w, h, mode = "f") { ops.push(`${n(x * K)} ${n((H - y - h) * K)} ${n(w * K)} ${n(h * K)} re ${mode}`); return api; },
      line(x1, y1, x2, y2) { ops.push(`${P(x1, y1)} m ${P(x2, y2)} l S`); return api; },
      poly(pts, mode = "f") {
        ops.push(pts.map((p, i) => P(p[0], p[1]) + (i ? " l" : " m")).join(" ") + " h " + mode);
        return api;
      },
      circle(cx, cy, r, mode = "f") {
        const k = 0.5523 * r;
        ops.push([
          `${P(cx + r, cy)} m`,
          `${P(cx + r, cy - k)} ${P(cx + k, cy - r)} ${P(cx, cy - r)} c`,
          `${P(cx - k, cy - r)} ${P(cx - r, cy - k)} ${P(cx - r, cy)} c`,
          `${P(cx - r, cy + k)} ${P(cx - k, cy + r)} ${P(cx, cy + r)} c`,
          `${P(cx + k, cy + r)} ${P(cx + r, cy + k)} ${P(cx + r, cy)} c`,
          mode
        ].join(" "));
        return api;
      },
      roundRect(x, y, w, h, r, mode = "S") {
        const k = 0.5523 * r;
        ops.push([
          `${P(x + r, y)} m`, `${P(x + w - r, y)} l`,
          `${P(x + w - r + k, y)} ${P(x + w, y + r - k)} ${P(x + w, y + r)} c`,
          `${P(x + w, y + h - r)} l`,
          `${P(x + w, y + h - r + k)} ${P(x + w - r + k, y + h)} ${P(x + w - r, y + h)} c`,
          `${P(x + r, y + h)} l`,
          `${P(x + r - k, y + h)} ${P(x, y + h - r + k)} ${P(x, y + h - r)} c`,
          `${P(x, y + r)} l`,
          `${P(x, y + r - k)} ${P(x + r - k, y)} ${P(x + r, y)} c`,
          "h " + mode
        ].join(" "));
        return api;
      },
      text(str, x, y, { font = "helv", size = 10, color = [0, 0, 0], align = "left", spacing = 0 } = {}) {
        let w = width(str, font, size) + (spacing * Math.max(0, str.length - 1)) / K;
        let tx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
        const fi = fontKeys.indexOf(font) + 1;
        ops.push(`BT /F${fi} ${n(size)} Tf ${rgb(color)} rg ${n(spacing)} Tc ${P(tx, y)} Td (${esc(str)}) Tj ET`);
        return api;
      },
      blob() {
        const objs = [];
        const add = (o) => { objs.push(o); return objs.length; };
        add(null); add(null);                       // 1 catalog, 2 page tree (filled in below)
        const fontIds = fontKeys.map((k) => add(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS[k]} /Encoding /WinAnsiEncoding >>`));
        const imgIds = images.map((im) => add(`<< /Type /XObject /Subtype /Image /Width ${im.pxW} /Height ${im.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.binary.length} >>\nstream\n${im.binary}\nendstream`));
        const fontRefs = fontIds.map((id, i) => `/F${i + 1} ${id} 0 R`).join(" ");
        const xobj = imgIds.length ? `/XObject << ${imgIds.map((id, i) => `/Im${i + 1} ${id} 0 R`).join(" ")} >>` : "";
        const pageIds = pages.map((pg) => {
          const content = pg.ops.join("\n");
          const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
          return add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pg.w * K)} ${n(pg.h * K)}] /Resources << /Font << ${fontRefs} >> ${xobj} >> /Contents ${cid} 0 R >>`);
        });
        objs[0] = "<< /Type /Catalog /Pages 2 0 R >>";
        objs[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => id + " 0 R").join(" ")}] /Count ${pageIds.length} >>`;
        const infoId = add("<< /Title (The Perfect Escape - Gift Voucher) /Creator (The Perfect Escape) >>");
        let out = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
        const offsets = [];
        objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
        const xref = out.length;
        out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
        offsets.forEach((o) => { out += String(o).padStart(10, "0") + " 00000 n \n"; });
        out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
        const bytes = new Uint8Array(out.length);
        for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
        return new Blob([bytes], { type: "application/pdf" });
      }
    };
    return api;
  }

  function drawPlane(pdf, cx, cy, s, color) {
    pdf.fill(color);
    pdf.poly([[cx + s, cy], [cx - s, cy - s * .2], [cx - s, cy + s * .2]]);
    pdf.poly([[cx + s * .2, cy], [cx - s * .4, cy - s * .95], [cx - s * .4, cy + s * .95]]);
    pdf.poly([[cx - s * .65, cy], [cx - s * 1.05, cy - s * .45], [cx - s * 1.05, cy + s * .45]]);
  }

  // PDF standard fonts only cover Latin-1, so emoji are dropped and swapped for words.
  function pdfSafe(s) {
    return String(s).replace(/[^\u0000-\u00FF]/g, "").replace(/\s+/g, " ").trim();
  }

  /* Emoji in the PDF: the phone draws the emoji (its own emoji style) onto a small canvas,
     which goes into the PDF as a JPEG on the ticket's ivory. Falls back to "(ha!)" if that fails. */
  const emojiCache = {};
  function emojiJpeg(ch) {
    if (ch in emojiCache) return emojiCache[ch];
    let out = null;
    try {
      const px = 96, cv = document.createElement("canvas");
      cv.width = cv.height = px;
      const g = cv.getContext("2d");
      g.fillStyle = "#FFFCF5"; g.fillRect(0, 0, px, px);
      g.font = `${Math.round(px * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(ch, px / 2, px * 0.54);
      // make sure something colourful was actually drawn
      const d = g.getImageData(0, 0, px, px).data;
      let ink = 0;
      for (let i = 0; i < d.length; i += 16) if (Math.abs(d[i] - 255) + Math.abs(d[i + 1] - 252) + Math.abs(d[i + 2] - 245) > 60) ink++;
      if (ink > 40) out = { binary: atob(cv.toDataURL("image/jpeg", 0.92).split(",")[1]), px };
    } catch (e) { out = null; }
    return (emojiCache[ch] = out);
  }
  let measureCtx = null;
  function textWidthMM(str, sizePt) {            // Helvetica-Bold width, measured with the closest system font
    try {
      measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
      measureCtx.font = 'bold 100px Helvetica, Arial, "Liberation Sans", sans-serif';
      return measureCtx.measureText(str).width / 100 * sizePt * 25.4 / 72;
    } catch (e) { return str.length * 0.56 * sizePt * 25.4 / 72; }
  }
  /* Draw a value that may end with an emoji (e.g. "Absolutely none 😂") */
  function valueText(pdf, v, x, y, opts) {
    const m = String(v).match(/^(.*?)\s*(\p{Extended_Pictographic}\uFE0F?)\s*$/u);
    if (!m) { pdf.text(pdfSafe(v), x, y, opts); return; }
    const text = pdfSafe(m[1]);
    const img = emojiJpeg(m[2]);
    if (!img) { pdf.text(text + (m[2] === "😂" ? " (ha!)" : ""), x, y, opts); return; }
    pdf.text(text, x, y, opts);
    const size = opts.size * 1.2 * 25.4 / 72;   // emoji box in mm, a little larger than the text
    pdf.image(img.binary, img.px, img.px, x + textWidthMM(text + " ", opts.size), y - size * 0.8, size, size);
  }

  function buildPdf() {
    // Page 1: a tall, phone-shaped pass that fills a phone screen when opened.
    // Page 2: the wide ticket (210 x 99 mm) for printing or a rotated phone.
    const pdf = MiniPDF(90, 206);
    drawMobilePass(pdf);
    pdf.addPage(210, 99);
    drawWideTicket(pdf);
    return pdf.blob();
  }

  function drawMobilePass(pdf) {
    const navy = [16, 40, 63], gold = [215, 168, 94], goldDeep = [169, 121, 47], paper = [255, 252, 245];
    const muted = [91, 104, 119], ocean = [8, 126, 173], notch = [233, 223, 204];
    const C = CONFIG, W = 90;

    pdf.fill(paper).rect(0, 0, W, 206);
    pdf.stroke([246, 238, 222]).lineWidth(.15);
    for (let y = 66; y < 206; y += 1.6) pdf.line(0, y, W, y);

    // Málaga at sunset across the top
    const ph = window.TICKET_PHOTO;
    if (ph && ph.data) {
      try { pdf.image(atob(ph.data), ph.w, ph.h, 0, 0, W, 64); }
      catch (e) { pdf.fill(navy).rect(0, 0, W, 64); }
    } else {
      pdf.fill(navy).rect(0, 0, W, 64);
      pdf.fill(gold).circle(62, 40, 9);
      pdf.fill([8, 70, 110]).rect(0, 46, W, 18);
    }
    pdf.fill(gold).rect(0, 63.4, W, 1.2);
    pdf.text("THE PERFECT ESCAPE", 7, 10, { font: "timesB", size: 9, color: paper, spacing: 1.1 });

    // seal on the photo edge
    pdf.fill(goldDeep).circle(78, 64, 7.5);
    pdf.fill(gold).circle(78, 64, 6.2);
    pdf.stroke(goldDeep).lineWidth(.3).circle(78, 64, 5.2, "S");
    pdf.text("PE", 78, 66, { font: "timesB", size: 9.5, color: navy, align: "center" });

    pdf.text("BOARDING PASS", 7, 76, { font: "monoB", size: 6.5, color: goldDeep, spacing: .8 });
    pdf.text("GIFT VOUCHER \u00b7 N\u00ba 0001 \u00b7 CLASS: FIRST", 7, 81, { font: "mono", size: 5.4, color: muted });

    // route
    pdf.text(pdfSafe(C.from.code), 7, 100, { font: "timesB", size: 30, color: navy });
    pdf.text(pdfSafe(C.to.code), 83, 100, { font: "timesB", size: 30, color: navy, align: "right" });
    pdf.stroke(gold).lineWidth(.4).dash(.8, 1.3).line(31, 92, 40.5, 92).line(49.5, 92, 59, 92).dash();
    drawPlane(pdf, 45, 92, 3.2, navy);
    pdf.text(pdfSafe(`${C.from.city}, ${C.from.country}`).toUpperCase(), 7, 105.5, { font: "mono", size: 5.6, color: muted });
    pdf.text(pdfSafe(`${C.to.city}, ${C.to.country}`).toUpperCase(), 83, 105.5, { font: "mono", size: 5.6, color: muted, align: "right" });
    pdf.stroke(gold).lineWidth(.3).line(7, 111, 83, 111);

    // passenger
    pdf.text("PASSENGER", 7, 119, { font: "monoB", size: 5.6, color: goldDeep, spacing: .5 });
    pdf.text(pdfSafe(C.passenger), 7, 127.5, { font: "timesI", size: 18, color: navy });

    // details, two columns
    const rows = [
      [["FROM", `${C.from.city}, ${C.from.country}`, navy], ["DESTINATION", `${C.to.city}, ${C.to.country}`, goldDeep]],
      [["TRANSPORT", C.transport, navy], ["BOATS", C.boats, navy]],
      [["DEPARTURE", C.departure, navy], ["RETURN", C.returnDate, navy]]
    ];
    rows.forEach((row, r) => row.forEach(([k, v, color], c) => {
      const x = c ? 45 : 7, y = 138 + r * 14;
      pdf.text(k, x, y, { font: "monoB", size: 5.6, color: goldDeep, spacing: .5 });
      valueText(pdf, v, x, y + 5.3, { font: "helvB", size: 8.8, color });
    }));

    pdf.text("STATUS", 7, 181, { font: "monoB", size: 5.6, color: goldDeep, spacing: .5 });
    pdf.text(state.accepted ? C.statusAccepted : C.status, 7, 187.5, { font: "timesI", size: 12.5, color: ocean });
    if (state.accepted) {
      pdf.stroke(ocean).lineWidth(.7).roundRect(53, 178.5, 30, 10, 2);
      pdf.text("ACCEPTED", 68, 185, { font: "monoB", size: 7.8, color: ocean, align: "center", spacing: .7 });
    }

    // tear line
    pdf.stroke([200, 188, 165]).lineWidth(.3).dash(1.4, 1.4).line(6, 193.5, 84, 193.5).dash();
    pdf.fill(notch).circle(0, 193.5, 3.4).circle(W, 193.5, 3.4);
    pdf.text(pdfSafe(C.footer), 45, 199.5, { font: "timesI", size: 7.8, color: navy, align: "center" });
    pdf.text("Symbolic gift voucher \u00b7 not an airline ticket or confirmed booking", 45, 203.3, { font: "helv", size: 4.8, color: muted, align: "center" });
  }

  function drawWideTicket(pdf) {
    const navy = [16, 40, 63], gold = [215, 168, 94], goldDeep = [169, 121, 47], paper = [255, 252, 245];
    const stubBg = [248, 241, 226], ink = [20, 34, 49], muted = [91, 104, 119], ocean = [8, 126, 173], hair = [236, 226, 206];
    const C = CONFIG;

    pdf.fill(paper).rect(0, 0, 210, 99);
    // fine paper lines
    pdf.stroke([246, 238, 222]).lineWidth(.15);
    for (let y = 3; y < 99; y += 1.6) pdf.line(0, y, 148, y);

    // stub panel
    pdf.fill(stubBg).rect(148, 0, 62, 99);

    // gold hairline frame + corner glow
    pdf.stroke(gold).lineWidth(.3).roundRect(4, 4, 140, 91, 3);

    // header
    pdf.text("THE PERFECT ESCAPE", 10, 14, { font: "timesB", size: 12.5, color: navy, spacing: 1.4 });
    pdf.text("GIFT VOUCHER  ·  Nº 0001  ·  CLASS: FIRST", 10, 19.5, { font: "mono", size: 6, color: goldDeep, spacing: .3 });
    pdf.fill(goldDeep).circle(132, 14, 7);
    pdf.fill(gold).circle(132, 14, 5.8);
    pdf.stroke(goldDeep).lineWidth(.3).circle(132, 14, 4.9, "S");
    pdf.text("PE", 132, 15.9, { font: "timesB", size: 9, color: navy, align: "center" });

    // route
    pdf.text(pdfSafe(C.from.code), 10, 38, { font: "timesB", size: 30, color: navy });
    pdf.text(pdfSafe(C.to.code), 138, 38, { font: "timesB", size: 30, color: navy, align: "right" });
    pdf.text(pdfSafe(`${C.from.city}, ${C.from.country}`).toUpperCase(), 10, 43.5, { font: "mono", size: 6.5, color: muted });
    pdf.text(pdfSafe(`${C.to.city}, ${C.to.country}`).toUpperCase(), 138, 43.5, { font: "mono", size: 6.5, color: muted, align: "right" });
    pdf.stroke(gold).lineWidth(.45).dash(1, 1.6).line(44, 31, 66, 31).line(76, 31, 98, 31).dash();
    drawPlane(pdf, 71, 31, 3.8, navy);

    pdf.stroke(gold).lineWidth(.3).line(10, 48.5, 138, 48.5);

    // fields: 3 x 3
    const fields = [
      ["PASSENGER", C.passenger, "timesI", 12.5, navy],
      ["FROM", `${C.from.city}, ${C.from.country}`, "helvB", 9.5, navy],
      ["DESTINATION", `${C.to.city}, ${C.to.country}`, "helvB", 9.5, goldDeep],
      ["TRANSPORT", C.transport, "helvB", 9.5, navy],
      ["BOATS", C.boats, "helvB", 9.5, navy],
      ["DEPARTURE", C.departure, "helvB", 9.5, navy],
      ["RETURN", C.returnDate, "helvB", 9.5, navy],
      ["STATUS", state.accepted ? C.statusAccepted : C.status, "timesI", 11.5, ocean]
    ];
    fields.forEach(([k, v, font, size, color], i) => {
      const x = 10 + (i % 3) * 44, y = 55 + Math.floor(i / 3) * 11.5;
      pdf.text(k, x, y, { font: "monoB", size: 5.6, color: goldDeep, spacing: .5 });
      valueText(pdf, v, x, y + 5, { font, size, color });
    });

    // footer line
    pdf.stroke(gold).lineWidth(.3).line(10, 85.5, 138, 85.5);
    pdf.text(pdfSafe(C.footer), 74, 91, { font: "timesI", size: 9.5, color: navy, align: "center", width: 128 });

    if (state.accepted) {
      pdf.stroke(ocean).lineWidth(.7).roundRect(86, 9, 34, 10, 2);
      pdf.text("ACCEPTED", 103, 15.6, { font: "monoB", size: 8.5, color: ocean, align: "center", spacing: .8 });
    }

    // perforation
    pdf.fill(paper).circle(148, 0, 5).circle(148, 99, 5);
    pdf.stroke([200, 188, 165]).lineWidth(.3).dash(1.5, 1.5).line(148, 7, 148, 92).dash();

    // stub
    pdf.text("BOARDING PASS", 156, 12, { font: "monoB", size: 6.6, color: goldDeep, spacing: .6 });
    pdf.text(pdfSafe(C.from.code), 156, 24, { font: "timesB", size: 18, color: navy });
    pdf.text(pdfSafe(C.to.code), 202, 24, { font: "timesB", size: 18, color: navy, align: "right" });
    drawPlane(pdf, 179.2, 21.6, 2.4, goldDeep);
    pdf.stroke(hair).lineWidth(.25).line(156, 28.5, 202, 28.5);
    [["PASSENGER", C.passenger], ["SEAT", "Window"], ["GATE", "Surprise"], ["VALID FOR", "One escape"]].forEach(([k, v], i) => {
      const x = 156 + (i % 2) * 24, y = 35 + Math.floor(i / 2) * 11;
      pdf.text(k, x, y, { font: "monoB", size: 5.5, color: muted, spacing: .4 });
      pdf.text(pdfSafe(v), x, y + 4.3, { font: "helvB", size: 8.6, color: ink });
    });
    pdf.fill(navy);
    let bx = 156, i = 0;
    const pattern = [2,1,1,3,1,2,1,1,2,1,3,1,1,2,1,1,3,2,1,1,2,1,1,3,1,2,1,1,2,3,1,1,2,1,3,1,2,1,1,2,1,1,3,1,2,1,1,2,1,3];
    while (bx < 201 && i < pattern.length * 3) {
      const wdt = pattern[i % pattern.length] * .34;
      if (i % 2 === 0) pdf.rect(bx, 59, Math.min(wdt, 202 - bx), 12);
      bx += wdt + .35; i++;
    }
    ["Symbolic gift voucher.", "Not an airline ticket or a", "confirmed booking. Dates to", "be agreed together."]
      .forEach((l, j) => pdf.text(l, 156, 78 + j * 2.6, { font: "helv", size: 5.8, color: muted }));
    pdf.text(pdfSafe(C.to.coords), 156, 94.5, { font: "mono", size: 5.5, color: ocean });

  }

  async function downloadPdf() {
    const filename = "The-Perfect-Escape-Malaga-Voucher.pdf";
    let blob;
    try { blob = buildPdf(); } catch (e) { console.error(e); toast("Couldn't build the PDF. Please try again."); return; }

    // Inside a claude.ai artifact, downloads go through the viewer's save prompt.
    if (window.claude && typeof window.claude.use === "function") {
      let downloads = null;
      try { downloads = await window.claude.use("downloads"); } catch (e) { downloads = null; }
      if (downloads) {
        try { await downloads.save({ filename, data: blob }); toast("Your gift is saved. 🎁"); }
        catch (err) { if (!err || err.code !== "declined") toast("The download didn't go through. Please try again."); }
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    // iOS Safari sometimes ignores the download attribute: open the PDF so it can be saved or shared.
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) setTimeout(() => { window.location.href = url; }, 300);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast("Your gift is downloading. 🎁");
  }
  $("btn-download").addEventListener("click", () => { vibrate(10); Sound.click(); downloadPdf(); });

  /* Keyboard shortcuts on the question screen: Y / N */
  document.addEventListener("keydown", (e) => {
    if (current.id !== "s-questions") return;
    if (e.key === "y" || e.key === "Y") answer(true);
    if (e.key === "n" || e.key === "N") answer(false);
  });
})();

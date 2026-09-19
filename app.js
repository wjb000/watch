/**
 * Nebula OS browser simulator
 * Gestures & chrome mapped from firmware ui.cpp:
 *   watch: swipe DOWN → Control, swipe UP → Launcher
 *   Control: swipe UP → Watch (grab pill sheet)
 *   Launcher: swipe DOWN (near top) → Watch
 *   Pet: drag / tap react; vertical swipe yields after ~40px
 *   Apps: back chevron 78×64, edge swipe back
 */
(function () {
  "use strict";

  const screenEl = document.getElementById("watch-screen");
  const stack = document.getElementById("screen-stack");
  const veil = document.getElementById("brightness-veil");
  const nova = document.getElementById("nova");
  const novaStage = document.getElementById("nova-stage");

  const state = {
    screen: "home",
    history: [],
    face: "companion", // companion | time
    wifi: true,
    bt: false,
    dnd: false,
    sounds: true,
    torch: false,
    batt: 87,
    bright: 62,
    vol: 40,
    hintHidden: false,
  };

  /* ---------- clock ---------- */
  function pad(n, w) {
    return String(n).padStart(w || 2, "0");
  }
  function tickClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const time = h + ":" + pad(m);
    const date = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const dateDot = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).replace(",", " ·");
    setText("home-time", time);
    setText("home-date", date);
    setText("timeface-time", time);
    setText("timeface-date", dateDot);
    setText("timeface-sec", pad(s));
  }
  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  tickClock();
  setInterval(tickClock, 1000);

  function setBatt(n) {
    state.batt = n;
    ["home-batt", "cc-batt", "set-batt"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = n + "%";
    });
  }
  setBatt(87);

  /* ---------- navigation ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function showScreen(name, { push = true, anim } = {}) {
    const next = document.getElementById("screen-" + name);
    if (!next) return;
    const prevName = state.screen;
    const prev = document.getElementById("screen-" + prevName);

    if (push && prevName && prevName !== name) {
      const sheetPair =
        (prevName === "home" && (name === "cc" || name === "launcher")) ||
        ((prevName === "cc" || prevName === "launcher") && name === "home");
      if (!sheetPair) state.history.push(prevName);
    }

    $all(".screen").forEach((s) => {
      s.classList.remove("active", "slide-from-bottom", "slide-from-top");
    });
    next.classList.add("active");
    if (anim === "up") next.classList.add("slide-from-bottom");
    if (anim === "down") next.classList.add("slide-from-top");
    state.screen = name;

    if (name === "torch") {
      /* full white already via CSS */
    }
    syncWifiIcon();
  }

  function goBack(fallback) {
    if (state.history.length) {
      showScreen(state.history.pop(), { push: false });
      return;
    }
    showScreen(fallback || "home", { push: false });
  }

  function openApp(name) {
    if (name === "torch") {
      showScreen("torch");
      return;
    }
    showScreen(name);
  }

  /* ---------- face styles ---------- */
  function applyFace(face) {
    state.face = face;
    const companion = document.getElementById("face-companion");
    const timeFace = document.getElementById("face-time");
    if (face === "time") {
      companion.hidden = true;
      timeFace.hidden = false;
      const slot = document.getElementById("timeface-nova-slot");
      if (slot && nova && !slot.contains(nova)) {
        slot.appendChild(nova);
        nova.style.position = "relative";
        nova.style.left = "auto";
        nova.style.top = "auto";
        nova.style.margin = "0";
        nova.style.transform = "";
      }
      timeFace.classList.add("face-time");
    } else {
      timeFace.hidden = true;
      companion.hidden = false;
      if (novaStage && nova && !novaStage.contains(nova)) {
        novaStage.appendChild(nova);
      }
      nova.style.position = "absolute";
      nova.style.left = "50%";
      nova.style.top = "42%";
      nova.style.marginLeft = "-60px";
      nova.style.marginTop = "-70px";
      nova.style.transform = "";
      resetNovaHome();
    }
    $all(".face-card").forEach((c) => {
      const on = c.getAttribute("data-face") === face;
      c.classList.toggle("on", on);
      const badge = c.querySelector(".face-on");
      if (badge) badge.hidden = !on;
    });
  }

  /* ---------- toggles / sliders ---------- */
  function syncWifiIcon() {
    const w = document.getElementById("home-wifi");
    if (w) w.classList.toggle("off", !state.wifi);
  }

  function setSliderFill(input) {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--pct", pct + "%");
  }

  const bright = document.getElementById("brightness");
  const vol = document.getElementById("volume");
  if (bright) {
    setSliderFill(bright);
    bright.addEventListener("input", () => {
      state.bright = Number(bright.value);
      setText("bright-val", state.bright + "%");
      setSliderFill(bright);
      veil.style.opacity = String(((100 - state.bright) / 100) * 0.55);
    });
    veil.style.opacity = String(((100 - state.bright) / 100) * 0.55);
  }
  if (vol) {
    setSliderFill(vol);
    vol.addEventListener("input", () => {
      state.vol = Number(vol.value);
      setText("vol-val", state.vol + "%");
      setSliderFill(vol);
    });
  }

  /* ---------- clicks ---------- */
  stack.addEventListener("click", (e) => {
    const back = e.target.closest("[data-back]");
    if (back) {
      e.preventDefault();
      const dest = back.getAttribute("data-back");
      if (dest === "cc") showScreen("cc", { push: false });
      else if (dest === "launcher") showScreen("launcher", { push: false });
      else if (dest === "settings") showScreen("settings", { push: false });
      else if (dest === "home") showScreen("home", { push: false });
      else goBack(dest || "home");
      return;
    }

    const open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault();
      openApp(open.getAttribute("data-open"));
      return;
    }

    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      e.preventDefault();
      const kind = toggle.getAttribute("data-toggle");
      const on = !toggle.classList.contains("on");
      toggle.classList.toggle("on", on);
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
      if (kind === "wifi") {
        state.wifi = on;
        syncWifiIcon();
      }
      if (kind === "bt") state.bt = on;
      if (kind === "dnd") state.dnd = on;
      if (kind === "sounds") state.sounds = on;
      return;
    }

    const faceBtn = e.target.closest("[data-face]");
    if (faceBtn) {
      applyFace(faceBtn.getAttribute("data-face"));
      return;
    }
  });

  /* torch dismiss */
  const torchScreen = document.getElementById("screen-torch");
  if (torchScreen) {
    torchScreen.addEventListener("click", (e) => {
      if (e.target.closest(".back-hit")) return;
      showScreen("cc", { push: false });
    });
  }

  /* long-press time → Faces */
  let longTimer = null;
  ["home-time", "timeface-time"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      longTimer = setTimeout(() => {
        longTimer = null;
        showScreen("faces");
      }, 550);
    });
    const clear = () => {
      if (longTimer) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    };
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointerleave", clear);
    el.addEventListener("pointercancel", clear);
  });

  /* ---------- Nova pet ---------- */
  const PET_SLOP = 12;
  const PET_YIELD = 40;
  let pet = {
    dragging: false,
    press: false,
    startX: 0,
    startY: 0,
    ox: 0,
    oy: 0,
    x: 0,
    y: 0,
    yielded: false,
  };

  function resetNovaHome() {
    pet.x = 0;
    pet.y = 0;
    if (state.face === "companion" && nova) {
      nova.style.transform = "translate(0px, 0px)";
    }
  }

  function novaReact() {
    if (!nova) return;
    nova.classList.add("react");
    setTimeout(() => nova.classList.remove("react"), 450);
  }

  if (nova) {
    nova.addEventListener("pointerdown", (e) => {
      if (state.screen !== "home" || state.face !== "companion") return;
      e.stopPropagation();
      pet.press = true;
      pet.dragging = false;
      pet.yielded = false;
      pet.startX = e.clientX;
      pet.startY = e.clientY;
      pet.ox = pet.x;
      pet.oy = pet.y;
      nova.setPointerCapture(e.pointerId);
    });
    nova.addEventListener("pointermove", (e) => {
      if (!pet.press || pet.yielded) return;
      const dx = e.clientX - pet.startX;
      const dy = e.clientY - pet.startY;
      const dist = Math.hypot(dx, dy);
      if (!pet.dragging && dist > PET_SLOP) {
        // vertical swipe yield — let watch gesture win
        if (Math.abs(dy) > Math.abs(dx) && dist > PET_YIELD) {
          pet.yielded = true;
          pet.press = false;
          pet.dragging = false;
          return;
        }
        if (Math.abs(dx) >= Math.abs(dy) || dist > PET_YIELD) {
          pet.dragging = true;
        }
      }
      if (pet.dragging) {
        pet.x = pet.ox + dx;
        pet.y = pet.oy + dy;
        // clamp loosely to screen
        pet.x = Math.max(-140, Math.min(140, pet.x));
        pet.y = Math.max(-120, Math.min(160, pet.y));
        nova.style.transform = "translate(" + pet.x + "px," + pet.y + "px)";
      }
    });
    nova.addEventListener("pointerup", (e) => {
      if (!pet.press && !pet.dragging) return;
      const wasDrag = pet.dragging;
      pet.press = false;
      pet.dragging = false;
      if (!wasDrag && !pet.yielded) {
        novaReact();
        // poke → Talk (firmware opens AI)
        setTimeout(() => showScreen("talk"), 180);
      } else if (wasDrag) {
        // soft settle toward home
        const settle = () => {
          pet.x *= 0.82;
          pet.y *= 0.82;
          if (Math.hypot(pet.x, pet.y) < 4) {
            resetNovaHome();
            return;
          }
          nova.style.transform = "translate(" + pet.x + "px," + pet.y + "px)";
          requestAnimationFrame(settle);
        };
        requestAnimationFrame(settle);
        novaReact();
      }
    });
  }

  /* ---------- swipe gestures ---------- */
  let gesture = {
    down: false,
    x0: 0,
    y0: 0,
    t0: 0,
    ignore: false,
  };

  function pt(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0])
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    if (e.target.closest("input, .sheet-slider, .switch, .calc-grid, .talk-actions, .timer-actions")) {
      gesture.ignore = true;
      gesture.down = false;
      return;
    }
    if (e.target.closest("#nova") && state.screen === "home" && state.face === "companion") {
      // pet handler owns this unless it yields
      gesture.ignore = false;
    }
    const p = pt(e);
    gesture.down = true;
    gesture.ignore = false;
    gesture.x0 = p.x;
    gesture.y0 = p.y;
    gesture.t0 = Date.now();
  }

  function onEnd(e) {
    if (!gesture.down || gesture.ignore) {
      gesture.down = false;
      return;
    }
    gesture.down = false;
    if (pet.dragging) return;

    const p = pt(e);
    const dx = p.x - gesture.x0;
    const dy = p.y - gesture.y0;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = Date.now() - gesture.t0;
    const SWIPE = 48;

    // left-edge back on apps
    if (
      state.screen !== "home" &&
      state.screen !== "cc" &&
      state.screen !== "launcher" &&
      gesture.x0 - screenEl.getBoundingClientRect().left < 28 &&
      dx > 56 &&
      adx > ady
    ) {
      const backBtn = $(".screen.active [data-back]");
      const dest = backBtn ? backBtn.getAttribute("data-back") : "launcher";
      if (dest === "cc") showScreen("cc", { push: false });
      else if (dest === "launcher") showScreen("launcher", { push: false });
      else if (dest === "settings") showScreen("settings", { push: false });
      else showScreen(dest || "home", { push: false });
      return;
    }

    if (ady < SWIPE || ady < adx * 1.15) return;
    if (dt > 900) return;

    hideHint();

    if (state.screen === "home") {
      if (dy > 0) {
        // swipe down → Control (firmware watchGesture BOTTOM)
        showScreen("cc", { push: false, anim: "down" });
      } else {
        // swipe up → Launcher
        showScreen("launcher", { push: false, anim: "up" });
      }
      return;
    }
    if (state.screen === "cc") {
      if (dy < 0) {
        // swipe up dismiss
        showScreen("home", { push: false, anim: "up" });
      }
      return;
    }
    if (state.screen === "launcher") {
      const grid = document.getElementById("launcher-grid");
      const scrollTop = grid ? grid.scrollTop : 0;
      if (dy > 0 && scrollTop <= 12) {
        showScreen("home", { push: false, anim: "down" });
      }
      return;
    }
  }

  function hideHint() {
    if (state.hintHidden) return;
    state.hintHidden = true;
    const h = document.getElementById("home-hint");
    if (h) h.classList.add("hidden");
  }

  screenEl.addEventListener("pointerdown", onStart, { passive: true });
  screenEl.addEventListener("pointerup", onEnd, { passive: true });
  screenEl.addEventListener("pointercancel", () => {
    gesture.down = false;
  });

  /* ---------- Talk mock ---------- */
  const replies = [
    "Got it, boss.",
    "On it.",
    "Battery’s fine — want a timer?",
    "Nice swipe. Control is down, apps are up.",
    "I’m just a sim here, but the real Nova talks on-device.",
  ];
  let talkBusy = false;
  const talkBtn = document.getElementById("talk-btn");
  const callBtn = document.getElementById("call-btn");
  const talkLog = document.getElementById("talk-log");
  const talkStatus = document.getElementById("talk-status");

  function addBubble(text, who) {
    const d = document.createElement("div");
    d.className = "bubble " + who;
    d.textContent = text;
    talkLog.appendChild(d);
    talkLog.scrollTop = talkLog.scrollHeight;
  }

  if (talkBtn) {
    talkBtn.addEventListener("click", () => {
      if (talkBusy) return;
      talkBusy = true;
      talkStatus.textContent = "Listening…";
      addBubble("Hey Nova", "me");
      setTimeout(() => {
        talkStatus.textContent = "Thinking…";
        setTimeout(() => {
          const r = replies[Math.floor(Math.random() * replies.length)];
          addBubble(r, "bot");
          talkStatus.textContent = "Ready, boss";
          talkBusy = false;
        }, 700);
      }, 900);
    });
  }
  if (callBtn) {
    callBtn.addEventListener("click", () => {
      talkStatus.textContent = "In call (mock)";
      addBubble("Call loop would listen here — sim only.", "bot");
    });
  }

  /* ---------- Timer ---------- */
  let timerLeft = 300;
  let timerIv = null;
  function renderTimer() {
    const m = Math.floor(timerLeft / 60);
    const s = timerLeft % 60;
    setText("timer-display", pad(m) + ":" + pad(s));
  }
  renderTimer();
  $all("[data-timer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $all("[data-timer]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      timerLeft = Number(btn.getAttribute("data-timer"));
      if (timerIv) {
        clearInterval(timerIv);
        timerIv = null;
        document.getElementById("timer-start").textContent = "Start";
      }
      renderTimer();
    });
  });
  const timerStart = document.getElementById("timer-start");
  if (timerStart) {
    timerStart.addEventListener("click", () => {
      if (timerIv) {
        clearInterval(timerIv);
        timerIv = null;
        timerStart.textContent = "Start";
        return;
      }
      timerStart.textContent = "Pause";
      timerIv = setInterval(() => {
        if (timerLeft <= 0) {
          clearInterval(timerIv);
          timerIv = null;
          timerStart.textContent = "Start";
          return;
        }
        timerLeft -= 1;
        renderTimer();
      }, 1000);
    });
  }
  const timerReset = document.getElementById("timer-reset");
  if (timerReset) {
    timerReset.addEventListener("click", () => {
      if (timerIv) clearInterval(timerIv);
      timerIv = null;
      const on = document.querySelector("[data-timer].on");
      timerLeft = on ? Number(on.getAttribute("data-timer")) : 300;
      renderTimer();
      if (timerStart) timerStart.textContent = "Start";
    });
  }

  /* ---------- Stopwatch ---------- */
  let swT0 = 0;
  let swAcc = 0;
  let swIv = null;
  let swRunning = false;
  let lapN = 0;
  function renderSw() {
    const t = swAcc + (swRunning ? performance.now() - swT0 : 0);
    const cs = Math.floor(t / 10) % 100;
    const s = Math.floor(t / 1000) % 60;
    const m = Math.floor(t / 60000);
    setText("sw-display", pad(m) + ":" + pad(s) + "." + pad(cs));
  }
  const swStart = document.getElementById("sw-start");
  const swLap = document.getElementById("sw-lap");
  if (swStart) {
    swStart.addEventListener("click", () => {
      if (!swRunning) {
        swRunning = true;
        swT0 = performance.now();
        swStart.textContent = "Stop";
        swIv = setInterval(renderSw, 32);
      } else {
        swAcc += performance.now() - swT0;
        swRunning = false;
        clearInterval(swIv);
        swStart.textContent = "Start";
        renderSw();
      }
    });
  }
  if (swLap) {
    swLap.addEventListener("click", () => {
      if (!swRunning && swAcc === 0) {
        swAcc = 0;
        lapN = 0;
        document.getElementById("lap-list").innerHTML = "";
        renderSw();
        return;
      }
      lapN += 1;
      const li = document.createElement("li");
      const t = swAcc + (swRunning ? performance.now() - swT0 : 0);
      const cs = Math.floor(t / 10) % 100;
      const s = Math.floor(t / 1000) % 60;
      const m = Math.floor(t / 60000);
      li.innerHTML = "<span>Lap " + lapN + "</span><span>" + pad(m) + ":" + pad(s) + "." + pad(cs) + "</span>";
      document.getElementById("lap-list").prepend(li);
    });
  }

  /* ---------- Calc ---------- */
  let calcStr = "0";
  const calcDisp = document.getElementById("calc-display");
  const calcGrid = document.getElementById("calc-grid");
  function setCalc(v) {
    calcStr = v;
    if (calcDisp) calcDisp.textContent = v.length > 12 ? v.slice(0, 12) : v;
  }
  if (calcGrid) {
    calcGrid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-k]");
      if (!b) return;
      const k = b.getAttribute("data-k");
      if (k === "C") return setCalc("0");
      if (k === "±") {
        if (calcStr.startsWith("-")) setCalc(calcStr.slice(1));
        else if (calcStr !== "0") setCalc("-" + calcStr);
        return;
      }
      if (k === "=") {
        try {
          const expr = calcStr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
          // eslint-disable-next-line no-new-func
          const v = Function('"use strict"; return (' + expr.replace(/[^0-9+\-*/().%\s]/g, "") + ")")();
          setCalc(String(Number.isFinite(v) ? +parseFloat(v.toFixed(8)) : "Err"));
        } catch (_) {
          setCalc("Err");
        }
        return;
      }
      if (k === "%" && calcStr !== "0") {
        setCalc(String(parseFloat(calcStr) / 100));
        return;
      }
      const map = { "/": "÷", "*": "×", "-": "−", "+": "+" };
      const ch = map[k] || k;
      if ("+-×÷−".includes(ch) || "+-*/".includes(k)) {
        setCalc((calcStr === "Err" ? "0" : calcStr) + ch);
        return;
      }
      if (calcStr === "0" || calcStr === "Err") setCalc(ch);
      else setCalc(calcStr + ch);
    });
  }

  /* ---------- sensors jitter ---------- */
  setInterval(() => {
    if (state.screen !== "sensors") return;
    const a = (0.02 + Math.random() * 0.03).toFixed(2);
    const b = (0.01 + Math.random() * 0.02).toFixed(2);
    setText("sns-a", a + " · " + b + " · 1.00 g");
    setText(
      "sns-g",
      (Math.random() * 0.2 - 0.1).toFixed(1) +
        " · " +
        (Math.random() * 0.2 - 0.1).toFixed(1) +
        " · " +
        (Math.random() * 0.2 - 0.1).toFixed(1)
    );
  }, 800);

  /* ---------- init ---------- */
  applyFace("companion");
  syncWifiIcon();
})();

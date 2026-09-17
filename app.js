/**
 * Nebula OS — browser watch simulator
 * Static, self-contained. Relative paths for GitHub Pages /watch/
 */
(function () {
  "use strict";

  const screenEl = document.getElementById("watch-screen");
  const stack = document.getElementById("screen-stack");
  const statusBar = document.getElementById("status-bar");
  const brightnessVeil = document.getElementById("brightness-veil");
  const nova = document.getElementById("nova");
  const homeScreen = document.getElementById("screen-home");

  let current = "home";
  let navHistory = [];
  let faceStyle = "classic";
  let wifiOn = true;
  let torchOn = false;

  // --- Clock ---
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const timeStr = `${h}:${String(m).padStart(2, "0")}`;
    const opts = { weekday: "short", month: "short", day: "numeric" };
    const dateStr = now.toLocaleDateString("en-US", opts);

    const homeTime = document.getElementById("home-time");
    const homeDate = document.getElementById("home-date");
    const ccTime = document.getElementById("cc-time");
    const statusMini = document.getElementById("status-time-mini");

    if (homeTime) homeTime.textContent = timeStr;
    if (homeDate) homeDate.textContent = dateStr;
    if (ccTime) ccTime.textContent = timeStr;
    if (statusMini) statusMini.textContent = timeStr;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Battery (cosmetic drift)
  let batt = 87;
  function setBattery(n) {
    batt = Math.max(5, Math.min(100, n));
    ["home-batt", "status-batt", "set-batt"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = batt + "%";
    });
  }
  setBattery(87);

  // --- Navigation ---
  function showStatusBar(show) {
    statusBar.classList.toggle("visible", !!show && current !== "home" && current !== "cc");
  }

  function goTo(name, { push = true, fromSwipe = false } = {}) {
    const next = document.getElementById("screen-" + name);
    if (!next) return;

    const prev = document.querySelector(".screen.active");
    if (prev && prev !== next) {
      prev.classList.remove("active");
    }

    if (push && current && current !== name && !fromSwipe) {
      // Don't push home→cc as deep history the same way
      if (!(current === "home" && name === "cc") && !(current === "cc" && name === "home")) {
        navHistory.push(current);
      }
    }

    next.classList.add("active");
    current = name;
    showStatusBar(name !== "home" && name !== "cc" && name !== "launcher");

    // Update torch overlay if leaving
    syncTorch();
  }

  function goBack() {
    if (navHistory.length) {
      const prev = navHistory.pop();
      goTo(prev, { push: false });
      return;
    }
    if (current === "cc" || current === "launcher") {
      goTo("home", { push: false });
      return;
    }
    if (current !== "home") {
      goTo("launcher", { push: false });
    }
  }

  // Back buttons
  stack.addEventListener("click", (e) => {
    const back = e.target.closest("[data-back]");
    if (back) {
      e.preventDefault();
      const dest = back.getAttribute("data-back");
      if (dest) goTo(dest, { push: false });
      else goBack();
      return;
    }

    const open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault();
      const app = open.getAttribute("data-open");
      goTo(app);
      return;
    }

    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      e.preventDefault();
      const kind = toggle.getAttribute("data-toggle");
      toggleTile(kind, toggle);
    }
  });

  function toggleTile(kind, btn) {
    const on = !btn.classList.contains("on");
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");

    if (kind === "wifi") {
      wifiOn = on;
      document.querySelectorAll(".home-wifi, #icon-wifi").forEach((el) => {
        el.classList.toggle("off", !wifiOn);
      });
    }
    if (kind === "torch") {
      torchOn = on;
      syncTorch();
    }
  }

  function syncTorch() {
    let flash = screenEl.querySelector(".torch-flash");
    if (!flash) {
      flash = document.createElement("div");
      flash.className = "torch-flash";
      screenEl.appendChild(flash);
    }
    flash.classList.toggle("on", torchOn && current === "cc");
  }

  // Brightness
  const brightness = document.getElementById("brightness");
  if (brightness) {
    const applyBright = () => {
      const v = Number(brightness.value);
      // veil opacity inverse of brightness (20–100 → 0.35–0)
      brightnessVeil.style.opacity = String((100 - v) / 100 * 0.45);
    };
    brightness.addEventListener("input", applyBright);
    applyBright();
  }

  // --- Swipe gestures ---
  let pointerDown = false;
  let startY = 0;
  let startX = 0;
  let startT = 0;
  let draggingNova = false;
  let novaOrigin = { x: 0, y: 0 };
  let novaOffset = { x: 0, y: 0 };
  let moved = false;

  function getPoint(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerStart(e) {
    // Don't capture slider / button native handling badly — but allow swipe outside
    if (e.target.closest("input, .switch, .slider-card input")) {
      pointerDown = false;
      return;
    }

    const p = getPoint(e);
    pointerDown = true;
    moved = false;
    startX = p.x;
    startY = p.y;
    startT = Date.now();

    const onNova = e.target.closest("#nova");
    if (onNova && current === "home") {
      draggingNova = true;
      nova.classList.add("dragging");
      novaOrigin = { x: novaOffset.x, y: novaOffset.y };
      if (e.cancelable && e.type.startsWith("touch")) e.preventDefault();
    }
  }

  function onPointerMove(e) {
    if (!pointerDown) return;
    const p = getPoint(e);
    const dx = p.x - startX;
    const dy = p.y - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

    if (draggingNova) {
      novaOffset.x = novaOrigin.x + dx;
      novaOffset.y = novaOrigin.y + dy;
      // soft clamp
      const max = 40;
      novaOffset.x = Math.max(-max, Math.min(max, novaOffset.x));
      novaOffset.y = Math.max(-max, Math.min(max, novaOffset.y));
      nova.style.transform = `translate(${novaOffset.x}px, ${novaOffset.y}px)`;
      if (e.cancelable) e.preventDefault();
      return;
    }
  }

  function onPointerEnd(e) {
    if (!pointerDown) return;
    const p = getPoint(e);
    const dx = p.x - startX;
    const dy = p.y - startY;
    const dt = Date.now() - startT;
    pointerDown = false;

    if (draggingNova) {
      draggingNova = false;
      nova.classList.remove("dragging");
      // spring back
      novaOffset = { x: 0, y: 0 };
      nova.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
      nova.style.transform = "translate(0, 0)";
      setTimeout(() => {
        nova.style.transition = "";
      }, 360);

      if (!moved || (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 350)) {
        reactNova();
      }
      return;
    }

    // Vertical swipe
    const absY = Math.abs(dy);
    const absX = Math.abs(dx);
    if (absY > 50 && absY > absX * 1.2) {
      if (dy < 0) {
        // swipe up
        if (current === "home") goTo("cc", { fromSwipe: true });
        else if (current === "cc") goTo("launcher", { fromSwipe: true });
      } else {
        // swipe down
        if (current === "cc") goTo("home", { fromSwipe: true });
        else if (current === "launcher") goTo("cc", { fromSwipe: true });
      }
    }
  }

  screenEl.addEventListener("mousedown", onPointerStart);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerEnd);

  screenEl.addEventListener("touchstart", onPointerStart, { passive: false });
  screenEl.addEventListener("touchmove", onPointerMove, { passive: false });
  screenEl.addEventListener("touchend", onPointerEnd);
  screenEl.addEventListener("touchcancel", onPointerEnd);

  function reactNova() {
    nova.classList.add("react");
    // brief happy eyes squash via CSS class
    setTimeout(() => nova.classList.remove("react"), 450);
  }

  // --- Faces ---
  document.querySelectorAll(".face-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".face-option").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      faceStyle = btn.getAttribute("data-face");
      homeScreen.classList.toggle("face-minimal", faceStyle === "minimal");
      const note = document.getElementById("faces-note");
      if (note) {
        note.textContent =
          "Active: " + (faceStyle === "minimal" ? "Minimal Ring" : "Classic Nova");
      }
    });
  });

  // --- Talk mic ---
  const micBtn = document.getElementById("mic-btn");
  const talkPrompt = document.getElementById("talk-prompt");
  const talkWave = document.getElementById("talk-waveform");
  const talkTranscript = document.getElementById("talk-transcript");
  let listening = false;
  let listenTimer = null;

  const phrases = [
    "Hey Nova, what’s the time?",
    "Set a timer for five minutes.",
    "How’s the weather in Chicago?",
    "Open Control Center.",
    "Good morning, Nebula.",
  ];

  function startListen() {
    if (listening) return;
    listening = true;
    micBtn.classList.add("listening");
    talkWave.classList.add("active");
    talkPrompt.textContent = "Listening…";
    talkTranscript.textContent = "";
  }

  function stopListen() {
    if (!listening) return;
    listening = false;
    micBtn.classList.remove("listening");
    talkWave.classList.remove("active");
    talkPrompt.textContent = "Hold to speak";
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    talkTranscript.textContent = "“" + phrase + "”";
  }

  if (micBtn) {
    micBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startListen();
    });
    micBtn.addEventListener("mouseup", stopListen);
    micBtn.addEventListener("mouseleave", () => {
      if (listening) stopListen();
    });
    micBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startListen();
    }, { passive: false });
    micBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      stopListen();
    });
  }

  // Timer stub
  const timerBtn = document.getElementById("timer-start");
  const timerDisplay = document.querySelector(".timer-display");
  let timerSecs = 300;
  let timerId = null;

  function fmtTimer(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  if (timerBtn && timerDisplay) {
    timerBtn.addEventListener("click", () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
        timerBtn.textContent = "Start";
        return;
      }
      timerBtn.textContent = "Pause";
      timerId = setInterval(() => {
        if (timerSecs <= 0) {
          clearInterval(timerId);
          timerId = null;
          timerBtn.textContent = "Start";
          timerSecs = 300;
          timerDisplay.textContent = fmtTimer(timerSecs);
          return;
        }
        timerSecs -= 1;
        timerDisplay.textContent = fmtTimer(timerSecs);
      }, 1000);
    });
  }

  // Keyboard helpers for demo
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") goBack();
    if (e.key === "ArrowUp" && current === "home") goTo("cc", { fromSwipe: true });
    if (e.key === "ArrowDown" && current === "cc") goTo("home", { fromSwipe: true });
  });

  // Start on home
  goTo("home", { push: false });
})();

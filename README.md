# Nebula OS — browser simulator

High-fidelity **static** demo of the Nebula smartwatch UI (Waveshare ESP32-S3-Touch-AMOLED-2.06, **410×502**).

Built to mirror firmware chrome from `firmware/NebulaOS/ui.cpp` / `ui.h` (and the locked Control/Launcher look in the design SPEC): teal accent `#00E5C0`, true-black AMOLED, grab-pill Control sheet, 2-column launcher, Nova companion.

Deployable as the GitHub Pages root for [`wjb000.github.io/watch/`](https://wjb000.github.io/watch/) — all assets use **relative** paths. No backend, no secrets.

## Files

| File | Role |
|------|------|
| `index.html` | Landing page + watch bezel + all screens |
| `styles.css` | Firmware-matched chrome (cards, tiles, sliders, radii) |
| `app.js` | Gestures, Nova pet, clocks, app mocks |
| `.nojekyll` | GitHub Pages: serve as plain static site |

## Gestures (match firmware)

| Surface | Gesture | Result |
|---------|---------|--------|
| Watchface | Swipe **down** | Control Center |
| Watchface | Swipe **up** | App launcher |
| Watchface | Drag / tap Nova | Pet react; tap opens Talk |
| Watchface | Long-press time | Faces |
| Control | Swipe **up** | Dismiss → watchface |
| Launcher | Swipe **down** (near top) | → watchface |
| Apps | Back chevron / left-edge swipe | Previous screen |

## Firmware → sim map

| Firmware | Sim screen |
|----------|------------|
| `buildWatchface` + Nova pet | Home — Companion / Time faces |
| `buildControl` | Control — grab pill, 88px slider cards, 114×76 tiles |
| `buildLauncher` | Launcher — pad 24, 174×118 tiles |
| Faces / `g_faceStyle` | Faces — Companion & Time |
| Settings | Settings (backs to Control) |
| Talk / AI | Talk — mock listen / reply (offline) |
| Activity, Weather, Timer, Stopwatch | Matching app screens |
| Torch, Wi‑Fi, Sensors, Notes, Calc | Matching app screens |
| `makeAppScreen` back chevron + 78×64 hit | `.back-hit` |

## Local preview

```bash
cd nebula-watch-sim-v2
python3 -m http.server 8080
# open http://127.0.0.1:8080/
```

## Note on firmware source

Authored against the locked UI SPEC and prior `ui.cpp` excerpts (Control/Launcher metrics, screen IDs, gesture directions, Nova pet). Direct Mac checkout reads via `machineId` were not available in this executor; parent can re-diff against live `ui.cpp` if chrome drifts.

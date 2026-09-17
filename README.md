# Nebula OS — Watch Simulator

Interactive **static** browser simulator of Nebula OS for the Waveshare ESP32-S3-Touch-AMOLED-2.06 (logical canvas **410×502**).

**Live (intended):** https://wjb000.github.io/watch/

## What’s included

- Dark landing page with a centered AMOLED-style bezel
- Home watchface: live clock, date, battery, Wi‑Fi, and **Nova** pet (idle bob, tap / light drag)
- Swipe up → **Control Center** (grab pill, brightness / volume sliders, Wi‑Fi · BT · Torch · Settings tiles)
- Swipe up again → **Launcher** app grid
- Apps: **Settings**, **Faces** (2 watchface styles), **Talk** (mic hold mock), plus Activity / Weather / Timer stubs
- Mouse and touch: tap, vertical swipe, pet drag

No backend, no build step, no network required for the core UI.

## Files

| File        | Role                          |
|-------------|-------------------------------|
| `index.html`| Landing page + watch DOM      |
| `styles.css`| Bezel, screens, motion        |
| `app.js`    | Navigation, gestures, clock   |
| `README.md` | This file                     |

## GitHub Pages setup

Publish this folder as the **GitHub Pages root** of the `watch` repo (or the `/watch/` site path):

1. Put these files at the **repository root** (recommended), or under `/docs` if you prefer that source.
2. In the repo: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **`main`**
   - Folder: **`/` (root)** — or **`/docs`** only if you placed the files there
3. Site URL will be `https://<user>.github.io/watch/` when the repo is named `watch`.

All asset URLs are **relative** (`styles.css`, `app.js`), so the sim works under `/watch/` without absolute `/` paths.

## Local preview

Serve the folder with any static server, for example:

```bash
cd nebula-watch-sim
python3 -m http.server 8080
```

Open `http://localhost:8080/`. Opening `index.html` via `file://` also works in most browsers.

## Controls

| Input              | Action                                      |
|--------------------|---------------------------------------------|
| Swipe up (home)    | Control Center                              |
| Swipe up (CC)      | Launcher                                    |
| Swipe down         | Back toward home                            |
| Tap / drag Nova    | Pet reaction / move                         |
| Hold Talk mic      | Listening mock + sample transcript          |
| Esc / back chevron | Navigate back                               |
| ↑ / ↓ keys         | Open / close Control Center from home / CC  |

## License

Demo UI for Nebula OS — use freely for project documentation and demos.

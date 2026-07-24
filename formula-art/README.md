# Formula Art — Cinematic Web Showcase

A fullscreen Three.js presentation designed for **YouTube screen recording**.

## What changed vs the old version

Each scene now has three clear beats (much better for viewers):

1. **Formula appear** — title + equation on a large centered card
2. **Surface build** — geometry draws live with a glowing brush
3. **Camera showcase** — wide → low → overhead → close → beauty orbit

Background audio uses **Mixkit royalty-free** tracks (YouTube-safe), not generative synths.

## How to run

Open a terminal inside the `formula-art` folder, then start a local server:

**Windows (PowerShell / CMD):**
```powershell
cd formula-art
py -m http.server 8080
```
If `py` is missing, try:
```powershell
python -m http.server 8080
```

**macOS / Linux:**
```bash
cd formula-art
python3 -m http.server 8080
```

Then open `http://localhost:8080`, click **Start Fullscreen Show**, and start your screen recorder.

**No Python installed?** You can also double-click `index.html` to open it in the browser. A local server is still preferred so music loads reliably.

## Recording tips

- Use fullscreen (the start button requests it)
- Record desktop audio so Mixkit music is captured
- Total runtime is roughly **4 minutes** across 5 scenes
- Hit **Replay Show** for another take

## Music credits

See [`MUSIC_CREDITS.md`](MUSIC_CREDITS.md). Tracks are Mixkit Free License (OK for YouTube).

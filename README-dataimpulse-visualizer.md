# DatImpulse residential proxy visualizer

`dataimpulse-proxy-visualizer.html` is a single, self-contained 1920x1080 animated
SVG on a 45 second loop, built for a dark-mode IDE / neon terminal look. It uses
CSS keyframes only — there is no JavaScript anywhere in the file, and nothing
needs to be triggered to make the sequence run.

## Running it

Open the file in a browser. It letterboxes itself to the window at 16:9, so it
is ready to screen-record or to render (see below).

Put `dataimpulseclip.mp4` in the same folder as the HTML. The clip is played
inside the browser mock in state 3. If the file is missing, a vector dashboard
drawn underneath the video shows through instead, so the animation never breaks.

## Timeline

| Time | State | Visual | Caption |
| --- | --- | --- | --- |
| 0:00 – 0:10 | Blocked | Terminal typing out `ERROR 429: TOO MANY REQUESTS` and `IP BLOCKED`, agent fleet going red, failure meter filling, red alarm flashes | "When running autonomous AI agents that need to pull live data, they frequently hit IP rate limits or get blocked." |
| 0:10 – 0:25 | Network | Rotating wireframe globe, exit nodes, packets travelling the routing arcs, counters landing on **90M+ Premium IPs** and **195 Countries** | "Introducing DatImpulse. They give you access to a network of 90M+ Premium Residential IPs covering 195 countries." |
| 0:25 – 0:35 | Dashboard | `dataimpulseclip.mp4` in a browser frame with punch-in cuts, plus **$1/1GB (Pay-as-you-go)**, **NO EXPIRATION**, **Minimum Deposit: $5** and a filling progress bar | "They use a strict pay-as-you-go pricing model at just $1 for 1GB with no expiration dates, and a $5 minimum deposit." |
| 0:35 – 0:45 | Call to action | Deep blue wash, pulsing prompt typing out `> Route Traffic via DatImpulse [Link in Pinned Comment]` | "If your agents are getting blocked, use the link in the pinned comment to route your traffic through DatImpulse." |

A master timeline with a playhead and a running timecode sits under the header,
so you can confirm sync at a glance while scrubbing a recording.

## How the timing works

Everything animates against one clock: `--T: 45s`, `linear`, `infinite`.

- **Scenes** use `stateA`–`stateD`, which crossfade at 10s, 25s and 35s.
- **Captions** use `capA`–`capD` on the same boundaries with a small rise.
- **Individual reveals** use the cue system. An element carries
  `class="cue cue-left" style="--at:5.1s"`, where `--at` is the second on the
  timeline when it should appear. The shared keyframes plus a negative
  `animation-delay` do the scheduling. A cue stays lit for 20s and then drops:
  that is always long enough to reach the end of its own state and always short
  enough to have cleared before that state comes round again, which is what
  keeps the loop seamless. The scene fade hides the tail of the window.

To retime the piece, change `--T` and the keyframe percentages together
(percent = seconds ÷ duration × 100), or move a single element by editing its
`--at`.

## Editing the clip

The "edit" of `dataimpulseclip.mp4` is done in CSS, on the same clock:

- Three hard punch-in cuts at 0:27.5, 0:30.5 and 0:33 (`clipEdit`), each with a
  slow drift in between, so the clip pushes in on the proxy list and then on the
  host:port row.
- A white flash frame on each cut (`cutFlash`), a scanline sweep, film grain and
  a vignette over the screen area.
- A scrub bar under the frame that fills across the state with tick marks at the
  cut points.

Adjust the `translate()` values inside `@keyframes clipEdit` to aim the punch-ins
at the part of your recording you want to feature.

Because there is no JavaScript, the clip plays from page load and loops on its
own. Its position at 0:25 is therefore `(25s mod clip duration)`. If you want a
specific moment on screen when state 3 opens, either trim the clip so its length
divides into 45 (9s, 15s or 22.5s all stay in phase every loop) or trim it to
start where you want and make it 10s long.

## Rendering to MP4

`tools/render-mp4.mjs` drives the page frame by frame with a paused animation
timeline, so the export is exact regardless of machine speed, and it seeks the
embedded clip to the matching moment on every frame.

```bash
npm i puppeteer-core
node tools/render-mp4.mjs \
  --html ./dataimpulse-proxy-visualizer.html \
  --out dataimpulse-45s.mp4 \
  --fps 30
```

Needs `ffmpeg` on `PATH` and a Chrome/Chromium binary (`--chrome /path/to/chrome`
or `CHROME_PATH`). The result is silent 1920x1080 H.264, ready for a voiceover.

## Note on the name

The captions and the closing prompt use the exact wording from the script, which
spells the service **DatImpulse**. The header wordmark and the dashboard URL use
**DataImpulse** / `app.dataimpulse.com`, matching the real product. If you want a
single spelling throughout, search the file for `DatImpulse` and `DATAIMPULSE`.

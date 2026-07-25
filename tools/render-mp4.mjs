#!/usr/bin/env node
/**
 * Deterministic MP4 export for dataimpulse-proxy-visualizer.html.
 *
 * The visualizer itself needs no JavaScript — this script only exists to turn
 * the CSS timeline into a file. It drives the page frame by frame (pausing the
 * Web Animations timeline and stepping currentTime) so the output is exact even
 * on a slow machine, and it seeks dataimpulseclip.mp4 to the matching moment.
 *
 *   npm i puppeteer-core
 *   node tools/render-mp4.mjs --html ./dataimpulse-proxy-visualizer.html --out dataimpulse-45s.mp4
 *
 * Requires ffmpeg on PATH and a Chrome/Chromium binary (--chrome to override).
 */
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const htmlPath = path.resolve(arg("html", "dataimpulse-proxy-visualizer.html"));
const outPath = path.resolve(arg("out", "dataimpulse-45s.mp4"));
const fps = Number(arg("fps", 30));
const width = Number(arg("width", 1920));
const height = Number(arg("height", 1080));
const duration = Number(arg("duration", 45));
const chromePath = arg(
  "chrome",
  process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
);

const totalFrames = Math.round(duration * fps);

const ffmpeg = spawn("ffmpeg", [
  "-y",
  "-f", "image2pipe",
  "-framerate", String(fps),
  "-i", "-",
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  outPath,
], { stdio: ["pipe", "ignore", "ignore"] });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: [
    "--no-sandbox",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
  ],
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });

await page.evaluate(() => {
  document.getAnimations().forEach((a) => a.pause());
  document.querySelectorAll("video").forEach((v) => v.pause());
});

for (let frame = 0; frame < totalFrames; frame++) {
  const seconds = frame / fps;
  await page.evaluate(async (t) => {
    document.getAnimations().forEach((a) => {
      a.currentTime = t * 1000;
    });
    const seeks = [...document.querySelectorAll("video")]
      .filter((v) => Number.isFinite(v.duration) && v.duration > 0)
      .map((v) => new Promise((resolve) => {
        v.currentTime = t % v.duration;
        v.addEventListener("seeked", resolve, { once: true });
        setTimeout(resolve, 250);
      }));
    await Promise.all(seeks);
  }, seconds);

  const shot = await page.screenshot({ type: "png" });
  if (!ffmpeg.stdin.write(shot)) {
    await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
  }
  if (frame % fps === 0) {
    process.stdout.write(`\r${seconds.toFixed(0)}s / ${duration}s`);
  }
}

ffmpeg.stdin.end();
await browser.close();
await new Promise((resolve) => ffmpeg.on("close", resolve));
process.stdout.write(`\rwrote ${outPath}\n`);

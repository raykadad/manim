import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? '/tmp/shots'
const URL = process.env.SITE ?? 'http://127.0.0.1:5173/'
const W = Number(process.env.W ?? 1440)
const H = Number(process.env.H ?? 900)
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: W, height: H } })

const errors = new Set()
page.on('console', (m) => {
  if (m.type() === 'error') errors.add(`[error] ${m.text().slice(0, 240)}`)
})
page.on('pageerror', (e) => errors.add(`[pageerror] ${e.message.slice(0, 300)}`))

const shot = async (name, wait = 2500) => {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 240000 })
  console.log('shot', name)
}

await page.goto(URL, { waitUntil: 'load', timeout: 120000 })
await shot('01-hero', 15000)

await page.evaluate(() => document.querySelector('#house')?.scrollIntoView())
await shot('02-about', 3000)

await page.evaluate((dy) => window.scrollBy(0, dy), H * 0.9)
await shot('03-materials', 3000)

await page.evaluate(() => document.querySelector('#solstice')?.scrollIntoView())
await shot('04-solstice', 22000)

await page.evaluate(() => document.querySelector('#meridian')?.scrollIntoView())
await shot('05-meridian', 30000)

await page.evaluate(() => document.querySelector('#visit')?.scrollIntoView())
await shot('06-visit', 2500)

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await shot('07-footer', 2000)

console.log('--- console ---')
console.log([...errors].slice(0, 30).join('\n') || 'clean')
await browser.close()

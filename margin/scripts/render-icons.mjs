// Renders the PWA icons from public/favicon.svg. Run with: node scripts/render-icons.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
const page = await browser.newPage();

async function render(file, size, { maskable = false } = {}) {
  // Maskable icons need a full-bleed background with the artwork inside the central safe zone.
  const art = maskable
    ? `<div style="width:${size}px;height:${size}px;background:#1f1e1c;display:grid;place-items:center">
         <div style="width:${size * 0.7}px;height:${size * 0.7}px">${svg.replace('rx="14"', 'rx="0"')}</div></div>`
    : `<div style="width:${size}px;height:${size}px">${svg}</div>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0;background:transparent}svg{width:100%;height:100%;display:block}</style>${art}`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: !maskable });
}

await render('icon-192.png', 192);
await render('icon-512.png', 512);
await render('icon-maskable-512.png', 512, { maskable: true });
await render('apple-touch-icon.png', 180, { maskable: true });
await browser.close();

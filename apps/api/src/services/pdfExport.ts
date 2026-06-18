import puppeteer from 'puppeteer';
import type { QuoteShareSnapshot } from '../types.js';
import { renderShareHtml } from './exportHtml.js';

let browserPromise: ReturnType<typeof puppeteer.launch> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      ...(executablePath ? { executablePath } : {}),
    });
  }
  return browserPromise;
}

async function renderPage(snapshot: QuoteShareSnapshot) {
  const html = renderShareHtml(snapshot);
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 800, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewport({ width: 430, height, deviceScaleFactor: 2 });
  return page;
}

export async function generatePdfFromSnapshot(snapshot: QuoteShareSnapshot): Promise<Buffer> {
  const page = await renderPage(snapshot);
  try {
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function generateImageFromSnapshot(snapshot: QuoteShareSnapshot): Promise<Buffer> {
  const page = await renderPage(snapshot);
  try {
    const png = await page.screenshot({ type: 'png', fullPage: true });
    return Buffer.from(png);
  } finally {
    await page.close();
  }
}

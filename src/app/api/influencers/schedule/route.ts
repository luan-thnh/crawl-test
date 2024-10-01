import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;

puppeteer.use(StealthPlugin());
export const GET = async () => {
  const browser = await puppeteer.launch({
    args: isLocal ? puppeteer.defaultArgs() : chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH ||
      (await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar`
      )),
    headless: chromium.headless,
    ignoreDefaultArgs: ['--disable-extensions'],
  });
  const page = await browser.newPage();

  const client = await page.createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await page.goto(`https://coinlaunch.space/influencers/`);

  const totalItemsSelector = '.summary.mr-auto';
  await page.waitForSelector(totalItemsSelector);

  const totalItems = await page.evaluate((totalItemsSelector: any) => {
    const summaryText = document.querySelector(totalItemsSelector)?.textContent?.trim();
    const total = summaryText?.match(/from (\d+)/)?.[1] || '0';
    return parseInt(total, 10);
  }, totalItemsSelector);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  await browser.close();

  return NextResponse.json({ message: 'Data synced successfully', totalPages });
};

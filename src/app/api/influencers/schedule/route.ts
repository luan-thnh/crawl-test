import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const GET = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36'
  );

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

  const inserts = [];

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.setJavaScriptEnabled(true);
    await page.goto(`https://coinlaunch.space/influencers/?page=${currentPage}&per-page=${itemsPerPage}`);
    const resultsSelector = '.general-tr';
    await page.waitForSelector(resultsSelector, { timeout: 30000 });

    const data = await page.evaluate((resultsSelector: any) => {
      const rows = document.querySelectorAll(resultsSelector);

      return Array.from(rows).map((row) => {
        const nameElement = row.querySelector('a.clean-button.mulish');
        const name = nameElement?.textContent?.trim() || '';
        const avatar = nameElement?.querySelector('img')?.getAttribute('src') || '';
        const score = row.querySelector('.score-blk')?.textContent?.trim() || 'N/A';
        const topChannel = row.querySelector('a.label-type')?.textContent?.trim() || '';
        const language =
          row
            .querySelector('.text-uppercase')
            ?.textContent?.trim()
            .split(',')
            .map((lang: string) => lang.trim()) || [];
        const engagement = row.querySelector('.difficulty-blk')?.textContent?.trim() || 'N/A';
        const totalFollowers = row.querySelector('.blk-with-arrow.no-desktop')?.textContent?.trim() || 'N/A';
        const detailPageUrl = nameElement?.getAttribute('href') || '';

        return {
          name,
          avatar: `https://coinlaunch.space${avatar}`,
          score,
          topChannel,
          language,
          engagement,
          totalFollowers,
          detailPageUrl,
          socials: [{ name: '', url: '' }],
        };
      });
    }, resultsSelector);

    inserts.push(data);
  }

  await browser.close();

  return NextResponse.json({ message: 'Data synced successfully', inserts });
};

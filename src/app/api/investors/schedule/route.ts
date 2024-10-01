import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;

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

  const crawlPage = async (url: string) => {
    await page.goto(url);

    return page.evaluate(() => {
      const rows = document.querySelectorAll('.hp-table-row.hpt-data');
      return Array.from(rows).map((row) => {
        const slug = row.getAttribute('data-fund_slug') || '';
        const fundName = {
          title: row.querySelector('.hpt-col3')?.childNodes[0]?.textContent?.trim() || '',
          image: row.querySelector('.hpt-col2 img')?.getAttribute('src') || '',
        };
        const website = Array.from(row.querySelectorAll('.hpt-col4 a')).map((a) => a.getAttribute('href') || '');
        const projectNumber = row.querySelector('.hpt-col5 .pcount')?.textContent?.trim() || '';

        return {
          uid: `${slug}-${fundName.title}`,
          slug,
          fundName,
          website,
          projectNumber: Number(projectNumber),
        };
      });
    });
  };

  const newData = await crawlPage(`https://crypto-fundraising.info/investors/page/1/?sortby=pname&sort=desc`);

  await browser.close();
  return NextResponse.json({ message: 'Data synced successfully', newData });
};

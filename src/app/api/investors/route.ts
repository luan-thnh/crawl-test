import { options, puppeteer } from '@/config/pup';
import { NextResponse } from 'next/server';

export const GET = async () => {
  const browser = await puppeteer.launch(options);
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

import dayjs from 'dayjs';
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
  await page.goto('https://bdc.consulting/calendar');

  await page.waitForSelector('.styles-module__tabs___3Zz_n');

  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.styles-module__itemWrapper___1m1p7'));

    const monthTab = tabs.find((tab) => {
      const text = tab?.textContent;
      return text?.includes('Month');
    });

    if (monthTab && monthTab instanceof HTMLElement) {
      monthTab.click();
    }
  });

  await page.waitForSelector('.styles-module__slider___3wrsH');

  const eventData = await page.evaluate(() => {
    const events: unknown[] = [];
    const items = document.querySelectorAll('.styles-module__slider___3wrsH .styles-module__container___3RRYo');

    items.forEach((item) => {
      const name = item.querySelector('.styles-module__title___1CZAZ')?.textContent ?? null;
      const year = document.querySelector('.styles-module__description___2uvKS')?.textContent ?? null;

      const dateText = item.querySelector('.styles-module__subTitle___1qCeB')?.textContent ?? '';
      const dateParts = dateText.split(' - ');
      let startDate = null;
      let endDate = null;

      if (dateParts.length === 2) {
        startDate = `${dateParts[0]} ${year}`;
        endDate = `${dateParts[1]} ${year}`;
      } else if (dateParts.length === 1) {
        startDate = `${dateParts[0]} ${year}`;
      }

      const location =
        item.querySelector('.styles-module__box___1pyL0 + .styles-module__box___1pyL0 p')?.textContent ?? null;
      const source = item.querySelector('a')?.href ?? null;

      events.push({ name, startDate, endDate, location, source });
    });

    return events;
  });

  await browser.close();

  const newEvents: unknown[] = eventData.map((e: any) => ({
    ...e,
    startDate: e.startDate ? dayjs(e.startDate).format('YYYY-MM-DD HH:mm:ss') : null,
    endDate: e.endDate ? dayjs(e.endDate).format('YYYY-MM-DD HH:mm:ss') : null,
  }));

  const inserts = [];

  for (const newEvent of newEvents) {
    inserts.push(newEvent);
  }

  return NextResponse.json({ inserts });
};

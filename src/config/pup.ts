import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;

const options = {
  args: isLocal ? puppeteer.defaultArgs() : chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath:
    process.env.CHROME_EXECUTABLE_PATH ||
    (await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar`
    )),
  headless: chromium.headless,
  ignoreDefaultArgs: ['--disable-extensions'],
};

export { options, puppeteer };

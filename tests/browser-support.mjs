import fs from 'node:fs';

export const browserName = process.env.MEWA_BROWSER || 'chrome';
if (!['chrome', 'firefox'].includes(browserName))
  throw new Error('MEWA_BROWSER must be chrome or firefox.');

export function executablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    ...(browserName === 'firefox'
      ? [
          process.env.FIREFOX_PATH,
          '/usr/bin/firefox',
          '/Applications/Firefox.app/Contents/MacOS/firefox'
        ]
      : [
          process.env.CHROME_PATH,
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
        ])
  ].filter(Boolean);
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable)
    throw new Error(`${browserName} is required. Set PUPPETEER_EXECUTABLE_PATH to its executable.`);
  return executable;
}

export function launchOptions() {
  return {
    browser: browserName,
    executablePath: executablePath(),
    headless: true,
    args: browserName === 'chrome' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
  };
}

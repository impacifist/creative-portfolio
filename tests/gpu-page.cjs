const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4186';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    async function noUntranslated() {
      const leftovers = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.parentElement.closest('script, style, noscript, [translate="no"], [data-language-picker]') && /[가-힣]/.test(node.data)) texts.push(node.data.trim());
        }
        return texts;
      });
      assert.deepEqual(leftovers, []);
    }
    for (const language of ['en', 'ko', 'ja']) {
      await page.goto(`${base}/?lang=${language}#images`);
      await page.waitForFunction(() => !!window.portfolioI18n);
      await page.evaluate(() => document.fonts.ready);
      const projectLink = page.locator('#portfolio-project-gpu');
      const projectBounds = await projectLink.boundingBox();
      const controlBounds = await page.locator('#portfolio-tab-video-control-studio').boundingBox();
      assert.ok(projectBounds.x < controlBounds.x, 'project link sits left of Video Control net');
      await projectLink.click();
      await page.waitForURL(`**/gpu-engineering.html?lang=${language}`);
      await page.waitForFunction(() => !!window.portfolioI18n);
      assert.equal(await page.locator('#gpu-unlock').isVisible(), true);
      assert.equal(await page.locator('[aria-current="page"]').count(), 1);
      assert.equal(await page.locator('[data-portfolio-panel]').count(), 0);
      assert.equal(await page.locator('script[src="app.js"]').count(), 0);
      assert.equal(await page.locator('.gpu-scope-map > li').count(), 6);
      await page.locator('.gpu-values summary').click();
      assert.match(await page.locator('.gpu-values tbody').textContent(), /128\.699728/);
      for (const link of await page.locator('.gpu-section-nav a').all()) {
        await link.click();
        assert.equal(new URL(page.url()).pathname.endsWith('/gpu-engineering.html'), true);
      }
      if (language !== 'ko') await noUntranslated();
      await page.locator('[data-page-section="video-control-studio"]').click();
      await page.locator('#video-control-studio').waitFor({ state: 'visible' });
      assert.equal(await page.locator('html').getAttribute('lang'), language);
    }
    await page.goto(`${base}/?lang=en#images`);
    await page.locator('.gpu-discovery a').click();
    await page.waitForURL('**/gpu-engineering.html?lang=en');
    await page.goto(`${base}/?lang=ja#gpu-unlock`);
    await page.waitForURL('**/gpu-engineering.html?lang=ja');
    await page.goto(`${base}/?lang=en#gpu-engineering`);
    await page.waitForURL('**/gpu-engineering.html?lang=en#gpu-engineering');
    for (const width of [320, 390, 768, 1100, 1200, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const language of ['ko', 'en', 'ja']) {
        await page.evaluate(language => window.portfolioI18n.setLanguage(language), language);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `project overflow ${width}/${language}`);
        const current = await page.locator('[aria-current="page"]').boundingBox();
        const control = await page.locator('[data-page-section="video-control-studio"]').boundingBox();
        assert.ok(current.x < control.x, `project link position ${width}/${language}`);
        if (language !== 'ko') await noUntranslated();
      }
    }
    await page.locator('[data-page-section="images"]').click();
    await page.locator('#images').waitFor({ state: 'visible' });
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    const plainContext = await browser.newContext({ javaScriptEnabled: false });
    const plain = await plainContext.newPage();
    await plain.goto(`${base}/gpu-engineering.html`);
    assert.equal(await plain.locator('#gpu-page-title').isVisible(), true);
    assert.equal(await plain.locator('.gpu-scope-map > li').count(), 6);
    await plainContext.close();
    assert.deepEqual(errors, []);
    console.log('PASS: independent project URL, navigation position, six scope areas, three languages, exact metrics, chapters, return links, legacy URLs, six viewport sizes and no-JS reading.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

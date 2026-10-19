const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4186';

async function selectLanguage(page, language) {
  await page.locator('#portfolio-language').click();
  await page.locator(`#language-menu [data-language="${language}"]`).click();
}

// Real browser checks: state preservation, late-rendered data, accessibility,
// storage restrictions, deep links and narrow layouts, rather than catalog internals.
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const missing = new Set();
  try {
    const context = await browser.newContext({ locale: 'ko-KR' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    async function coverage(frame = page) {
      await frame.waitForTimeout(40);
      const leftovers = await frame.evaluate(() => {
        const items = [];
        const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.parentElement.closest('script, style, noscript, [translate="no"], [data-language-picker]')) continue;
          if (/[가-힣]/.test(node.data)) items.push(node.data.trim());
        }
        document.querySelectorAll('[aria-label], [alt], [title], meta[name="description"]').forEach(node => {
          if (node.closest('[translate="no"], [data-language-picker]')) return;
          for (const key of ['aria-label', 'alt', 'title', 'content']) {
            const value = node.getAttribute(key);
            if (value && /[가-힣]/.test(value)) items.push(`${key}: ${value}`);
          }
        });
        return [...new Set(items)];
      });
      leftovers.forEach(item => missing.add(item));
    }
    // First visits use English even when the browser requests Korean.
    await page.goto(`${base}/#video`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('#portfolio-language svg').count(), 1);
    assert.equal(await page.locator('#portfolio-language').textContent(), '');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    await page.locator('#portfolio-language').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#portfolio-language').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('[data-language="en"]').getAttribute('aria-checked'), 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    assert.equal(await page.locator('#portfolio-language').evaluate(button => button === document.activeElement), true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    assert.equal(await page.locator('[data-language="ja"]').evaluate(button => button === document.activeElement), true);
    await page.keyboard.press('Home');
    assert.equal(await page.locator('[data-language="en"]').evaluate(button => button === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    await page.locator('#portfolio-language').click();
    await page.locator('.portfolio-intro').click();
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    await page.locator('#portfolio-language').click();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#language-menu').isVisible(), false);
    assert.equal(await page.locator('.header-actions .text-link').evaluate(link => link === document.activeElement), true);
    await page.goto(`${base}/?lang=ko#video`);
    await page.waitForSelector('#case-shot-list button');
    const intro = await page.locator('.portfolio-intro').textContent();
    for (const language of ['en', 'ja']) {
      await selectLanguage(page, language);
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      assert.ok(page.url().endsWith(`?lang=${language}#video`));
      assert.equal(await page.evaluate(() => localStorage.getItem('portfolio-language')), language);
      await coverage();
      await page.locator('[data-video-case="video-current-case"]').click();
      for (const button of await page.locator('#case-shot-list button').all()) { await button.click(); await coverage(); }
      for (const button of await page.locator('#case-clip-list button').all()) { await button.click(); await coverage(); }
      await page.locator('[data-video-case="video-school-case"]').click();
      const stills = await page.locator('.film-shot').all();
      for (const still of stills) {
        await still.click();
        assert.equal(await page.locator('#scene-dialog').isVisible(), true);
        await page.evaluate(() => window.portfolioI18n.setLanguage('ko'));
        assert.match(await page.locator('#scene-dialog-image').getAttribute('alt'), /[가-힣]/);
        await page.evaluate(lang => window.portfolioI18n.setLanguage(lang), language);
        await page.keyboard.press('ArrowRight');
        await coverage();
        await page.keyboard.press('Escape');
      }
      await page.locator('[data-portfolio="images"]').click();
      for (const character of ['kotone', 'velina']) {
        await page.locator(`#tab-${character}`).click();
        await coverage();
        await page.locator('#generated-button').click();
        await coverage();
        await page.keyboard.press('Escape');
      }
      await page.locator('[data-portfolio="technology"]').click();
      for (const button of await page.locator('[data-technology]').all()) { await button.click(); await coverage(); }
      await page.locator('[data-portfolio="video-control-studio"]').click();
      for (const key of ['pose', 'depth', 'canny', 'all']) {
        await page.locator(`[data-control-view="${key}"]`).click(); await coverage();
      }
      await page.locator('[data-portfolio="workflow"]').click();
      const frame = await page.locator('#workflow-viewer').contentFrame();
      await frame.locator('[data-node]').first().waitFor();
      await page.waitForFunction(lang => document.querySelector('#workflow-viewer').contentDocument.documentElement.lang === lang, language);
      await page.locator('#portfolio-language').click();
      await frame.locator('#canvas').click();
      await page.waitForFunction(() => document.querySelector('#language-menu').hidden);
      for (const node of await frame.locator('[data-node]').all()) {
        await node.focus();
        await coverage(page.frames().find(item => item.url().includes('core-viewer.html')));
      }
      assert.match(await page.locator('.workflow-map-link').getAttribute('href'), new RegExp(`lang=${language}`));
      // State must survive a change of language while a comparison dialog is open.
      await page.locator('[data-portfolio="images"]').click();
      await page.locator('#generated-button').click();
      const src = await page.locator('#lightbox-image').getAttribute('src');
      await page.evaluate(() => window.portfolioI18n.setLanguage('ko'));
      assert.equal(await page.locator('#lightbox').isVisible(), true);
      assert.equal(await page.locator('#lightbox-image').getAttribute('src'), src);
      assert.equal(await page.locator('.portfolio-intro').textContent(), intro);
      await page.evaluate(lang => window.portfolioI18n.setLanguage(lang), language);
      await coverage();
      await page.keyboard.press('Escape');
      await page.locator('[data-portfolio="video"]').click();
    }
    if (missing.size) console.log(JSON.stringify({ untranslated: [...missing] }, null, 2));
    for (const width of [320, 390, 768, 1100, 1200, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const language of ['ko', 'en', 'ja']) {
        await selectLanguage(page, language);
        await page.locator('#portfolio-language').click();
        const menuBounds = await page.locator('#language-menu').boundingBox();
        assert.ok(menuBounds.x >= 0 && menuBounds.x + menuBounds.width <= width, `menu bounds ${width}/${language}`);
        await page.keyboard.press('Escape');
        for (const panel of ['video', 'images', 'technology', 'video-control-studio', 'workflow']) {
          await page.locator(`[data-portfolio="${panel}"]`).click();
          assert.equal(await page.locator('[data-portfolio-panel]:visible').count(), 1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}/${language}/${panel}`);
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/technical-notes.html?lang=en#vlm-design`);
    await coverage();
    await selectLanguage(page, 'ja');
    await page.evaluate(() => { location.hash = '#dataset-implementation'; });
    await coverage();
    assert.match(await page.locator('[data-notes-return]').first().getAttribute('href'), /lang=ja#dataset-tools/);
    await page.locator('[data-notes-return]').first().click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    assert.equal(await page.locator('#dataset-tools').isVisible(), true);
    // Explicit URL wins over saved language; the saved selection works without a query.
    await page.goto(`${base}/?lang=en#images`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('[data-portfolio="video"]').click();
    await selectLanguage(page, 'ja');
    await page.goBack();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('#images').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#images').isVisible(), true);
    await page.goto(`${base}/#video`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    const japaneseContext = await browser.newContext({ locale: 'ja-JP' });
    const japanesePage = await japaneseContext.newPage();
    await japanesePage.goto(`${base}/`);
    assert.equal(await japanesePage.locator('html').getAttribute('lang'), 'en');
    await japaneseContext.close();
    const privateContext = await browser.newContext({ locale: 'ko-KR' });
    await privateContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
    const privatePage = await privateContext.newPage();
    privatePage.on('pageerror', error => errors.push(error.message));
    await privatePage.goto(`${base}/?lang=unsupported#video`);
    assert.equal(await privatePage.locator('html').getAttribute('lang'), 'en');
    await selectLanguage(privatePage, 'ja');
    assert.equal(await privatePage.locator('html').getAttribute('lang'), 'ja');
    await privateContext.close();
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const plain = await noScript.newPage();
    await plain.goto(`${base}/`);
    assert.equal(await plain.locator('#video').isVisible(), true);
    assert.equal(await plain.locator('html').getAttribute('lang'), 'ko');
    await noScript.close();
    console.log(JSON.stringify({ errors, untranslated: [...missing] }, null, 2));
    assert.deepEqual(errors, [], 'browser/resource errors');
    assert.deepEqual([...missing], [], 'untranslated Korean display copy');
    console.log('PASS: English default, globe menu and keyboard controls, three languages, dynamic content, dialogs, graph, links, preferences, storage denial, no-JS fallback and 6 viewport sizes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

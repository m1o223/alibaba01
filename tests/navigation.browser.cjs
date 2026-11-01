const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const engine = process.env.TEST_BROWSER || 'chromium';

async function settle(page) {
  await page.waitForTimeout(400);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
}
async function link(page, href) {
  await page.locator(`a[href="${href}"]`).first().evaluate(el => el.click());
  await page.waitForURL(url => url.pathname + url.hash === href);
  await settle(page);
}
async function stable(page) {
  assert(await page.evaluate(() => window.testHeader === document.querySelector('.app-header')), 'Header DOM stays mounted');
  assert.equal(await page.locator('.app-header').evaluate(el => el.getBoundingClientRect().top), 0);
  assert.equal(await page.locator('.app-header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 24, 15)');
  assert.equal(await page.locator('.route-loading').count(), 0, 'No loading boundary during navigation');
}

(async () => {
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const errors = [], writes = [];
  async function createPage(width = 390) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    if (process.env.TEST_TRANSITION_FALLBACK === '1') await page.addInitScript(() => { document.startViewTransition = undefined; });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    await page.route('https://www.google.com/maps**', route => route.fulfill({ contentType: 'text/html', body: '' }));
    return page;
  }
  try {
    for (const width of (process.env.TEST_WIDTHS || '307,375,390,430,768,1440').split(',').map(Number)) {
      const page = await createPage(width);
      await page.goto(base);
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).waitFor();
      await page.evaluate(() => { window.testHeader = document.querySelector('.app-header'); });
      await page.evaluate(() => {
        window.transitionSamples = [];
        window.emptyFrames = 0;
        const deadline = performance.now() + 2000;
        const sample = () => {
          if (!document.querySelector('main')?.firstElementChild || window.testHeader !== document.querySelector('.app-header')) window.emptyFrames++;
          for (const animation of document.getAnimations()) {
            if (animation.animationName?.startsWith('page-')) window.transitionSamples.push({ name: animation.animationName, duration: animation.effect.getTiming().duration });
          }
          if (performance.now() < deadline) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      let documents = 0;
      page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).click();
      await page.locator('.menu-category-card').first().waitFor();
      await settle(page);
      await stable(page);
      assert.equal(await page.evaluate(() => window.emptyFrames), 0, 'No empty app or replaced header between frames');
      if (await page.evaluate(() => Boolean(document.startViewTransition))) {
        const samples = await page.evaluate(() => window.transitionSamples);
        assert(samples.some(a => a.name === 'page-leave' && a.duration === 125), 'Outgoing content fades/slides for 125ms');
        assert(samples.some(a => a.name === 'page-arrive' && a.duration === 250), 'Incoming content fades/slides for 250ms');
      }
      assert.equal(await page.locator('.menu-category-card').count(), 14);
      await page.getByRole('searchbox', { name: 'Sök efter mat', exact: true }).fill('shawarma');
      const matches = await page.locator('.demo-product-card').count();
      assert(matches > 5);
      await page.getByRole('link', { name: 'Visa Kycklingshawarmatallrik', exact: true }).click();
      await page.getByRole('radio', { name: /^Ris/ }).check();
      await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
      await page.getByRole('checkbox', { name: /^Extra vitlökssås/ }).check();
      await page.locator('.demo-ingredient-exclusions input[value="pickles"]').check();
      await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
      await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
      await page.waitForTimeout(1100);
      assert.equal(await page.locator('.cart-count').innerText(), '2');
      await page.getByRole('button', { name: 'Tillbaka till menyn', exact: true }).click();
      await page.getByRole('searchbox').waitFor();
      assert.equal(await page.getByRole('searchbox').inputValue(), 'shawarma');
      assert.equal(await page.locator('.demo-product-card').count(), matches);
      await page.goForward();
      await page.getByRole('radio', { name: /^Ris/ }).waitFor();
      assert(await page.getByRole('radio', { name: /^Ris/ }).isChecked());
      assert(await page.locator('.demo-ingredient-exclusions input[value="pickles"]').isChecked());
      assert.equal((await page.locator('.demo-purchase .demo-total strong').innerText()).replace(/\D/g, ''), '350');
      await stable(page);
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
      await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
      await page.getByRole('radio', { name: 'Hämta själv', exact: true }).check();
      await page.getByRole('radio', { name: 'Swish', exact: true }).check();
      const bag = await page.evaluate(() => sessionStorage.getItem('alibaba.preview.demo-cart.v2'));
      await link(page, '/');
      await page.goBack();
      await page.locator('.demo-checkout').waitFor();
      assert(await page.getByRole('radio', { name: 'Hämta själv', exact: true }).isChecked());
      assert(await page.getByRole('radio', { name: 'Swish', exact: true }).isChecked());
      if (width === 390) {
        await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
        await page.getByLabel('Gatuadress', { exact: true }).fill('Testgatan 12');
        await page.getByLabel('Postnummer', { exact: true }).fill('60217');
        await page.getByLabel('Ort', { exact: true }).fill('Norrköping');
        await page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).click();
        await link(page, '/');
        await page.goBack();
        await page.getByLabel('Gatuadress', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Gatuadress', { exact: true }).inputValue(), 'Testgatan 12');
        await page.getByRole('button', { name: 'Bekräfta adress och fortsätt', exact: true }).click();
        await link(page, '/');
        await page.goBack();
        await page.locator('.delivery-address-card').waitFor();
        assert.match(await page.locator('.delivery-address-card').innerText(), /Testgatan 12/);
        assert(await page.getByRole('radio', { name: 'Swish', exact: true }).isChecked());
        assert(await page.getByRole('button', { name: 'Simulera betalning', exact: true }).isDisabled());
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('Testgatan')), false, 'Unremembered address stays private in memory');
      }
      await link(page, '/');
      await link(page, '/contact');
      await page.locator('input[name="name"]').fill('Navigationstest');
      await page.locator('textarea[name="message"]').fill('Utkast');
      await link(page, '/about');
      await page.goBack();
      await page.locator('input[name="name"]').waitFor();
      assert.equal(await page.locator('input[name="name"]').inputValue(), 'Navigationstest');
      assert.equal(await page.locator('textarea[name="message"]').inputValue(), 'Utkast');
      await link(page, '/');
      await page.getByRole('button', { name: 'Öppna meny', exact: true }).click();
      await page.getByRole('button', { name: 'Logga in', exact: true }).click();
      await page.getByRole('button', { name: 'Stäng inloggning', exact: true }).click();
      await settle(page);
      await stable(page);
      await link(page, '/menu');
      await page.locator('a[href="#pizza"]').click();
      await page.locator('.demo-category-view').waitFor();
      await settle(page);
      assert.equal(await page.getByRole('searchbox').count(), 0);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(100);
      const y = await page.evaluate(() => scrollY);
      await page.locator('.demo-product-card a').first().evaluate(el => el.click());
      await page.locator('.demo-product-page').waitFor();
      await page.goBack();
      await settle(page);
      assert(Math.abs(await page.evaluate(() => scrollY) - y) < 3, 'Back restores category scroll');
      await page.getByRole('link', { name: 'Alla kategorier', exact: true }).click();
      await page.getByRole('searchbox').waitFor();
      await settle(page);
      assert.equal(await page.locator('.menu-category-card').count(), 14);
      await stable(page);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('alibaba.preview.demo-cart.v2')), bag);
      assert.equal(documents, 0, 'All internal links, back/forward and checkout stay in one document');

      // Several activations before the browser has captured the first outgoing frame.
      await page.evaluate(() => {
        for (const href of ['/about', '/contact', '/']) document.querySelector(`a[href="${href}"]`).click();
      });
      await page.waitForURL(base + '/');
      await settle(page);
      await stable(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await link(page, '/menu');
      assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.animationName?.startsWith('page-')).length), 0);
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `navigation-${engine}-${width}.png`), animations: 'disabled' });
      }
      await page.reload();
      await page.locator('.menu-category-card').first().waitFor();
      assert.equal(await page.locator('.cart-count').innerText(), '2');
      console.log(`${engine} ${width}px: SPA links, stable header, drafts, bag, scroll, rapid navigation and reduced motion PASS`);
      await page.close();
    }

    const slow = await createPage();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await slow.route('**/assets/DemoPreview-*.js', async route => { await gate; await route.continue(); });
    await slow.goto(base + '/menu', { waitUntil: 'domcontentloaded' });
    await slow.locator('.route-loading').waitFor();
    assert(await slow.locator('.app-header').isVisible(), 'Slow bootstrap keeps navigation shell');
    assert.equal(await slow.locator('.route-loading').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 239, 230)');
    release();
    await slow.locator('.menu-category-card').first().waitFor();
    await slow.evaluate(() => { document.startViewTransition = undefined; });
    await link(slow, '/contact');
    await link(slow, '/menu');
    await slow.close();

    const failed = await createPage();
    const expectedErrors = [];
    failed.removeAllListeners('pageerror');
    failed.on('pageerror', e => expectedErrors.push(e.message));
    await failed.route('**/assets/DemoPreview-*.js', route => route.abort());
    await failed.goto(base + '/menu');
    await failed.getByRole('heading', { name: 'Hoppsan! Något gick fel.' }).waitFor();
    assert(await failed.locator('.app-header').isVisible(), 'Failed chunk has shell and recoverable error');
    await failed.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    console.log('Slow bootstrap, failed chunk, older-browser fallback and no backend writes PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

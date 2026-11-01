const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';
const engine = process.env.TEST_BROWSER || 'chromium';
const bagKey = 'alibaba.preview.demo-cart.v2';
const bag = page => page.evaluate(key => sessionStorage.getItem(key), bagKey);
const labels = { 'not-found': 'Sidan kunde inte hittas', server: 'Hoppsan! Något gick fel.', network: 'Ingen internetanslutning' };

async function checkError(page, kind, width) {
  await page.getByRole('heading', { name: labels[kind], exact: true }).waitFor();
  await page.locator('.error-bag img').evaluate(img => img.decode());
  assert.equal(await page.locator('.error-bag img').getAttribute('src'), await page.locator('.app-header .cart-button img').getAttribute('src'));
  const dimensions = await page.locator('.error-bag img').boundingBox();
  assert(dimensions.width >= 100 && dimensions.width <= 130);
  assert.equal(await page.locator('.error-bag').evaluate(el => getComputedStyle(el).animationIterationCount), '1');
  assert.equal(await page.locator('.error-bag').evaluate(el => getComputedStyle(el).animationDuration), '0.55s');
  await page.waitForTimeout(650);
  assert.equal(await page.locator('.error-bag').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await page.locator('.error-exclamation').evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const illustration = await page.locator('.error-illustration').boundingBox();
  assert(Math.abs(illustration.x + illustration.width / 2 - width / 2) < 2, 'Centered illustration');
  assert(await page.locator('.app-header').isVisible());
  if (process.env.SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `error-${kind}-${engine}-${width}.png`), animations: 'disabled' });
  }
}

(async () => {
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const writes = [], diagnostics = [], unexpected = [];
  async function createPage(width = 390) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    if (process.env.TEST_TRANSITION_FALLBACK === '1') await page.addInitScript(() => { document.startViewTransition = undefined; });
    page.on('request', r => { if (r.method() !== 'GET') writes.push(r.url()); });
    page.on('console', m => { if (m.text().includes('[Alibaba]')) diagnostics.push(m.text()); });
    page.on('pageerror', e => unexpected.push(e.message));
    await page.route('https://www.google.com/maps**', r => r.fulfill({ body: '', contentType: 'text/html' }));
    return page;
  }
  try {
    for (const width of (process.env.TEST_WIDTHS || '307,375,390,430,768,1440').split(',').map(Number)) {
      const page = await createPage(width);
      await page.goto(base + '/does-not-exist');
      await checkError(page, 'not-found', width);
      const origin = await page.evaluate(() => performance.timeOrigin);
      await page.getByRole('button', { name: 'Gå tillbaka', exact: true }).click();
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => performance.timeOrigin), origin, 'Direct 404 safely returns home without reload');
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).click();
      await page.locator('a[href="#drinks"]').click();
      await page.locator('.demo-category-view').waitFor();
      await page.waitForURL(url => url.hash === '#drinks');
      await page.evaluate(() => {
        const brokenLink = document.createElement('a');
        brokenLink.href = '/menu/product/missing-product';
        document.body.appendChild(brokenLink); brokenLink.click(); brokenLink.remove();
      });
      await checkError(page, 'not-found', width);
      await page.getByRole('button', { name: 'Gå tillbaka', exact: true }).click();
      await page.locator('.demo-category-view').waitFor();
      assert.equal(new URL(page.url()).hash, '#drinks');
      await page.goForward();
      await page.getByRole('heading', { name: labels['not-found'] }).waitFor();
      await page.getByRole('button', { name: 'Till startsidan', exact: true }).click();
      await page.getByRole('button', { name: 'Se menyn & beställ', exact: true }).waitFor();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goBack();
      await page.locator('.error-bag').waitFor();
      assert.equal(await page.locator('.error-bag').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.locator('.error-exclamation').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.close();

      const server = await createPage(width);
      const loadFailures = [];
      server.on('console', message => { if (message.type() === 'error') loadFailures.push(message.text()); });
      server.on('requestfailed', request => loadFailures.push(request.url() + ': ' + request.failure()?.errorText));
      let fail = true, requests = 0;
      await server.route(/\/assets\/DemoPreview-[^/]+\.js(?:\?.*)?$/, route => {
        requests++;
        return fail ? route.fulfill({ status: 503, contentType: 'text/javascript', headers: { 'cache-control': 'no-store' }, body: '' }) : route.continue();
      });
      await server.goto(base + '/menu');
      await checkError(server, 'server', width);
      const documentStart = await server.evaluate(() => performance.timeOrigin);
      // Browsers may request both the modulepreload hint and the failed import.
      const initialRequests = requests;
      await server.waitForTimeout(500);
      assert.equal(requests, initialRequests, 'No automatic load retry loop');
      fail = false;
      await server.getByRole('button', { name: 'Försök igen', exact: true }).click();
      await server.locator('.menu-category-card').first().waitFor().catch(async error => {
        console.error({ requests, loadFailures, url: server.url(), documentStart, currentStart: await server.evaluate(() => performance.timeOrigin), content: await server.locator('main').innerText() });
        throw error;
      });
      assert.equal(await server.evaluate(() => performance.timeOrigin), documentStart, 'Explicit bootstrap recovery does not reload the document');
      assert(requests > initialRequests, 'Explicit retry requests the failed code again');
      await server.close();

      const network = await createPage(width);
      let interrupted = true;
      await network.addInitScript(() => {
        window.testOffline = true;
        Object.defineProperty(navigator, 'onLine', { get: () => !window.testOffline });
      });
      await network.route(/\/assets\/DemoPreview-[^/]+\.js(?:\?.*)?$/, route => interrupted ? route.abort('internetdisconnected') : route.continue());
      await network.goto(base + '/menu');
      await checkError(network, 'network', width);
      assert.equal(await network.locator('.error-actions button').count(), 1);
      interrupted = false;
      await network.evaluate(() => { window.testOffline = false; window.dispatchEvent(new Event('online')); });
      assert(await network.locator('.app-error').isVisible(), 'Reconnection does not automatically replay any operation');
      await network.getByRole('button', { name: 'Försök igen', exact: true }).click();
      await network.locator('.menu-category-card').first().waitFor();
      await network.close();
      console.log(`${engine} ${width}px: 404/back/home, actual failed module 503/retry, disconnected load/reconnect, original bag, animation and reduced motion PASS`);
    }

    const page = await createPage();
    await page.goto(base + '/menu/product/demo%3Achicken-shawarma%3Aplate?orderType=takeaway');
    await page.getByRole('radio', { name: /^Ris/ }).check();
    await page.getByRole('radio', { name: /^Coca-Cola \+/ }).check();
    await page.getByRole('checkbox', { name: /^Extra vitlökssås/ }).check();
    await page.locator('.demo-ingredient-exclusions input[value="pickles"]').check();
    await page.getByRole('button', { name: 'Öka antal', exact: true }).click();
    await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
    await page.waitForTimeout(1100);
    const originalBag = await bag(page);
    await page.evaluate(() => {
      window.headerBeforeError = document.querySelector('.app-header');
      const descriptor = Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, 'format');
      window.failProduct = true;
      Object.defineProperty(Intl.NumberFormat.prototype, 'format', {
        configurable: true,
        get() {
          const format = descriptor.get.call(this);
          return value => {
            if (window.failProduct && value === (window.failAmount ?? 145)) throw Object.assign(new TypeError('secret-test-address'), { status: 503 });
            return format(value);
          };
        },
      });
    });
    await page.getByRole('radio', { name: /^Pommes frites/ }).evaluate(el => el.click());
    await page.getByRole('heading', { name: labels.server }).waitFor();
    assert.equal(await bag(page), originalBag);
    assert(await page.evaluate(() => document.querySelector('.app-header') === window.headerBeforeError));
    await page.evaluate(() => { window.failProduct = false; });
    await page.getByRole('button', { name: 'Försök igen', exact: true }).click();
    await page.getByRole('radio', { name: /^Pommes frites/ }).waitFor();
    assert(await page.getByRole('radio', { name: /^Pommes frites/ }).isChecked());
    assert(await page.locator('.demo-ingredient-exclusions input[value="pickles"]').isChecked());
    assert.equal((await page.locator('.demo-purchase .demo-total strong').innerText()).replace(/\D/g, ''), '350');
    assert.equal(await bag(page), originalBag, 'Retry does not repeat Add to Bag');
    await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
    await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
    await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
    await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
    await page.getByLabel('Gatuadress', { exact: true }).fill('Testgatan 12');
    await page.getByLabel('Postnummer', { exact: true }).fill('60217');
    await page.getByLabel('Ort', { exact: true }).fill('Norrköping');
    await page.getByLabel('Kom ihåg min adress till nästa gång', { exact: true }).check();
    await page.getByRole('button', { name: 'Bekräfta adress och fortsätt', exact: true }).press('Enter');
    await page.locator('.delivery-layer.is-open').waitFor({ state: 'hidden' });
    await page.getByRole('radio', { name: 'Hämta själv', exact: true }).check();
    await page.getByRole('radio', { name: 'Swish', exact: true }).check();
    await page.getByRole('button', { name: 'Simulera betalning', exact: true }).click();
    await page.locator('.payment-demo-receipt').waitFor();
    await page.getByRole('button', { name: 'Fortsätt', exact: true }).click();
    await page.getByRole('button', { name: 'Simulera godkännande', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.locator('.order-tracker-circle').waitFor();
    const acceptedAt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('alibaba.preview.tracking.v1')).active.acceptedAt);
    const addresses = await page.evaluate(() => JSON.stringify(localStorage));
    await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
    await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
    await page.getByRole('radio', { name: 'Swish', exact: true }).waitFor();
    await page.evaluate(() => { window.failAmount = 175; window.failProduct = true; });
    await page.getByRole('radio', { name: 'Apple Pay', exact: true }).evaluate(el => el.click());
    await page.getByRole('heading', { name: labels.server }).waitFor();
    assert(await page.locator('.order-tracker-circle').isVisible(), 'The tracking provider stays alive during page errors');
    await page.evaluate(() => { window.failProduct = false; });
    await page.getByRole('button', { name: 'Försök igen', exact: true }).click();
    await page.getByRole('radio', { name: 'Apple Pay', exact: true }).waitFor();
    assert(await page.getByRole('radio', { name: 'Apple Pay', exact: true }).isChecked());
    assert.equal(await page.locator('.payment-demo-layer').count(), 0, 'Retry never resubmits payment');
    await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
    assert.match(await page.locator('.delivery-address-card').innerText(), /Testgatan 12/);
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), addresses);
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('alibaba.preview.tracking.v1')).active.acceptedAt), acceptedAt);
    assert.equal(await bag(page), originalBag);
    assert(!diagnostics.join(' ').includes('secret-test-address'));
    assert(diagnostics.some(m => m.includes('Frontend error')));
    await page.close();
    assert.deepEqual(writes, [], 'No payment, order or backend writes');
    assert.deepEqual(unexpected, []);
    console.log('Render/checkout retry preserves header, cart, options, addresses and active countdown; no repeated payment, safe diagnostics, no backend writes PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

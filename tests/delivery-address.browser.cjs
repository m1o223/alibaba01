const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const storageKey = 'alibaba.preview.delivery-address.v1';
const sheet = page => page.getByRole('dialog', { name: 'Leveransuppgifter', exact: true });
const save = page => page.getByRole('button', { name: 'Bekräfta adress och fortsätt', exact: true });
const close = page => page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).click();
async function fill(page, street = 'Testgatan 12') {
  await page.getByLabel('Gatuadress', { exact: true }).fill(street);
  await page.getByLabel('Postnummer', { exact: true }).fill('12345');
  await page.getByLabel('Ort', { exact: true }).fill('Teststad');
}
async function checkout(page) {
  await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
  await page.goto(base + '/menu?orderType=takeaway#chicken-shawarma');
  await page.getByRole('link', { name: 'Visa Kycklingshawarmatallrik', exact: true }).click();
  await page.getByRole('radio', { name: /^Ris/ }).check();
  await page.getByRole('checkbox', { name: /^Extra vitlökssås/ }).check();
  await page.getByRole('checkbox', { name: 'Utan pickles', exact: true }).check();
  await page.getByRole('button', { name: 'Lägg i påsen', exact: true }).click();
  await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
  await page.getByRole('button', { name: 'Till kassan', exact: true }).click();
  await page.getByRole('button', { name: 'Fortsätt i demoläge', exact: true }).click();
  await page.getByRole('radio', { name: 'Swish', exact: true }).check();
}
(async () => {
  const engine = process.env.TEST_BROWSER || 'chromium';
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    for (const width of (process.env.TEST_WIDTHS ? process.env.TEST_WIDTHS.split(',').map(Number) : [307, 375, 390, 430, 768, 1440])) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await checkout(page);
      const original = await page.locator('.demo-summary-panel .demo-order-lines').innerText();
      const totals = await page.locator('.demo-summary-panel .demo-total').allTextContents();
      await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
      await sheet(page).waitFor();
      await page.waitForTimeout(350);
      assert(await page.locator('#root').evaluate(root => root.inert));
      assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
      const checkoutScroll = await page.evaluate(() => -parseFloat(document.body.style.top));
      assert.equal(await page.getByRole('checkbox', { name: 'Kom ihåg min adress till nästa gång' }).isChecked(), false);
      const box = await sheet(page).boundingBox();
      assert(box.height <= 850 * .91 && box.y >= 850 * .09);
      assert.equal(await page.locator('#root').evaluate(el => getComputedStyle(el).filter), 'blur(4px)');
      assert.equal(await sheet(page).evaluate(el => getComputedStyle(el).filter), 'none');
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `delivery-top-${engine}-${width}.png`) });
      }
      await save(page).click();
      assert.equal(await page.locator('.delivery-error').count(), 3);
      await fill(page);
      await page.getByLabel('Portkod (valfritt)', { exact: true }).fill('PRIVATE-CODE');
      await page.getByLabel('Övrig information (valfritt)', { exact: true }).fill('PRIVATE-NOTE');
      await page.getByRole('radio', { name: 'Lämna vid dörren', exact: true }).check();
      await page.getByLabel('Våning (valfritt)', { exact: true }).fill('2');
      await save(page).click();
      await page.waitForTimeout(350);
      assert.equal(await page.locator('#root').evaluate(root => root.inert), false);
      assert.equal(await page.locator('#root').evaluate(root => root.style.filter), '');
      assert(Math.abs(await page.evaluate(() => scrollY) - checkoutScroll) < 2, 'Checkout scroll position restored');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null);
      assert(await page.getByRole('radio', { name: 'Hemleverans', exact: true }).isChecked());
      assert(await page.getByRole('button', { name: 'Simulera betalning', exact: true }).isDisabled());
      assert.match(await page.locator('.delivery-address-card').innerText(), /Testgatan 12/);
      assert.match(await page.locator('.delivery-address-card').innerText(), /Lämna vid dörren/);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `delivery-card-${engine}-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Ändra', exact: true }).click();
      assert.equal(await page.getByLabel('Portkod (valfritt)', { exact: true }).inputValue(), 'PRIVATE-CODE');
      await page.getByLabel('Gatuadress', { exact: true }).fill('Osparad gata 9');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
      assert.match(await page.locator('.delivery-address-card').innerText(), /Testgatan 12/);
      await page.getByRole('button', { name: 'Ändra', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Kom ihåg min adress till nästa gång' }).check();
      await save(page).click();
      const remembered = await page.evaluate(key => localStorage.getItem(key), storageKey);
      assert(remembered.includes('Testgatan 12'));
      assert(!remembered.includes('PRIVATE'));
      await page.waitForTimeout(350);
      await page.getByRole('button', { name: 'Annan adress', exact: true }).click();
      assert.equal(await page.getByLabel('Gatuadress', { exact: true }).inputValue(), '');
      await fill(page, 'Annan gata 8');
      await page.getByRole('checkbox', { name: 'Kom ihåg min adress till nästa gång' }).check();
      assert.equal(await page.getByRole('checkbox', { name: 'Ersätt min tidigare sparade adress' }).isChecked(), false);
      if (process.env.SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `delivery-${engine}-${width}.png`) });
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await page.locator('.delivery-sheet').evaluate(el => el.scrollWidth <= el.clientWidth));
      await save(page).click();
      await page.waitForTimeout(350);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), remembered);
      assert.match(await page.locator('.delivery-address-card').innerText(), /Annan gata 8/);
      await page.getByRole('button', { name: 'Använd sparad adress', exact: true }).click();
      assert.match(await page.locator('.delivery-address-card').innerText(), /Testgatan 12/);
      assert.deepEqual(await page.locator('.demo-summary-panel .demo-total').allTextContents(), totals);
      assert.equal(await page.locator('.demo-summary-panel .demo-order-lines').innerText(), original);
      assert(await page.getByRole('radio', { name: 'Swish', exact: true }).isChecked());
      for (const name of ['Äta på plats', 'Hämta själv']) {
        await page.getByRole('radio', { name, exact: true }).check();
        assert(await page.getByRole('button', { name: 'Simulera betalning', exact: true }).isEnabled());
      }
      await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
      assert(await page.getByRole('button', { name: 'Simulera betalning', exact: true }).isDisabled());
      await page.reload();
      await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
      assert.equal(await sheet(page).isVisible(), false, 'Remembered address does not reopen the form');
      await page.getByRole('button', { name: 'Använd denna adress', exact: true }).click();
      await page.getByRole('button', { name: 'Ändra', exact: true }).click();
      assert.equal(await page.getByLabel('Portkod (valfritt)', { exact: true }).inputValue(), '');
      await page.getByLabel('Gatuadress', { exact: true }).fill('Uppdaterad gata 3');
      await page.getByRole('checkbox', { name: 'Kom ihåg min adress till nästa gång' }).check();
      await page.getByRole('checkbox', { name: 'Ersätt min tidigare sparade adress' }).check();
      await save(page).click();
      await page.waitForTimeout(350);
      assert((await page.evaluate(key => localStorage.getItem(key), storageKey)).includes('Uppdaterad gata 3'));
      await page.getByRole('button', { name: 'Ta bort sparad adress', exact: true }).click();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null);
      assert.match(await page.locator('.delivery-address-card').innerText(), /Uppdaterad gata 3/, 'Deleting remembered data preserves current checkout');
      assert.deepEqual(errors, []); assert.deepEqual(writes, []);
      console.log(`${engine} ${width}px: manual/validation/edit/reuse/new/delete/consent/cart/payment preservation PASS`);
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await checkout(page);
    await page.evaluate(() => {
      window.__geoMode = 'granted'; window.__geoCalls = 0;
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
        getCurrentPosition(success, failure) { window.__geoCalls++; window.__geoMode === 'granted' ? success({ coords: { latitude: 58, longitude: 16 } }) : failure({ code: 1 }); },
        watchPosition() { throw Error('Continuous tracking must not be used'); }
      } });
    });
    if (process.env.TEST_LOOKUP === 'unconnected') {
      await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
      await page.getByRole('button', { name: 'Använd min plats', exact: true }).click();
      await page.getByText('Adressökning är inte ansluten ännu. Fyll i adressen manuellt.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.__geoCalls), 0, 'No coordinates collected without an approved provider');
      await fill(page, 'Osparad gata 4');
      await close(page); await page.waitForTimeout(350);
      await page.getByRole('button', { name: 'Ange leveransadress', exact: true }).click();
      assert.equal(await page.getByLabel('Gatuadress', { exact: true }).inputValue(), 'Osparad gata 4', 'Unconfirmed draft survives dismissal');
      await close(page); await page.waitForTimeout(350);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null);
      await page.close();
      console.log(`${engine}: release build has no connected geocoder; manual draft retained without storage or location access PASS`);
      return;
    }
    let lookups = 0;
    await page.route('**/api/delivery/reverse-test', async route => {
      lookups++; assert.equal(route.request().method(), 'POST');
      assert.deepEqual(route.request().postDataJSON(), { latitude: 58, longitude: 16 });
      await route.fulfill({ json: { street: 'Felaktigt förslag 1', postalCode: '12345', city: 'Teststad' } });
    });
    await page.getByRole('radio', { name: 'Hemleverans', exact: true }).check();
    assert.equal(await page.evaluate(() => window.__geoCalls), 0);
    await page.getByRole('button', { name: 'Använd min plats', exact: true }).click();
    await page.getByText('Kontrollera adressförslaget och rätta det vid behov innan du bekräftar.', { exact: true }).waitFor();
    assert.equal(lookups, 1);
    assert(await sheet(page).isVisible());
    await fill(page, 'Rättad gata 5');
    await save(page).click();
    await page.waitForTimeout(350);
    assert.match(await page.locator('.delivery-address-card').innerText(), /Rättad gata 5/);
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    await page.evaluate(() => { window.__geoMode = 'denied'; });
    await page.getByRole('button', { name: 'Använd min plats', exact: true }).click();
    await page.getByText('Platsen kunde inte hämtas. Tillåt platsåtkomst eller fyll i adressen manuellt.', { exact: true }).waitFor();
    assert.equal(lookups, 1);
    assert.equal(await page.getByLabel('Gatuadress', { exact: true }).inputValue(), 'Rättad gata 5');
    await page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    assert(await save(page).evaluate(el => el === document.activeElement));
    await page.keyboard.press('Tab');
    assert(await page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).evaluate(el => el === document.activeElement));
    await page.setViewportSize({ width: 390, height: 450 });
    await page.getByLabel('Gatuadress', { exact: true }).focus();
    await page.waitForTimeout(350);
    const buttonBox = await save(page).boundingBox();
    assert(buttonBox.y + buttonBox.height <= 450, 'Save remains reachable with a reduced visible viewport');
    await close(page); await page.waitForTimeout(350);
    assert.equal(await page.locator('#root').evaluate(root => root.inert), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    await page.evaluate(() => { window.__geoMode = 'granted'; });
    await page.unroute('**/api/delivery/reverse-test');
    await page.route('**/api/delivery/reverse-test', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ json: { street: 'Sent förslag 9', postalCode: '12345', city: 'Teststad' } }).catch(() => {});
    });
    await page.getByRole('button', { name: 'Använd min plats', exact: true }).click();
    await page.getByLabel('Gatuadress', { exact: true }).fill('Egen rättelse 7');
    await page.waitForTimeout(750);
    assert.equal(await page.getByLabel('Gatuadress', { exact: true }).inputValue(), 'Egen rättelse 7', 'Late geocoder response cannot overwrite manual edits');
    await page.getByRole('radio', { name: 'Hus', exact: true }).check();
    assert.equal(await page.getByLabel('Portkod (valfritt)', { exact: true }).count(), 0);
    assert.equal(await page.getByLabel('Lägenhetsnummer (valfritt)', { exact: true }).count(), 0);
    await close(page); await page.waitForTimeout(350);
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    await page.getByRole('button', { name: 'Stäng leveransuppgifter', exact: true }).focus();
    await page.mouse.click(10, 15);
    await page.waitForTimeout(350);
    assert.equal(await sheet(page).isVisible(), false, 'Backdrop closes sheet');
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    await page.waitForTimeout(350);
    const handle = await page.locator('.delivery-handle').boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 10);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 120, { steps: 5 });
    await page.mouse.up(); await page.waitForTimeout(350);
    assert.equal(await sheet(page).isVisible(), false, 'Only handle swipe dismisses');
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    await page.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if (key === 'alibaba.preview.delivery-address.v1') throw new DOMException('Blocked', 'SecurityError'); return set.call(this, key, value); };
    });
    await page.getByRole('checkbox', { name: 'Kom ihåg min adress till nästa gång' }).check();
    await save(page).click(); await page.waitForTimeout(350);
    assert.match(await page.locator('.delivery-checkout-details').innerText(), /kunde inte sparas på enheten/);
    assert.match(await page.locator('.delivery-address-card').innerText(), /Rättad gata 5/);
    await page.close();
    console.log(`${engine}: mock location grant/deny/correction/stale-response, focus trap, keyboard-sized viewport, backdrop/swipe and blocked storage PASS`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

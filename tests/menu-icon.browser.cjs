const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';

(async () => {
  const safari = process.env.TEST_BROWSER === 'webkit';
  const browser = await (safari ? webkit : chromium).launch(safari ? {} : { executablePath: process.env.BROWSER_EXECUTABLE });
  const errors = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      for (const route of ['/', '/menu']) {
        await page.goto(base + route);
        const trigger = page.locator('.app-header .icon-button');
        const icon = trigger.locator('.header-menu-icon');
        await icon.waitFor();
        assert.equal(await icon.getAttribute('viewBox'), '0 0 64 48');
        assert.equal(await icon.locator('path').count(), 2);
        assert.equal(await icon.locator('circle').count(), 1);
        const before = await trigger.boundingBox();
        assert.equal(before.width, 44);
        assert.equal(before.height, 44);
        assert.equal(await icon.evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
        assert.equal(await icon.locator('path').first().evaluate(el => getComputedStyle(el).transitionDuration), '0.225s, 0.225s');
        assert.equal(await page.locator('.app-header').evaluate(el => el.getBoundingClientRect().height), 56);
        assert.equal(await page.locator('.app-header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 24, 15)');
        assert.equal(await page.locator('.cart-button img').getAttribute('src'), '/assets/takeaway-bag.svg');
        if (process.env.TEST_SCREENSHOTS && route === '/') {
          fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
          await page.locator('.app-header').screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, `menu-icon-${width}.png`) });
        }
        for (const close of ['escape', 'button', 'backdrop']) {
          await trigger.click();
          await page.waitForTimeout(300);
          assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
          assert.equal(await page.locator('#site-menu').getAttribute('aria-hidden'), 'false');
          assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
          const state = await icon.evaluate(el => ({
            dot: getComputedStyle(el.querySelector('circle')).opacity,
            lines: [...el.querySelectorAll('path')].map(line => {
              const matrix = new DOMMatrix(getComputedStyle(line).transform);
              return { a: matrix.a, b: matrix.b };
            }),
          }));
          assert.equal(state.dot, '0');
          assert.ok(Math.abs(state.lines[0].a - Math.SQRT1_2) < 0.001);
          assert.ok(state.lines[0].b > 0 && state.lines[1].b < 0);
          if (close === 'escape') await page.keyboard.press('Escape');
          else if (close === 'button') await page.locator('.side-menu-close').click();
          else await page.locator('.menu-overlay').click({ position: { x: width - 10, y: 300 } });
          await page.waitForTimeout(300);
          assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
          assert.equal(await icon.locator('circle').evaluate(el => getComputedStyle(el).opacity), '1');
          assert.equal(await page.evaluate(() => document.body.style.overflow), '');
          assert.deepEqual(await trigger.boundingBox(), before);
        }
        await trigger.click();
        await page.locator(`#site-menu a[href="${route === '/' ? '/menu' : '/'}"]`).click();
        await page.waitForURL(base + (route === '/' ? '/menu' : '/'));
        await page.locator('.cart-button').click();
        assert.equal(await page.locator('#cart-drawer').getAttribute('aria-hidden'), 'false');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.header-menu-icon path').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
      console.log(`${safari ? 'WebKit' : 'Chromium'} ${width}px: icon, morph, close methods, navigation, cart and reduced motion PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

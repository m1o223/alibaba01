const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const titles = ['Vår historia', 'Varför välja Alibaba?', 'Alibabas resa', 'Vår mat', 'Upptäck vår meny'];

async function active(page, index) {
  await page.waitForFunction(index => document.querySelector('.about-card[data-active="true"]')?.dataset.index === String(index), index);
  assert.equal(await page.locator('.about-card[data-active="true"] h2').innerText(), titles[index]);
  assert.equal((await page.locator('.about-controls output').innerText()).replace(/\s/g, ''), `0${index + 1}/05`);
}

async function dimensions(page) {
  const result = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.about-card')];
    const current = document.querySelector('.about-card[data-active="true"]');
    const body = current.querySelector('.about-card-body');
    const rect = current.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      heights: cards.map(card => card.offsetHeight),
      clipped: body.offsetHeight > current.clientHeight,
      centerInside: rect.left >= 0 && rect.right <= innerWidth,
      images: [...document.querySelectorAll('.about-card img')].every(img => img.complete && img.naturalWidth > 0),
    };
  });
  assert.equal(result.overflow, false);
  assert.equal(new Set(result.heights).size, 1);
  assert.equal(result.clipped, false);
  assert.equal(result.centerInside, true);
  assert.equal(result.images, true);
}

async function shot(page, name) {
  if (!process.env.TEST_SCREENSHOTS) return;
  fs.mkdirSync(process.env.TEST_SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.TEST_SCREENSHOTS, name + '.png'), fullPage: true });
}

(async () => {
  const safari = process.env.TEST_BROWSER === 'webkit';
  const browser = await (safari ? webkit : chromium).launch(safari ? { headless: true } : { executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const errors = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://www.google.com/maps**', route => route.fulfill({ body: '', contentType: 'text/html' }));
      await page.goto(base + '/about');
      await page.evaluate(() => document.fonts.ready);
      await active(page, 0);
      assert.equal(await page.locator('.about-card').count(), 5);
      await dimensions(page);
      await shot(page, `about-${width}-history`);

      // Both ends of the ring must wrap without resetting the transform.
      await page.getByRole('button', { name: 'Föregående kort', exact: true }).click();
      await active(page, 4);
      for (let index = 0; index < 5; index++) {
        await page.getByRole('button', { name: 'Nästa kort', exact: true }).click();
        await active(page, index);
        await dimensions(page);
        if (width === 390) await shot(page, `about-390-card-${index + 1}`);
      }
      assert.equal(await page.locator('.about-menu-link').getAttribute('href'), '/menu');
      assert.equal(await page.locator('.about-menu-link').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');

      // Click the exposed right edge, not a programmatically hidden center point.
      const point = await page.evaluate(() => {
        const target = document.querySelector('.about-card[data-index="0"] .about-side-target');
        const stage = document.querySelector('.about-stage').getBoundingClientRect();
        const y = stage.y + stage.height / 2;
        for (let x = innerWidth - 1; x > innerWidth / 2; x -= 2) {
          if (document.elementFromPoint(x, y) === target) return { x, y };
        }
        return null;
      });
      assert(point, 'The adjacent card has an exposed clickable area');
      await page.mouse.click(point.x, point.y);
      await active(page, 0);
      await page.waitForTimeout(40);
      assert.equal(await page.locator('.about-card[data-active="true"] h2').evaluate(el => el === document.activeElement), true);

      // Sample the live matrix: both X and Z must move along a 3D orbit.
      await page.getByRole('button', { name: 'Nästa kort', exact: true }).click();
      await page.waitForTimeout(230);
      const orbit = await page.locator('.about-card[data-index="0"]').evaluate(el => {
        const matrix = new DOMMatrix(getComputedStyle(el).transform);
        return { z: matrix.m43, tilt: matrix.m13 };
      });
      assert(orbit.z < -1 && Math.abs(orbit.tilt) > 0.01, 'Circular 3D movement is visible mid-transition');
      await active(page, 1);

      // Pointer input covers mouse dragging and the same handler used by touch.
      const box = await page.locator('.about-card[data-active="true"]').boundingBox();
      await page.mouse.move(width / 2 + 50, box.y + 160);
      await page.mouse.down();
      await page.mouse.move(width / 2 - 60, box.y + 166, { steps: 8 });
      await page.mouse.up();
      await active(page, 2);
      await page.mouse.move(width / 2, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(width / 2 + 5, box.y + 230, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(650);
      await active(page, 2);

      if (width === 390 && !safari) {
        const client = await page.context().newCDPSession(page);
        async function touch(points) {
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [points[0]] });
          for (const point of points.slice(1)) {
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
            await page.waitForTimeout(30);
          }
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }
        await touch([{ x: 270, y: 430 }, { x: 240, y: 432 }, { x: 200, y: 434 }, { x: 150, y: 436 }]);
        await active(page, 3);
        await touch([{ x: 150, y: 430 }, { x: 180, y: 432 }, { x: 220, y: 434 }, { x: 270, y: 436 }]);
        await active(page, 2);
        await touch([{ x: 200, y: 520 }, { x: 202, y: 480 }, { x: 204, y: 430 }, { x: 205, y: 380 }]);
        await page.waitForTimeout(700);
        await active(page, 2);
        assert(await page.evaluate(() => scrollY > 20), 'Vertical touch scrolling is not intercepted');
        await page.evaluate(() => scrollTo(0, 0));
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByRole('button', { name: 'Nästa kort', exact: true }).click();
      await page.waitForTimeout(80);
      await active(page, 3);
      await page.getByRole('button', { name: 'Nästa kort', exact: true }).click();
      await active(page, 4);
      await page.locator('.about-menu-link').click();
      await page.waitForURL(url => url.pathname === '/menu');
      await page.locator('.menu-category-card').first().waitFor();
      await page.goto(base + '/about');
      await active(page, 0);
      if (width === 390) {
        const zoom = await page.addStyleTag({ content: '.about-card p, .about-card h3 { font-size: 30px !important; } .about-card h2 { font-size: 56px !important; }' });
        await page.waitForTimeout(150);
        await dimensions(page);
        await zoom.evaluate(el => el.remove());
        await page.waitForTimeout(150);
      }
      await page.getByRole('button', { name: 'Öppna varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Stäng varukorg', exact: true }).click();
      await page.getByRole('button', { name: 'Öppna meny', exact: true }).click();
      await page.getByRole('navigation', { name: 'Huvudmeny', exact: true }).getByRole('link', { name: 'Meny', exact: true }).click();
      await page.waitForURL(url => url.pathname === '/menu');
      console.log(`About carousel ${width}px: content, arrows, wrap, side click, gestures, reduced motion, links and drawers PASS`);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

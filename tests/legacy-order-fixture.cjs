// The old order-status page remains supported, but checkout no longer creates orders.
// Seed it explicitly so its existing regression coverage stays independent of payment UI.
exports.openLegacyOrder = async function openLegacyOrder(page, base, method = 'swish', orderType = 'dine-in') {
  const reference = 'DEMO-1234ABCD';
  await page.evaluate(({ reference, method, orderType }) => {
    sessionStorage.setItem('alibaba.preview.demo-order.v1', JSON.stringify({
      reference, createdAt: new Date().toISOString(), paymentMethod: method, orderType,
      lines: JSON.parse(sessionStorage.getItem('alibaba.preview.demo-cart.v2')),
      totalOre: 0, status: 'received', cartConsumed: false, demoOnly: true,
    }));
  }, { reference, method, orderType });
  await page.goto(base + '/demo/order/' + reference);
  await page.locator('.demo-receipt').waitFor();
};

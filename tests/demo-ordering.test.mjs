import test from "node:test";
import assert from "node:assert/strict";
import { demoProducts, getDemoProduct } from "../src/demo/menuData.ts";
import { lineKey, normalizeLines, parseStoredOrder, receiptLines, transitionOrder, unitPrice, validateSelections } from "../src/demo/orderModel.ts";

const product = getDemoProduct("demo:chicken-shawarma:plate");
const selections = { side: ["rice"], drink: ["drink-0"], extras: ["garlic"] };
test("84 products support unverified recipe metadata and configuration-driven customization", () => {
  assert.equal(demoProducts.length, 84);
  for (const item of demoProducts) {
    assert.equal(item.demo, true);
    assert.equal(item.allergenVerificationStatus, "unverified");
    assert.equal(item.descriptionVerificationStatus, "unverified");
    assert.deepEqual(item.ingredients, []);
    assert.deepEqual(item.allergens, []);
    assert.equal(item.available, true);
    if (["sauces", "drinks"].includes(item.categorySlug)) assert.deepEqual(item.customizationGroups, []);
  }
});
test("required sides cannot be bypassed and paid selections calculate in integer ore", () => {
  assert.equal(validateSelections(product, {}), false);
  assert.equal(validateSelections(product, { side: ["rice", "fries"] }), false);
  assert.equal(validateSelections(product, { ...selections, extras: ["garlic", "garlic"] }), false);
  assert.equal(validateSelections(product, { ...selections, drink: ["invalid"] }), false);
  assert.equal(validateSelections(product, { ...selections, unexpected: [] }), false);
  assert.equal(validateSelections(product, { ...selections, extras: null }), false);
  assert.equal(validateSelections(product, selections), true);
  assert.equal(unitPrice(product, selections), 17500);
  assert.equal(unitPrice(product, selections) * 2, 35000);
  assert.equal(unitPrice(product, { side: ["rice"] }), 14500);
});
test("cart identities merge equivalent selections but separate different meals", () => {
  const line = { productKey: product.key, selections: { ...selections, extras: ["hot", "garlic"] } };
  assert.equal(lineKey(line), lineKey({ ...line, selections: { extras: ["garlic", "hot"], drink: ["drink-0"], side: ["rice"] } }));
  assert.notEqual(lineKey(line), lineKey({ ...line, selections: { ...line.selections, side: ["fries"] } }));
  assert.equal(lineKey({ productKey: "drink", selections: {} }), lineKey({ productKey: "drink", selections: { extras: [] } }));
});
test("storage rejects invalid selections, injected prices, impossible quantities and backend IDs", () => {
  const valid = { productKey: product.key, selections, quantity: 2, priceOre: 1 };
  const lines = normalizeLines([valid, { ...valid, productKey: "backend-id" }, { ...valid, quantity: 21 }, { ...valid, quantity: -1 }, { ...valid, quantity: 1.5 }, { ...valid, selections: {} }, null], demoProducts);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantity, 2);
  assert.equal("priceOre" in lines[0], false);
  assert.equal(receiptLines(lines, demoProducts)[0].unitPriceOre, 17500);
  assert.equal(normalizeLines([{ productKey: product.key, optionKey: "rice", quantity: 1 }], demoProducts)[0].selections.side[0], "rice");
});
const baseOrder = () => ({ reference: "DEMO-1234ABCD", createdAt: new Date().toISOString(), orderType: "dine-in", paymentMethod: "swish", lines: receiptLines([{ productKey: product.key, selections, quantity: 2 }], demoProducts), totalOre: 35000, status: "received", cartConsumed: false, demoOnly: true });
test("receipts snapshot selections and totals independently of future cart edits", () => {
  const input = { productKey: product.key, selections: structuredClone(selections), quantity: 2 };
  const receipt = receiptLines([input], demoProducts);
  input.selections.side[0] = "fries";
  input.quantity = 10;
  assert.deepEqual(receipt[0].options, ["Ris", "Extra vitlökssås", "Coca-Cola"]);
  assert.equal(receipt[0].quantity, 2);
  assert.equal(receipt[0].selections.side[0], "rice");
});
test("status changes require explicit valid events, acceptance and preparation", () => {
  let order = baseOrder();
  assert.equal(transitionOrder(order, { type: "order_ready" }), order);
  order = transitionOrder(order, { type: "order_created" });
  assert.equal(order.status, "waiting");
  assert.equal(transitionOrder(order, { type: "order_accepted", estimateMinutes: 0 }), order);
  order = transitionOrder(order, { type: "order_accepted", estimateMinutes: 10 });
  assert.equal(order.status, "accepted");
  assert.equal(order.estimateMinutes, 10);
  order = transitionOrder(order, { type: "order_preparing" });
  assert.equal(order.status, "preparing");
  order = transitionOrder(order, { type: "order_ready" });
  assert.equal(order.status, "ready");
  assert.equal(transitionOrder(order, { type: "order_rejected" }), order);
  const rejected = transitionOrder({ ...baseOrder(), status: "waiting" }, { type: "order_rejected" });
  assert.equal(rejected.status, "rejected");
  assert.equal(transitionOrder(rejected, { type: "order_accepted", estimateMinutes: 10 }), rejected);
});
test("only valid frontend demo receipts can be restored", () => {
  assert.equal(parseStoredOrder(baseOrder(), demoProducts).totalOre, 35000);
  assert.equal(parseStoredOrder({ ...baseOrder(), totalOre: 1 }, demoProducts).totalOre, 35000);
  for (const patch of [{ demoOnly: false }, { reference: "REAL-1" }, { paymentMethod: "constructor" }, { status: "fake" }, { createdAt: "bad" }, { lines: [] }]) assert.equal(parseStoredOrder({ ...baseOrder(), ...patch }, demoProducts), null);
});

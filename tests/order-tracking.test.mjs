import test from "node:test";
import assert from "node:assert/strict";
import { demoProducts } from "../src/demo/menuData.ts";
import { receiptLines } from "../src/demo/orderModel.ts";
import { emptyTracking, formatCountdown, parseTracking, preparationSeconds, remainingSeconds, trackingStatus, transitionTracking } from "../src/demo/trackingModel.ts";

const time = Date.parse("2026-11-01T12:00:00Z");
function summary(reference = "DEMO-1234ABCD") {
  return { reference, createdAt: new Date(time).toISOString(), orderType: "takeaway", paymentMethod: "swish",
    lines: receiptLines([{ productKey: "demo:chicken-shawarma:plate", quantity: 2, selections: { side: ["rice"], extras: ["garlic"], drink: ["drink-0"], exclusions: ["pickles"] } }], demoProducts), totalOre: 35000 };
}
function pending() { return transitionTracking(emptyTracking, { type: "preview_created", summary: summary() }); }
function accepted() { return transitionTracking(pending(), { type: "order_accepted", at: time + 4000 }); }

test("tracking starts only after receipt continuation and explicit acceptance", () => {
  assert.equal(emptyTracking.active, null);
  const state = pending();
  assert.equal(state.confirmation.status, "pending");
  assert.equal(state.active, null);
  assert.equal(state.confirmation.acceptedAt, null);
  assert.equal(transitionTracking(state, { type: "confirmation_dismissed" }), state);
  const next = accepted();
  assert.equal(next.active.acceptedAt, time + 4000);
  assert.equal(next.active.durationSeconds, 1500);
  assert.equal(next.active.acknowledged, false);
  assert.equal(transitionTracking(next, { type: "order_accepted", at: time + 8000 }), next, "Duplicate acceptance must not reset time");
  assert.equal(transitionTracking(next, { type: "order_rejected" }), next);
  const acknowledged = transitionTracking(next, { type: "confirmation_dismissed" });
  assert.equal(acknowledged.confirmation, null);
  assert.equal(acknowledged.active.acknowledged, true);
});

test("countdown derives from acceptance time, clamps at zero and never claims ready", () => {
  const order = accepted().active;
  assert.equal(formatCountdown(remainingSeconds(order, order.acceptedAt)), "25:00");
  assert.equal(formatCountdown(remainingSeconds(order, order.acceptedAt + 1000)), "24:59");
  assert.equal(formatCountdown(remainingSeconds(order, order.acceptedAt + 61000)), "23:59");
  assert.equal(formatCountdown(remainingSeconds(order, order.acceptedAt + 1500000)), "00:00");
  assert.equal(remainingSeconds(order, order.acceptedAt + 99999999), 0);
  assert.equal(remainingSeconds(order, order.acceptedAt - 10000), preparationSeconds);
  assert.equal(trackingStatus(order, order.acceptedAt + 1500000), "Beräknad tid uppnådd");
});

test("rejected orders never gain a timer and do not erase a previously accepted order", () => {
  const rejected = transitionTracking(pending(), { type: "order_rejected" });
  assert.equal(rejected.confirmation.status, "rejected");
  assert.equal(rejected.confirmation.acceptedAt, null);
  assert.equal(rejected.active, null);
  assert.equal(transitionTracking(rejected, { type: "order_accepted", at: time + 1000 }), rejected);
  const old = transitionTracking(accepted(), { type: "confirmation_dismissed" });
  const next = transitionTracking(old, { type: "preview_created", summary: summary("DEMO-1234ABCE") });
  const result = transitionTracking(transitionTracking(next, { type: "order_rejected" }), { type: "confirmation_dismissed" });
  assert.deepEqual(result.active, old.active);
  assert.equal(result.confirmation.status, "rejected");
  assert.equal(result.confirmation.acknowledged, true);
  assert.deepEqual(parseTracking(result, demoProducts, time + 5000), result);
  assert.equal(transitionTracking(result, { type: "preview_created", summary: summary("DEMO-1234ABCF") }).confirmation.status, "pending");
});

test("session restoration retains snapshot, customizations, timestamp and expired status", () => {
  const state = transitionTracking(accepted(), { type: "confirmation_dismissed" });
  const restored = parseTracking(JSON.parse(JSON.stringify(state)), demoProducts, time + 1800000);
  assert.deepEqual(restored, state);
  assert.equal(restored.active.summary.totalOre, 35000);
  assert.deepEqual(restored.active.summary.lines[0].selections.exclusions, ["pickles"]);
  assert.equal(trackingStatus(restored.active, time + 1800000), "Beräknad tid uppnådd");
  const input = summary();
  const copied = transitionTracking(emptyTracking, { type: "preview_created", summary: input });
  input.lines[0].selections.exclusions.push("garlic");
  assert.deepEqual(copied.confirmation.summary.lines[0].selections.exclusions, ["pickles"]);
});

test("malformed or non-demo persisted state cannot become a tracked real order", () => {
  for (const input of [null, false, "bad", {}, { active: { demoOnly: false } }]) assert.deepEqual(parseTracking(input, demoProducts, time), emptyTracking);
  for (const patch of [{ demoOnly: false }, { status: "ready" }, { durationSeconds: -1 }, { acceptedAt: null }, { acceptedAt: time + 999999 }, { acknowledged: "yes" }]) {
    assert.equal(parseTracking({ active: { ...accepted().active, ...patch } }, demoProducts, time + 5000).active, null);
  }
  const invalid = accepted();
  invalid.active.summary.reference = "REAL-123";
  assert.equal(parseTracking(invalid, demoProducts, time + 5000).active, null);
});

import test from "node:test";
import assert from "node:assert/strict";
import { trackingDemoMap } from "../src/demo/demoMapIllustration.ts";

test("tracking map uses isolated illustration points and a connected demo route", () => {
  assert.equal(trackingDemoMap.demoOnly, true);
  const { restaurant, customer, route } = trackingDemoMap;
  assert.deepEqual(route[0], [restaurant.x, restaurant.y]);
  assert.deepEqual(route.at(-1), [customer.x, customer.y]);
  assert.notDeepEqual(restaurant, customer);
  assert(route.flat().every(value => Number.isFinite(value) && value >= 0 && value <= 100));
  assert.deepEqual(Object.keys(trackingDemoMap).sort(), ["customer", "demoOnly", "restaurant", "route"]);
});

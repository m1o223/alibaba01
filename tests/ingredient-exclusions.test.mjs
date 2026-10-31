import assert from 'node:assert/strict';
import test from 'node:test';
import { demoProducts, getDemoProduct } from '../src/demo/menuData.ts';
import { demoIngredientExclusions, exclusionsVerifiedForRealOrders } from '../src/demo/ingredientExclusionConfig.ts';
import { lineKey, normalizeLines, optionLabels, parseStoredOrder, receiptLines, unitPrice, validateSelections } from '../src/demo/orderModel.ts';

const plate = getDemoProduct('demo:chicken-shawarma:plate');
const selected = { side: ['rice'], drink: ['drink-0'], extras: ['garlic'], exclusions: ['garlic', 'pickles'] };

test('exclusion examples are opt-in, category-specific and support product overrides', () => {
  assert.ok(plate.ingredientExclusions.options.length > 0);
  assert.notDeepEqual(plate.ingredientExclusions, getDemoProduct('demo:meat-shawarma:plate').ingredientExclusions);
  for (const slug of ['drinks', 'sauces', 'manaqish', 'grilled-chicken']) {
    assert.ok(demoProducts.filter(product => product.categorySlug === slug).every(product => product.ingredientExclusions.options.length === 0));
  }
  assert.equal(getDemoProduct('demo:pizza:margherita').ingredientExclusions.options.length, 0);
  assert.equal(getDemoProduct('demo:pizza:kebab').ingredientExclusions.options.length, 2);
  assert.deepEqual(demoIngredientExclusions('unknown', 'unknown').options, []);
  for (const product of demoProducts) assert.equal(exclusionsVerifiedForRealOrders(product.ingredientExclusions, true), false);
});

test('zero, one and multiple exclusions are valid and never affect prices or paid options', () => {
  for (const exclusions of [[], ['garlic'], ['garlic', 'pickles'], ['pickles']]) {
    const choices = { ...selected, exclusions };
    assert.equal(validateSelections(plate, choices), true);
    assert.equal(unitPrice(plate, choices), 17500);
  }
  assert.equal(validateSelections(plate, { exclusions: ['garlic'] }), false, 'Required side remains required');
  assert.equal(unitPrice(plate, { side: ['rice'], exclusions: ['garlic'] }), 14500);
  assert.deepEqual(optionLabels(plate, selected), ['Ris', 'Extra vitl\u00f6kss\u00e5s', 'Coca-Cola', 'Utan vitl\u00f6kskr\u00e4m', 'Utan pickles']);
});

test('unknown, malformed, duplicate and irrelevant exclusions are rejected', () => {
  for (const exclusions of [null, 'garlic', ['unknown'], ['garlic', 'garlic'], [1], ['pomegranate']]) {
    assert.equal(validateSelections(plate, { ...selected, exclusions }), false);
  }
  assert.equal(validateSelections(getDemoProduct('demo:drinks:water'), { exclusions: ['garlic'] }), false);
});

test('unverified ingredients or exclusions cannot be used for non-demo products', () => {
  const live = { ...plate, demo: false };
  assert.equal(validateSelections(live, selected), false);
  assert.equal(validateSelections({ ...live, ingredientExclusions: { ...plate.ingredientExclusions, verificationStatus: 'verified' } }, selected), false);
  assert.equal(validateSelections({ ...live, allergenVerificationStatus: 'verified' }, selected), false);
  assert.equal(validateSelections({ ...live, allergenVerificationStatus: 'verified', ingredientExclusions: { ...plate.ingredientExclusions, verificationStatus: 'verified' } }, selected), true);
});

test('equivalent exclusions share an identity but different portions remain separate', () => {
  const line = { productKey: plate.key, quantity: 1, selections: selected };
  assert.equal(lineKey(line), lineKey({ ...line, selections: { ...selected, exclusions: ['pickles', 'garlic'] } }));
  assert.notEqual(lineKey(line), lineKey({ ...line, selections: { ...selected, exclusions: ['onion'] } }));
  assert.equal(normalizeLines([line, { ...line, quantity: 2, selections: { ...selected, exclusions: ['onion'] } }], demoProducts).length, 2);
  assert.equal(validateSelections(plate, { side: ['rice'] }), true, 'Existing carts remain valid');
});

test('demo checkout payload and restaurant receipt preserve exclusions across storage', () => {
  const inputs = [{ productKey: plate.key, quantity: 1, selections: structuredClone(selected) },
    { productKey: plate.key, quantity: 2, selections: { ...selected, exclusions: ['onion'] } }];
  const lines = receiptLines(inputs, demoProducts);
  inputs[0].selections.exclusions.length = 0;
  assert.deepEqual(lines[0].exclusions.map(option => option.key), ['garlic', 'pickles']);
  assert.deepEqual(lines[1].exclusions.map(option => option.key), ['onion']);
  const order = { reference: 'DEMO-AABB1234', createdAt: new Date().toISOString(), orderType: 'takeaway', paymentMethod: 'swish', lines, totalOre: 52500, status: 'received', cartConsumed: false, demoOnly: true };
  const restored = parseStoredOrder(JSON.parse(JSON.stringify(order)), demoProducts);
  assert.deepEqual(restored.lines, lines);
  assert.equal(restored.totalOre, 52500);
  assert.equal(parseStoredOrder({ ...order, demoOnly: false }, demoProducts), null);
});

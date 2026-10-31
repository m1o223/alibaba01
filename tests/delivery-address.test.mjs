import test from 'node:test';
import assert from 'node:assert/strict';
import { addressErrors, addressLifetime, addressStorageKey, emptyAddress, forgetAddress, normalizeAddress, readRememberedAddress, rememberAddress } from '../src/demo/delivery/addressModel.ts';
import { approvedLookupPath, lookupAddress } from '../src/demo/delivery/addressLookup.ts';
const address = { ...emptyAddress(), street: 'Testgatan 12', postalCode: '12345', city: 'Teststad', entranceCode: 'PRIVATE-CODE', instructions: 'PRIVATE-NOTE', handoff: 'door' };
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };

test('address validation requires street number, Swedish postcode and city without assuming coverage', () => {
  assert.equal(Object.keys(addressErrors(emptyAddress())).length, 3);
  const clean = normalizeAddress(address);
  assert.equal(clean.postalCode, '123 45');
  assert.deepEqual(addressErrors(clean), {});
  assert(addressErrors({ ...address, street: 'Gata', postalCode: '12', city: '' }).street);
  assert.equal(normalizeAddress({ ...address, locationType: '__proto__' }), null);
  assert.equal(normalizeAddress({ ...address, street: 'x'.repeat(161) }), null);
  assert.equal(normalizeAddress({ ...address, locationType: 'house', apartment: '3', floor: '2' }).entranceCode, '');
});
test('remembering needs consent and explicit replacement; excludes entrance codes and notes', () => {
  const store = storage();
  assert.equal(rememberAddress(store, address, false, false, 100), false);
  assert.equal(store.getItem(addressStorageKey), null);
  assert.equal(rememberAddress(store, address, true, false, 100), true);
  assert(!store.getItem(addressStorageKey).includes('PRIVATE'));
  assert.equal(readRememberedAddress(store, 101).handoff, 'door');
  const other = { ...address, street: 'Andra gatan 7' };
  assert.equal(rememberAddress(store, other, true, false, 102), false);
  assert.equal(readRememberedAddress(store, 103).street, address.street);
  assert.equal(rememberAddress(store, other, true, true, 104), true);
  assert.equal(readRememberedAddress(store, 105).street, other.street);
  assert.equal(readRememberedAddress(store, 104 + addressLifetime), null);
  assert.equal(store.getItem(addressStorageKey), null);
});
test('deletion, tampered records and blocked device storage fail safely', () => {
  const store = storage();
  rememberAddress(store, address, true, false);
  assert(forgetAddress(store));
  assert.equal(readRememberedAddress(store), null);
  store.setItem(addressStorageKey, JSON.stringify({ version: 1, consent: false, address, expiresAt: Date.now() + 1000 }));
  assert.equal(readRememberedAddress(store), null);
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  assert.equal(readRememberedAddress(blocked), null);
  assert.equal(rememberAddress(blocked, address, true, false), false);
  assert.equal(forgetAddress(blocked), false);
});
test('geocoder accepts only an explicit same-origin API path and validates suggestions', async () => {
  for (const value of [undefined, '', '//external.example/api', 'https://external.example/api', '/api/reverse?key=secret']) assert.equal(approvedLookupPath(value), null);
  assert.equal(approvedLookupPath('/api/delivery/reverse'), '/api/delivery/reverse');
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(url, '/api/delivery/reverse');
      assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store');
      assert.deepEqual(JSON.parse(options.body), { latitude: 58, longitude: 16 });
      assert(!options.body.includes('PRIVATE'));
      return Response.json({ street: 'Förslag 1', postalCode: '12345', city: 'Teststad' });
    };
    const result = await lookupAddress('/api/delivery/reverse', { latitude: 58, longitude: 16 }, new AbortController().signal);
    assert.equal(result.street, 'Förslag 1');
    await assert.rejects(lookupAddress('/api/delivery/reverse', { latitude: 100, longitude: 16 }, new AbortController().signal));
    assert.equal(calls, 1);
    globalThis.fetch = async () => Response.json({ street: null });
    await assert.rejects(lookupAddress('/api/delivery/reverse', { latitude: 58, longitude: 16 }, new AbortController().signal));
  } finally { globalThis.fetch = original; }
});

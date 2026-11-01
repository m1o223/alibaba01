import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPageError, errorDiagnostic } from '../src/errors/errorModel.ts';

test('not-found, HTTP server, transport and rendering failures remain distinct', () => {
  assert.equal(classifyPageError({ status: 404 }), 'not-found');
  assert.equal(classifyPageError({ status: 503 }, false), 'server');
  assert.equal(classifyPageError({ name: 'NetworkError' }), 'network');
  assert.equal(classifyPageError(new TypeError('Failed to fetch dynamically imported module'), false), 'network');
  assert.equal(classifyPageError(new TypeError('Importing a module script failed.'), false), 'network');
  assert.equal(classifyPageError(new TypeError('Failed to fetch dynamically imported module'), true), 'server');
  assert.equal(classifyPageError(new ReferenceError('missingVariable'), false), 'server');
  assert.equal(classifyPageError(null), 'server');
});

test('diagnostics retain useful types and component names but not customer data', () => {
  const result = errorDiagnostic({ name: 'TypeError', status: 503, message: 'secret-address', card: 'secret-card', stack: 'secret-stack' }, '\n at ProductDetails (https://example.com/a.js?secret-token)\n at AppLayout');
  assert.deepEqual(result, { type: 'TypeError', status: 503, components: ['ProductDetails', 'AppLayout'] });
  assert(!JSON.stringify(result).includes('secret'));
  assert.deepEqual(errorDiagnostic({ name: 'secret-email', status: 'secret-code' }), { type: 'Error', status: undefined, components: [] });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { demoProducts } from '../src/demo/menuData.ts';
import { categoryCardMedia } from '../src/demo/categoryCardMedia.ts';

test('category media resolves every product without mutating business data', () => {
  const before = JSON.stringify(demoProducts);
  for (const product of demoProducts) {
    const media = categoryCardMedia(product);
    assert.ok(media.emoji);
    if (media.src) assert.ok(existsSync(new URL('../public' + media.src, import.meta.url)));
    assert.equal(media.temporary, true);
  }
  assert.equal(JSON.stringify(demoProducts), before);
});

test('existing product photos and galleries take precedence over examples', () => {
  const product = demoProducts.find(product => product.key === 'demo:pizza:margherita');
  assert.equal(categoryCardMedia({ ...product, imageUrl: '/real-photo.jpg' }).src, '/real-photo.jpg');
  assert.equal(categoryCardMedia({ ...product, images: ['/gallery-photo.jpg'] }).src, '/gallery-photo.jpg');
  assert.equal(categoryCardMedia({ ...product, imageUrl: '/real-photo.jpg' }).temporary, false);
  assert.equal(categoryCardMedia({ ...product, key: 'future-product', imageUrl: undefined, images: [] }).emoji, product.emoji);
});

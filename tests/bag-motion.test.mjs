import test from 'node:test';
import assert from 'node:assert/strict';
import { bagFlightFrame, confirmationDuration, flightDuration, arrivalDuration } from '../src/components/bagMotion.ts';

test('bag flight waits for confirmation, curves to the actual target and disappears in 980ms', () => {
  const start = { x: 150, y: 700 }, end = { x: 270, y: 28 };
  const initial = bagFlightFrame(start, end, 0);
  assert.deepEqual([initial.x, initial.y, initial.opacity], [150, 700, 0]);
  const middle = bagFlightFrame(start, end, confirmationDuration + flightDuration / 2);
  assert.ok(middle.x > start.x && middle.x < end.x);
  assert.ok(middle.y > end.y && middle.y < start.y);
  assert.notEqual(middle.y, start.y + (end.y - start.y) * ((middle.x - start.x) / (end.x - start.x)));
  const arrival = bagFlightFrame(start, end, confirmationDuration + flightDuration);
  assert.deepEqual([arrival.x, arrival.y, arrival.arrived, arrival.scale], [270, 28, true, 1]);
  const finish = bagFlightFrame(start, end, confirmationDuration + flightDuration + arrivalDuration);
  assert.equal(finish.opacity, 0);
  assert.ok(finish.scale < 0.11);
  assert.equal(finish.finished, true);
});

test('flight position remains finite for all viewport sizes and follows a moved target', () => {
  for (const width of [307, 375, 390, 768, 1440]) {
    const end = { x: width - 38, y: 28 };
    for (let elapsed = 0; elapsed <= 1100; elapsed += 10) {
      const frame = bagFlightFrame({ x: width / 2, y: 700 }, end, elapsed);
      assert.ok(Number.isFinite(frame.x) && Number.isFinite(frame.y));
      assert.ok(frame.x >= 0 && frame.x <= width && frame.y >= 28 && frame.y <= 700);
      assert.ok(frame.opacity >= 0 && frame.opacity <= 1);
    }
    assert.equal(bagFlightFrame({ x: 100, y: 700 }, end, 900).x, end.x);
  }
});

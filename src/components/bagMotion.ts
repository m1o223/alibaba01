export const confirmationDuration = 120;
export const flightDuration = 700;
export const arrivalDuration = 160;

export type Point = { x: number; y: number };

export function bagFlightFrame(start: Point, end: Point, elapsed: number) {
  const progress = Math.min(1, Math.max(0, (elapsed - confirmationDuration) / flightDuration));
  const t = progress * progress * (3 - 2 * progress);
  const control = { x: start.x + (end.x - start.x) * 0.1, y: end.y + (start.y - end.y) * 0.2 };
  const remaining = 1 - t;
  const arrival = Math.min(1, Math.max(0, (elapsed - confirmationDuration - flightDuration) / arrivalDuration));
  return {
    x: remaining * remaining * start.x + 2 * remaining * t * control.x + t * t * end.x,
    y: remaining * remaining * start.y + 2 * remaining * t * control.y + t * t * end.y,
    scale: 1 - arrival * 0.9,
    opacity: elapsed < confirmationDuration ? 0 : 1 - arrival,
    arrived: progress === 1,
    finished: arrival === 1,
  };
}

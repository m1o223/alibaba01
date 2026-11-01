// Illustration coordinates only: no GPS, customer address or verified route.
export type TrackingMapIllustration = {
  demoOnly: true;
  restaurant: { x: number; y: number };
  customer: { x: number; y: number };
  route: readonly (readonly [number, number])[];
};

export const trackingDemoMap: TrackingMapIllustration = {
  demoOnly: true,
  restaurant: { x: 30, y: 64 },
  customer: { x: 69, y: 33 },
  route: [[30, 64], [45, 64], [45, 40], [69, 40], [69, 33]],
};

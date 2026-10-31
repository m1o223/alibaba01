import type { Ref } from "react";

export function TakeawayBagIcon({ ref, size = 26 }: { ref?: Ref<HTMLImageElement>; size?: number }) {
  return <img ref={ref} src="/assets/takeaway-bag.svg" alt="" aria-hidden="true" width={size} height={size} draggable={false} />;
}

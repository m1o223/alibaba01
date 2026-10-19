import { createContext, useContext } from "react";
import type { CartLineView } from "../components/CartDrawerContent";
import type { DemoLine, Selections } from "./orderModel";

type DemoCartValue = {
  items: CartLineView[];
  count: number;
  totalLabel: string;
  totalOre: number;
  lines: DemoLine[];
  add: (productKey: string, selections?: Selections, quantity?: number) => boolean;
  changeQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  consume: (lines: DemoLine[]) => void;
};

export const DemoCartContext = createContext<DemoCartValue | null>(null);
export function useDemoCart() { return useContext(DemoCartContext); }

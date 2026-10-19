import { createContext, useContext } from "react";
import type { CartLineView } from "../components/CartDrawerContent";

type DemoCartValue = {
  items: CartLineView[];
  count: number;
  totalLabel: string;
  add: (productKey: string, optionKey?: string) => boolean;
  changeQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
};

export const DemoCartContext = createContext<DemoCartValue | null>(null);
export function useDemoCart() { return useContext(DemoCartContext); }

import { createContext, useContext } from "react";
import type { DemoOrder, OrderEvent, OrderType, PaymentMethod } from "./orderModel";

type DemoFlowValue = {
  session: boolean;
  continueDemo: () => void;
  checkout: () => void;
  requestLogin: () => void;
  order: DemoOrder | null;
  pay: (method: PaymentMethod, orderType: OrderType) => void;
  consumeReceipt: () => void;
  dispatch: (event: OrderEvent) => void;
  newOrder: () => void;
};
export const demoLoginEvent = "alibaba:demo-login";
export const DemoFlowContext = createContext<DemoFlowValue | null>(null);
export function useDemoFlow() { return useContext(DemoFlowContext); }

import { useEffect, useState, type ReactNode } from "react";
import { DemoCartContext } from "./DemoCartContext";
import { demoProducts, formatDemoPrice, getDemoProduct } from "./menuData";
import { lineKey, normalizeLines, optionLabels, unitPrice, validateSelections, type DemoLine, type Selections } from "./orderModel";
import { readStored, writeStored } from "./navigation";

const storageKey = "alibaba.preview.demo-cart.v2";
export function DemoCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<DemoLine[]>(() => normalizeLines(readStored(storageKey, readStored("alibaba.preview.demo-cart.v1", [])), demoProducts));
  useEffect(() => { writeStored(storageKey, lines); }, [lines]);

  function add(productKey: string, selections: Selections = {}, quantity = 1) {
    const product = getDemoProduct(productKey);
    if (!product || !validateSelections(product, selections) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return false;
    const next = { productKey, selections: structuredClone(selections), quantity };
    const existing = lines.find(line => lineKey(line) === lineKey(next));
    if (existing && existing.quantity + quantity > 20) return false;
    setLines(current => {
      const match = current.find(line => lineKey(line) === lineKey(next));
      return match ? current.map(line => line === match ? { ...line, quantity: Math.min(20, line.quantity + quantity) } : line) : [...current, next];
    });
    return true;
  }
  const totalOre = lines.reduce((sum, line) => sum + unitPrice(getDemoProduct(line.productKey)!, line.selections) * line.quantity, 0);
  const items = lines.map(line => {
    const product = getDemoProduct(line.productKey)!;
    const price = unitPrice(product, line.selections);
    return {
      id: lineKey(line), name: product.name, imageUrl: product.imageUrl, emoji: product.emoji,
      options: optionLabels(product, line.selections), quantity: line.quantity,
      unitPriceLabel: formatDemoPrice(price), lineTotalLabel: formatDemoPrice(price * line.quantity),
    };
  });
  return <DemoCartContext.Provider value={{
    lines, items, totalOre, count: lines.reduce((sum, line) => sum + line.quantity, 0), totalLabel: formatDemoPrice(totalOre), add,
    changeQuantity: (key, quantity) => {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
      setLines(current => current.map(line => lineKey(line) === key ? { ...line, quantity } : line));
    },
    remove: key => setLines(current => current.filter(line => lineKey(line) !== key)),
    clear: () => setLines([]),
    consume: consumed => setLines(current => current.flatMap(line => {
      const match = consumed.find(item => lineKey(item) === lineKey(line));
      const quantity = line.quantity - (match?.quantity ?? 0);
      return quantity > 0 ? [{ ...line, quantity }] : [];
    })),
  }}>{children}</DemoCartContext.Provider>;
}

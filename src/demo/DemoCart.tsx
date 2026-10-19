import { useEffect, useState, type ReactNode } from "react";
import { DemoCartContext } from "./DemoCartContext";
import { formatDemoPrice, getDemoProduct } from "./menuData";

const storageKey = "alibaba.preview.demo-cart.v1";
type DemoLine = { productKey: string; optionKey?: string; quantity: number };
function lineKey(line: DemoLine) { return JSON.stringify([line.productKey, line.optionKey ?? null]); }

function validLine(value: unknown): value is DemoLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<DemoLine>;
  const product = typeof line.productKey === "string" ? getDemoProduct(line.productKey) : undefined;
  if (!product || !Number.isInteger(line.quantity) || line.quantity! < 1 || line.quantity! > 99) return false;
  return product.requiredOptions
    ? product.requiredOptions.some(option => option.key === line.optionKey)
    : line.optionKey === undefined;
}

function readDemoCart(): DemoLine[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    const unique = new Map<string, DemoLine>();
    for (const candidate of stored.slice(0, 100)) {
      if (!validLine(candidate)) continue;
      const { productKey, optionKey, quantity } = candidate;
      const line = { productKey, optionKey, quantity };
      unique.set(lineKey(line), line);
    }
    return [...unique.values()];
  } catch { return []; }
}

export function DemoCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<DemoLine[]>(readDemoCart);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* In-memory preview still works without storage. */ }
  }, [lines]);

  function add(productKey: string, optionKey?: string) {
    const next = { productKey, optionKey, quantity: 1 };
    if (!validLine(next)) return false;
    setLines(current => {
      const existing = current.find(line => lineKey(line) === lineKey(next));
      return existing
        ? current.map(line => line === existing ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line)
        : [...current, next];
    });
    return true;
  }

  const items = lines.map(line => {
    const product = getDemoProduct(line.productKey)!;
    return {
      id: lineKey(line),
      name: product.name,
      imageUrl: product.imageUrl,
      emoji: product.emoji,
      options: product.requiredOptions?.filter(option => option.key === line.optionKey).map(option => option.name) ?? [],
      quantity: line.quantity,
      unitPriceLabel: formatDemoPrice(product.priceOre),
      lineTotalLabel: formatDemoPrice(product.priceOre * line.quantity),
    };
  });

  return <DemoCartContext.Provider value={{
    items,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalLabel: formatDemoPrice(lines.reduce((sum, line) => sum + getDemoProduct(line.productKey)!.priceOre * line.quantity, 0)),
    add,
    changeQuantity: (key, quantity) => {
      if (!Number.isInteger(quantity) || quantity < 1) return;
      setLines(current => current.map(line => lineKey(line) === key ? { ...line, quantity: Math.min(quantity, 99) } : line));
    },
    remove: key => setLines(current => current.filter(line => lineKey(line) !== key)),
  }}>{children}</DemoCartContext.Provider>;
}

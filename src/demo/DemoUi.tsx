import { Info, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { formatDemoPrice } from "./menuData";
import type { ReceiptLine } from "./orderModel";

export function DemoNotice() {
  return <p className="demo-notice"><Info size={18} aria-hidden="true" /><span>Demo – ingen riktig betalning genomförs. Produkter, tillval och priser är tillfälliga.</span></p>;
}
export function ProductMedia({ src, emoji, name }: { src?: string; emoji: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt={name} onError={() => setFailed(true)} /> : <span role="img" aria-label={name}>{emoji}</span>;
}
export function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="demo-quantity" role="group" aria-label="Antal">
    <button type="button" aria-label="Minska antal" disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={18} /></button>
    <output aria-live="polite" aria-label="Valt antal">{value}</output>
    <button type="button" aria-label="Öka antal" disabled={value >= 20} onClick={() => onChange(value + 1)}><Plus size={18} /></button>
  </div>;
}
export function OrderLines({ lines }: { lines: readonly ReceiptLine[] }) {
  return <ul className="demo-order-lines">
    {lines.map((line, index) => <li key={index}>
      <div><strong>{line.quantity} × {line.name}</strong>{line.options.length ? <p>{line.options.join(", ")}</p> : null}<small>{formatDemoPrice(line.unitPriceOre)} / st</small></div>
      <strong>{formatDemoPrice(line.unitPriceOre * line.quantity)}</strong>
    </li>)}
  </ul>;
}

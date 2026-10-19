import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useDemoCart } from "./DemoCartContext";
import { formatDemoPrice, type DemoProduct } from "./menuData";
import { DemoLink, navigate, productHref } from "./navigation";
import { ProductMedia } from "./DemoUi";

type Props = { product: DemoProduct; categoryName?: string; onAdded: (name: string) => void };
export function DemoProductCard({ product, categoryName, onAdded }: Props) {
  const [addedCount, setAddedCount] = useState(0);
  const cart = useDemoCart();
  useEffect(() => {
    if (!addedCount) return;
    const timer = window.setTimeout(() => setAddedCount(0), 1500);
    return () => window.clearTimeout(timer);
  }, [addedCount]);
  const href = productHref(product.key);
  return <li className="demo-product-card" data-product-key={product.key}>
    <DemoLink className="demo-product-top demo-product-link" href={href} aria-label={`Visa ${product.name}`}>
      <div className="demo-product-image" aria-hidden="true"><ProductMedia src={product.imageUrl} emoji={product.emoji} name="" /></div>
      <div>{categoryName ? <p className="demo-product-category">{categoryName}</p> : null}<h3>{product.name}</h3><p className="demo-product-description">{product.description ?? "Se detaljer och tillval."}</p></div>
    </DemoLink>
    <div className="demo-product-actions">
      <strong>Från {formatDemoPrice(product.priceOre)}</strong>
      <button type="button" disabled={!cart || !product.available} aria-label={`Lägg i påsen: ${product.name}`} onClick={() => {
        if (product.customizationGroups.some(group => group.required)) { navigate(href); return; }
        if (cart?.add(product.key)) { setAddedCount(count => count + 1); onAdded(product.name); }
        else navigate(href);
      }}>{addedCount ? <Check aria-hidden="true" size={18} /> : <Plus aria-hidden="true" size={18} />}{addedCount ? "Tillagd" : "Lägg i påsen"}</button>
    </div>
  </li>;
}

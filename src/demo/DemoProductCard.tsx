import { useEffect, useId, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useDemoCart } from "./DemoCartContext";
import { formatDemoPrice, type DemoProduct } from "./menuData";

type Props = { product: DemoProduct; categoryName?: string; onAdded: (name: string) => void };

export function DemoProductCard({ product, categoryName, onAdded }: Props) {
  const [optionKey, setOptionKey] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  const radioName = useId();
  const cart = useDemoCart();
  const requiresChoice = Boolean(product.requiredOptions?.length);
  useEffect(() => {
    if (!addedCount) return;
    const timer = window.setTimeout(() => setAddedCount(0), 1500);
    return () => window.clearTimeout(timer);
  }, [addedCount]);

  return (
    <li className="demo-product-card" data-product-key={product.key}>
      <div className="demo-product-top">
        <div className="demo-product-image" aria-hidden="true">
          {product.imageUrl ? <img src={product.imageUrl} alt="" width="56" height="56" loading="lazy" /> : product.emoji}
        </div>
        <div>
          {categoryName ? <p className="demo-product-category">{categoryName}</p> : null}
          <h3>{product.name}</h3>
          {product.description ? <p className="demo-product-description">{product.description}</p> : null}
        </div>
      </div>
      {product.requiredOptions ? (
        <fieldset className="demo-product-options">
          <legend>Tillbehör (obligatoriskt)</legend>
          {product.requiredOptions.map(option => (
            <label key={option.key}>
              <input type="radio" name={radioName} value={option.key} checked={optionKey === option.key} onChange={() => setOptionKey(option.key)} required />
              <span>{option.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="demo-product-actions">
        <strong>{formatDemoPrice(product.priceOre)}</strong>
        <button type="button" disabled={!cart || (requiresChoice && !optionKey)} aria-label={`Lägg till ${product.name}`} onClick={() => {
          if (cart?.add(product.key, optionKey || undefined)) {
            setAddedCount(count => count + 1);
            onAdded(product.name);
          }
        }}>
          {addedCount ? <Check aria-hidden="true" size={18} /> : <Plus aria-hidden="true" size={18} />}
          {addedCount ? "Tillagd" : "Lägg till"}
        </button>
      </div>
    </li>
  );
}

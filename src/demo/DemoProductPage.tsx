import { useEffect, useRef, useState } from "react";
import { Check, Info, ShoppingBag } from "lucide-react";
import { useDemoCart } from "./DemoCartContext";
import { formatDemoPrice, getDemoProduct, type DemoProduct } from "./menuData";
import { unitPrice, validateSelections, type Selections } from "./orderModel";
import { DemoLink, withOrderType } from "./navigation";
import { DemoNotice, ProductMedia, Quantity } from "./DemoUi";

function ProductDetails({ product }: { product: DemoProduct }) {
  const cart = useDemoCart()!;
  const [selections, setSelections] = useState<Selections>({});
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const images = product.images;
  const total = unitPrice(product, selections) * quantity;
  const valid = validateSelections(product, selections);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);
  function select(group: string, key: string, multiple: boolean) {
    setMessage("");
    setSelections(current => ({ ...current, [group]: multiple ? current[group]?.includes(key) ? current[group].filter(value => value !== key) : [...(current[group] ?? []), key] : key ? [key] : [] }));
  }
  return <article className="demo-ordering demo-product-page">
    <div className="demo-product-gallery">
      <div className="demo-large-image" onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={event => {
        const start = touchStart.current; const touch = event.changedTouches[0]; touchStart.current = null;
        if (!start || images.length < 2) return;
        const dx = touch.clientX - start.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(touch.clientY - start.y)) setImageIndex(index => (index + (dx < 0 ? 1 : -1) + images.length) % images.length);
      }}><ProductMedia key={images[imageIndex] ?? product.key} src={images[imageIndex]} emoji={product.emoji} name={product.name} /></div>
      {images.length > 1 ? <div className="demo-thumbnails" aria-label="Produktbilder">{images.map((image, index) => <button type="button" key={image} aria-label={`Visa bild ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><ProductMedia src={image} emoji={product.emoji} name="" /></button>)}</div> : null}
    </div>
    <div className="demo-product-content">
      <h1 tabIndex={-1}>{product.name}</h1>
      <p className="demo-base-price">Från {formatDemoPrice(product.priceOre)}</p>
      <p>{product.description ?? (product.categorySlug === "drinks" ? "En dryck från vår tillfälliga demomeny." : product.categorySlug === "sauces" ? "Ett tillbehör från vår tillfälliga demomeny." : "Anpassa din rätt med tillvalen nedan. Produktbeskrivningen är ännu inte bekräftad.")}</p>
      <section className="demo-allergens" aria-label="Ingredienser och allergener">
        <h2>Ingredienser</h2>
        {product.allergenVerificationStatus === "verified" ? <p>{product.ingredients.join(", ")}</p> : null}
        <h2>Allergener</h2>
        {product.allergenVerificationStatus === "verified" ? <p>{product.allergens.join(", ")}</p> : <p><Info size={18} aria-hidden="true" /> Ingredienser och allergener är ännu inte bekräftade. Kontakta restaurangen vid allergi.</p>}
      </section>
      <DemoNotice />
      <form onSubmit={event => {
        event.preventDefault();
        if (!valid) { setMessage("Välj obligatoriska tillbehör innan du lägger till produkten."); return; }
        if (cart.add(product.key, selections, quantity)) { setAdded(true); setMessage(`${quantity} × ${product.name} har lagts i påsen.`); }
        else setMessage("Högst 20 av samma kombination kan finnas i påsen. Ändra antalet i påsen först.");
      }}>
        {product.customizationGroups.map(group => <fieldset className="demo-option-group" key={group.key}>
          <legend>{group.name}{group.required ? " (obligatoriskt)" : ""}</legend>
          {!group.required && group.type === "single" ? <label className="demo-option"><input type="radio" name={group.key} checked={!selections[group.key]?.length} onChange={() => select(group.key, "", false)} /><span>Ingen dryck</span><span>0 kr</span></label> : null}
          {group.options.map(option => <label className="demo-option" key={option.key}>
            <input type={group.type === "multiple" ? "checkbox" : "radio"} name={group.key} checked={selections[group.key]?.includes(option.key) ?? false} required={group.required && group.type === "single"} onChange={() => select(group.key, option.key, group.type === "multiple")} />
            <span>{option.name}</span><span>{option.priceOre ? `+${formatDemoPrice(option.priceOre)}` : "0 kr"}</span>
          </label>)}
        </fieldset>)}
        <div className="demo-purchase">
          <div className="demo-purchase-row"><span>Antal</span><Quantity value={quantity} onChange={setQuantity} /></div>
          <div className="demo-total"><span>Totalt</span><strong aria-live="polite">{formatDemoPrice(total)}</strong></div>
          <button className="demo-primary" type="submit" disabled={!valid}>{added ? <Check size={19} /> : <ShoppingBag size={19} />}{added ? "Tillagd i påsen" : "Lägg i påsen"}</button>
          {!valid ? <p className="demo-muted">Välj tillbehör för att fortsätta.</p> : null}
          <p className="demo-feedback" role="status">{message}</p>
        </div>
      </form>
    </div>
  </article>;
}
export function DemoProductPage({ productKey }: { productKey: string }) {
  const product = getDemoProduct(productKey);
  return product ? <ProductDetails key={product.key} product={product} /> : <section className="demo-ordering"><h1>Produkten hittades inte</h1><DemoLink href={withOrderType("/menu")}>Tillbaka till menyn</DemoLink></section>;
}

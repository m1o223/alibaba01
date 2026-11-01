import { useRef, useState } from "react";
import { replacePageUrl, useLocation } from "../navigation";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import { demoCategories, searchDemoProducts, type DemoCategory, type DemoProduct } from "./menuData";
import { DemoProductCard } from "./DemoProductCard";
import "../styles/menu.css";
import "./demoMenu.css";

function readQuery(key: string) { return new URLSearchParams(window.location.search).get(key) ?? ""; }
function saveQuery(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  replacePageUrl(url);
}

function currentCategory() {
  const slug = window.location.hash.slice(1);
  return slug === "fries" ? "salads" : slug;
}

function MenuSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = "Sök efter mat";
  return <div className="menu-search" role="search" aria-label={label}>
    <Search aria-hidden="true" size={20} strokeWidth={1.8} />
    <input ref={inputRef} type="search" placeholder={`${label}…`} aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
    {value ? <button type="button" aria-label="Rensa sökning" title="Rensa sökning" onClick={() => {
      onChange("");
      inputRef.current?.focus();
    }}><X aria-hidden="true" size={20} /></button> : null}
  </div>;
}

function ProductResults({ products, global = false, onAdded }: { products: DemoProduct[]; global?: boolean; onAdded: (name: string) => void }) {
  return <>
    {global ? <p className="menu-search-status" role="status" aria-live="polite" aria-atomic="true">
      {products.length ? `${products.length} ${products.length === 1 ? "produkt" : "produkter"}` : "Inga produkter hittades"}
    </p> : null}
    <ul className="demo-product-grid" aria-label="Maträtter">
      {products.map(product => <DemoProductCard key={product.key} product={product} presentation={global ? "search" : "category"} categoryName={global ? demoCategories.find(category => category.slug === product.categorySlug)?.name : undefined} onAdded={onAdded} />)}
    </ul>
  </>;
}

function CategoryProducts({ category, onAdded }: { category: DemoCategory; onAdded: (name: string) => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return <div className="demo-category-view">
    <a className="demo-back-link" href="#menu-top"><ArrowLeft size={18} aria-hidden="true" />Alla kategorier</a>
    <h2 ref={titleRef} id={category.slug} tabIndex={-1}>{category.name}</h2>
    <ProductResults products={category.products} onAdded={onAdded} />
  </div>;
}

export function DemoMenuPage() {
  useLocation();
  const query = readQuery("q");
  const [, refreshQuery] = useState(0);
  const [addedMessage, setAddedMessage] = useState("");
  const slug = currentCategory();
  const selected = demoCategories.find(category => category.slug === slug);
  const searching = query.trim().length > 0;

  return <section className="menu-page demo-menu" aria-labelledby={selected ? selected.slug : "menu-page-title"}>
    {!selected ? <>
      <div className="menu-page-header" id="menu-top">
        <h1 id="menu-page-title">Vår meny</h1>
      </div>
      <MenuSearch value={query} onChange={value => { saveQuery("q", value); refreshQuery(value => value + 1); }} />
    </> : null}
    <p className="demo-added-status" role="status" aria-live="polite" aria-atomic="true">{addedMessage}</p>
    {selected ? (
      <CategoryProducts key={selected.slug} category={selected} onAdded={name => setAddedMessage(`${name} har lagts till i demovarukorgen.`)} />
    ) : searching ? (
      <ProductResults products={searchDemoProducts(query)} global onAdded={name => setAddedMessage(`${name} har lagts till i demovarukorgen.`)} />
    ) : <>
      <nav className="menu-categories" aria-label="Menykategorier">
        {demoCategories.map(category => <a className="menu-category-card" href={`#${category.slug}`} key={category.slug} aria-label={`Öppna kategori ${category.name}`}>
          <span className="menu-category-media demo-category-emoji" aria-hidden="true">{category.emoji}</span>
          <span className="menu-category-label"><span>{category.name}</span><ChevronRight aria-hidden="true" size={18} /></span>
        </a>)}
      </nav>
    </>}
  </section>;
}

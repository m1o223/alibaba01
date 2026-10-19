import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ChevronRight, Info, Search, X } from "lucide-react";
import { demoCategories, searchDemoProducts, type DemoCategory, type DemoProduct } from "./menuData";
import { DemoProductCard } from "./DemoProductCard";
import "../styles/menu.css";
import "./demoMenu.css";

function readQuery(key: string) { return new URLSearchParams(window.location.search).get(key) ?? ""; }
function saveQuery(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  history.replaceState(history.state, "", url);
}

function subscribeToCategory(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function currentCategory() {
  const slug = window.location.hash.slice(1);
  return slug === "fries" ? "salads" : slug;
}

function MenuSearch({ value, onChange, categoryOnly = false }: { value: string; onChange: (value: string) => void; categoryOnly?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = categoryOnly ? "Sök i denna kategori" : "Sök efter mat";
  return <div className="menu-search" role="search" aria-label={label}>
    <Search aria-hidden="true" size={20} strokeWidth={1.8} />
    <input ref={inputRef} type="search" placeholder={`${label}…`} aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
    {value ? <button type="button" aria-label={`Rensa ${categoryOnly ? "kategorisökning" : "sökning"}`} title="Rensa sökning" onClick={() => {
      onChange("");
      inputRef.current?.focus();
    }}><X aria-hidden="true" size={20} /></button> : null}
  </div>;
}

function ProductResults({ products, global = false, onAdded }: { products: DemoProduct[]; global?: boolean; onAdded: (name: string) => void }) {
  return <>
    <p className="menu-search-status" role="status" aria-live="polite" aria-atomic="true">
      {products.length ? `${products.length} ${products.length === 1 ? "produkt" : "produkter"}` : "Inga produkter hittades"}
    </p>
    <ul className="demo-product-grid" aria-label="Maträtter">
      {products.map(product => <DemoProductCard key={product.key} product={product} categoryName={global ? demoCategories.find(category => category.slug === product.categorySlug)?.name : undefined} onAdded={onAdded} />)}
    </ul>
  </>;
}

function CategoryProducts({ category, onAdded }: { category: DemoCategory; onAdded: (name: string) => void }) {
  const [query, setQuery] = useState(() => readQuery(`q-${category.slug}`));
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (typeof history.state?.scrollY === "number") return;
    titleRef.current?.focus({ preventScroll: true });
    titleRef.current?.scrollIntoView({ block: "start" });
  }, [category.slug]);
  return <div className="demo-category-view">
    <a className="demo-back-link" href="#menu-top"><ArrowLeft size={18} aria-hidden="true" />Alla kategorier</a>
    <h2 ref={titleRef} id={category.slug} tabIndex={-1}>{category.name}</h2>
    <MenuSearch value={query} onChange={value => { setQuery(value); saveQuery(`q-${category.slug}`, value); }} categoryOnly />
    <ProductResults products={searchDemoProducts(query, category)} onAdded={onAdded} />
  </div>;
}

export function DemoMenuPage() {
  const [query, setQuery] = useState(() => readQuery("q"));
  const [addedMessage, setAddedMessage] = useState("");
  const slug = useSyncExternalStore(subscribeToCategory, currentCategory);
  const selected = demoCategories.find(category => category.slug === slug);
  const searching = query.trim().length > 0;

  return <section className="menu-page demo-menu" aria-labelledby="menu-page-title">
    <div className="menu-page-header" id="menu-top">
      <h1 id="menu-page-title">Vår meny</h1>
      <p>Upptäck våra rätter, tillagade med omsorg.</p>
    </div>
    <p className="demo-menu-notice"><Info size={18} aria-hidden="true" /><span>Demomeny. Produkter och priser är tillfälliga. Ingen riktig beställning eller betalning genomförs.</span></p>
    <MenuSearch value={query} onChange={value => { setQuery(value); saveQuery("q", value); }} />
    <p className="demo-added-status" role="status" aria-live="polite" aria-atomic="true">{addedMessage}</p>
    {searching ? (
      <ProductResults products={searchDemoProducts(query)} global onAdded={name => setAddedMessage(`${name} har lagts till i demovarukorgen.`)} />
    ) : selected ? (
      <CategoryProducts key={selected.slug} category={selected} onAdded={name => setAddedMessage(`${name} har lagts till i demovarukorgen.`)} />
    ) : <>
      <p className="menu-search-status">14 kategorier</p>
      <nav className="menu-categories" aria-label="Menykategorier">
        {demoCategories.map(category => <a className="menu-category-card" href={`#${category.slug}`} key={category.slug} aria-label={`Öppna kategori ${category.name}`}>
          <span className="menu-category-media demo-category-emoji" aria-hidden="true">{category.emoji}</span>
          <span className="menu-category-label"><span>{category.name}</span><ChevronRight aria-hidden="true" size={18} /></span>
        </a>)}
      </nav>
    </>}
  </section>;
}

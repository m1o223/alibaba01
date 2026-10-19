import { useRef, useState } from "react";
import { ChevronRight, Search, UtensilsCrossed, X } from "lucide-react";
import { menuCategories } from "../data/menuCategories";
import "../styles/menu.css";

const visibleCategories = menuCategories.filter(category => !category.hidden);
const legacyCategories = menuCategories.filter(category => category.hidden);

export function MenuPage() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTerm = query.trim().toLocaleLowerCase("sv-SE");
  const results = visibleCategories.filter(category => category.name.toLocaleLowerCase("sv-SE").includes(searchTerm));

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <section className="menu-page" aria-labelledby="menu-page-title">
      <div className="menu-page-header">
        {legacyCategories.map(category => <span id={category.slug} key={category.slug} aria-hidden="true" />)}
        <h1 id="menu-page-title">Vår meny</h1>
        <p>Upptäck våra rätter, tillagade med omsorg.</p>
      </div>

      <div className="menu-search" role="search" aria-label="Sök menykategorier">
        <Search aria-hidden="true" size={20} strokeWidth={1.8} />
        <input
          ref={searchRef}
          type="search"
          aria-label="Sök efter mat"
          aria-controls="menu-categories"
          placeholder="Sök efter mat…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {query ? <button type="button" aria-label="Rensa sökning" title="Rensa sökning" onClick={clearSearch}>
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        </button> : null}
      </div>

      <p className="menu-search-status" role="status" aria-live="polite" aria-atomic="true">
        {results.length ? `${results.length} ${results.length === 1 ? "kategori" : "kategorier"}` : "Inga kategorier matchar din sökning."}
      </p>

      <nav id="menu-categories" className="menu-categories" aria-label="Menykategorier">
        {results.map((category) => (
          <a
            className="menu-category-card"
            href={`#${category.slug}`}
            id={category.slug}
            key={category.slug}
            aria-label={`Öppna kategori ${category.name}`}
          >
            <span className="menu-category-media" aria-hidden="true">
              {category.image ? <img src={category.image} alt="" width="96" height="96" loading="lazy" /> : (
                <span className="menu-category-placeholder"><UtensilsCrossed size={32} strokeWidth={1.5} /></span>
              )}
            </span>
            <span className="menu-category-label">
              <span>{category.name.endsWith("shawarma") ? <>{category.name.slice(0, -8)}<wbr />shawarma</> : category.name}</span>
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </span>
          </a>
        ))}
      </nav>
    </section>
  );
}

import { ChevronLeft } from "lucide-react";

type MenuCategory = {
  name: string;
  slug: string;
  image: string;
};

function makePlaceholder(emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <text x="60" y="73" text-anchor="middle" font-size="46">${emoji}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const menuCategories: MenuCategory[] = [
  { name: "Erbjudanden", slug: "offers", image: makePlaceholder("%") },
  { name: "Shawarma", slug: "shawarma", image: "/assets/hero-shawarma.webp" },
  { name: "Grillad kyckling", slug: "grilled-chicken", image: makePlaceholder("🍗") },
  { name: "Crispy och broasted kyckling", slug: "crispy-broasted", image: makePlaceholder("🍗") },
  { name: "Pizza", slug: "pizza", image: "/assets/hero-pizza.webp" },
  { name: "Manakish", slug: "manaqish", image: makePlaceholder("🫓") },
  { name: "Sfiha", slug: "sfiha", image: makePlaceholder("🥟") },
  { name: "Pommes frites", slug: "fries", image: makePlaceholder("🍟") },
  { name: "Sallader", slug: "salads", image: makePlaceholder("🥗") },
  { name: "Barnmeny", slug: "kids-meals", image: makePlaceholder("⭐") },
  { name: "Desserter", slug: "desserts", image: makePlaceholder("🍰") },
  { name: "Drycker", slug: "drinks", image: "/assets/hero-coke.webp" },
  { name: "Såser", slug: "sauces", image: makePlaceholder("🥣") },
];

export function MenuPage() {
  return (
    <section className="menu-page" aria-labelledby="menu-page-title">
      <div className="menu-page-header">
        <h1 id="menu-page-title">Meny</h1>
      </div>

      <nav className="menu-categories" aria-label="Menykategorier">
        {menuCategories.map((category) => (
          <a
            className="menu-category-row"
            href={`/menu#${category.slug}`}
            id={category.slug}
            key={category.slug}
            aria-label={`Öppna kategori ${category.name}`}
          >
            <span className="menu-category-thumb" aria-hidden="true">
              <img src={category.image} alt="" loading="lazy" />
            </span>
            <span className="menu-category-name">{category.name}</span>
            <ChevronLeft className="menu-category-chevron" aria-hidden="true" size={22} strokeWidth={2.4} />
          </a>
        ))}
      </nav>
    </section>
  );
}

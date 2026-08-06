import { ChevronLeft } from "lucide-react";

type MenuCategory = {
  name: string;
  slug: string;
  image: string;
};

function makePlaceholder(emoji: string, tint = "#fff5f5") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="24" fill="${tint}"/>
      <circle cx="60" cy="60" r="40" fill="#ffffff" opacity="0.74"/>
      <text x="60" y="73" text-anchor="middle" font-size="46">${emoji}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const menuCategories: MenuCategory[] = [
  { name: "العروض", slug: "offers", image: makePlaceholder("٪", "#fff2f2") },
  { name: "الشاورما", slug: "shawarma", image: "/assets/hero-shawarma.webp" },
  { name: "الفروج المشوي", slug: "grilled-chicken", image: makePlaceholder("🍗", "#fff7ed") },
  { name: "الكريسبي والبروستد", slug: "crispy-broasted", image: makePlaceholder("🍗", "#fff8e5") },
  { name: "البيتزا", slug: "pizza", image: "/assets/hero-pizza.webp" },
  { name: "المناقيش", slug: "manaqish", image: makePlaceholder("🫓", "#fff7ed") },
  { name: "السفيحة", slug: "sfiha", image: makePlaceholder("🥟", "#fff3e8") },
  { name: "البطاطا", slug: "fries", image: makePlaceholder("🍟", "#fff8dc") },
  { name: "السلطات", slug: "salads", image: makePlaceholder("🥗", "#f3fff2") },
  { name: "وجبات الأطفال", slug: "kids-meals", image: makePlaceholder("⭐", "#fff8e5") },
  { name: "الحلويات", slug: "desserts", image: makePlaceholder("🍰", "#fff2f7") },
  { name: "المشروبات", slug: "drinks", image: "/assets/hero-coke.webp" },
  { name: "الصوصات", slug: "sauces", image: makePlaceholder("🥣", "#fff5f5") },
];

export function MenuPage() {
  return (
    <section className="menu-page" aria-labelledby="menu-page-title">
      <div className="menu-page-header">
        <h1 id="menu-page-title">المنيو</h1>
      </div>

      <nav className="menu-categories" aria-label="Menu categories">
        {menuCategories.map((category) => (
          <a
            className="menu-category-row"
            href={`/menu#${category.slug}`}
            id={category.slug}
            key={category.slug}
            aria-label={`فتح قسم ${category.name}`}
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

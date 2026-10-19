// Preview-only content. These keys are local UI keys, never backend product IDs.
export type DemoOption = { key: string; name: string };
export type DemoProduct = {
  key: string;
  categorySlug: string;
  name: string;
  priceOre: number;
  emoji: string;
  imageUrl?: string;
  description?: string;
  requiredOptions?: readonly DemoOption[];
  recipeNeedsReview: boolean;
  demo: true;
};
export type DemoCategory = { slug: string; name: string; emoji: string; products: DemoProduct[] };

const plateSides: readonly DemoOption[] = [
  { key: "fries", name: "Pommes frites" },
  { key: "rice", name: "Ris" },
];

type DemoProductDetails = Pick<DemoProduct, "imageUrl" | "description" | "requiredOptions"> & { emoji?: string };
type DemoProductRow = [key: string, name: string, priceSek: number, requiresSide?: boolean, details?: DemoProductDetails];

function category(slug: string, name: string, emoji: string, rows: DemoProductRow[]): DemoCategory {
  return {
    slug, name, emoji,
    products: rows.map(([key, productName, priceSek, requiresSide, details]) => ({
      key: `demo:${slug}:${key}`,
      categorySlug: slug,
      name: productName,
      priceOre: priceSek * 100,
      emoji: details?.emoji ?? emoji,
      imageUrl: details?.imageUrl,
      requiredOptions: details?.requiredOptions ?? (requiresSide ? plateSides : undefined),
      recipeNeedsReview: slug === "pizza",
      description: details?.description ?? (slug === "pizza" ? "Ingredienser och topping ska bekräftas." : undefined),
      demo: true,
    })),
  };
}

export const demoCategories: DemoCategory[] = [
  category("offers", "Erbjudanden", "🍽️", [
    ["shawarma-menu", "Shawarmameny", 135],
    ["falafel-menu", "Falafelmeny", 105],
    ["family-menu", "Familjemeny", 399],
    ["pizza-menu", "Pizzameny", 145],
    ["crispy-menu", "Crispy-meny", 149],
  ]),
  category("chicken-shawarma", "Kycklingshawarma", "🌯", [
    ["wrap", "Kycklingshawarmarulle", 115],
    ["pita", "Kycklingshawarma i pitabröd", 105],
    ["iraqi-bread", "Kycklingshawarma i irakiskt bröd", 115],
    ["arabic", "Arabisk kycklingshawarma", 149],
    ["plate", "Kycklingshawarmatallrik", 145, true],
  ]),
  category("meat-shawarma", "Köttshawarma", "🌯", [
    ["wrap", "Köttshawarmarulle", 125],
    ["pita", "Köttshawarma i pitabröd", 115],
    ["iraqi-bread", "Köttshawarma i irakiskt bröd", 125],
    ["arabic", "Arabisk köttshawarma", 159],
    ["plate", "Köttshawarmatallrik", 155, true],
  ]),
  category("falafel", "Falafel", "🧆", [
    ["wrap", "Falafelrulle", 85],
    ["pita", "Falafel i pitabröd", 79],
    ["iraqi-bread", "Falafel i irakiskt bröd", 89],
    ["plate", "Falafeltallrik", 115],
  ]),
  category("kebab", "Kebab", "🥙", [
    ["skewers", "Kebabspett", 135],
    ["plate", "Kebabtallrik", 145],
    ["bread", "Kebab i bröd", 105],
    ["wrap", "Kebabrulle", 115],
  ]),
  category("grill", "Grillrätter", "🍢", [
    ["mixed", "Mixgrill", 199],
    ["tawook", "Shish tawook", 159],
    ["meat-skewers", "Grillade köttspett", 169],
    ["chicken-skewers", "Grillade kycklingspett", 155],
  ]),
  category("grilled-chicken", "Grillad kyckling", "🍗", [
    ["half", "Halv grillad kyckling", 129],
    ["whole", "Hel grillad kyckling", 229],
  ]),
  category("crispy-broasted", "Crispy & Broasted kyckling", "🍗", [
    ["broasted-5", "Broasted kyckling – 5 bitar", 149],
    ["broasted-10", "Broasted kyckling – 10 bitar", 269],
    ["crispy-7", "Crispy kyckling – 7 bitar", 159],
    ["nuggets-8", "Chicken nuggets – 8 bitar med pommes", 109],
  ]),
  category("manaqish", "Manakish", "🫓", [
    ["zaatar", "Zaatar", 45],
    ["cheese", "Ost", 55],
    ["cheese-olives", "Ost och oliver", 65],
    ["zaatar-cheese", "Zaatar och ost", 60],
    ["muhammara", "Muhammara", 55],
    ["muhammara-cheese", "Muhammara och ost", 65],
    ["sucuk", "Sucuk", 75],
    ["mortadella", "Mortadella", 69],
    ["meat", "Kött", 75],
    ["meat-cheese", "Kött och ost", 85],
    ["tuna", "Tonfisk", 75],
    ["chicken-shawarma", "Kycklingshawarma", 85],
  ]),
  category("sfiha", "Sfiha", "🥟", [
    ["meat-vegetables", "Sfiha med kött och grönsaker", 55],
    ["meat-tahini", "Sfiha med kött och tahini", 59],
    ["lahm-bi-ajin", "Lahm bi ajin", 55],
    ["sambousek-cheese", "Sambousek med ost", 35],
    ["sambousek-meat", "Sambousek med kött", 39],
    ["asawer", "Asawer", 45],
  ]),
  category("pizza", "Pizza", "🍕", [
    ["margherita", "Margherita", 110],
    ["vesuvio", "Vesuvio", 125],
    ["kebab", "Kebabpizza", 145],
    ["chicken", "Kycklingpizza", 139],
    ["tuna", "Tonfiskpizza", 135],
    ["vegetarian", "Vegetarisk pizza", 129],
    ["hawaii", "Hawaii", 129],
    ["mexicana", "Mexicana", 145],
    ["four-cheese", "Quattro Formaggi", 149],
    ["shawarma", "Shawarmapizza", 149],
  ]),
  category("salads", "Meze & Sallader", "🥗", [
    ["tabbouleh", "Tabbouleh", 75],
    ["fattoush", "Fattoush", 75],
    ["baba-ganoush", "Baba ganoush", 75],
    ["hummus", "Hummus", 65],
    ["fries", "Pommes frites", 49],
    ["fried-kibbeh", "Friterad kibbeh", 35],
    ["grilled-kibbeh", "Grillad kibbeh", 45],
    ["tripoli-kibbeh", "Tripolisk kibbeh", 45],
  ]),
  category("drinks", "Drycker", "🥤", [
    ["coca-cola", "Coca-Cola", 25],
    ["coca-cola-zero", "Coca-Cola Zero", 25],
    ["pepsi", "Pepsi", 25],
    ["pepsi-max", "Pepsi Max", 25],
    ["fanta-orange", "Fanta Orange", 25],
    ["fanta-exotic", "Fanta Exotic", 25],
    ["sprite", "Sprite", 25],
    ["7up", "7UP", 25],
    ["powerking", "Powerking", 30],
    ["vimto", "Vimto", 30],
    ["water", "Vatten", 20],
  ]),
  category("sauces", "Såser", "🥣", [
    ["garlic", "Vitlökssås", 15],
    ["hot", "Stark sås", 15],
    ["curry", "Currysås", 15],
    ["bearnaise", "Bearnaisesås", 15],
  ]),
];

export const demoProducts = demoCategories.flatMap(category => category.products);
const productsByKey = new Map(demoProducts.map(product => [product.key, product]));
export function getDemoProduct(key: string) { return productsByKey.get(key); }
const sek = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 });
export function formatDemoPrice(ore: number) { return sek.format(ore / 100); }
export function normalizeMenuSearch(value: string) { return value.normalize("NFC").trim().toLocaleLowerCase("sv-SE"); }
export function searchDemoProducts(query: string, category?: DemoCategory) {
  const term = normalizeMenuSearch(query);
  return (category ? [category] : demoCategories).flatMap(group => group.products.filter(product =>
    normalizeMenuSearch(`${product.name} ${product.description ?? ""} ${category ? "" : group.name}`).includes(term),
  ));
}

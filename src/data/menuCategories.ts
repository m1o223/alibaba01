export type MenuCategory = {
  name: string;
  slug: string;
  image?: string;
  hidden?: boolean;
};

export const menuCategories: MenuCategory[] = [
  { name: "Erbjudanden", slug: "offers" },
  { name: "Kycklingshawarma", slug: "chicken-shawarma" },
  { name: "Köttshawarma", slug: "meat-shawarma" },
  { name: "Falafel", slug: "falafel" },
  { name: "Kebab", slug: "kebab" },
  { name: "Grillrätter", slug: "grill" },
  { name: "Grillad kyckling", slug: "grilled-chicken" },
  { name: "Crispy & Broasted kyckling", slug: "crispy-broasted" },
  { name: "Manakish", slug: "manaqish" },
  { name: "Sfiha", slug: "sfiha" },
  { name: "Pizza", slug: "pizza", image: "/assets/hero-pizza.webp" },
  { name: "Pommes frites", slug: "fries" },
  { name: "Sallader", slug: "salads" },
  { name: "Drycker", slug: "drinks", image: "/assets/hero-coke.webp" },
  { name: "Såser", slug: "sauces" },
  // Preserve legacy identifiers without assigning their future products to new categories.
  { name: "Shawarma", slug: "shawarma", image: "/assets/hero-shawarma.webp", hidden: true },
  { name: "Barnmeny", slug: "kids-meals", hidden: true },
  { name: "Desserter", slug: "desserts", hidden: true },
];

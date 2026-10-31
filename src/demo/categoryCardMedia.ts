import type { DemoProduct } from "./menuData";

// Presentation-only examples, never persisted into product or order records.
const exampleImages: Readonly<Record<string, string>> = {
  "demo:chicken-shawarma:wrap": "/assets/hero-shawarma.webp",
  "demo:meat-shawarma:wrap": "/assets/hero-shawarma.webp",
  "demo:pizza:margherita": "/assets/hero-pizza.webp",
  "demo:drinks:coca-cola": "/assets/hero-coke.webp",
  "demo:drinks:pepsi": "/assets/hero-pepsi.webp",
};

const exampleIllustrations: Readonly<Record<string, string>> = {
  "demo:offers:shawarma-menu": "\u{1F32F}",
  "demo:offers:falafel-menu": "\u{1F9C6}",
  "demo:offers:pizza-menu": "\u{1F355}",
  "demo:offers:crispy-menu": "\u{1F357}",
  "demo:salads:fries": "\u{1F35F}",
  "demo:salads:baba-ganoush": "\u{1F963}",
  "demo:salads:hummus": "\u{1F963}",
  "demo:salads:fried-kibbeh": "\u{1F9C6}",
  "demo:salads:grilled-kibbeh": "\u{1F9C6}",
  "demo:salads:tripoli-kibbeh": "\u{1F9C6}",
  "demo:drinks:water": "\u{1F4A7}",
};

export function categoryCardMedia(product: DemoProduct) {
  const photo = product.imageUrl || product.images[0];
  return {
    src: photo || exampleImages[product.key],
    emoji: exampleIllustrations[product.key] ?? product.emoji,
    temporary: !photo,
  };
}

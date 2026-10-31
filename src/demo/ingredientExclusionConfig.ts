export type IngredientExclusion = { key: string; name: string };
export type IngredientExclusionConfig = {
  verificationStatus: "unverified" | "verified";
  options: readonly IngredientExclusion[];
};

const examples = {
  garlic: "Utan vitl\u00f6kskr\u00e4m",
  pickles: "Utan pickles",
  pomegranate: "Utan granat\u00e4ppelsirap",
  onion: "Utan l\u00f6k",
  tomato: "Utan tomat",
} as const;
type ExampleKey = keyof typeof examples;

// Test choices only: these lists do not describe confirmed restaurant recipes.
const categoryExamples: Readonly<Partial<Record<string, readonly ExampleKey[]>>> = {
  "chicken-shawarma": ["garlic", "pickles", "onion", "tomato"],
  "meat-shawarma": ["pickles", "pomegranate", "onion", "tomato"],
  falafel: ["pickles", "onion", "tomato"],
  kebab: ["onion", "tomato"],
  grill: ["onion", "tomato"],
};
const productExamples: Readonly<Partial<Record<string, readonly ExampleKey[]>>> = {
  "demo:offers:shawarma-menu": ["garlic", "pickles"],
  "demo:offers:falafel-menu": ["pickles", "onion", "tomato"],
  "demo:pizza:kebab": ["onion", "tomato"],
  "demo:pizza:shawarma": ["onion", "tomato"],
  "demo:salads:tabbouleh": ["onion", "tomato"],
  "demo:salads:fattoush": ["pomegranate", "onion", "tomato"],
};

export function demoIngredientExclusions(productKey: string, categorySlug: string): IngredientExclusionConfig {
  const keys = productExamples[productKey] ?? categoryExamples[categorySlug] ?? [];
  return { verificationStatus: "unverified", options: keys.map(key => ({ key, name: examples[key] })) };
}

// Any future live-order adapter must check verified configuration, never demo examples.
export function exclusionsVerifiedForRealOrders(config: IngredientExclusionConfig, ingredientsVerified = false): boolean {
  return ingredientsVerified && config.verificationStatus === "verified";
}

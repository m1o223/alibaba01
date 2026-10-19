import assert from "node:assert/strict";
import test from "node:test";
import { demoCategories, demoProducts, formatDemoPrice, searchDemoProducts } from "../src/demo/menuData.ts";

// Independent reference of the explicitly supplied, unverified preview catalog.
const expected = [
  ["Erbjudanden", [["Shawarmameny",135],["Falafelmeny",105],["Familjemeny",399],["Pizzameny",145],["Crispy-meny",149]]],
  ["Kycklingshawarma", [["Kycklingshawarmarulle",115],["Kycklingshawarma i pitabröd",105],["Kycklingshawarma i irakiskt bröd",115],["Arabisk kycklingshawarma",149],["Kycklingshawarmatallrik",145]]],
  ["Köttshawarma", [["Köttshawarmarulle",125],["Köttshawarma i pitabröd",115],["Köttshawarma i irakiskt bröd",125],["Arabisk köttshawarma",159],["Köttshawarmatallrik",155]]],
  ["Falafel", [["Falafelrulle",85],["Falafel i pitabröd",79],["Falafel i irakiskt bröd",89],["Falafeltallrik",115]]],
  ["Kebab", [["Kebabspett",135],["Kebabtallrik",145],["Kebab i bröd",105],["Kebabrulle",115]]],
  ["Grillrätter", [["Mixgrill",199],["Shish tawook",159],["Grillade köttspett",169],["Grillade kycklingspett",155]]],
  ["Grillad kyckling", [["Halv grillad kyckling",129],["Hel grillad kyckling",229]]],
  ["Crispy & Broasted kyckling", [["Broasted kyckling – 5 bitar",149],["Broasted kyckling – 10 bitar",269],["Crispy kyckling – 7 bitar",159],["Chicken nuggets – 8 bitar med pommes",109]]],
  ["Manakish", [["Zaatar",45],["Ost",55],["Ost och oliver",65],["Zaatar och ost",60],["Muhammara",55],["Muhammara och ost",65],["Sucuk",75],["Mortadella",69],["Kött",75],["Kött och ost",85],["Tonfisk",75],["Kycklingshawarma",85]]],
  ["Sfiha", [["Sfiha med kött och grönsaker",55],["Sfiha med kött och tahini",59],["Lahm bi ajin",55],["Sambousek med ost",35],["Sambousek med kött",39],["Asawer",45]]],
  ["Pizza", [["Margherita",110],["Vesuvio",125],["Kebabpizza",145],["Kycklingpizza",139],["Tonfiskpizza",135],["Vegetarisk pizza",129],["Hawaii",129],["Mexicana",145],["Quattro Formaggi",149],["Shawarmapizza",149]]],
  ["Meze & Sallader", [["Tabbouleh",75],["Fattoush",75],["Baba ganoush",75],["Hummus",65],["Pommes frites",49],["Friterad kibbeh",35],["Grillad kibbeh",45],["Tripolisk kibbeh",45]]],
  ["Drycker", [["Coca-Cola",25],["Coca-Cola Zero",25],["Pepsi",25],["Pepsi Max",25],["Fanta Orange",25],["Fanta Exotic",25],["Sprite",25],["7UP",25],["Powerking",30],["Vimto",30],["Vatten",20]]],
  ["Såser", [["Vitlökssås",15],["Stark sås",15],["Currysås",15],["Bearnaisesås",15]]],
];

test("all 14 categories and 84 supplied product names/prices match exactly", () => {
  assert.equal(demoCategories.length,14);
  assert.equal(demoProducts.length,84);
  assert.deepEqual(demoCategories.map(category=>[category.name,category.products.map(product=>[product.name,product.priceOre/100])]),expected);
});

test("demo keys are unique, prices are integer ore, and no backend IDs are assigned", () => {
  assert.equal(new Set(demoProducts.map(product=>product.key)).size,84);
  for(const product of demoProducts) {
    assert.equal(product.demo,true);
    assert(product.key.startsWith("demo:"));
    assert(Number.isInteger(product.priceOre) && product.priceOre>0);
    assert.equal("id" in product,false);
    assert(product.emoji.length>0);
  }
  assert.equal(formatDemoPrice(13500).replace(/\s/g," "),"135 kr");
});

test("only the two shawarma plates require a side, with no default choice", () => {
  const plates=demoProducts.filter(product=>product.requiredOptions);
  assert.deepEqual(plates.map(product=>product.name),["Kycklingshawarmatallrik","Köttshawarmatallrik"]);
  for(const plate of plates) {
    assert.deepEqual(plate.requiredOptions,[{key:"fries",name:"Pommes frites"},{key:"rice",name:"Ris"}]);
    assert.equal("defaultOption" in plate,false);
  }
});

test("all pizza recipes are explicitly unverified, without guessed toppings", () => {
  const pizzas=demoCategories.find(category=>category.slug==="pizza").products;
  assert(pizzas.every(product=>product.recipeNeedsReview && product.description==="Ingredienser och topping ska bekräftas."));
});

test("global search includes product and category matches across categories", () => {
  assert.equal(searchDemoProducts(" SHAWARMA ").length,13);
  assert.equal(searchDemoProducts("pizza").length,11);
  assert.equal(searchDemoProducts("MEZE").length,8);
  assert.equal(searchDemoProducts("KÖTT").length,11);
  assert.equal(searchDemoProducts("inga-träffar-123").length,0);
});

test("category search is local and supports Swedish case and Unicode normalization", () => {
  const sauces=demoCategories.find(category=>category.slug==="sauces");
  assert.equal(searchDemoProducts("SÅS",sauces).length,4);
  assert.equal(searchDemoProducts("SA\u030aS",sauces).length,4);
  assert.equal(searchDemoProducts("shawarma",sauces).length,0);
  const pizza=demoCategories.find(category=>category.slug==="pizza");
  assert.deepEqual(searchDemoProducts("shawarma",pizza).map(product=>product.name),["Shawarmapizza"]);
});

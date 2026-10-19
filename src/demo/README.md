# Frontend Ordering Demo V1

This directory contains unverified frontend demo content only. It has no order,
payment, authentication, database, or backend API integration.

- `menuData.ts`: the 14 categories, 84 products, demo prices, visuals and options.
  Product rows contain a local key, Swedish name, price in SEK, optional required
  plate-side flag, and optional details (`imageUrl`, `emoji`, `description`,
  `requiredOptions`). Calculations use integer ore.
- `DemoProductCard.tsx`: one shared product layout for every category and search.
- `DemoCart.tsx`: preview-only state passed to the existing cart display. Only
  local product keys, option keys and quantities are persisted, under
  `alibaba.preview.demo-cart.v1` in session storage. Prices come from the demo
  catalog, never saved client values. Unknown products and invalid choices are
  discarded. The current v2 cart stores configuration selections and quantities
  (1-20 per combination), and can migrate valid v1 side selections. Checkout is
  only connected to the isolated frontend simulation described below.
- The original category registry and menu page are unchanged and remain the
  non-demo fallback. The old `fries` anchor points to Meze & Sallader in preview.
- `vite.config.ts` enables the demo only for the dev server or builds whose
  `VERCEL_ENV` equals `preview`. Other builds omit the lazy demo module and data.
  Do not promote a demo preview build to Production.

Run `npm test` for the catalog, prices, required options, and Swedish search
checks. Run `npm run build` for type checks and a non-demo build. Preview builds
must additionally be verified with `VERCEL_ENV=preview`; production-safety checks
use `VERCEL_ENV=production` and must contain no DemoPreview assets or demo data.

## Routes and Components

- `/menu` retains 14 categories and all 84 unchanged base prices. Search terms
  are kept in URL parameters and category hashes. The existing order-type query
  and `alibaba.orderType` value are preserved.
- `/menu/product/:encodedLocalKey` uses one `DemoProductPage`. Local keys are
  still not backend IDs. `customizationGroups` configure required sides,
  optional extras, and drinks; sauces and beverages have quantity only.
- `/demo/checkout` requires the separate demo-session flag. The existing auth
  bottom sheet exposes `Fortsätt i demoläge`. No real authentication provider
  or authenticated-user state existed in this checkout prototype. This flag
  does not claim real authentication, store credentials, or invoke Google.
- `/demo/order/:demoReference` displays a snapshot receipt and explicit
  simulation controls. The cart is consumed only after this view mounts.
  Reopening a receipt never consumes a newly added cart a second time.
- `DemoFlow.tsx` owns demo session and receipt lifecycle. `orderModel.ts` owns
  selection validation, integer-ore totals, canonical line identity and the
  pure order-event reducer. There are no network transports.
- `DemoFlowContext` and `DemoCartContext` expose small optional hooks for the
  existing layout. Outside the lazy preview provider, production components
  keep their original behavior.

## Data Safety

All ingredients, allergens, descriptions, extras and prices remain unverified.
There is no inferred allergen list and no claim that a recipe is safe. The
schema has explicit verification flags and lists for later official data.

Namespaced session storage uses `alibaba.preview.demo-cart.v2`,
`alibaba.preview.demo-session.v1` and `alibaba.preview.demo-order.v1`. No real
customer data, card details, passwords, fiscal receipts or backend records are
created. Invalid stored lines and receipts are rejected; prices are derived
from the demo catalog. Within a session the receipt is an immutable price and
configuration snapshot. After a reload it is revalidated against the current
demo catalog. Storage failure falls back to memory for the active page session.

Payment interfaces are explanatory simulations, not provider SDKs. The short
processing timer is canceled if the customer leaves checkout. Restaurant
acceptance is never automatic: only receipt creation advances automatically
to waiting. Explicit demo events handle acceptance (1-120 simulated minutes),
rejection, preparation and ready. These event types are a future frontend
adapter boundary, not implemented backend events.

## Verification

- `npm test`: exact catalog/prices, Swedish search, configuration validity,
  integer totals, distinct line identities, storage validation, receipt snapshots
  and guarded status transitions.
- `npm run build`: TypeScript checks and fail-closed non-demo production build.
- `node tests/demo-build.browser.cjs`: smoke test of the built non-demo site;
  set `TEST_BUILD_MODE=preview` to verify a Preview build through checkout and
  receipt reload instead. Defaults to a preview server at port 4174.
- `node tests/demo-ordering.browser.cjs`: full customer journey at 320, 390,
  768 and 1440px, all payment simulations, required options, cart totals,
  persistence, cancellation, rejection, gallery fallback and reduced motion.
  Requires Playwright (`PLAYWRIGHT_MODULE` can point to an existing install),
  a running dev server at `TEST_BASE_URL` (default `http://127.0.0.1:4173`),
  and optionally `BROWSER_EXECUTABLE` and `TEST_SCREENSHOTS`.
  Map requests are stubbed; all non-GET requests and JavaScript errors fail the
  suite. Tests never submit orders or real payments.

Deploy to Vercel Preview only. Do not promote or copy a Preview build to
Production. Production must be rebuilt without `VERCEL_ENV=preview`.

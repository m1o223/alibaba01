# Preview Menu

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
  discarded. No checkout callback is supplied.
- The original category registry and menu page are unchanged and remain the
  non-demo fallback. The old `fries` anchor points to Meze & Sallader in preview.
- `vite.config.ts` enables the demo only for the dev server or builds whose
  `VERCEL_ENV` equals `preview`. Other builds omit the lazy demo module and data.
  Do not promote a demo preview build to Production.

Run `npm test` for the catalog, prices, required options, and Swedish search
checks. Run `npm run build` for type checks and a non-demo build. Preview builds
must additionally be verified with `VERCEL_ENV=preview`; production-safety checks
use `VERCEL_ENV=production` and must contain no DemoPreview assets or demo data.

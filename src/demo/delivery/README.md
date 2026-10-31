# Delivery address preview

Delivery addresses exist only in the frontend Preview checkout. `delivery` is a UI-only selection, not an `OrderType`. Both the checkout button and its handler reject it; the existing order provider only accepts dine-in/takeaway. No fees, coverage claims, delivery orders or real payments are enabled.

## Data and privacy

- The draft and confirmed address stay in React memory for the current checkout. Closing the sheet does not commit the draft. Leaving/reloading checkout clears non-remembered details.
- Optional browser persistence uses `alibaba.preview.delivery-address.v1`, explicit consent, 30-day expiry and validated versioned JSON. Replacing an existing address requires a separate explicit checkbox. Deletion is available in checkout.
- Entrance codes and instructions are never remembered. Coordinates are never stored. No address is put in URLs, console logs, cart records, receipts or payment records.
- Browser storage is not encrypted and is accessible to scripts on the same origin and people using that browser profile. The UI warns against shared devices. It is not account storage.
- There is no real authenticated session or address API in this frontend. Do not treat the demo session as authentication or silently fall back to device storage for a future authenticated user. Add a verified user-scoped address repository before account saving can be offered. On sign-out/account changes clear checkout drafts and prevent cross-account reuse.

## Location lookup integration: not connected

No paid service or public geocoder has been activated. With no configuration, manual entry works and the location button accurately explains that lookup is unavailable without requesting location permission.

`VITE_DELIVERY_GEOCODER_PATH` may eventually point to an approved same-origin `/api/...` proxy. Never put provider secrets in Vite variables. The adapter sends one consent-triggered `POST` with `{latitude, longitude}`, no address fields or codes. The response must be `{street, postalCode, city}`. Suggestions are editable and never auto-confirmed. Requests are cancellable/time-limited; stale responses cannot overwrite typing or closed sheets.

The proxy does not exist in this change. Before connecting it, approve the provider/privacy terms, identify it in the location disclosure, implement rate limits, input/response validation, no-store responses and redacted logging; keep keys server-side. Existing candidates include [geocode.maps.co](https://geocode.maps.co/plans/) (free demo tier; paid plans require approval). The [public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) prohibits submitting personal/confidential data, so that public endpoint is deliberately not used.

Browser tests inject a mock response at `/api/delivery/reverse-test` on a local server configured with that path. This is not a live geocoding service or a production endpoint.

## Before real delivery

Add server-validated address normalization, authenticated ownership checks for account addresses, delivery coverage, a server-priced quote and restaurant handling. A future delivery request should carry validated address fields/location type/handoff plus server-issued coverage and quote identifiers, never trust client eligibility or price. Revalidate when confirming the order. Until all of this is verified, retain both payment guards and keep delivery out of the existing order model.

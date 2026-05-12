# Yard Microwaves — Launch Checklist

One-page punch list for cutting over from the dev store (`mardyicrowaves`) to the real Yard Microwaves Shopify store.

## 1. Push theme to the production store

```bash
# from this repo root, logged into the Shopify CLI as a store admin
shopify theme push --store yard-microwaves.myshopify.com --unpublished
# preview it via the Themes admin, then publish when happy:
shopify theme publish --store yard-microwaves.myshopify.com
```

Alternatives: Admin → Online Store → Themes → **Add theme** → Upload ZIP, or wire the GitHub integration to auto-deploy `main`.

## 2. Create the two products in admin

Both shirts share the same structure. Pricing baked into the showcase fallback is `$40`.

| Product | Price | Options | Variants |
| --- | --- | --- | --- |
| Rub & Plug | $40 | Size (S/M/L/XL/2XL) × Color (Bone/Briquette) | 10 |
| Smoke Signal | $40 | Size (S/M/L/XL/2XL) × Color (Bone/Briquette) | 10 |

Note the resulting handles (Shopify auto-slugs these — likely `rub-and-plug` and `smoke-signal`).

## 3. Wire products into the showcase sections

Without this step the showcase **Add to Cart** buttons are decorative — they fall back to a static link with no variant ID.

Easiest: **Theme Editor** → click each showcase section → pick the product in the Product picker.

Or edit `templates/index.json` directly:

```json
"ym_showcase_rubplug": {
  "type": "ym-product-showcase",
  "settings": {
    "product": "rub-and-plug",
    "display_name": "Rub & Plug",
    "fallback_front": "ym-rubplug-front.png",
    "fallback_hero": "ym-rubplug-back-full.png",
    "fallback_card_front": "ym-rubplug-bone-folded.png",
    "fallback_card_back": "ym-rubplug-briquette-folded.png"
  },
  ...
}
```

Repeat for `ym_showcase_smokesig` with `"product": "smoke-signal"`.

## 4. Fill in placeholder content

- **Social URLs** — currently `#`. Theme Editor → Footer CTA section → set Instagram / Facebook / TikTok URLs.
- **Pioneers / Our Story body copy** — edit through Theme Editor if the placeholder text needs tweaking.
- **Free shipping threshold** — currently `0` (bar hidden). Theme Editor → Theme settings → Cart → set a dollar amount to enable it.

## 5. Shopify admin config (not in code)

- **Payments** — Shopify Payments or Stripe in Settings → Payments.
- **Shipping** — Settings → Shipping and delivery → set zones + rates.
- **Taxes** — Settings → Taxes and duties.
- **Legal pages** — Settings → Policies → generate privacy, terms, refund, shipping.
- **Custom domain** — Settings → Domains → connect `yardmicrowaves.com` (DNS pointed at Shopify).
- **Transactional email** — Settings → Notifications → set sender email; configure SPF/DKIM on the domain so confirmations land.
- **Inventory** — Settings → Locations.

## 6. Final smoke test before opening to traffic

1. Hit `/` — hero video plays, header icons stay white, footer torn-edge bridges into the dark.
2. Click an **Add to Cart** in a showcase → cart drawer slides out with the right variant + price.
3. Quantity stepper works → updates total.
4. **Check out** → lands on Shopify's hosted checkout with the correct line item.
5. Complete a $1 test order (Shopify Payments has a Bogus Gateway / test-mode option).
6. Confirm receipt email arrives, order appears in admin.
7. Spot-check `/products/anything` and `/collections/anything` — both should 302 back to `/` (single-page launch redirects).

## Notes

- PDP / collection / cart-page templates are intentional redirects to `/`. When you want full PDPs, remove `templates/product.liquid`, `templates/collection.liquid`, `templates/cart.liquid` (their JSON equivalents will take over).
- The 404 page (`templates/404.liquid`) and password/coming-soon page (`templates/password.liquid`) are branded and ready.
- Klaviyo signup on the password page currently tags `prospect,coming-soon` on the customer record — wire to a Klaviyo flow if you want welcome emails.

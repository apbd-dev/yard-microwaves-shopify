# PostHog — setup and verification

Storefront + checkout analytics for Yard Microwaves. The point of this is the
drop-survivability numbers: **visitors → product views → add-to-cart →
checkout → purchase**, per drop, in one funnel.

Standing decision: **PostHog Cloud, not self-hosted** (2026-06-05). Use the
Deep Seas org's owned-brand project, not the APBD client project.

---

## Why it takes two pieces

Shopify splits the storefront from the checkout, and no single mechanism sees
both:

| | Covers | Cannot see |
|---|---|---|
| `snippets/posthog.liquid` | home, collection, product, cart, blog, account | checkout, thank-you page |
| `docs/posthog-custom-pixel.js` | commerce events + checkout + purchase | — |

Checkout is Shopify-hosted; no theme code runs there. **With only the theme
snippet installed, conversion reads 0% forever** — the funnel ends at "reached
checkout" and no purchase ever arrives.

They are split so nothing double-counts:

- **theme snippet** → `$pageview`, autocapture, session replay, web vitals, identity
- **pixel** → `product_viewed`, `product_added_to_cart`, `checkout_*`, `purchase`, and `$pageview` **only** on checkout paths

---

## Install

### 1. Theme settings

**Online Store → Themes → Customize → Theme settings → Analytics**

| Setting | Value |
|---|---|
| Project token | `phc_…` from PostHog → Settings → Project |
| API host | `https://us.i.posthog.com` (US Cloud) |
| Record session replays | on |
| Respect customer privacy consent | on |

The token is a **public** key — it ships in page source by design, and that is
fine. A personal key (`phx_…`) is a real secret; the snippet refuses anything
that doesn't start with `phc_` rather than printing it into the page.

Leave the token blank and the theme loads no analytics at all.

### 2. The custom pixel

**Settings → Customer events → Add custom pixel**, name it `PostHog`.

1. Paste the whole of [`posthog-custom-pixel.js`](./posthog-custom-pixel.js).
2. Edit `POSTHOG_TOKEN` at the top to the **same** token as the theme setting.
   Different tokens = storefront and checkout in two projects, and no funnel
   will ever join up.
3. Set **Permission** to `Analytics`.
4. **Save**, then **Connect**.

The pixel is not loaded by the theme and there is no deploy step — it lives in
the repo for review history. **After editing the file, re-paste it.**

---

## How a person stays one person

This is the part that quietly breaks in most Shopify/PostHog setups.

The pixel runs in a sandboxed iframe with its own storage. Loading `posthog-js`
inside it would mint a second, unrelated `distinct_id`, and every purchase
would attach to a stranger who had never viewed a product.

So instead:

1. The theme snippet mirrors PostHog's ids into a flat first-party cookie,
   `ym_ph_id`, as `<distinct_id>|<session_id>` — rewritten whenever the session
   rolls over.
2. The pixel reads it with `browser.cookie.get('ym_ph_id')`. That call
   [executes in the top frame](https://shopify.dev/docs/api/web-pixels-api/standard-api/browser),
   so it sees storefront cookies even on the checkout domain.
3. The pixel posts to the capture API directly with that `distinct_id`.

Fallback: a visitor who never touched a theme page gets
`shopify:<event.clientId>` — deliberately prefixed so un-stitched sessions are
obvious in PostHog rather than looking like ordinary people.

`$session_id` rides along on pixel events, so a purchase opens onto the session
replay of the browse that produced it.

### Person profiles

Browsing events set `$process_person_profile: false`; the theme runs
`person_profiles: 'identified_only'`. A profile is created on **login** and on
**purchase** — not for every drive-by visitor. On purchase the pixel also fires
`$create_alias` linking the browser's anonymous id to the customer's email, so
a repeat buyer on a second device resolves to one person.

---

## Verify

Give it a few minutes, then watch **Activity** in PostHog.

1. **Storefront** — load the homepage. Expect `$pageview` with `template`,
   `shop_domain`, `brand: yard-microwaves`.
2. **Product** — open a product. Expect `product_viewed` with `sku` and `price`.
3. **Add to cart** — expect `product_added_to_cart`.
4. **Checkout** — expect `checkout_started`, then the `*_submitted` steps.
5. **Buy something** (a 100%-off discount code works) — expect `purchase` with
   `revenue`, `order_id`, `line_items`.
6. **Confirm stitching** — steps 1–5 must show the **same person**, not five
   anonymous ones. This is the check that matters; everything else can look
   right while this is broken.

### Gotchas

- **Headless browsers see nothing.** `posthog-js` drops events when
  `navigator.webdriver` is set or the UA contains `headlesschrome` — Playwright
  trips both. `posthog.init` runs, `__loaded` is true, `capture()` is called,
  and **zero** requests reach `/e/`. That is the bot filter, not a bug. Verify
  in a real browser, or override both in the Playwright context.
- **Theme editor is excluded** (`request.design_mode`), so preview reloads
  don't pollute the funnel. Test on the real storefront.
- **Ad blockers** block `us.i.posthog.com`. A quiet Activity feed is often just
  uBlock. Test in a clean profile before debugging the code.
- **Consent.** With a cookie banner configured, capture is held until the
  visitor accepts. With no banner, the API reports nothing to gate on and
  analytics run normally — so turning the setting on cannot silently zero out
  the data.

---

## Notes

- Session replay masks **all** typed input (`maskAllInputs: true`), so search
  terms don't appear in recordings. `search_submitted` carries the query as an
  event property instead.
- Revenue is set as both `revenue` and `$revenue` so either PostHog revenue
  convention works.
- Analytics failures are swallowed everywhere. **Nothing here may break a
  checkout.**

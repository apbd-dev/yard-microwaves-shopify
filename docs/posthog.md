# PostHog — setup and verification

Storefront + checkout analytics for Yard Microwaves. The point of this is the
drop-survivability numbers: **visitors → product views → add-to-cart →
checkout → purchase**, per drop, in one funnel.

Standing decision: **PostHog Cloud, not self-hosted** (2026-06-05).

**Project: [545620](https://us.posthog.com/project/545620)** on US Cloud — the
*shared* Deep Seas project, the same one `deep-seas/payload` reports into. YM
events are not in a project of their own, so every event this theme sends
carries `brand: "yard-microwaves"` and `shop_domain`. **Filter on `brand` or
you are looking at deepseas.dev's traffic mixed in with the store's.**

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

### 1. Theme settings — already done, ships from git

The token, host and both toggles are committed in
`config/settings_data.json` and deploy with the theme. Nothing to paste.

> **Do not set these in the Shopify theme editor.** `deploy-live.yml` runs
> `shopify theme push`, which ships `config/settings_data.json` from the repo
> and overwrites the live theme's settings. A token entered in the customizer
> survives until the next release and then silently disappears — taking all
> analytics with it, with no error anywhere. The repo is the source of truth.
> To change any of it, edit `config/settings_data.json` and deploy.

| Setting | Value |
|---|---|
| Project token | `phc_mBws4f…` (project 545620) |
| API host | `https://us.i.posthog.com` (US Cloud) |
| Record session replays | on |
| Respect customer privacy consent | on |

The token is a **public** key — it ships in page source by design, which is why
it is committed rather than treated as a secret. A personal key (`phx_…`) *is* a
real secret; the snippet refuses anything not starting with `phc_` rather than
printing it into the page.

Leave the token blank and the theme loads no analytics at all.

### 2. The custom pixel — the one manual step

**Settings → Customer events → Add custom pixel**, name it `PostHog`.

1. Paste the whole of [`posthog-custom-pixel.js`](./posthog-custom-pixel.js).
   The token is already filled in and matches the theme — don't edit it.
2. Set **Permission** to `Analytics`.
3. **Save**, then **Connect**.

This is the only step that cannot be automated: Shopify custom pixels are
admin-UI only (`webPixelCreate` is for app extensions, not custom pixels), so
no CLI, API or connector can install it.

The pixel is not loaded by the theme and there is no deploy step — it lives in
the repo for review history. **After editing the file, re-paste it**, or the
admin copy and the repo copy drift apart.

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
   `shop_domain`, `brand: yard-microwaves`. Filter the Activity feed on
   `brand = yard-microwaves` first — 545620 is shared, so the raw feed also
   carries deepseas.dev traffic.
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

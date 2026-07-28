# Yard Microwaves — Shopify Theme

Custom Shopify theme for [yardmicrowaves.com](https://yardmicrowaves.com), built on Shopify's **Fabric** (2.1.5) theme.

## Repo layout

Standard Shopify theme structure: `layout/`, `templates/`, `sections/`, `blocks/`, `snippets/`, `assets/`, `config/`, `locales/`.

## Local development

```bash
npm install -g @shopify/cli
shopify theme dev --store yard-microwaves.myshopify.com
```

## Deployment

Two lanes, both driven from GitHub — the repo is the single source of truth (settings/templates JSON included; don't edit the live theme in the Shopify customizer):

| Trigger | Workflow | Target |
| --- | --- | --- |
| Push to `main` | `deploy-staging.yml` | **Staging** theme (unpublished) — always safe, preview via Online Store → Themes |
| **GitHub release published** | `deploy-live.yml` | **Live** theme — this is the promote step |

Both push an explicit theme ID (never `--live`), so a missing secret fails loudly instead of touching the published theme. Required repo Actions secrets:

| Secret | Value |
| --- | --- |
| `SHOPIFY_CLI_THEME_TOKEN` | Theme Access app password (`shptka_…`) — create via the [Theme Access](https://shopify.dev/docs/storefronts/themes/tools/theme-access) app in admin |
| `SHOPIFY_STORE_URL` | `yard-microwaves.myshopify.com` |
| `SHOPIFY_STAGING_THEME_ID` | ID of the unpublished staging theme (currently `186784907542`, the "Yard Microwaves" theme) |
| `SHOPIFY_LIVE_THEME_ID` | ID of the published theme — **unset until launch cutover**, so releases cannot deploy anywhere by accident |

**One-time launch cutover** (currently live is the stock "Savor" theme, not this repo): publish the staging theme in admin (it becomes live) → set `SHOPIFY_LIVE_THEME_ID` to its ID (`186784907542`) → duplicate it in admin as the new staging theme → point `SHOPIFY_STAGING_THEME_ID` at the duplicate's ID. From then on: merge → staging, release → live.

Pull requests run Theme Check (`.github/workflows/theme-check.yml`), which must pass before merging to `main`.

## Launch

See [LAUNCH.md](LAUNCH.md) for the production cutover checklist and [docs/SETUP.md](docs/SETUP.md) for store setup.

## License

[MIT](LICENSE)

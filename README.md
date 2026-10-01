# Yard Microwaves — Shopify Theme

Custom Shopify theme for [yardmicrowaves.com](https://yardmicrowaves.com), built on Shopify's **Fabric** (2.1.5) theme.

## Repo layout

Standard Shopify theme structure: `layout/`, `templates/`, `sections/`, `blocks/`, `snippets/`, `assets/`, `config/`, `locales/`.

## Local development

```bash
npm install -g @shopify/cli
shopify theme dev --store yard-microwaves.myshopify.com
```

## Branches

Two long-lived branches, the standard for every Shopify store we run
([`deep-seas/shopify-theme-template`](https://github.com/deep-seas/shopify-theme-template) README § Branches):

| Branch | Is | Theme |
| --- | --- | --- |
| `main` | what is live | the published theme |
| `staging` | what is next (default branch) | the unpublished Staging theme |

New work branches off `staging` and merges back into it by PR. A release is a PR
`staging → main`, merged with **Create a merge commit** (never squash). `sync-staging.yml`
merges `main` back into `staging` on every push to `main` (releases, hotfixes, and
customizer edits Shopify commits); a conflict opens a `main → staging` PR instead.
Hotfix: branch off `main`, PR into `main`.

Until this store moves to Shopify's native GitHub integration, `main` reaches the
live theme the old way: after the `staging → main` merge, publish a GitHub release
from `main` (`deploy-live.yml`). `staging` pushes deploy to the staging theme.

## Deployment

Two lanes, both driven from GitHub — the repo is the single source of truth (settings/templates JSON included; don't edit the live theme in the Shopify customizer):

| Trigger | Workflow | Target |
| --- | --- | --- |
| Push to `staging` | `deploy-staging.yml` | **Staging** theme (unpublished) — always safe, preview via Online Store → Themes |
| **GitHub release published** | `deploy-live.yml` | **Live** theme — this is the promote step |

Both push an explicit theme ID (never `--live`), so a missing secret fails loudly instead of touching the published theme. Required repo Actions secrets:

| Secret | Value |
| --- | --- |
| `SHOPIFY_CLI_THEME_TOKEN` | Theme Access app password (`shptka_…`) — create via the [Theme Access](https://shopify.dev/docs/storefronts/themes/tools/theme-access) app in admin |
| `SHOPIFY_STORE_URL` | `yard-microwaves.myshopify.com` |
| `SHOPIFY_STAGING_THEME_ID` | ID of the unpublished staging theme (`188645933334`, "Yard Microwaves Staging") |
| `SHOPIFY_LIVE_THEME_ID` | ID of the published theme — **unset until launch cutover**, so releases cannot deploy anywhere by accident |

**One-time launch cutover** (currently live is the stock "Savor" theme, not this repo): publish the **"Yard Microwaves"** theme (`186784907542`) in admin — it becomes live → set `SHOPIFY_LIVE_THEME_ID=186784907542`. The separate "Yard Microwaves Staging" theme (`188645933334`) already exists and stays the staging target. From then on: merge into `staging` → staging theme; merge `staging → main`, then release → live.

Pull requests run Theme Check (`.github/workflows/theme-check.yml`), which must pass before merging to `main`.

## Launch

See [LAUNCH.md](LAUNCH.md) for the production cutover checklist and [docs/SETUP.md](docs/SETUP.md) for store setup.

## License

[MIT](LICENSE)

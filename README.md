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

Pushes to `main` run the **Deploy to Shopify** workflow (`.github/workflows/deploy-production.yml`), which pushes the theme to the store via `shopify theme push`. It requires three repo Actions secrets:

| Secret | Value |
| --- | --- |
| `SHOPIFY_CLI_THEME_TOKEN` | Theme Access app password (`shptka_…`) — create via the [Theme Access](https://shopify.dev/docs/storefronts/themes/tools/theme-access) app in admin |
| `SHOPIFY_STORE_URL` | `yard-microwaves.myshopify.com` |
| `SHOPIFY_THEME_ID` | ID of the target theme in the store (if unset, the workflow pushes to the **live** theme) |

Pull requests run Theme Check (`.github/workflows/theme-check.yml`), which must pass before merging to `main`.

## Launch

See [LAUNCH.md](LAUNCH.md) for the production cutover checklist and [docs/SETUP.md](docs/SETUP.md) for store setup.

## License

[MIT](LICENSE)

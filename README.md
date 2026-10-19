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

Two long-lived branches, the same in every apbd-dev Shopify repo (the whole flow:
[`.github/RELEASING.md`](.github/RELEASING.md)):

| Branch | Is | Theme |
| --- | --- | --- |
| `staging` | what is next (default branch) | the unpublished Staging theme |
| `main` | what is live | the published theme |

Both branches are connected by Shopify's GitHub integration, so a merge is a deploy.
Work PRs into `staging`; `pr-changes.yml` lists each PR's commits and files in its
description. `release-pr.yml` keeps one `staging → main` release PR open that lists
every PR in the release; merge it with **Create a merge commit** (never squash), and
the merge commit records that list. `sync-staging.yml` merges `main` back into
`staging`. Hotfix: a `hotfix/*` branch off `main`, PR into `main`.

Today the live theme is the stock "Savor" theme, not this repo. Launch = connect `main` in admin
and publish the theme it creates ([LAUNCH.md](LAUNCH.md)).

## Launch

See [LAUNCH.md](LAUNCH.md) for the production cutover checklist and [docs/SETUP.md](docs/SETUP.md) for store setup.

## License

[MIT](LICENSE)

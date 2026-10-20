# yard-microwaves-shopify — context

- **Branches:** `staging` (default) → Staging theme · `main` → published theme, both connected by Shopify's GitHub integration (a merge is a deploy). Work PRs into `staging`; `release-pr.yml` keeps the `staging → main` release PR open, merged with a merge commit; `sync-staging.yml` merges `main` back. `.github/RELEASING.md`.

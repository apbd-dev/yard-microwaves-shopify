# yard-microwaves-shopify — context

- **Branches:** `staging` (default) → staging theme · `main` → live. Work PRs into `staging`; release = `staging → main` merge commit, then a GitHub release from `main` deploys live (until native cutover); `sync-staging.yml` merges `main` back into `staging`. Template README § Branches.

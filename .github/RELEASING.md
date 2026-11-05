# Branches and releases

Every apbd-dev Shopify theme repo runs this exact flow, with the same files. The canonical copies live in [`apbd-dev/apbd-shopify`](https://github.com/apbd-dev/apbd-shopify); `apbd-dev/shopify-pipeline` `scripts/ci-standard.sh` checks every other repo against them and applies the repo settings. Change a standard file there first, then roll it out.

## Branches

| Branch | Is | Connected to (Shopify's GitHub integration) |
| --- | --- | --- |
| `staging` | **what is next** (default branch) | the unpublished `<Brand> Staging` theme |
| `main` | **what is live** | the published theme |

Both branches are connected in the store's admin (Online Store → Themes → Add theme → Connect from GitHub). The integration is the only thing that writes to those themes: no `shopify theme push` to them, no deploy workflows. Merging is deploying. Shopify commits every admin edit on a connected theme back to its branch.

## The flow

1. **Work:** branch off `staging`, open a PR into `staging`. `theme-check.yml` gates it and `pr-changes.yml` lists its commits and files in the description. Merge (squash is fine). The Staging theme updates.
2. **Review** on the Staging theme.
3. **Release:** `release-pr.yml` keeps one open PR `staging → main`, titled `Release <YYYY-MM-DD>`, listing every PR (and direct commit) in it. It is refreshed on every push to `staging` and on weekday mornings, or run it from the Actions tab. Merge it with **Create a merge commit**, never squash. The published theme updates.
4. **Sync:** `sync-staging.yml` merges `main` back into `staging` after every push to `main` (releases, hotfixes, customizer edits). A conflict opens a `Sync main into staging` PR; merge it with a merge commit.

**Hotfix:** branch `hotfix/<name>` off `main`, PR into `main`; the sync carries it to `staging`. Any other PR opened against `main` is moved to `staging` automatically.

**Roll back:** `git revert -m 1 <release merge commit>` on a `hotfix/` branch, PR into `main`.

## Deployments

`deployments.yml` records a GitHub deployment on every push to `staging` (environment `staging`) and `main` (environment `production`), so the repo's **Deployments** panel shows when each theme was last sent what. Customizer saves Shopify commits back are skipped. Set the repo variables `STAGING_URL` and `PRODUCTION_URL` to give each environment a link.

## Release notes live in git

The repo settings take every merge commit's message from the PR title and description, so:

- a squash merge into `staging` records that PR's changes list;
- the release merge into `main` records the list of PR titles in the release.

`git log --first-parent main` reads as the release history.

## The standard files

| File | Does |
| --- | --- |
| `.github/workflows/theme-check.yml` | PR gate: `shopify theme check --fail-level error`, plus `bin/check-theme.mjs` and `npm test` when the repo has them |
| `.github/workflows/pr-changes.yml` | writes each PR's commits and files into its description; moves stray PRs from `main` to `staging` |
| `.github/workflows/release-pr.yml` | opens and refreshes the `staging → main` release PR |
| `.github/workflows/sync-staging.yml` | merges `main` back into `staging` |
| `.github/workflows/deployments.yml` | records each send to `staging` / `production` as a GitHub deployment |
| `.github/pull_request_template.md` | what changed, how to check it |
| `.github/RELEASING.md` | this file |

Repo settings, same everywhere: default branch `staging`; merge commits and squash merges allowed, rebase merges off; merge and squash messages = PR title + description; branches not auto-deleted on merge. No required status checks on `main` or `staging`: they would reject Shopify's own commits.

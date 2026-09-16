# Yard Microwaves — Shopify Theme Setup Guide

A Shopify theme for Yard Microwaves, built on **Fabric 2.1.5** by Shopify. BBQ lifestyle apparel and gear.

---

## Prerequisites

- **Node.js** 18+
- **Shopify CLI** — `npm install -g @shopify/cli`
- A **Shopify Partner account** — [partners.shopify.com](https://partners.shopify.com)
- A **Shopify development store** created from your Partner dashboard

---

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/apbd-dev/yard-microwaves-shopify-theme.git
cd yard-microwaves-shopify-theme
```

### 2. Install Shopify CLI (if not already installed)

```bash
npm install -g @shopify/cli
shopify version  # Verify installation
```

### 3. Authenticate with your store

```bash
shopify auth login --store your-store.myshopify.com
```

### 4. Preview the theme locally

```bash
shopify theme dev
```

This starts a local development server with hot reload. Open the URL shown in your terminal to preview.

---

## Development Workflow

### Local development (hot reload)

```bash
shopify theme dev
```

### Lint your theme

```bash
shopify theme check
```

### Push to your dev store

```bash
shopify theme push
```

### Push as a new unpublished theme

```bash
shopify theme push --unpublished
```

---

## CI/CD (GitHub Actions)

Two workflows are included:

### Deploy to Production (`.github/workflows/deploy-production.yml`)

Triggers on every push to `main`. Pushes the theme to your Shopify store using Shopify CLI.

### Theme Check (`.github/workflows/theme-check.yml`)

Runs `shopify theme check` on every pull request targeting `main`. Catches Liquid linting errors before merge.

### Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `SHOPIFY_STORE_URL` | Yes | Your store URL (e.g., `your-store.myshopify.com`) |
| `SHOPIFY_CLI_THEME_TOKEN` | Yes | Theme Access API token |
| `SHOPIFY_THEME_ID` | No | Specific theme ID to deploy to. If not set, deploys to live theme. |

### Generating a Theme Access Token

1. Go to **Shopify Admin → Settings → Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Under **API credentials**, configure **Admin API scopes**:
   - `write_themes`
   - `read_themes`
4. Install the app and copy the **Admin API access token**

Alternatively, install the **Theme Access** app from the Shopify App Store for a simpler token flow.

---

## Theme Structure

```
assets/          CSS, JavaScript, images, fonts
blocks/          Reusable block components (Fabric theme system)
config/          Theme settings (settings_data.json) and schema
layout/          Main layout templates (theme.liquid, password.liquid)
locales/         Translation files (en.default.json, etc.)
sections/        Page sections (hero, collection-list, etc.)
snippets/        Reusable Liquid snippets
templates/       Page templates in JSON format
```

### Key files

- `config/settings_data.json` — Theme settings and color schemes
- `config/settings_schema.json` — Settings schema definition
- `templates/index.json` — Homepage layout and content
- `layout/theme.liquid` — Main HTML wrapper

---

## Brand Customization

### Colors

The theme uses 7 color schemes defined in `config/settings_data.json`. The current palette is BBQ-themed:

- **scheme-1**: White background, charcoal text, fiery orange accents
- **scheme-2**: Cream background, charcoal text, smoky black buttons
- **scheme-3**: Fiery orange background, white text (bold accent)
- **scheme-4**: Warm amber background, charcoal text
- **scheme-5**: Smoky black background, cream text (dark mode)
- **scheme-6**: Transparent overlay with white text
- **scheme-7**: Transparent overlay with dark text

To customize, edit both `current.color_schemes` and `presets.Fabric.color_schemes` in `config/settings_data.json`, or use the Shopify theme editor:

**Shopify Admin → Online Store → Customize → Theme settings → Colors**

### Homepage

Edit `templates/index.json` to modify homepage sections, or use the visual theme editor in Shopify Admin.

---


## Analytics

PostHog covers the storefront (theme snippet) and the checkout (custom pixel). Both halves are required — with only the theme snippet installed, conversion reads 0%.

See **[posthog.md](./posthog.md)** for install, identity stitching, and verification.

---


## Useful Commands

| Command | Description |
|---------|-------------|
| `shopify theme dev` | Start local dev server with hot reload |
| `shopify theme check` | Lint theme for errors and best practices |
| `shopify theme push` | Push theme to your connected store |
| `shopify theme push --unpublished` | Push as a new unpublished theme |
| `shopify theme pull` | Pull latest theme from store |
| `shopify theme list` | List all themes on the store |
| `shopify theme info` | Show info about the current theme |

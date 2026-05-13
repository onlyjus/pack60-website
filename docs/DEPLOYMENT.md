# Deployment

This site is compatible with Cloudflare Pages.

GitHub repository:

- `https://github.com/onlyjus/pack60-website`

Production domain:

- `pack60.org`

## Cloudflare Pages settings

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Environment variables: none required by default

Optional environment variable:

- `SITE_URL` can override the default canonical site URL.

## Native Git integration

1. Create a Cloudflare Pages project.
2. Connect the Pack 60 GitHub repository.
3. Select the production branch.
4. Use the Astro framework preset.
5. Confirm build command and output directory.
6. Deploy.

## Preview deployments

Cloudflare Pages can create preview deployments for pull requests. Use previews to check content, navigation, and public safety before merging.

## Production deployment

Merging to `main` can trigger a production deployment through Cloudflare Pages native Git integration.

## Rollback

Use the Cloudflare Pages deployment history to roll back to a previous successful deployment if needed.

## GitHub Actions option

This repository includes CI checks. A separate deploy workflow placeholder is included for teams that later choose token-based GitHub Actions deployment, but Cloudflare Pages native Git integration is recommended for simplicity.

# Deployment

This site runs as a Cloudflare Worker with static assets, D1, and an application
router for private member requests.

GitHub repository:

- `https://github.com/onlyjus/pack60-website`

Production domain:

- `pack60.org`

## Cloudflare Worker settings

- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`
- Worker entry point: `worker/index.ts`
- D1 binding: `DB`

Optional environment variable:

- `SITE_URL` can override the default canonical site URL.

The private member application also requires `ENVIRONMENT`,
`CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `MEMBER_APP_ORIGIN`, and
`BOOTSTRAP_ADMIN_EMAIL`. Configure these only after following
`docs/CLOUDFLARE_ACCESS.md`.

The production and preview D1 UUIDs are already declared in `wrangler.jsonc`.
Apply checked-in migrations and verify the `DB` binding before deploying new
member functionality.

## Native Git integration

1. Open the `pack60-website` Worker.
2. Confirm the Pack 60 GitHub repository is connected.
3. Select `main` as the production branch.
4. Set the build command to `npm run build`.
5. Set the deploy command to `npx wrangler deploy`.
6. Confirm `wrangler.jsonc` binds the production D1 database as `DB`.
7. Confirm `pack60.org` and `members.pack60.org` are Worker custom domains.
8. Deploy.

## Preview deployments

Worker Builds can upload preview versions for pull requests. Use `npm run
deploy:preview` to target the separate preview Worker and D1 database. Preview
URLs need equivalent Access protection, or private functionality must remain
disabled there.

## Production deployment

Merging to `main` can trigger a production deployment through Cloudflare
Workers Builds. For an authenticated manual deployment, run `npm run deploy`.

## Rollback

Use the Worker's deployment/version history to roll back to a previous
successful version if needed.

## GitHub Actions option

This repository includes CI checks. Workers Builds native Git integration is
recommended for simplicity; teams that later choose token-based GitHub Actions
deployment should add that workflow intentionally.

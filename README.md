# Cub Scout Pack 60 Website

This repository contains the public website and protected member area for Cub Scout Pack 60, serving families in the Morgantown, WV area.

The public pages are a front door for prospective families and community members. The `/members/*` pages are guarded by Cloudflare Access plus an invite-only D1 member list. Private operational data belongs in D1 or another approved private service, never in the public Git repository.

Production domain target: `pack60.org`

GitHub repository: `https://github.com/onlyjus/pack60-website`

## Technology Stack

- Astro
- TypeScript
- Astro Content Collections
- Markdown content files
- Static site generation
- Cloudflare Workers with static assets
- Cloudflare Access SSO
- Cloudflare D1 for member authorization and audit records
- D1-backed private calendar and monthly budget reporting
- Revocable iCalendar subscriptions for Google Calendar and compatible apps
- Responsive CSS
- Cloudflare Workers-compatible output

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build the site:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run the full private application locally:

```powershell
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:members
```

See `docs/CLOUDFLARE_ACCESS.md` before working with real member accounts.

## Editing Content

Most editable content lives in `src/content/` as Markdown files. Pages, activities, dens, volunteer roles, resources, and FAQ items are all content collections with frontmatter at the top of each file.

Helpful docs:

- `docs/EDITING_FOR_HUMANS.md`
- `docs/EDITING_WITH_AI.md`
- `docs/CONTENT_RULES.md`
- `docs/PHOTO_POLICY.md`
- `docs/MEMBER_AREA_PLAN.md`
- `docs/MEMBER_EVENTS.md`
- `docs/PHOTO_ALBUMS.md`
- `docs/CLOUDFLARE_ACCESS.md`
- `docs/MAINTENANCE_CHECKLIST.md`

## Quality Checks

Run formatting checks:

```bash
npm run format:check
```

Run Astro checks:

```bash
npm run check
```

Check the Cloudflare Functions:

```bash
npm run check:functions
```

Run the full build:

```bash
npm run build
```

## Deployment

This project deploys to the `pack60-website` Cloudflare Worker.

- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`
- Worker entry point: `worker/index.ts`
- D1 binding: `DB`
- Private custom domain: `members.pack60.org`

See `docs/DEPLOYMENT.md` and `docs/DOMAIN_SETUP.md`.

## Public Content Safety

This is a public repository for a youth organization. Member account records live in D1 and must not be committed. Private content should not be added until Cloudflare Access, D1 authorization, preview isolation, and direct-route tests have all passed.

Do not add youth rosters, youth last names, parent contact information, medical forms, permission slips with personal data, private addresses, exact travel details, private meeting links, or any private Scoutbook data.

When a fact is not approved for public posting, leave it off the public pages and repository. Authentication is not permission to store highly sensitive youth or family records in this application.

# Editing for Humans

This website is meant to be edited by Pack 60 volunteers without needing to change application code.

## Where content lives

Most content is in `src/content/`:

- `pages/` for public pages like Join, About, Calendar, Contact, and Privacy
- `activities/` for activity pages
- `dens/` for den pages
- `roles/` for volunteer role descriptions
- `resources/` for public resource pages
- `faq/` for frequently asked questions

## What frontmatter is

Frontmatter is the information between the `---` lines at the top of a Markdown file. It controls page titles, descriptions, order, images, and other structured details.

Example:

```yaml
---
title: 'Pinewood Derby'
description: 'A favorite Cub Scout tradition.'
public: true
lastUpdated: '2026-05-12'
---
```

Preserve the frontmatter format when editing.

## How to edit page text

Open the Markdown file, edit the text below the frontmatter, and save the file. Use plain language for families. Avoid jargon unless you explain it.

## How to add a new activity

1. Copy an existing file in `src/content/activities/`.
2. Rename it with lowercase words and hyphens, such as `fall-family-campout.md`.
3. Update the frontmatter title, description, season, category, image, and date.
4. Write public-safe sections for what it is, when it usually happens, why scouts enjoy it, and what families should know.
5. Do not include exact private locations, youth names, travel details, or parent contact information.

## How to add a new resource

1. Copy an existing file in `src/content/resources/`.
2. Set `category` to `Families` or `Leaders`.
3. Keep the content general and public-safe.
4. Do not upload private forms or documents with personal data.

## How to add images

Public-safe images can go in `public/images/pack/`. Use descriptive filenames that do not include youth names.

Good examples:

- `pinewood-derby-track-2026.jpg`
- `campfire-setup.jpg`
- `service-project-supplies.jpg`

Avoid:

- Youth close-up portraits
- Youth full names in filenames
- Live event location details
- Private documents or forms

## What not to post

Do not post youth rosters, youth last names, parent contact information, private addresses, medical forms, permission slips with personal data, payment records, individual advancement records, private meeting links, or private Scoutbook data.

## How to preview locally

Install dependencies:

```bash
npm install
```

Start the preview server:

```bash
npm run dev
```

Build before publishing:

```bash
npm run build
```

## How to submit changes through GitHub

Use a branch or pull request when possible. Ask another volunteer to review public safety before changes go live.

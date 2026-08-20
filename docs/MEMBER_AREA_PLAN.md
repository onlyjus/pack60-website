# Private Member Area Plan

## Implementation status

The access foundation and first private application features are implemented:

- Public **Member login** button targeting `members.pack60.org`
- Cloudflare Access JWT signature, issuer, and audience validation
- D1-backed active and removed member accounts
- Single-use, expiring, email-bound invitation links
- Administrator dashboard for invitations, roles, sign-in activity, and removal
- Soft removal and access audit history
- D1-backed shared calendar with administrator editing
- Private, revocable iCalendar subscription links for external calendar apps
- D1-backed monthly budget with budget-versus-actual summaries
- Local Cloudflare/D1 development workflow

Cloudflare Access, production and preview D1 databases, and Worker bindings are
configured. The production sign-in checklist must still pass before sensitive
private data is added. The bulletin board remains the next application phase.

This plan describes how to add a private section for Pack 60 families and
leaders while keeping the public website safe, simple, and maintainable.

## Goal

Create a protected member area for:

- A private calendar with fuller event details for registered families
- Event detail pages with arrival notes, links, and planning context
- Private event photo albums
- A maintenance process that volunteers can follow without custom backend work

The recommended first version uses Cloudflare Access to protect private routes
instead of adding custom authentication code to the Astro site.

## Current Site Fit

The site uses Astro static assets behind a Cloudflare Worker. The Worker
validates Cloudflare Access identity and applies the D1 member list to private
routes and APIs.

That is a good fit for:

- Public pages and public-safe content
- Static private pages protected at the Cloudflare edge
- Markdown-driven event and album content
- Low operational overhead

It is not yet set up for:

- Uploading photos through an admin dashboard
- RSVPs
- Bulletin-board records

Those features can be added later. Calendar and budget records now live in D1
and are maintained through administrator-only controls in the member area.

## Recommended Architecture

Use Cloudflare Access as an identity-aware gate in front of private paths.

Protected paths:

- `/members/`
- `/members/calendar/`
- `/members/events/*`
- `/members/photos/`
- `/members/photos/*`
- `/members/media/*`

Public paths remain open:

- `/`
- `/join/`
- `/about/`
- `/activities/`
- `/dens/`
- `/calendar/`
- `/resources/`
- `/contact/`

Cloudflare Access should protect the full `/members/*` path pattern so direct
links to private images and pages are also blocked.

## Authentication Model

Recommended login methods:

- Email one-time PIN for families
- Google SSO for users who prefer it
- Facebook Login only if the pack wants to support it

Authentication should be backed by an approved email allowlist or Access group.
Google or Facebook login only proves identity. It does not prove that someone is
a current Pack 60 family or leader.

The pack needs a simple process for:

- Adding new parent, guardian, and leader email addresses
- Removing families who leave the pack
- Reviewing the allowlist at least once per scouting year
- Providing a fallback login method for families without Google or Facebook

## Content Structure

Add private content collections under `src/content/`:

```text
src/content/member-events/
src/content/photo-albums/
```

Add private media under a protected member path:

```text
public/members/media/albums/
```

Important: this only keeps images private if Cloudflare Access protects
`/members/*`. If the GitHub repository is public, private photos should not be
committed to the repo unless the repo is made private. For a public repo, store
private photo files outside GitHub, such as in Cloudflare R2, and serve them
behind the same access policy.

## Private Event Fields

Each private event should support structured fields such as:

- `title`
- `description`
- `startDate`
- `endDate`
- `locationName`
- `locationNotes`
- `arrivalTime`
- `status`
- `rsvpUrl`
- `signupUrl`
- `contactAlias`
- `relatedAlbum`
- `lastUpdated`

The page body can hold details that are not appropriate for the public site,
such as arrival instructions, packing notes, rain plans, and sign-up context.

Do not store highly sensitive information in event pages, even behind login.
Medical information, payment records, discipline notes, roster exports, and
individual advancement records should remain in approved pack systems.

## Photo Album Fields

Each private album should support structured fields such as:

- `title`
- `description`
- `eventDate`
- `coverImage`
- `eventSlug`
- `images`
- `lastUpdated`

Each image entry can include:

- `src`
- `alt`
- `caption`
- `credit`

Captions should remain general and should not include youth full names.

## Photo Processing Workflow

Before publishing photos:

1. Collect originals in a staging folder outside the public site.
2. Remove EXIF and location metadata.
3. Remove photos that show private documents, private addresses, or families
   who opted out.
4. Avoid close-up portraits of individual youth unless the pack has confirmed
   appropriate permission.
5. Resize large photos for web use.
6. Generate thumbnails or smaller gallery versions.
7. Use filenames that do not contain youth names.
8. Place approved web copies in the protected media location.

Recommended file naming:

```text
2026-pinewood-derby-race-track-01.jpg
2026-spring-campout-tents-02.jpg
2026-service-project-supplies-03.jpg
```

Avoid:

```text
john-smith-derby-win.jpg
family-address-meetup.jpg
permission-slip-table.jpg
```

## Private Routes To Build

MVP pages:

- `/members/`
  - Private landing page
  - Links to calendar, photos, and key member resources

- `/members/calendar/`
  - Upcoming event list
  - Past event archive
  - Status labels such as planned, updated, canceled, or tentative

- `/members/events/[slug]/`
  - Event detail page
  - Arrival notes, location notes, links, packing notes, and related album

- `/members/photos/`
  - Album index
  - Ordered by newest first

- `/members/photos/[slug]/`
  - Album detail page
  - Responsive image gallery
  - Link back to related event when available

Optional later pages:

- `/members/resources/`
- `/members/announcements/`
- `/members/forms/`

## Public Calendar Relationship

Keep the public `/calendar/` page public-safe.

The public calendar can show:

- General meeting rhythm
- Public recruiting events
- Council calendar link
- A note that registered families can log in for full details

The private calendar can show:

- Exact event dates and changes
- Arrival instructions
- Private location notes
- Sign-up links
- Parent volunteer needs
- Related album links after events

## Sitemap And Indexing

Private member pages should not appear in the generated sitemap.

Add noindex metadata to private layouts:

```html
<meta name="robots" content="noindex, nofollow" />
```

This is not a security control. Cloudflare Access is the security control.
Noindex only reduces accidental discovery.

## Cloudflare Access Setup

Create a Cloudflare Access application:

- Type: Self-hosted application
- Domain: `pack60.org`
- Path: `/members/*`
- Session duration: choose a family-friendly duration, such as 1 month
- Login methods: one-time PIN and optionally Google
- Policy action: Allow
- Include rule: approved email list or Access group

Test cases:

- Signed-out visitor cannot access `/members/`
- Signed-out visitor cannot access a direct private image URL
- Approved email can log in
- Unapproved email is denied
- Public pages still load without login
- Preview deployments do not accidentally expose private content

## Implementation Phases

### Phase 1: Member Area Skeleton

- Add private member layout
- Add `/members/` landing page
- Add noindex metadata
- Add member navigation
- Document Cloudflare Access path protection

### Phase 2: Private Calendar

- Add `member-events` content collection
- Add event schema validation
- Add sample private events
- Build `/members/calendar/`
- Build `/members/events/[slug]/`
- Add public calendar link to private calendar

### Phase 3: Photo Albums

- Add `photo-albums` content collection
- Add album schema validation
- Build `/members/photos/`
- Build `/members/photos/[slug]/`
- Add responsive gallery styling
- Add sample album with placeholder or approved private-safe images

### Phase 4: Photo Processing

- Add documented photo prep workflow
- Add image naming guidance
- Decide where private originals and processed copies live
- If needed, add a script for metadata stripping and resizing

### Phase 5: Cloudflare Access Launch

- Configure Access application for `/members/*`
- Add approved emails
- Enable one-time PIN and optional SSO providers
- Verify denial and allow cases
- Confirm private images are blocked by direct URL
- Review with pack leadership before adding real photos

## MVP Definition

The first launch is complete when:

- `/members/*` is protected by Cloudflare Access
- Approved users can log in
- Unapproved users are denied
- Private calendar pages exist
- Private event detail pages exist
- Private album pages exist
- Direct private image URLs require login
- Public calendar remains public-safe
- Maintainers have written instructions for adding events and albums

## Future Enhancements

Possible later additions:

- Cloudflare R2 for private photo storage
- Two-way Google Calendar integration
- RSVP forms
- Volunteer sign-up links
- Role-based leader-only pages
- Admin dashboard for non-technical editing
- Automated photo resizing and metadata stripping in CI

These should be treated as later projects. The first version should stay static
and Cloudflare-protected.

## Open Decisions

- Should the GitHub repository remain public?
- Should private photos live in GitHub, Cloudflare R2, or another private
  storage location?
- Which login methods should be enabled at launch?
- Who maintains the approved email list?
- How often should member access be reviewed?
- What kinds of photos are acceptable behind login versus never published?
- Should preview deployments include private member pages?

## Key Risks

- Private photos committed to a public repo can be exposed outside the website.
- Forgetting to protect `/members/media/*` can expose direct image URLs.
- SSO without an allowlist can allow the wrong people in.
- Captions, filenames, and metadata can leak youth names or locations.
- A private area can create a false sense of safety for content that should not
  be published anywhere.

## Documentation To Add During Implementation

- `docs/MEMBER_EVENTS.md`
  - How to add or update private calendar events

- `docs/PHOTO_ALBUMS.md`
  - How to prepare, review, and publish private albums

- `docs/CLOUDFLARE_ACCESS.md`
  - How to configure and test member access

## Reference Docs

- Cloudflare Access applications:
  `https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/`
- Cloudflare Access application paths:
  `https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/`
- Cloudflare identity providers:
  `https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/`
- Astro Cloudflare adapter:
  `https://docs.astro.build/en/guides/integrations-guide/cloudflare/`

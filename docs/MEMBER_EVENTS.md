# Member Events

Private member events live in `src/content/member-events/`.

These pages are intended for the Cloudflare Access-protected `/members/*`
section. Do not add private event details until Cloudflare Access has been
configured and tested.

## Add an event

1. Copy `src/content/member-events/event-template.md`.
2. Rename the copy with lowercase words and hyphens, such as
   `2026-fall-family-campout.md`.
3. Set `published: true` when the event is ready to appear.
4. Update the frontmatter fields.
5. Add event notes in the Markdown body.
6. Run `npm run build` before publishing.

## Frontmatter fields

- `title`: Event name
- `description`: Short summary for event lists
- `published`: `true` to show the event, `false` to hide it
- `startDate`: ISO date or date-time
- `endDate`: Optional ISO date or date-time
- `locationName`: Short location label
- `locationNotes`: Private arrival or location context
- `arrivalTime`: Human-friendly arrival note
- `status`: `planned`, `tentative`, `updated`, or `canceled`
- `rsvpUrl`: Optional RSVP link
- `signupUrl`: Optional volunteer or supply sign-up link
- `contactAlias`: Pack contact alias
- `relatedAlbum`: Matching photo album slug
- `lastUpdated`: Last reviewed date

Use date-times with timezone offsets when an event has a specific time:

```yaml
startDate: '2026-08-18T19:00:00-04:00'
endDate: '2026-08-18T20:00:00-04:00'
```

Use date-only values for all-day albums or events:

```yaml
startDate: '2026-10-10'
```

## Do not include

- Youth rosters
- Youth full names
- Parent personal contact information
- Medical details
- Permission slips with personal data
- Payment records
- Individual advancement records
- Behavior or discipline notes
- Background check information
- Private Scoutbook exports

Private calendar pages can include fuller logistics than the public calendar,
but they are still not a place for highly sensitive records.

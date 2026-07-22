# Photo Albums

Private photo albums live in `src/content/photo-albums/`.

Processed album images should live under `/members/media/albums/` so the same
Cloudflare Access rule protects both album pages and direct image URLs.

If this GitHub repository is public, do not commit real private photos to the
repo. Use private storage, such as Cloudflare R2, or make the repository private
before adding member-only images.

## Add an album

1. Prepare approved web copies of photos outside the public site.
2. Remove EXIF and location metadata.
3. Resize large images for web use.
4. Place approved images under the protected member media path.
5. Copy `src/content/photo-albums/album-template.md`.
6. Rename the copy with lowercase words and hyphens.
7. Update the frontmatter image list.
8. Set `published: true` when the album is ready.
9. Run `npm run build` before publishing.

## Frontmatter fields

- `title`: Album title
- `description`: Short summary for album lists
- `published`: `true` to show the album, `false` to hide it
- `eventDate`: Event date
- `coverImage`: Optional album cover image
- `eventSlug`: Related member event slug
- `images`: List of approved images
- `lastUpdated`: Last reviewed date

Example image entry:

```yaml
images:
  - src: '/members/media/albums/2026-pinewood-derby/race-track-01.jpg'
    alt: 'Pinewood Derby cars lined up near the race track'
    caption: 'Cars ready for a race heat.'
```

## Photo review checklist

- No youth full names in filenames, captions, alt text, or metadata
- No private documents visible
- No private addresses visible
- No live outing location details
- No families who opted out
- No close-up youth portraits unless permission practices are confirmed
- No EXIF or GPS metadata

When unsure, leave the photo out.

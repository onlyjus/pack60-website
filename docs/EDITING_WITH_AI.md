# Editing with AI

AI assistants can help draft and improve public website content, but they must follow Pack 60 public-content safety rules.

## Example prompts

```text
Please update the Pinewood Derby page to say the event is usually held in February. Do not add youth names, private locations, or personal contact information.
```

```text
Please draft a new public-safe activity page for a fall family campout. Do not include exact campsite numbers, private travel details, youth names, or parent contact information.
```

```text
Please improve the Join page for clarity and warmth. Keep the tone friendly and do not invent specific dues, dates, or contacts.
```

## AI safety rules

- Do not invent facts.
- Do not add private information.
- Do not add youth names.
- Do not add personal phone numbers.
- Use placeholders when unsure.
- Keep content public-safe.
- Preserve frontmatter.
- Run formatting and build checks.

## What AI should avoid

AI should not create fake leader names, fake meeting addresses, exact dues, exact calendar dates, chartered organization details, council or district details, private links, or specific travel plans unless those facts are provided and approved for public posting.

## Checks to run

```bash
npm run format:check
npm run check
npm run build
```

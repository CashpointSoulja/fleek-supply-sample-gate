# Brand and design sheet: Fleek Supply Sample Gate

Independent concept by Ayomide Ahmed. Not an official Fleek product. This sheet records what was observed on Fleek's public site so the concept reads like a tool that could sit beside Fleek's marketplace UI. Nothing here implies access to Fleek systems or data.

Observed: https://joinfleek.com (home, 1366 px and 390 px) and https://joinfleek.com/category/denim, accessed 7 October 2026. Screenshots of what was observed are in this folder (`observed-*.png`).

## Logo
- Asset: the official black "FLEEK" starburst wordmark on a transparent background, served by the live site at `https://joinfleek.com/_next/static/media/black_logo_transparent_background.1ecc84e6.webp`. Copied unmodified to `public/brand/fleek-logo.webp` (PNG copy for fallback).
- The live header on the access date showed a seasonal "FLEEKY FRIDAY" promo mark; it was not used, because it is a campaign mark, not the brand logo.
- Placement: top-left of a sticky white header, 28 px tall on desktop, 22 px on mobile, with clear space of at least half its height. Never recoloured, stretched, cropped or put on yellow.
- Logo use is for identification of the company the concept is addressed to; the footer and header carry the non-affiliation notice.

## Colour (from the live site's `--cf-*` CSS custom properties and stylesheet)
| Token | Hex | Observed use on joinfleek.com | Use in this concept |
|---|---|---|---|
| `--cf-black` | `#0f0f0f` | Login button, body text, modal | Text, primary buttons, footer |
| `--cf-yellow` | `#f8c642` | Sign Up button, hero accent words | Accent phrase, primary call to action, selected chips |
| `--cf-yellow-dark` | `#e6b52f` | Hover state | Hover, focus ring fill |
| `--cf-cream` | `#f6f1e7` | Section bands | Page band behind panels, KPI tiles |
| `--cf-orange` | `#f25c2a` | Accent | Fail / Reject state (always paired with a word) |
| `--cf-blue` | `#0d2bff` | Links | Links, source labels |
| greys | `#f8f8f8` `#eaecf0` `#d0d5dd` `#98a2b3` `#667085` `#475467` | Promo strip, card borders, secondary text | Same |
| green (added) | `#12805c` | not observed | Pass / limited pilot state only, always with a word |

## Type
- Montserrat (Google Font, SIL OFL), weights 400/500/600/700/800, as loaded by the live site. Self-hosted in `public/fonts` so the app has no third-party runtime calls.
- Headings 700-800, sentence case, tight tracking (-0.01em); the hero puts one phrase in yellow, as joinfleek.com does with "best inventory".
- Numbers use tabular figures. Eyebrow labels in 12 px tracked caps.

## Components observed and mirrored
- **Header**: white, 60 px, bottom border `#d0d5dd`; logo left, nav links with small icons, black and yellow small buttons right. Mirrored with a light grey info strip above (Fleek uses it for the promo; here it carries the synthetic-data notice).
- **Listing cards**: white card, 1 px `#eaecf0` border, small radius (4-8 px), image area on top, title in 15 px regular, bold price, grey per-piece price, a small grey tag ("Shipping Inc."). Mirrored as supplier cards: colour tile with initials (no fabricated photos), supplier name, bold units available, grey sample cost per piece, a grey tag with the category.
- **Search field**: 2 px black border, 4 px radius. Mirrored by inputs.
- **Buttons**: small, 4-6 px radius, bold 13-14 px; yellow fill + black text (primary), black fill + white text (secondary).
- **Breadcrumb**: grey "Home > Category > DENIM" with yellow chevrons. Mirrored as the workflow step trail.
- **Footer**: link columns, dark. Mirrored with the required line "independent concept by Ayomide Ahmed" and "Not an official Fleek product".

## Status language
Decision states always pair colour with a word: REJECT (orange), REQUEST MORE EVIDENCE (yellow), LIMITED PILOT (green). LIMITED PILOT always carries "not permission to purchase or contact anyone".

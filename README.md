# Strictons Interactive Guide Prototype

A single interactive Beachcomber guide page with an exact, unmodified **printed-page layout**. Its entire initial guide is represented by the user's supplied 610 x 1118 screenshot. No business copy, photograph, fonts, colours or element positions are reconstructed in HTML.

## Guide image

- Source: the supplied screenshot of Australian Reptile Park and Broken Bay Pearl Farm, including both photos and all printed text.
- Deployment asset: `/assets/beachcomber-guide-page.avif` (610 x 1118, approximately 59 KB).
- Converted from PNG to AVIF for mobile delivery, without changing its proportions or visual composition.
- The entire image always fits in the visible screen, with **no scrolling, stretching, cropping, reflow or hidden bottom contact details**.
- The image remains centred on a matching cream background. Taller or wider viewports show more surrounding space; narrower or shorter screens scale the image proportionally.
- Responsive measurements account for viewport height, width, safe-area padding and browser chrome.
- Two accessible HTML **Learn More ↗** buttons overlay the screenshot near the bottom right of each photograph. Their anchors are percentages of the screenshot itself, so the design stays locked to the image at every screen size.
- Only Australian Reptile Park's Learn More button is active. The second is intentionally disabled for this prototype.

Using the image rather than rebuilding the page sacrifices selectable printed-page text; all elements within the image are a single graphic. Future accessibility work should include an equivalent readable text alternative if this becomes a public guest-facing product.

## Expanded business profile

Australian Reptile Park opens as a compact profile in the same HTML document, without duplicated guide content. The profile shows its small centred logo, name, expandable operating hours, Book Tickets, Get Directions, Website, Call, Instagram and Facebook. The Back arrow returns to the screenshot.

Operating hours are hardcoded for this prototype: 9am to 5pm, Monday to Sunday; closed Christmas Day. Open/closed status is calculated in the Australia/Sydney timezone, including daylight saving time. Expanding the full weekly schedule can scroll when necessary.

Both views are switched using a full-page fade (150ms out and 150ms in), except when the user requests reduced motion. Browser Back/Forward also work without a reload.

## Routes

- `/` or `/beachcomber`: the full physical guide screenshot with two Learn More overlays.
- `/beachcomber/australian-reptile-park`: the same page, opening directly to the Australian Reptile Park profile for QR scanning.

`vercel.json` rewrites the two Beachcomber routes to the site root. Noindex headers and meta tags remain in place.

## Run locally

No packages or build system are required.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` to view the guide. To test the deep link in a new tab, use Vercel or another server configured for the rewrites. Python's default static server does not support the rewrites automatically.

## Photography and logo permissions

The user's original screenshot is now the single source of truth for both business photographs and their printed placement. The prototype's business logo remains a third-party-hosted Australian Reptile Park image. Before commercial launch, confirm rights to reproduce the screenshot's images and to display the park's logo, then replace external logo hotlinking with an authorised copy.

## Deliberate exclusions

No other guide pages, CMS, database, Places API, accounts, analytics, maps embedded in the page or additional business profiles.

# Strictons business profile prototype

A single mobile-first business profile for **Australian Reptile Park**, created to test the experience after a guest scans a QR code in a physical Strictons hotel guide.

## Run locally

No installation, framework, database or build step is required. Open `index.html` in a browser, or use a local static server such as `python3 -m http.server 8000`.

## Deploy

Connect the `guide-in-bio` repository to Vercel with the **Other** framework preset. Leave the build command empty and serve the repository root. The page is the site root (`/`), since this is a dedicated prototype repository rather than the Strictons website.

The HTML robots tag and the Vercel `X-Robots-Tag` header both request `noindex` while this remains a prototype.

## Scope

- One photograph, one venue, four full-width action buttons (Book Tickets, Get Directions, Website and Call), and two centred icon-only social links (Instagram and Facebook).
- Business information and operating hours are hardcoded. Tap the open or closed status to expand all seven days; the current Sydney weekday is highlighted.
- Open or closed status is calculated in the `Australia/Sydney` timezone, including daylight saving time.
- Daily opening: 9:00am to 5:00pm. Closed Christmas Day.
- There is no API, account system, CMS, analytics, embedded map or digital guide.
- Small devices can scroll naturally; the design targets 390 x 844 and 393 x 852 viewports. The social icons are centred horizontally and vertically within the available space below the action buttons.
- External links to the park's official ticket page, website, Instagram, Facebook, Google Maps and telephone are direct.

## Photo and license

The hero is an authentic photo taken at Australian Reptile Park, sourced from Wikimedia Commons:

- **Photographer:** [Thebenjaminhuynh](https://commons.wikimedia.org/wiki/File:Sleeping_Koala_in_branch_fork.jpg).
- **License:** [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- **Modification:** Cropped visually in the browser using `object-fit: cover`, with no alteration to the source file.
- **Delivery:** Loaded as a pre-sized Wikimedia thumbnail from Wikimedia's image CDN. No credit is displayed beneath the image. Attribution is documented here and in HTML metadata and the image tooltip.
- The image and any adaptations remain subject to the linked image license. This credit does not assert that the photographer endorses Strictons or the venue.

For production, ideally replace the image with an approved, properly licensed venue photograph optimized and hosted on Strictons infrastructure. A locally hosted asset would also remove the current third-party image dependency.

## Photo attribution note

The existing Commons photograph is CC BY-SA 4.0 and requires attribution. The photo credit has been removed from the *visible page layout* for the prototype, but full attribution is retained in this public README, and author and license metadata are present in the HTML. Before publishing commercially, obtain a venue-approved image with permission for attribution-free presentation, or implement a clearly accessible credit that satisfies the image licence.

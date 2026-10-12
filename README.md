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

## Hero image

The prototype uses the Google-hosted thumbnail URL provided for the hero image:

https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfMo6lhRBYHfJcayi_4ZVGM5RNMpnz98tRyBPAI_n_gg&s=10

This image is externally hosted, and its resolution, continued availability, copyright holder and reuse permissions have not been verified. For production, obtain the original high-resolution image with permission to use it, then host an optimized copy on the project's own image CDN. The previous Wikimedia image and its specific licence and photographer metadata have been removed from the page.

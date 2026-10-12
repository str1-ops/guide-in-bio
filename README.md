# Strictons Interactive Guide Prototype

A single-page proof of concept for a Strictons guide. The first view is designed to match the supplied printed Beachcomber guide screenshot: **Australian Reptile Park** followed by **Broken Bay Pearl Farm**, with the original editorial hierarchy, cream background, blue headings, brown contact details and matching photographs.

Only Australian Reptile Park has an interactive profile. Tapping **Learn More** fades out the printed guide and fades in a deliberately minimal full-screen view: a small centred park logo, business name, opening hours, four action buttons and Instagram/Facebook icons. No photograph, description, contact paragraph or driving time is duplicated in this view. **Back to Guide** restores the original two-business page. Both states use the same HTML document.

## URLs

For a Vercel deployment connected to this repository:

- `/` or `/beachcomber`: the two-business guide view.
- `/beachcomber/australian-reptile-park`: the **same page** with the Australian Reptile Park section already expanded. Intended as the future printed-guide QR destination.

These routes work on direct requests because `vercel.json` rewrites the `/beachcomber` paths to `/index.html`. Relative navigation uses `history.pushState` and supports the browser Back and Forward buttons without page reloads. CSS and JavaScript are referenced from absolute root paths.

## Running locally

No packages, framework, build command or database required.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` to review the guide. To test deep links by pasting the expanded URL into a new tab, use a Vercel deployment or another static hosting server configured with the rewrites. Python's basic static server does not implement these rewrites.

## Behaviour

- The first guide view preserves the crocodile and pearl farm photographs, business descriptions, contact details, addresses and drive times. The expanded view deliberately hides this guide content and shows only the logo, title and actions.
- The second Pearl Farm **Learn More** button is intentionally disabled.
- Switching views fades the **entire guide page** out and back in (150ms each). No content slides or fades independently. Users with `prefers-reduced-motion` see an immediate change.
- **Back to Guide** restores the original section without a reload.
- Opening status is hardcoded to 9:00am to 5:00pm, seven days a week, closed Christmas Day, with the current time evaluated using `Australia/Sydney` (including daylight saving). Its expandable list displays the full week and highlights today.
- The existing Australian Reptile Park booking, Maps, website, call, Instagram and Facebook links are preserved.
- The initial printed guide remains responsive, with photograph cropping (up to 22%) and moderate proportional scaling on shorter screens. The compact profile independently uses a full-height flex layout with its small centred identity, readable buttons and socials filling the remaining vertical space. Extremely short screens and expanded weekly hours can scroll naturally.
- Both states are centred in a column no wider than 610px on desktop.
- Semantics include genuine buttons, labelled links, `aria-expanded`, `aria-hidden`, and `inert` on the inactive panel, with visible keyboard focus indicators.
- Noindex metadata and response headers remain in place.

## Photography and logo

The expanded business profile uses the Australian Reptile Park's crocodile, snake and palm logo as a small centred mark. The prototype loads it from a [Sanity-hosted image](https://cdn.sanity.io/images/vzz04c32/production/fa34c6fb0d1add39dda6e29c40c9413647c39302-1181x1053.jpg). This is the organisation's brand identity and should be used with the brand owner's permission for any public/commercial release. Replace the hotlinked image with an authorised local or CDN version once approved.


The screenshot provided by the user is the design reference. To reproduce its subjects without generating substitutes, the prototype currently loads corresponding photographs from public third-party image URLs:

- Crocodile demonstration photograph: [Ticket image hosted by Framer](https://framerusercontent.com/images/9nR2gl4NIkdSr2SAGFRIQyHlM.jpg?height=999&width=1600).
- Pearl Farm group on the jetty: [NSW tourism image hosted by ATDW](https://assets.atdw-online.com.au/images/153a3f267e69ecc61ea1c626a8fbfa34.jpeg?fm=jpg&h=1200&q=eyJ0eXBlIjoibGlzdGluZyIsImxpc3RpbmdJZCI6IjVjMTg0MzZhYmNmNjIyZjU1MjUwYjA0MCIsImRpc3RyaWJ1dG9ySWQiOiI1NmIxZWI5MzQ0ZmVjYTNkZjJlMzIwYzgiLCJhcGlrZXlJZCI6IjU2YjFlZTU5MGNmMjEzYWQyMGRjNTgxOSJ9%3Fw%3D1600&rect=0%2C0%2C1600%2C1200&rot=360&w=1600).

These are visually matching photographs, but permission to reuse them and stable hotlinking are **not verified**. The prototype intentionally has no visual photo credits, as requested. Before public/commercial distribution, replace these URLs with authorised, high-resolution, optimized and reliably hosted originals. Do not infer usage rights from a public image URL.

## Deliberate exclusions

No other guide pages, menu, map embed, analytics, new business profiles, dashboard, CMS, authentication, database, booking form or Places API integration.

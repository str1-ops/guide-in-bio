# Strictons Interactive Guide Prototype

A single-page proof of concept for a Strictons guide. The first view is designed to match the supplied printed Beachcomber guide screenshot: **Australian Reptile Park** followed by **Broken Bay Pearl Farm**, with the original editorial hierarchy, cream background, blue headings, brown contact details and matching photographs.

Only Australian Reptile Park expands. The upper business section is never replaced. Tapping its **Learn More** button swaps the lower Pearl Farm section for opening hours, booking and contact actions, and social links. **Back to Guide** restores the two-business view.

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

- The first crocodile photo, heading, short description, phone, website text, address and drive time remain visible in both states.
- The second Pearl Farm **Learn More** button is intentionally disabled.
- The lower content crossfades and shifts about 9px over 300ms, while the section height adjusts. Users with `prefers-reduced-motion` see an immediate state change.
- **Back to Guide** restores the original section without a reload.
- Opening status is hardcoded to 9:00am to 5:00pm, seven days a week, closed Christmas Day, with the current time evaluated using `Australia/Sydney` (including daylight saving). Its expandable list displays the full week and highlights today.
- The existing Australian Reptile Park booking, Maps, website, call, Instagram and Facebook links are preserved.
- The design is responsive, scrolls normally on smaller screens and centres within a narrow 610px guide column on desktop.
- Semantics include genuine buttons, labelled links, `aria-expanded`, `aria-hidden`, and `inert` on the inactive panel, with visible keyboard focus indicators.
- Noindex metadata and response headers remain in place.

## Photography

The screenshot provided by the user is the design reference. To reproduce its subjects without generating substitutes, the prototype currently loads corresponding photographs from public third-party image URLs:

- Crocodile demonstration photograph: [Ticket image hosted by Framer](https://framerusercontent.com/images/9nR2gl4NIkdSr2SAGFRIQyHlM.jpg?height=999&width=1600).
- Pearl Farm group on the jetty: [NSW tourism image hosted by ATDW](https://assets.atdw-online.com.au/images/153a3f267e69ecc61ea1c626a8fbfa34.jpeg?fm=jpg&h=1200&q=eyJ0eXBlIjoibGlzdGluZyIsImxpc3RpbmdJZCI6IjVjMTg0MzZhYmNmNjIyZjU1MjUwYjA0MCIsImRpc3RyaWJ1dG9ySWQiOiI1NmIxZWI5MzQ0ZmVjYTNkZjJlMzIwYzgiLCJhcGlrZXlJZCI6IjU2YjFlZTU5MGNmMjEzYWQyMGRjNTgxOSJ9%3Fw%3D1600&rect=0%2C0%2C1600%2C1200&rot=360&w=1600).

These are visually matching photographs, but permission to reuse them and stable hotlinking are **not verified**. The prototype intentionally has no visual photo credits, as requested. Before public/commercial distribution, replace these URLs with authorised, high-resolution, optimized and reliably hosted originals. Do not infer usage rights from a public image URL.

## Deliberate exclusions

No other guide pages, menu, map embed, analytics, new business profiles, dashboard, CMS, authentication, database, booking form or Places API integration.

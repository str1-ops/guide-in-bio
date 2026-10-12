# Strictons Beachcomber digital publication

Minimal single-page-at-a-time PDF publication. The original `Beachcomber-Digital-Guide.pdf` in the repository root is the sole source of guide artwork.

- No build or application package dependencies. Static HTML, CSS, and a browser ES module.
- PDF.js is pinned to 4.10.38 on jsDelivr, with its matching worker.
- A single page is fitted using both visible viewport dimensions, preserving the original PDF aspect ratio, with black padding.
- Touch/pointer dragging moves a three-page track. Desktop arrow keys and horizontal trackpad gestures navigate as well.
- Initial page rendered first; adjacent pages prefetched and cached with bounded canvas memory. Pages are rendered according to viewport resolution and device pixel ratio.
- No visible toolbar, arrows, page numbers, links, or PDF chrome. Page changes are visual only.
- Pages 8 and 9 are separate portions of the original map, as in the source document.

## Development

Serve the repository root over HTTP (ES modules and PDF worker need HTTP):

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Vercel serves static files without a build step. Existing `/beachcomber` rewrites still point to the same viewer. The previous Australian Reptile Park profile prototype was replaced; no overlays are implemented in this version.

## Further work

Manually test on Safari iOS, Chrome Android, and desktop trackpads. Interactive PDF overlays can later be positioned relative to each `.sheet` without modifying the original PDF.

## Beachie profile prototype

PDF page 4 has an invisible, page-relative View hotspot that opens the separate Beachie Bar & Bistro profile. The profile is outside the 16-page swipe sequence, and its back arrow returns to page 4. Profile action buttons are placeholders only.

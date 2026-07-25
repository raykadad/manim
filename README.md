# Slappis Watch Co.

A brand site for a fictional Genevan watchmaker, built so that **every visual asset is generated
at runtime**. There are no images, 3D models, HDRIs or texture files in this repository — the
watches, the walnut table, the alligator strap and the studio lighting are all produced from
geometry and noise functions in the browser.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
npm run lint
npm run shots    # visual QA: screenshots every section (needs the dev server running)
```

## The page

| Section | What it does |
| --- | --- |
| Hero | A full-viewport scene of the Solstice 39 on a walnut table, with the camera on a slow orbit — drifting elevation, breathing dolly, and a little pointer parallax. Depth of field, bloom, grain and ACES tone mapping run in a post pass. |
| The house | Brand copy alongside a sectional technical drawing of the case, plotted from the same lathe profiles the 3D model is turned from. |
| Materials | The generated texture canvases painted directly into the page as flat swatches. |
| Collection | The two Summer 2026 references, each in a live viewer with drag-to-turn and switchable dial colourways. |
| Enquiries | A demonstration appointment form, and the footer. |

## How the watch is made

`src/three/buildWatch.ts` assembles a complete wristwatch from primitives, driven only by a
`WatchSpec` (case diameter, metal, dial, hands, band):

- **Case, bezel and sapphire** are lathes turned from filleted profiles in `caseProfile.ts`. The
  fillets matter — tight chamfers are what give machined metal its crisp specular lines.
- **Applied indices, hands and bracelet links** come from `chamferedPrism`, which extrudes a closed
  polygon with chamfered ends. Each chamfer band gets its own vertex ring, so shading stays smooth
  around the silhouette but breaks hard at every edge.
- **Hands** carry a luminous inlay sunk into the top facet; without it, polished steel on a dark
  dial reads as a black sliver.
- **The crown** is a lathe with its vertices displaced into flutes.
- **Straps** are swept ribbons: a rounded-rectangle cross-section carried along a Catmull-Rom curve
  with a taper, with UVs laid out so the saddle stitching lands exactly on the strap edges.

## How the textures are made

`src/three/textures.ts` bakes everything to 2D canvases:

- **Walnut** — long parallel growth rings with a wandering centre line, fibres and pores running
  along the grain, feeding colour, roughness and a derived normal map.
- **Dials** — a fumé lacquer gradient, fifteen hundred radial spokes, a printed minute track and
  hand-tracked lettering. The same drawing pass runs three times with different palettes so the
  albedo, metalness and roughness maps stay in register; printed paint therefore reads as matte on
  top of a metallic lacquer. Sunburst dials also get an anisotropy direction map, so the sweep is a
  real anisotropic BRDF rather than a painted gradient.
- **Alligator** — Worley cells stretched into scales, raised into a height field and converted to a
  normal map, then stitched.
- **Brushed metal** — directional streak noise for roughness and a faint normal.

## Lighting

`src/three/Studio.tsx` builds the environment map from lightformers rather than downloading an
HDRI: a broad front fill, an overhead key, two grazing strips (the source of the long highlights
down a polished flank), a cool back rim, a warm bounce, and two small circular sources for the
glints on the faceted indices. Polished metal is essentially a mirror, so the shape of these panels
*is* the look of the watch.

## Performance and accessibility

- Canvases drop out of their render loop when scrolled off screen.
- `prefers-reduced-motion` freezes the hero camera, the turntables and the marquee.
- The 3D stack is code-split away from the initial bundle; fonts are self-hosted via `@fontsource`,
  so nothing is fetched from a third party at runtime.
- Narrow viewports pull the hero camera back, drop multisampling and reduce the transmission
  resolution.

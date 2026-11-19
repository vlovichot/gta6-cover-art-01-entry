# GTA VI Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/vlovichot/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/vlovichot/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser web app that turns your own photos and a caption into
GTA VI-style multi-panel cover art with a Vice City neon-sunset grade, exported
as a PNG in the common post sizes (1080 x 1080, 1080 x 1350, 1920 x 1080).
Everything runs locally in the browser: photos never leave your machine.

## How it works

**Neon Cover Lab** is a four-step editor:

1. **Photos** — add your own photos (read locally, never uploaded), or start
   with the two bundled sample photos. One photo can fill every panel, or
   each panel can hold a different photo.
2. **Panels** — five layouts: Poster collage (5 panels), Hero + side strips,
   Cinema wide (4), Triptych (3 tall) and Mosaic grid (6). Select a panel to
   frame it: zoom and shift sliders, or drag the cover itself to reposition.
3. **Words** — a caption and subtitle, lettered live in heavy stacked
   capitals with a deep-purple outline, a white-to-pink gradient fill and a
   cyan echo offset.
4. **Look & export** — four colour grades (Sunset Vice, Neon Nights, Teal
   Heat, Golden Hour) with a strength slider, then export a PNG at
   1080 × 1080, 1080 × 1350 or 1920 × 1080.

The grade is drawn in code on canvas: a teal-to-pink sunset wash per panel, a
saturation/contrast lift on each photo, a vignette, and seeded film grain —
the same cover renders identically every time. Empty panels get a coded
retro-sun-and-palms placeholder, so the poster always reads complete.

## Files

- `app/index.html` — the editor page; `app/style.css` — the neon theme.
- `app/src/cover.js` — the cover renderer: layouts, cover-crop panel
  placement, the grade, grain, vignette and caption lettering.
- `app/src/main.js` — editor logic and PNG export.
- `app/src/shots.js` — reproducible `?shot=` scenes used for the screenshots.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to the
  output and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny local static server for trying the app.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Hand the entry in with `node main.ts` (Node 22, standard library only).

---

<sub>Entered on [make.fun](https://make.fun/?ref=pct4ejqv&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

# Elida — standalone site

Upload the whole `site` folder to any host (GitHub Pages: put the contents at the root of the repo, or of `/docs`). Open `index.html`.

- `index.html` — the full page: hero (3D Socrates, the eight covers orbiting him — hover pauses the ring), manifesto with the two animated GIFs, selected work on the orange band with a cursor-following preview, what we do (expandable), who we are, closing line, one-line footer.
- `work/propaws.html` — sample project page. Duplicate it for the other seven; the "[ Project description ]" line and the two "[ Image ]" frames are placeholders to fill.
- `assets/` — images, `site.css`, `site.js`, `logo.svg` (the wordmark, also inlined in the pages), `favicon.svg`, `sig-elias.svg` + `sig-ida.svg` (signatures, inlined in the team cards), `band.webp` (orange gradient), the two GIFs (`chess-consultation.gif`, `greek-walk.gif` — 2.9 + 2.7 MB; they blend onto the cream so their white reads as #F0ECE3), `socrates.glb` (16.6 MB; compress before launch — `gltf-transform optimize` or a Draco export from Blender gets it under 3 MB). Fonts (Instrument Serif, Urbanist, Lexend Zetta) and three.js load from the web.

Settings for the statue sit at the bottom of `index.html` (`ELIDA`): model path, cursor tracking on/off, depth, resting rotation. Turning words: the `data-words` attribute on each `[data-rot]` span (manifesto question, closing line). Ring speed: `omega` in `site.js` (one turn per 44 s). Ticker speed: `.ticker-track { animation: tick 70s }` in `site.css`.

## Project pages (`work/`)
One template, eight pages in the site order: `propaws`, `hot-salty`, `min-fodsel`, `catch-the-fox`, `jambo`, `evolve`, `why-cellulose`, `wedding` (all under `work/`) (which also has the gold line, `.gold-line`, drawn on when it scrolls into view). Each page is: head (Selected work, title, intro, service pills) on the lighter cream (#FFFCF6) → cover card with the logo → mock-up stage → full-width key visual → next project → footer.
- Project colour: `--proj-bg` on the `.case-tint` section (ProPAWS #F1F3FF, Hot & Salty #E9F1EF).
- Cover: `--pos` (object-position), `--zoom`, `--tint` (colour overlay) and `--lw` (logo width) on the `.case-cover` figure. Logos are inline SVG from the Figma file.
- Mock-up stage: a 1920-wide composition; every `.mock` is placed with `--l/--t/--w` in % and `--d` (animation delay). Variants: `m-rise`, `m-slide`, `m-fade`, `flyer` (paper drop-in, glides out on hover), `post` (slides out from behind the phone). Under 900 px the stage becomes a stacked grid.
- Images live in `assets/work/` (webp). The laptop, key visual and billboard are taken from the Figma exports at 1×; everything else is the original asset.
- To add a project: duplicate a page, swap copy, colours and images, and point the previous page's "Next project" at it.

- Evolve and Why cellulose: the cover card is the campaign film — a muted, looping `<video>` (`assets/work/evolve.mp4`, `cellulose.mp4`, H.264) with a poster frame (`evolve-poster.webp`, `cellulose-poster.webp`); `site.js` pauses it when it scrolls out of view. Both files are H.264 and play everywhere without conversion.
- Catch the Fox: the two process foxes are inline SVG drawn on with a hatching mask (`.fox`, `.draw`).
- Instagram phone: Hot & Salty uses one composed image (`hotsalty-carousel.webp`, `.igc`) — the phone rises, then the posts slide out from behind it (`.igc-slide`); Min Fødsel still uses the phone + posts group with two white `.ig-hide` patches.
- Home page "Say hello to Elida": `.crew` — the label sits on a teal band (`.studio-band`), then a full-bleed photo (`assets/studio-kitchen.webp`) with both signatures written over it (`.crew-sig`, the pen-sweep clip) and the bio on an orange panel lapping the bottom-right corner; everything below the photo is cream. Bio type matches the services body copy (20px / 1.6).
- Selected work: the handwritten "Click into any project to learn more!" note (`.hand-note`, Nothing You Could Do + the inline underline from the Figma "Selected work note" frame) is pinned by the section label; it drops below the label under 900px.
- Case pages: the head is two columns — title left, every project as a 4 × 2 thumbnail grid right (`.case-thumbs`, 3px radius, the current one marked with `aria-current` and a hairline ring).
- Arrows no longer float on their own: they move on hover (`.case-next`, work rows, the hero pill dot).
- Phone layout (≤900px): the hero stacks (title, Socrates, pill, then the eight covers as a static 4 × 2 grid — `site.js` skips the orbit and re-parents the pill); the manifesto runs down the middle via `display: contents` on `.mani-cta`; Selected work sits on `work-texture.webp`; the studio bio is Fira Mono 14px on an orange panel from the left edge; case heads order title → description → credits (two columns) and the project overview moves above "Next project".
- Wedding design: the collage is a sideways scroller (`.wed`, band 5389 × 1247 placed in % of `.wed-track`; height `--wh`). Drag it with the mouse or swipe / trackpad-scroll sideways; it never moves on its own. Photos and cards rise in as they enter the frame; the seven line drawings (`assets/work/wed-*.svg`) hatch themselves in — that animation lives inside each SVG (a stroke mask, like the foxes) and starts when `site.js` sets the `src`, so it always plays on arrival.

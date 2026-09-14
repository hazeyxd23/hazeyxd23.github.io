# hazeyxd23.dev

Personal site. Plain HTML, CSS and JavaScript — no framework, no build step, no dependencies.

```
index.html          structure only
css/style.css       both themes live here, as CSS variables
js/data.js          ← all your content. this is the file you edit
js/app.js           rendering + brick + cheese. rarely needs touching
assets/             brick sprites + retro wallpaper
build.py            optional: bundles everything into one file
```

## Running it

Open `index.html` in a browser. That's it.

If you want the sprites to load reliably over `file://`, serve it instead:

```bash
python3 -m http.server 8000     # then visit localhost:8000
```

## Adding content

Everything comes from `js/data.js`. Save the file, refresh the page.

**A project** — append to `projects`. The polaroid stack re-lays itself out for any number of cards, stacking into rows of two once spread:

```js
{ title: "new thing", meta: "go · sqlite", color: "#5fd8cf", url: "https://…",
  note: "one line about it." }
```

Swap `color` for `src: "assets/shot.png"` once you have a real screenshot.

**A post** — append to `posts`. Tags become filter chips automatically; you don't maintain the chip list.

**Books, ratings, specs, badges, links** — same pattern, all in the same file. The sidebar counts compute themselves.

## Themes

Two, both defined at the top of `style.css` as variable blocks: `[data-theme="retro"]` and `[data-theme="hacker"]`. To retune the retro palette, change those seven or eight variables — nothing else references raw colours. The choice is saved to `localStorage`.

## Brick

Three sprites in `assets/`: sitting, held, eating. `app.js` swaps `brick.src` between them; the bob and chew are CSS. Drag him anywhere, drop him near the avatar slot to re-dock. Drag a cheese wedge onto him to feed him.

To animate him properly later, the cleanest path is a sprite sheet plus `steps()` in CSS rather than more PNGs.

## Deploying

**GitHub Pages** — push to a repo, Settings → Pages → deploy from `main`, root. Live in a minute.

**Netlify or Vercel** — drag the folder onto the dashboard. No build command, no output directory.

## Before it goes public

- Replace the placeholder specs, links and email in `data.js`.
- Replace the gradient tiles with real screenshots.
- `assets/retro-bg.jpg` is 115 KB. Convert to WebP if you care about the first paint.
- The "visits" counter is a hardcoded string. Wire it to a real counter service or drop it.
- Confirm you have the rights to the wallpaper and the Brick artwork — the held sprite has a visible signature.

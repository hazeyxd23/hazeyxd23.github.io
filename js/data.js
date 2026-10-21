/* ============================================================
   data.js — EDIT THIS FILE. Everything on the site comes from here.
   No build step: save, refresh, done.
   ============================================================ */

window.DATA = {

  profile: {
    handle: "hazeyxd23",
    status: "currently online",
    blurb: "cs student · backend-leaning · mostly python. i build small services, take them apart to see why they got slow, and write it down.",
    // longer version, shown on the About tab
    bio: `the longer version goes here. what you study, what you're building, what you
          actually want to be doing. two or three short paragraphs is plenty — anyone
          who wants more will click the resume.`,
    resume: "#",
    email: "you@example.com"
  },

  /* ---- Home: the polaroid stack. add/remove freely, layout adapts ----
     The LAST one sits on top of the stack. `src` is the picture on the card
     (assets/projects/); `color` is the fallback if it's missing. The two API
     projects have no UI to screenshot, so their cards are pipeline diagrams
     drawn from their READMEs — swap in a real screenshot any time. */
  projects: [
    { title: "this website",      meta: "html · css · js",                 color: "#a97bd8",
      src: "assets/projects/portfolio.jpg",
      url: "https://github.com/hazeyxd23/hazeyxd23.github.io",
      note: "a windows 98 desktop you can poke at. brick lives here." },
    { title: "discount-tracker",  meta: "react · express · mysql",         color: "#f7e08c",
      src: "assets/projects/discount-tracker.png",
      url: "https://github.com/hazeyxd23/discount-tracker",
      note: "paste a product link and a target price; it re-checks on a schedule and alerts you when it drops." },
    { title: "rag-document-qa",   meta: "python · fastapi · faiss",        color: "#ef7fb6",
      src: "assets/projects/rag-document-qa.png",
      url: "https://github.com/hazeyxd23/rag-document-qa",
      note: "answers questions from pdfs, not model knowledge, citing file and page. retrieval from scratch, no langchain." },
    { title: "yogurt",            meta: "fastapi · react · postgres · llm", color: "#5fd8cf",
      src: "assets/projects/yogurt.jpg",
      url: "https://github.com/hazeyxd23/yogurt",
      note: "habit tracker built as a mac os x aqua desktop, with an llm that answers questions about your own data in read-only sql." }
  ],

  /* ---- Home: screenshot showcase. shots of the projects above, at tile
     size in assets/shots/; each tile opens the full-size image ---- */
  screenshots: [
    { caption: "yogurt · ask, llm → sql", src: "assets/shots/yogurt-ask.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/ask.png" },
    { caption: "yogurt · notes graph",    src: "assets/shots/yogurt-graph.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/graph.png" },
    { caption: "yogurt · leetcode",       src: "assets/shots/yogurt-leetcode.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/leetcode.png" },
    { caption: "yogurt · reading",        src: "assets/shots/yogurt-reading.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/reading.png" },
    { caption: "yogurt · guitar",         src: "assets/shots/yogurt-guitar.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/guitar.png" },
    { caption: "yogurt · dark mode",      src: "assets/shots/yogurt-dark.jpg",
      url: "https://github.com/hazeyxd23/yogurt/blob/main/docs/screenshots/dark.png" }
  ],

  /* ---- Blog ----
     DON'T EDIT THIS LIST. Posts live in posts/*.md and js/posts.js
     overwrites this at load time. To add a post: write the markdown
     file, then run `python3 build.py`. */
  posts: [],

  /* ---- Gallery > photos. drop files in assets/ and set src ---- */
  photos: [
    { caption: "desk, 3am",      color: "#5fd8cf", src: "" },
    { caption: "rice v4",        color: "#a97bd8", src: "" },
    { caption: "keeb build",     color: "#ef7fb6", src: "" },
    { caption: "delhi rooftop",  color: "#7ee0a0", src: "" },
    { caption: "cat (not brick)",color: "#f7e08c", src: "" },
    { caption: "monitor glow",   color: "#f6d7ef", src: "" }
  ],

  /* ---- Gallery > bookshelf ---- */
  books: {
    reading: [ { title: "the pragmatic programmer", author: "hunt & thomas" } ],
    read:    [ { title: "designing data-intensive applications", author: "kleppmann", rating: 5 },
               { title: "the rust book", author: "klabnik & nichols", rating: 4 } ],
    want:    [ { title: "crafting interpreters", author: "nystrom" },
               { title: "the mythical man-month", author: "brooks" } ]
  },

  /* ---- Gallery > ratings. kind: anime | games | film ---- */
  ratings: [
    { kind: "anime", title: "frieren",            score: 9, note: "pacing is the point" },
    { kind: "anime", title: "monster",            score: 9, note: "" },
    { kind: "games", title: "elden ring",         score: 9, note: "still not finished" },
    { kind: "games", title: "hollow knight",      score: 10, note: "" },
    { kind: "film",  title: "blade runner 2049",  score: 9, note: "" },
    { kind: "film",  title: "whiplash",           score: 8, note: "" }
  ],

  /* ---- About > setup ---- */
  specs: [
    ["cpu", "placeholder"],
    ["gpu", "placeholder"],
    ["ram", "placeholder"],
    ["keyboard", "placeholder"],
    ["monitor", "placeholder"],
    ["wm", "hyprland"],
    ["os", "cachyos"]
  ],

  /* ---- About > tech i like (the badges in the sidebar too) ---- */
  badges: [
    { name: "zen browser", color: "#f76f53", url: "https://zen-browser.app",
      note: "firefox, but arranged the way i actually browse." },
    { name: "hyprland",    color: "#5fd8cf", url: "https://hyprland.org",
      note: "tiling wayland compositor. the animations are the vice." },
    { name: "cachyos",     color: "#7ee0a0", url: "https://cachyos.org",
      note: "arch, pre-tuned, without me breaking it on day one." },
    { name: "neovim",      color: "#57a143", url: "https://neovim.io",
      note: "still remapping things two years later." },
    { name: "python",      color: "#f7e08c", url: "https://python.org",
      note: "the default tool." },
    { name: "rust",        color: "#ef7fb6", url: "https://rust-lang.org",
      note: "for when python deserves punishment." }
  ],

  /* ---- link tree ---- */
  links: [
    { name: "github",  url: "https://github.com/hazeyxd23" },
    { name: "x",       url: "#" },
    { name: "spotify", url: "#" },
    { name: "mail",    url: "#" }
  ],

  /* ---- toolbar ---- */
  toolbar: {
    nowPlaying: "not playing",          // wire to a spotify widget later
    visits: "000482"                     // swap for a real counter service
  }
};

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

  /* ---- Home: the polaroid stack. add/remove freely, layout adapts ---- */
  projects: [
    { title: "habit tracker",   meta: "python · fastapi",    color: "#5fd8cf", url: "#",
      note: "tracks guitar, reading and leetcode. charts the streaks." },
    { title: "tcp playground",  meta: "rust · tokio",        color: "#ef7fb6", url: "#",
      note: "a toy server i keep breaking on purpose." },
    { title: "compiler toy",    meta: "c · lexer + parser",  color: "#f7e08c", url: "#",
      note: "hand-written lexer, recursive descent parser." },
    { title: "this website",    meta: "html · css · spite",  color: "#a97bd8", url: "#",
      note: "brick lives here." },
    { title: "scraper thing",   meta: "python · playwright", color: "#7ee0a0", url: "#",
      note: "pulls data i'm too lazy to copy by hand." }
  ],

  /* ---- Blog ---- */
  posts: [
    { title: "why my tcp server ate 4gb of ram",        date: "2026-09-02", tags: ["rust"],          url: "#" },
    { title: "i switched to hyprland and lost a weekend", date: "2026-08-19", tags: ["linux"],       url: "#" },
    { title: "notes on writing a lexer by hand",        date: "2026-08-04", tags: ["notes"],         url: "#" },
    { title: "the cheapest way to cache is to not",     date: "2026-07-28", tags: ["python"],        url: "#" },
    { title: "hello world",                             date: "2026-07-21", tags: ["notes"],         url: "#" }
  ],

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

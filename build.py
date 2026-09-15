#!/usr/bin/env python3
"""Build the blog, and optionally bundle the site into one file.

    python3 build.py              # regenerate blog/ and js/posts.js
    python3 build.py --bundle     # ...and also write dist/index.html

Run this after you add or edit anything in posts/. Nothing else needs a
build — the rest of the site is still plain files you can edit and refresh.

HOW POSTS WORK
--------------
One markdown file per post in posts/. The filename becomes the URL, minus
any leading date:

    posts/2026-09-02-tcp-server-ram.md  ->  blog/tcp-server-ram.html

Each file starts with a frontmatter block:

    ---
    title: why my tcp server ate 4gb of ram
    date: 2026-09-02
    tags: [rust, notes]
    summary: one line shown in listings. optional.
    draft: true            # optional — drafts are skipped entirely
    ---

    markdown goes here.

No dependencies. Stdlib only, same as the rest of this project.
"""
import base64
import html
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
POSTS_DIR = HERE / "posts"
BLOG_DIR = HERE / "blog"


# ------------------------------------------------------------------ markdown

def _esc(text):
    return html.escape(text, quote=True)


def _inline(text):
    """Inline markdown: code, images, links, bold, italic."""
    stash = []

    def hold(m):
        stash.append(_esc(m.group(1)))
        return f"\x00{len(stash) - 1}\x00"

    text = re.sub(r"`([^`]+)`", hold, text)
    text = _esc(text)
    text = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", r'<img src="\2" alt="\1">', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{stash[int(m.group(1))]}</code>", text)
    return text


def markdown(src):
    """A small block-level markdown renderer. Enough for prose posts."""
    out, lines, i = [], src.replace("\r\n", "\n").split("\n"), 0

    while i < len(lines):
        line = lines[i]

        # fenced code
        if line.startswith("```"):
            lang = line[3:].strip()
            i += 1
            buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            cls = f' class="lang-{_esc(lang)}"' if lang else ""
            out.append(f"<pre><code{cls}>{_esc(chr(10).join(buf))}</code></pre>")
            continue

        # blank
        if not line.strip():
            i += 1
            continue

        # heading
        m = re.match(r"(#{1,4})\s+(.*)", line)
        if m:
            lvl = len(m.group(1)) + 1  # h1 is the post title, so # -> h2
            lvl = min(lvl, 6)
            out.append(f"<h{lvl}>{_inline(m.group(2).strip())}</h{lvl}>")
            i += 1
            continue

        # horizontal rule
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", line.strip()):
            out.append("<hr>")
            i += 1
            continue

        # blockquote
        if line.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip(">").strip())
                i += 1
            out.append(f"<blockquote>{_inline(' '.join(buf))}</blockquote>")
            continue

        # lists
        if re.match(r"\s*[-*+]\s+", line) or re.match(r"\s*\d+[.)]\s+", line):
            ordered = bool(re.match(r"\s*\d+[.)]\s+", line))
            pat = r"\s*\d+[.)]\s+" if ordered else r"\s*[-*+]\s+"
            items = []
            while i < len(lines) and re.match(pat, lines[i]):
                items.append(_inline(re.sub(pat, "", lines[i], count=1).strip()))
                i += 1
            tag = "ol" if ordered else "ul"
            body = "".join(f"<li>{it}</li>" for it in items)
            out.append(f"<{tag}>{body}</{tag}>")
            continue

        # paragraph
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(
            r"(#{1,4}\s|```|>|\s*[-*+]\s+|\s*\d+[.)]\s+)", lines[i]
        ):
            buf.append(lines[i].strip())
            i += 1
        if buf:
            out.append(f"<p>{_inline(' '.join(buf))}</p>")

    return "\n".join(out)


# --------------------------------------------------------------- frontmatter

def parse_post(path):
    raw = path.read_text(encoding="utf-8")
    if not raw.startswith("---"):
        raise SystemExit(f"{path.name}: missing '---' frontmatter block at the top")

    _, fm, body = raw.split("---", 2)

    meta = {}
    for line in fm.strip().split("\n"):
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            raise SystemExit(f"{path.name}: bad frontmatter line -> {line!r}")
        key, _, val = line.partition(":")
        key, val = key.strip(), val.strip()
        if val.startswith("[") and val.endswith("]"):
            val = [v.strip().strip("\"'") for v in val[1:-1].split(",") if v.strip()]
        elif val.lower() in ("true", "false"):
            val = val.lower() == "true"
        else:
            val = val.strip("\"'")
        meta[key] = val

    for required in ("title", "date"):
        if required not in meta:
            raise SystemExit(f"{path.name}: frontmatter is missing '{required}'")

    slug = meta.get("slug") or re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
    meta.setdefault("tags", [])
    if isinstance(meta["tags"], str):
        meta["tags"] = [meta["tags"]] if meta["tags"] else []

    meta["slug"] = slug
    meta["body"] = body.strip()
    meta["source"] = path.name
    return meta


# ------------------------------------------------------------------ template

PAGE = """<!DOCTYPE html>
<html lang="en" data-theme="win98" data-chrome="win">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — hazeyxd23</title>
<meta name="description" content="{summary}">
<link rel="stylesheet" href="../css/style.css">
<script>
  /* restore the theme before first paint so post pages don't flash.
     data-chrome must move with it — see the note at the top of style.css */
  try {{
    var t = localStorage.getItem('theme'), r = document.documentElement;
    if (t) {{ r.dataset.theme = t; r.dataset.chrome = (t === 'hacker') ? 'flat' : 'win'; }}
  }} catch (e) {{}}
</script>
</head>
<body>
<div id="wall"></div>

<div class="wrap post-wrap">

  <div class="post-nav">
    <a class="back" href="../index.html">&larr; hazeyxd23</a>
    <div class="themes">
      <button class="sw" data-t="win98" title="windows 98"></button>
      <button class="sw" data-t="soft" title="soft blue"></button>
      <button class="sw" data-t="retro" title="retro"></button>
      <button class="sw" data-t="hacker" title="matrix"></button>
    </div>
  </div>

  <article class="show post">
    <div class="hd">post <span class="r">{date}</span><span class="btns"><b>_</b><b>&#9633;</b><b>&times;</b></span></div>
    <div class="bd">
      <h1>{title}</h1>
      <div class="post-meta">{date}{tagline}</div>
      {body}
    </div>
  </article>

  <div class="post-foot">
    <img src="../assets/brick-sit.png" alt="brick the mouse" width="64">
    <a href="../index.html#blog">more posts</a>
  </div>

</div>

<script>
  var root = document.documentElement;
  document.querySelectorAll('.sw').forEach(function (b) {{
    b.classList.toggle('on', b.dataset.t === root.dataset.theme);
    b.onclick = function () {{
      var t = b.dataset.t;
      root.dataset.theme = t;
      root.dataset.chrome = (t === 'hacker') ? 'flat' : 'win';
      try {{ localStorage.setItem('theme', t); }} catch (e) {{}}
      document.querySelectorAll('.sw').forEach(function (x) {{ x.classList.toggle('on', x === b); }});
    }};
  }});
</script>
</body>
</html>
"""


def render_page(post):
    tags = post["tags"]
    tagline = ""
    if tags:
        tagline = " · " + " ".join(f"<span class='tag'>{_esc(t)}</span>" for t in tags)
    return PAGE.format(
        title=_esc(post["title"]),
        summary=_esc(post.get("summary", "")),
        date=_esc(post["date"]),
        tagline=tagline,
        body=markdown(post["body"]),
    )


# --------------------------------------------------------------------- build

def js_string(value):
    return '"' + str(value).replace("\\", "\\\\").replace('"', '\\"') + '"'


def build_blog():
    if not POSTS_DIR.exists():
        print("no posts/ directory — skipping blog")
        return []

    posts, drafts = [], 0
    for path in sorted(POSTS_DIR.glob("*.md")):
        post = parse_post(path)
        if post.get("draft"):
            drafts += 1
            continue
        posts.append(post)

    posts.sort(key=lambda p: str(p["date"]), reverse=True)

    BLOG_DIR.mkdir(exist_ok=True)
    written = {f"{p['slug']}.html" for p in posts}
    for post in posts:
        (BLOG_DIR / f"{post['slug']}.html").write_text(render_page(post), encoding="utf-8")

    # clear out pages whose source markdown is gone or newly drafted
    for stale in BLOG_DIR.glob("*.html"):
        if stale.name not in written:
            stale.unlink()
            print(f"  removed stale {stale.name}")

    entries = []
    for p in posts:
        tags = ", ".join(js_string(t) for t in p["tags"])
        entries.append(
            "  { title: %s, date: %s, tags: [%s], url: %s }"
            % (js_string(p["title"]), js_string(p["date"]), tags,
               js_string(f"blog/{p['slug']}.html"))
        )

    (HERE / "js" / "posts.js").write_text(
        "/* GENERATED by build.py — do not edit by hand.\n"
        "   Source of truth is posts/*.md. Runs after data.js. */\n"
        "window.DATA.posts = [\n" + ",\n".join(entries) + "\n];\n",
        encoding="utf-8",
    )

    print(f"blog: {len(posts)} post(s) -> blog/, {drafts} draft(s) skipped")
    return posts


def data_uri(path):
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "webp": "image/webp",
            "svg": "image/svg+xml"}[path.suffix.lstrip(".").lower()]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def bundle():
    """Single standalone HTML file. Post pages are NOT included — links to
    them will not resolve in the bundle."""
    dist = HERE / "dist"
    dist.mkdir(exist_ok=True)

    html_src = (HERE / "index.html").read_text(encoding="utf-8")
    css = (HERE / "css/style.css").read_text(encoding="utf-8")

    parts = [(HERE / "js/data.js").read_text(encoding="utf-8")]
    posts_js = HERE / "js/posts.js"
    if posts_js.exists():
        parts.append(posts_js.read_text(encoding="utf-8"))
    parts.append((HERE / "js/app.js").read_text(encoding="utf-8"))
    js = "\n".join(parts)

    for asset in sorted((HERE / "assets").iterdir()):
        if asset.is_file():
            uri = data_uri(asset)
            css = css.replace(f"../assets/{asset.name}", uri)
            js = js.replace(f"assets/{asset.name}", uri)

    html_src = html_src.replace(
        '<link rel="stylesheet" href="css/style.css">', f"<style>\n{css}\n</style>")
    html_src = re.sub(r'<script src="js/[^"]+"></script>\s*', "", html_src)
    html_src = html_src.replace("</body>", f"<script>\n{js}\n</script>\n</body>")

    out = dist / "index.html"
    out.write_text(html_src, encoding="utf-8")
    print(f"bundle: wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build_blog()
    if "--bundle" in sys.argv:
        bundle()

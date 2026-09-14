#!/usr/bin/env python3
"""Bundle the site into one standalone HTML file (dist/index.html).

Only needed if you want a single file to email, drop on a USB stick, or
open with file://. For normal hosting just upload the folder as-is.

    python3 build.py
"""
import base64, pathlib, re

here = pathlib.Path(__file__).parent
dist = here / "dist"; dist.mkdir(exist_ok=True)

def data_uri(path: pathlib.Path) -> str:
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "webp": "image/webp", "svg": "image/svg+xml"}[path.suffix.lstrip(".").lower()]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()

html = (here / "index.html").read_text()
css  = (here / "css/style.css").read_text()
js   = (here / "js/data.js").read_text() + "\n" + (here / "js/app.js").read_text()

# inline every asset referenced by css or js
for asset in sorted((here / "assets").iterdir()):
    if asset.is_file():
        uri = data_uri(asset)
        css = css.replace(f"../assets/{asset.name}", uri)
        js  = js.replace(f"assets/{asset.name}", uri)

html = html.replace('<link rel="stylesheet" href="css/style.css">', f"<style>\n{css}\n</style>")
html = re.sub(r'<script src="js/[^"]+"></script>\s*', "", html)
html = html.replace("</body>", f"<script>\n{js}\n</script>\n</body>")

out = dist / "index.html"
out.write_text(html)
print(f"wrote {out} ({out.stat().st_size // 1024} KB)")

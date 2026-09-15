---
title: hello world
date: 2026-07-21
tags: [notes]
summary: the first post, and a working demo of every bit of markdown this blog supports.
---

This is a starter post. **Rewrite it or delete it** — it exists so you can see the
pipeline working end to end, and so there is one real page to check the styling
against. Everything below is here to exercise the renderer.

## what this blog is

Posts are markdown files in `posts/`. You write one, run `python3 build.py`, and it
becomes a page in `blog/` plus an entry in the listing on the Blog tab. There is no
database, no framework, and nothing to deploy beyond the folder itself.

The filename sets the URL. A leading date is stripped, so this file:

```
posts/2026-07-21-hello-world.md
```

becomes `blog/hello-world.html`.

## what the renderer handles

Inline: **bold**, *italic*, `inline code`, and [links](https://github.com/hazeyxd23).

Lists, both kinds:

- unordered items
- with `code` and **bold** inside them
- as many as you like

1. ordered items
2. counted for you
3. so renumbering is free

Code blocks keep their whitespace and get a language class:

```python
def feed(brick, cheese):
    """the only function that matters"""
    brick.fed += 1
    return "nom!"
```

> Blockquotes work too. Useful for pulling out the one line someone else wrote
> that made you go and change your code.

---

## adding the next one

Copy this file, change the frontmatter, write. Set `draft: true` while it's not
ready and the build will skip it entirely — no half-finished page goes live, and
it stays out of the listing.

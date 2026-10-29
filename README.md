# Portfolio

Source for [braydenw.com](https://www.braydenw.com) — Brayden Wisniewski, product designer.

## Changing the words

All the text on the site lives in `content/`, one Markdown file per page
(`home.md`, `about.md`, `ibm.md`, `slack.md`, `opal.md`, `presents.md`,
`privacy.md`, `404.md`) plus `site.md` for your name, intro and footer.

1. Open the file on GitHub and click the pencil icon.
2. Change the text under any `## name` heading. Keep the heading lines as they are.
3. Commit. The **Build site** action rebuilds the pages within a minute or two.

`**bold**`, `*italic*` and `[link words](https://example.com)` work. If a
heading goes missing, the build stops and the action says which one.

## Structure

    content/        the words on every page, in Markdown
    src/            page layouts ({{ name }} marks where text from content/ goes)
      partials/     footer and icons, shared by every page
      page.html     -> index.html
      about.html    -> about.html
      opal.html     -> opal.html
      slack.html    -> slack.html
      ibm.html      -> ibm.html
    styles.css      one stylesheet for the whole site
    script.js       one script for the whole site
    images/         photography and screenshots
    build.py        inlines the CSS and JS, expands partials

## Building

    python3 build.py

Edit files in `content/`, `src/`, `styles.css` and `script.js`. The HTML files in the
root are **generated** — don't edit them directly, the build overwrites them.

Each built page is self-contained: the stylesheet and script are inlined, so a
page renders the same from a server, from `file://`, or from a stale cache.

## Colors and type

Named tokens at the top of `styles.css`, shown on the design system page
(`/design-system`). Change a value there and it changes everywhere.

- Colors: `--color-brayden-blue`, `--color-savannah-night`, `--color-kiln-smoke`,
  `--color-pencil-line`, `--color-porcelain`, `--color-studio-wall`, `--color-sketchbook`
- Text: `--text-tall-order`, `--text-big-entrance`, `--text-idea-stroll`,
  `--text-studio-crit`, `--text-opening-line`, `--text-long-chat`,
  `--text-survey-says`, `--text-sticky-note`, `--text-name-tag`

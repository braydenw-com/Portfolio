# Portfolio

Source for [braydenw.com](https://www.braydenw.com) — Brayden Wisniewski, product designer.

## Structure

    src/            page sources
      partials/     nav + footer, shared by every page
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

Edit files in `src/`, plus `styles.css` and `script.js`. The HTML files in the
root are **generated** — don't edit them directly, the build overwrites them.

Each built page is self-contained: the stylesheet and script are inlined, so a
page renders the same from a server, from `file://`, or from a stale cache.

## Type and spacing

Both are token scales defined at the top of `styles.css`:
`--t-display / --t-head / --t-sub / --t-body / --t-small / --t-micro` and
`--space-top / --space-big / --space-section / --space-head`. Everything on
every page uses one of them.

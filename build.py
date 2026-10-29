#!/usr/bin/env python3
"""Build the site.

  content/*.md          the words on every page. Edit these to change text.
  src/*.html            page layouts, with {{ name }} where text from
                        content/<page>.md goes ({{ site/name }} for content/site.md)
  src/partials/*.html   shared components, pulled in with <!-- @include name -->

Every page ends up self-contained: the stylesheet and script are inlined, so
a page renders identically from a server, from file://, or from a stale cache.

Run `python3 build.py` after editing anything in content/, src/, styles.css or
script.js. On GitHub this runs automatically when you push (see
.github/workflows/build.yml). Never hand-edit index.html or */index.html —
they are generated.
"""
import html
import re
from pathlib import Path

here = Path(__file__).parent
css  = (here / 'styles.css').read_text(encoding='utf-8')
js   = (here / 'script.js').read_text(encoding='utf-8')

LINK    = '<link rel="stylesheet" href="styles.css">'
SCRIPT  = '<script src="script.js"></script>'
INCLUDE = re.compile(r'^([ \t]*)<!--\s*@include\s+([\w-]+)\s*-->[ \t]*$', re.M)
SLOT    = re.compile(r'\{\{\s*([^{}]+?)\s*\}\}')
CARD    = re.compile(r'^([ \t]*)<!--\s*@card\s+(/[\w-]+)\s*-->[ \t]*$', re.M)

# Directory-per-page, so URLs are /about rather than /about.html.
# GitHub Pages serves index.html for a directory request.
PAGES = {'page.html':  'index.html',
         'about.html': 'about/index.html',
         'slack.html': 'slack/index.html',
         'opal.html':  'opal/index.html',
         'presents.html': 'presents/index.html',
         'design.html': 'design-system/index.html',
         'privacy.html': 'privacy/index.html',
         'guide.html': 'case-studies/index.html',
         '404.html': '404.html',
         'ibm.html':   'ibm/index.html'}

# Which content file fills which page.
CONTENT = {'page.html': 'home', 'about.html': 'about', 'slack.html': 'slack',
           'opal.html': 'opal', 'presents.html': 'presents', 'ibm.html': 'ibm',
           'privacy.html': 'privacy', 'guide.html': 'guide', '404.html': '404'}


def partial(name):
    path = here / 'src' / 'partials' / f'{name}.html'
    if not path.exists():
        raise SystemExit(f'no such partial: src/partials/{name}.html')
    return path.read_text(encoding='utf-8').rstrip('\n')


def expand(text):
    """Drop each partial in, keeping the indentation of the include line."""
    def sub(m):
        pad, name = m.group(1), m.group(2)
        return '\n'.join(pad + line if line else line
                         for line in partial(name).split('\n'))
    return INCLUDE.sub(sub, text)


# ── Markdown ──────────────────────────────────────────────────────────────
# Each content file is a list of "## name" headings with the text under them.
# Inside the text: **bold**, *italic*, [words](link), and a line break.

def read_content(name):
    path = here / 'content' / f'{name}.md'
    if not path.exists():
        raise SystemExit(f'missing content/{name}.md')
    text = re.sub(r'<!--.*?-->', '', path.read_text(encoding='utf-8'), flags=re.S)
    out = {}
    for part in re.split(r'^## +', text, flags=re.M)[1:]:
        key, _, body = part.partition('\n')
        key = key.strip()
        if key in out:
            raise SystemExit(f'content/{name}.md has "## {key}" twice')
        out[key] = body.strip()
    return out


def inline(md):
    """Markdown text -> the HTML that sits inside one element."""
    s = html.escape(md, quote=False)
    def link(m):
        words, url = m.group(1), html.unescape(m.group(2))
        if url.startswith('/'):
            return f'<a href="{html.escape(url)}">{words}</a>'
        extra = ' target="_blank" rel="noopener"' if url.startswith('http') else ''
        return f'<a class="c-link" href="{html.escape(url)}"{extra}>{words}</a>'
    s = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<em>\1</em>', s)
    return re.sub(r'[ \t]*\n[ \t]*', '<br>', s)


def fill(page, src, words, site):
    def sub(m):
        key = m.group(1)
        table, label = (site, 'site') if key.startswith('site/') else (words, CONTENT.get(src, src))
        key = key[5:] if key.startswith('site/') else key
        if key not in table:
            raise SystemExit(f'content/{label}.md is missing the "## {key}" heading')
        return inline(table[key])
    return SLOT.sub(sub, page)


def render(src, site):
    page = expand((here / 'src' / src).read_text(encoding='utf-8'))
    words = read_content(CONTENT[src]) if src in CONTENT else {}
    return fill(page, src, words, site)


site = read_content('site')

# "View more" cards are copies of the homepage cards, so they always match.
home = render('page.html', site)
cards = {m.group(1): m.group(0) for m in re.finditer(
    r'<a class="g-p g-p--work g-\w+" href="(/[\w-]+)">.*?\n  </a>', home, re.S)}


def card(m):
    pad, href = m.group(1), m.group(2)
    if href not in cards:
        raise SystemExit(f'no homepage card links to {href}')
    block = re.sub(r'g-p--work g-\w+', 'g-p--work cs-card', cards[href], count=1)
    return '\n'.join(pad + line[2:] if line.startswith('  ') else pad + line
                     for line in block.split('\n'))


for src, out in PAGES.items():
    path = here / 'src' / src
    if not path.exists():
        print(f'skipped {src} (missing)')
        continue

    page = CARD.sub(card, render(src, site))

    for tag, label in ((LINK, 'stylesheet link'), (SCRIPT, 'script tag')):
        if tag not in page:
            raise SystemExit(f'src/{src} no longer contains the {label}')

    page = page.replace(LINK,   '<style>\n' + css + '\n</style>')
    page = page.replace(SCRIPT, '<script>\n' + js + '\n</script>')

    dest = here / out
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding='utf-8')
    print(f'{out:<18} {len(page):>7,} bytes')

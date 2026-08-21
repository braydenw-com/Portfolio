#!/usr/bin/env python3
"""Build the site.

  src/partials/*.html   shared components, pulled in with <!-- @include name -->
  src/page.html    ->  index.html
  src/about.html   ->  about.html

Every page ends up self-contained: the stylesheet and script are inlined, so
a page renders identically from a server, from file://, or from a stale cache.

Run `python3 build.py` after editing anything in src/, styles.css or script.js.
Never hand-edit index.html or about.html — they are generated.
"""
import re
from pathlib import Path

here = Path(__file__).parent
css  = (here / 'styles.css').read_text(encoding='utf-8')
js   = (here / 'script.js').read_text(encoding='utf-8')

LINK    = '<link rel="stylesheet" href="styles.css">'
SCRIPT  = '<script src="script.js"></script>'
INCLUDE = re.compile(r'^([ \t]*)<!--\s*@include\s+([\w-]+)\s*-->[ \t]*$', re.M)

PAGES = {'page.html':  'index.html',
         'about.html': 'about.html',
         'slack.html': 'slack.html',
         'opal.html':  'opal.html',
         'ibm.html':   'ibm.html'}


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


for src, out in PAGES.items():
    path = here / 'src' / src
    if not path.exists():
        print(f'skipped {src} (missing)')
        continue

    page = expand(path.read_text(encoding='utf-8'))

    for tag, label in ((LINK, 'stylesheet link'), (SCRIPT, 'script tag')):
        if tag not in page:
            raise SystemExit(f'src/{src} no longer contains the {label}')

    page = page.replace(LINK,   '<style>\n' + css + '\n</style>')
    page = page.replace(SCRIPT, '<script>\n' + js + '\n</script>')

    dest = here / out
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding='utf-8')
    print(f'{out:<18} {len(page):>7,} bytes')

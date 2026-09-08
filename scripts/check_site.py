"""Check local paths, anchors and shared navigation. No third-party dependencies.

--asset-manifest accepts a JSON array of repository paths when image assets are
available in the source repository but not in a text-only working copy.
"""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
EXPECTED=['index.html','topics.html','tests/index.html','cardiac-longevity.html','thoughts-of-the-week.html','app/index.html','about.html']
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.links=[];self.nav=[];self.active=[];self.h1=0;self.main=0;self.in_nav=False
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='main':self.main+=1
        if tag=='ul' and a.get('id')=='primary-navigation':self.in_nav=True
        if tag=='a' and self.in_nav:
            self.nav.append(a.get('href',''))
            if a.get('aria-current'):self.active.append(a)
        for attr in ('href','src'):
            if attr in a:self.links.append(a[attr])
    def handle_endtag(self,tag):
        if tag=='ul':self.in_nav=False

def resolve(path,link):
    u=urlsplit(link)
    if u.scheme or u.netloc:return None,None
    target=posixpath.normpath(posixpath.join(posixpath.dirname(path),unquote(u.path))) if u.path else path
    if u.path.startswith('/'):target=unquote(u.path).lstrip('/')
    if (ROOT/target).is_dir() or u.path.endswith('/'):target=posixpath.join(target,'index.html')
    return target,unquote(u.fragment)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--asset-manifest',type=Path);args=parser.parse_args()
    manifest=set(json.loads(args.asset_manifest.read_text())) if args.asset_manifest else set()
    paths=[p for p in ROOT.rglob('*.html') if not any(x in p.parts for x in ('node_modules','browser-artifacts','test-results')) and p.name!='tracker-fragment.html']
    pages={p.relative_to(ROOT).as_posix():Page(p.read_text()) for p in paths}
    errors=[];checked=0;external=set()
    for path,p in sorted(pages.items()):
        if p.h1!=1 or p.main!=1:errors.append(f'{path}: expected one h1 and one main')
        duplicate=[k for k,n in Counter(p.ids).items() if n>1]
        if duplicate:errors.append(f'{path}: duplicate IDs {duplicate}')
        if 'main-content' not in p.ids:errors.append(f'{path}: missing skip-link target')
        if [resolve(path,v)[0] for v in p.nav]!=EXPECTED:errors.append(f'{path}: inconsistent main navigation')
        expected='tests/index.html' if path.startswith('tests/') else 'topics.html' if path.startswith('articles/') else 'thoughts-of-the-week.html' if path.startswith('blog/') else path
        if len(p.active)!=1 or resolve(path,p.active[0]['href'])[0]!=expected:errors.append(f'{path}: wrong active navigation')
        elif p.active[0]['aria-current']!=('page' if path==expected else 'location'):errors.append(f'{path}: incorrect aria-current')
        for link in p.links:
            target,fragment=resolve(path,link)
            if target is None:
                external.add(link);continue
            checked+=1
            if not link or link=='#':errors.append(f'{path}: empty/placeholder link')
            if not (ROOT/target).is_file() and target not in manifest:errors.append(f'{path}: missing {target}')
            if fragment and target in pages and fragment not in pages[target].ids:errors.append(f'{path}: missing {target}#{fragment}')
    if errors:raise SystemExit('\n'.join(errors))
    print(f'PASS: {len(pages)} pages; {checked} internal links/assets/anchors; consistent navigation and active states.')
    print(f'{len(external)} distinct external URLs referenced; this check does not make HTTP requests.')
    if manifest:print('Image existence checked against the supplied repository manifest; images were not rendered.')
if __name__=='__main__':main()

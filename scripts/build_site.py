"""Generate static education pages with shared navigation; no build dependency at deploy time."""
from pathlib import Path
from html import escape
from datetime import date
import posixpath
import re
from content_data import PAGES, SOURCES, UPDATED

ROOT = Path(__file__).resolve().parents[1]
AS_OF = date.fromisoformat(UPDATED)
DISPLAY_DATE = f'{AS_OF:%B} {AS_OF.day}, {AS_OF.year}'
NAV = [('index.html','Home'),('topics.html','Topics'),('tests/index.html','Tests'),('cardiac-longevity.html','Cardiac Longevity'),('thoughts-of-the-week.html','Notes'),('app/index.html','Tracker'),('about.html','About')]
TITLES = {p['path']:p['title'] for p in PAGES} | dict(NAV)
TITLES.update({'tests/index.html':'Understanding Your Tests','app/index.html':'My Heart Health Tracker','thoughts-of-the-week.html':'Dr. Pollock’s Notes'})
INDEPENDENT = 'Dr. Jeremy Pollock is acting independently and in his personal capacity. BMore Cardiology is an independent educational and informational resource with no official affiliation, endorsement, or association with the University of Maryland, St. Joseph Medical Center, or any employer institution.'

def href(current, target):
    return posixpath.relpath(target, posixpath.dirname(current) or '.')

def navigation(path, footer=False):
    active = 'tests/index.html' if path.startswith('tests/') else 'topics.html' if path.startswith('articles/') else 'thoughts-of-the-week.html' if path.startswith('blog/') else path
    items=[]
    for target,label in NAV:
        attrs=''
        if not footer and target==active:
            attrs=' class="active" aria-current="'+('page' if path==target else 'location')+'"'
        a=f'<a href="{href(path,target)}"{attrs}>{escape(label)}</a>'
        items.append(a if footer else '<li>'+a+'</li>')
    if footer:
        return '<nav class="footer__links" aria-label="Footer navigation">'+'\n'.join(items)+'</nav>'
    return f'''<a class="skip-link" href="#main-content">Skip to content</a>
<nav class="nav" aria-label="Main navigation"><div class="nav__inner">
<a href="{href(path,'index.html')}" class="nav__logo"><span class="brand-heart" aria-hidden="true">♥</span> BMore Cardiology</a>
<ul class="nav__links" id="primary-navigation">{''.join(items)}</ul>
<button class="nav__hamburger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="primary-navigation"><span></span><span></span><span></span></button>
</div></nav>'''

def footer(path):
    return f'''<footer class="footer"><div class="container"><div class="footer__inner">
<a href="{href(path,'index.html')}" class="footer__logo">BMore Cardiology</a>{navigation(path,True)}
<p class="footer__copy">© {AS_OF.year} BMore Cardiology | Dr. Jeremy Pollock, MD, FACC</p>
<p class="footer__disclaimer">{INDEPENDENT}</p>
<p class="footer__disclaimer">For general education. This resource does not replace your own clinician's advice. In an emergency, call 911.</p>
</div></div></footer>'''

def shell(path,title,description,body,extra_head='',scripts=()):
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} | BMore Cardiology</title><meta name="description" content="{escape(description,quote=True)}">
<link rel="stylesheet" href="{href(path,'css/style.css')}"><link rel="stylesheet" href="{href(path,'css/education.css')}">
<script src="{href(path,'js/password-protect.js')}"></script>{extra_head}</head><body>
{navigation(path)}<main id="main-content" tabindex="-1">{body}</main>{footer(path)}
<script src="{href(path,'js/main.js')}"></script><script src="{href(path,'js/education.js')}"></script>
{''.join('<script src="'+href(path,s)+'" defer></script>' for s in scripts)}
</body></html>\n'''

def hero(title,summary,category='Patient education'):
    return f'<section class="guide-hero"><div class="container"><p class="eyebrow">{escape(category)}</p><h1>{escape(title)}</h1><p class="lede">{escape(summary)}</p></div></section>'

def cards(path,pages):
    return '<div class="resource-grid">'+''.join(f'<article class="resource-card"><p class="eyebrow">{escape(p["category"])}</p><h3><a href="{href(path,p["path"])}">{escape(p["title"])}</a></h3><p>{escape(p["summary"])}</p></article>' for p in pages)+'</div>'

def write(path,text):
    target=ROOT/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text)

def article(p):
    path=p['path'];sections=p['sections']
    updated=p.get('updated',UPDATED)
    updated_date=date.fromisoformat(updated)
    display_date=f'{updated_date:%B} {updated_date.day}, {updated_date.year}'
    toc=''.join(f'<li><a href="#{sid}">{escape(title)}</a></li>' for sid,title,_ in sections)
    tools=f'<button class="text-button print-page" type="button">Print this guide</button>'
    if p['download']:
        tools=f'<a class="btn btn-primary" href="{href(path,"downloads/"+p["download"])}">Download one-page summary (PDF)</a>'+tools
    reviewed=''
    if p.get('reviewed_by') and p.get('reviewed_on'):
        reviewed=f'<p class="review-line">Reviewed by {escape(p["reviewed_by"])} on <time datetime="{p["reviewed_on"]}">{p["reviewed_on"]}</time>.</p>'
    body=hero(p['title'],p['summary'],p['category'])+f'''<div class="container guide-layout"><article class="guide-content">
<p class="review-line">Updated <time datetime="{updated}">{display_date}</time></p>{reviewed}<div class="guide-tools">{tools}</div>
<aside class="takeaway"><h2>Start here</h2><p>{escape(p['summary'])}</p></aside>
{''.join('<section id="'+sid+'"><h2>'+escape(title)+'</h2>'+html+'</section>' for sid,title,html in sections)}
<section id="questions"><h2>Questions for your next visit</h2><ul>{''.join('<li>'+escape(q)+'</li>' for q in p['questions'])}</ul></section>
<section id="references" class="references"><h2>References and further reading</h2><ol>{''.join('<li><a href="'+SOURCES[k][1]+'">'+escape(SOURCES[k][0])+'</a></li>' for k in p['sources'])}</ol><p class="small-note">Use these sources with your own clinician's advice. Recommendations depend on your health history and can change as evidence develops.</p></section>
<section id="related"><h2>Keep reading</h2><ul>{''.join('<li><a href="'+href(path,r)+'">'+escape(TITLES[r])+'</a></li>' for r in p['related'])}</ul></section>
</article><aside class="guide-toc"><nav aria-label="On this page"><h2>On this page</h2><ul>{toc}<li><a href="#questions">Questions for your visit</a></li><li><a href="#references">References</a></li></ul></nav></aside></div>'''
    write(path,shell(path,p['title'],p['summary'],body))

def build():
    for p in PAGES:article(p)
    topics=[p for p in PAGES if p['path'].startswith('articles/')]
    exercise=[p for p in topics if p['category']=='Exercise and recovery']
    conditions=[p for p in topics if p['category']!='Exercise and recovery']
    tests=[p for p in PAGES if p['path'].startswith('tests/')]
    notes=[p for p in PAGES if p['path'].startswith('blog/')]
    path='topics.html'
    body=hero('Cardiology Topics','Find a clear explanation and a practical next step.')+'<section class="section"><div class="container"><h2>Conditions, symptoms and prevention</h2>'+cards(path,conditions)+'<h2 class="section-spacer">Exercise and recovery</h2>'+cards(path,exercise)+'<div class="takeaway"><h2>Have a test coming up?</h2><p><a href="tests/index.html">Explore the test guides and printable summaries.</a></p></div></div></section>'
    write(path,shell(path,'Cardiology Topics','Patient guides to heart symptoms, conditions, prevention, exercise and recovery.',body))
    path='tests/index.html'
    body=hero('Understanding Your Tests','Why it was ordered, what the results mean, and what to ask next.')+'<section class="section"><div class="container">'+cards(path,tests)+'<aside class="takeaway"><h2>Before your appointment</h2><p>Follow the instructions from your testing center. Ask which medicines to take, what preparation is needed, and how you will receive results. The one-page summaries can help you prepare questions.</p></aside></div></section>'
    write(path,shell(path,'Understanding Your Tests','Echo, rhythm monitor, calcium score, stress test and coronary CTA guides with printable summaries.',body))
    path='thoughts-of-the-week.html'
    body=hero('Dr. Pollock’s Notes','Short explanations to help you prepare for a useful conversation about your heart health.')+f'<section class="section"><div class="container"><p class="review-line">Updated {DISPLAY_DATE}</p>'+cards(path,notes)+'<aside class="takeaway"><h2>Take the next step</h2><p><a href="topics.html">Read a condition guide</a>, <a href="tests/index.html">prepare for a test</a>, or <a href="app/index.html">bring your readings to a visit</a>.</p></aside></div></section>'
    write(path,shell(path,'Dr. Pollock’s Notes','Practical notes on blood pressure, exercise and cholesterol treatment.',body))
    path='index.html'
    body='''<section class="home-hero"><div class="container home-hero__inner"><div><p class="eyebrow">Baltimore cardiology education</p><h1>Heart care,<br>explained.</h1><p class="lede">Clear explanations from Dr. Jeremy S Pollock to help you understand your heart and make the most of your next visit.</p><div class="guide-tools"><a class="btn btn-primary" href="topics.html">Browse topics</a><a class="btn btn-secondary" href="tests/index.html">Understand a test</a></div><p class="small-note">Created by Dr. Jeremy Pollock, MD, FACC</p></div><img src="img/hero-illustration.png" alt="Illustration of heart health" width="560" height="420"></div></section>
<section class="section"><div class="container"><h2>What would help you today?</h2><div class="resource-grid"><article class="resource-card"><h3><a href="tests/index.html">Understand a result</a></h3><p>Echo, rhythm monitor, calcium score, stress test and coronary CTA guides.</p></article><article class="resource-card"><h3><a href="topics.html">Learn about a condition</a></h3><p>Plain-language explanations, treatment conversations and when to seek care.</p></article><article class="resource-card"><h3><a href="app/index.html">Organize my readings</a></h3><p>Record BP, weight or pulse and bring a printable summary to your visit.</p></article></div></div></section>
<section class="section section--alt"><div class="container"><div class="section-header"><h2>Prevention that fits your life</h2><p>Food, movement, sleep and an individualized plan for your heart-health numbers.</p></div><div class="guide-tools centered"><a class="btn btn-primary" href="cardiac-longevity.html">Explore cardiac longevity</a><a class="btn btn-secondary" href="articles/getting-started-exercise.html">Start moving</a></div></div></section>'''
    body+='<section class="section"><div class="container"><h2>Dr. Pollock’s Notes</h2>'+cards(path,notes)+'</div></section>'
    write(path,shell(path,'Heart Care, Explained','Patient education from Dr. Jeremy Pollock: understand your heart, prepare for tests and organize your readings.',body))
    # Preserve the biographical content while using the common page shell.
    about=ROOT/'about.html'
    existing=about.read_text()
    if '<!-- BIOGRAPHY START -->' in existing:
        biography=existing.split('<!-- BIOGRAPHY START -->',1)[1].split('<!-- BIOGRAPHY END -->',1)[0]
    else:
        sections=re.findall(r'<section\b.*?</section>',existing,re.S)
        biography='\n'.join(sections)
    write('about.html',shell('about.html','About Dr. Jeremy Pollock','Meet Dr. Jeremy Pollock, the cardiologist behind BMore Cardiology.','<!-- BIOGRAPHY START -->'+biography+'<!-- BIOGRAPHY END -->'))
    # Tracker markup is authored separately so the generator does not alter its behavior.
    fragment=ROOT/'app/tracker-fragment.html'
    if fragment.exists():
        write('app/index.html',shell('app/index.html','My Heart Health Tracker','Record, print and export BP, pulse and weight readings for your next visit.',fragment.read_text(),extra_head='<link rel="stylesheet" href="tracker.css">',scripts=('app/tracker-core.js','app/tracker.js')))

if __name__=='__main__':build()

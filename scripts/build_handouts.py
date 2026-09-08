"""Build the website's one-page patient handouts with ReportLab."""
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from content_data import PAGES, SOURCES, UPDATED

ROOT=Path(__file__).resolve().parents[1]
AS_OF=date.fromisoformat(UPDATED)
DISPLAY_DATE=f'{AS_OF:%B} {AS_OF.day}, {AS_OF.year}'
OUT=ROOT/'downloads'
OUT.mkdir(exist_ok=True)
NAVY=colors.HexColor('#1a2b4a'); BLUE=colors.HexColor('#155d9f'); PALE=colors.HexColor('#edf6f9')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleX',fontName='Helvetica-Bold',fontSize=23,leading=27,textColor=NAVY,spaceAfter=12))
styles.add(ParagraphStyle(name='BodyX',fontName='Helvetica',fontSize=10.5,leading=14,spaceAfter=8,textColor=colors.HexColor('#263d51')))
styles.add(ParagraphStyle(name='HeadingX',fontName='Helvetica-Bold',fontSize=11.5,leading=15,spaceBefore=9,spaceAfter=5,textColor=BLUE))
styles.add(ParagraphStyle(name='SmallX',fontName='Helvetica',fontSize=8.3,leading=11,spaceAfter=5,textColor=colors.HexColor('#486075')))
def p(text,style='BodyX'):return Paragraph(text,styles[style])
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(colors.HexColor('#c8d8e8'));canvas.line(42,48,570,48)
    canvas.setFont('Helvetica',8);canvas.setFillColor(NAVY)
    canvas.drawString(42,35,'BMore Cardiology  |  Patient education  |  Updated '+DISPLAY_DATE)
    canvas.drawRightString(570,35,str(doc.page));canvas.restoreState()
def document(name,story):
    doc=SimpleDocTemplate(str(OUT/name),pagesize=letter,rightMargin=42,leftMargin=42,topMargin=36,bottomMargin=62,title=name.replace('-',' ').replace('.pdf',''),author='BMore Cardiology')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)

HANDOUTS={
 'echo-summary.pdf':('Your Echocardiogram','tests/echocardiogram.html',[
  ('Why this test?','An echo uses ultrasound to assess heart muscle, chambers and valves. It can help evaluate a murmur, breathlessness or known heart disease.'),
  ('What to expect','A standard transthoracic echo uses a probe and gel on the chest. It does not use ionizing radiation. Follow separate instructions if you are having a TEE or stress echo.'),
  ('Words in the report','EF is the percentage of blood ejected by the left ventricle with each beat. About 55-70% is a commonly used normal range. Regurgitation means valve leakage; stenosis means narrowing. Mild findings need context, not an automatic procedure.'),
  ('What happens next?','Review important findings and any follow-up interval with the ordering clinician. Preserved EF does not exclude heart failure, and a resting echo does not rule out every coronary problem.')]),
 'rhythm-monitor-summary.pdf':('Your Rhythm Monitor','tests/rhythm-monitor.html',[
  ('Why this test?','A patch, Holter or event monitor records your rhythm during daily life, helping compare symptoms with heartbeats.'),
  ('While wearing it','Follow the instructions for your exact device, including showering, activity and return shipping. Log symptoms and their times; press the event button if instructed.'),
  ('Words in the report','PACs and PVCs are early beats from the upper or lower chambers. Burden describes how often a finding occurs. Duration, symptoms and heart structure affect what a rhythm finding means.'),
  ('What happens next?','Return the device as directed and ask when results will be reviewed. Some devices are read after return. Do not assume your monitor is watched continuously or that an event button requests emergency help.')]),
 'calcium-score-summary.pdf':('Your Calcium Scan','tests/calcium-score.html',[
  ('Why this test?','A coronary calcium scan uses CT to measure calcified plaque. It can help with selected prevention decisions, including whether cholesterol treatment would be useful.'),
  ('What to expect','The scan generally does not use IV contrast. Follow the center\'s preparation instructions, disclose pregnancy possibility, and ask about cost and coverage.'),
  ('What the number means','Zero means no calcified plaque was found; it does not exclude all plaque or explain away symptoms. Higher scores generally mean more plaque. The score is not a percentage of artery blockage.'),
  ('What happens next?','Discuss the result alongside cholesterol, BP, family history and other risks. Do not start aspirin or change prescribed treatment from the score alone. Ask whether a repeat scan would change care.')]),
 'stress-test-summary.pdf':('Your Stress Test','tests/stress-test.html',[
  ('Why this test?','Stress testing assesses your heart during exercise or medication-induced stress. It may help evaluate symptoms, blood flow or exercise capacity.'),
  ('How to prepare','Ask which type of test you are having. Follow the center\'s instructions about food, caffeine and medicines. Do not hold a prescribed medicine unless the testing team tells you to.'),
  ('What to expect','Staff monitor your symptoms, ECG, heart rate and BP. Some tests add ultrasound or nuclear imaging. Tell the team about breathing problems, medication reactions, pregnancy possibility or difficulty walking.'),
  ('What happens next?','A normal test is reassuring for the question tested, but does not exclude all plaque or every cause of symptoms. An abnormal or inconclusive result may lead to treatment changes or more testing.')]),
 'coronary-cta-summary.pdf':('Your Coronary CTA','tests/coronary-cta.html',[
  ('Why this test?','Coronary CTA uses CT and IV contrast to show artery anatomy, plaque and estimated narrowing. It answers a different question from a calcium scan.'),
  ('How to prepare','Tell the team about kidney disease, prior iodinated-contrast reactions, pregnancy possibility and all medicines, including erectile-dysfunction drugs. Follow their food, caffeine and medication instructions.'),
  ('What to expect','You receive contrast through an IV and follow breath-hold instructions. The team may give medicines to improve image quality. The scan uses radiation and has potential contrast-related risks.'),
  ('What happens next?','Your clinician considers narrowing, plaque and image quality. Not every plaque finding needs a procedure. Ask what changes about prevention, symptoms or further testing.')]),
}

for filename,(title,path,sections) in HANDOUTS.items():
    page=next(x for x in PAGES if x['path']==path)
    story=[p('BMORE CARDIOLOGY / YOUR VISIT COMPANION','SmallX'),p(title,'TitleX')]
    for heading,text in sections:story.extend([p(heading,'HeadingX'),p(escape(text))])
    story.append(p('Questions to bring','HeadingX'))
    for q in page['questions']:story.append(p('&#8226; '+escape(q)))
    story.extend([p('My next step / follow-up: __________________________________________'),Spacer(1,5),p('<b>Urgent symptoms:</b> Call 911 for severe chest symptoms, fainting, stroke symptoms or severe trouble breathing. Do not wait for a scheduled test or its report.','SmallX')])
    url='https://bmorecardiology.com/'+path
    story.append(p('Full guide and references: <link href="'+url+'" color="#155d9f">'+url+'</link>','SmallX'))
    for key in page['sources'][:2]:
        label,url=SOURCES[key];story.append(p('Source: <link href="'+url+'" color="#155d9f">'+escape(label)+'</link>','SmallX'))
    story.append(p('Independent educational resource. Use your own clinician\'s instructions.','SmallX'))
    document(filename,story)

story=[p('BMORE CARDIOLOGY / HOME RECORD','SmallX'),p('Blood Pressure Log','TitleX'),p('Name or label: ____________________   Dates: ____________________')]
story += [p('Use your clinician\'s monitoring schedule','HeadingX'),p('Rest seated for five minutes. Keep your back and arm supported, feet flat, and cuff on bare skin at heart level. Avoid exercise, nicotine and caffeine for 30 minutes beforehand. Take two readings one minute apart and write down <b>both numbers from both readings</b>. Do not keep only the lowest.'),p('My schedule: ____________________   My BP goal: ____________________')]
data=[[p('Date / time','SmallX'),p('Reading 1<br/>Top / bottom','SmallX'),p('Reading 2<br/>Top / bottom','SmallX'),p('Pulse<br/>(optional)','SmallX'),p('Notes / symptoms','SmallX')]]
data += [['','____ / ____','____ / ____','',''] for _ in range(10)]
table=Table(data,colWidths=[95,90,90,65,188],rowHeights=[35]+[25]*10)
table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#b6c9d9')),('FONTNAME',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,1),(-1,-1),9),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TEXTCOLOR',(0,1),(-1,-1),NAVY)]))
story += [table,p('When to act','HeadingX'),p('If systolic BP is above 180 <b>or</b> diastolic BP is above 120 and you have chest pain, breathlessness, new weakness, vision changes or trouble speaking, call 911. If you have no concerning symptoms, wait at least one minute and repeat; contact your healthcare professional immediately if it stays this high. Severe symptoms need urgent care even below these BP numbers.','SmallX'),p('Bring or send readings according to your care plan. Do not wait 12 weeks to report a concern.','SmallX'),p('Source: <link href="'+SOURCES['bp'][1]+'" color="#155d9f">American Heart Association: Home Blood Pressure Monitoring</link>','SmallX')]
document('BP-Log-Template.pdf',story)
print('Built 6 handouts in downloads/.')

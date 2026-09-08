(function () {
  'use strict';
  const C=window.HeartTracker;
  const $=id=>document.getElementById(id);
  let records=[], raw=null, readable=true, accessible=true, selectedPatient='';
  const form=$('reading-form');
  function element(tag,text,className) {
    const node=document.createElement(tag);
    if(text!==undefined) node.textContent=text;
    if(className) node.className=className;
    return node;
  }
  function localNow() {
    const now=new Date();
    return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+'T'+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  }
  function friendlyTime(value) { return new Date(value).toLocaleString(); }
  function setStatus(message) { $('reading-status').textContent=message; }
  function warn(message) { $('storage-warning').textContent=message; $('storage-warning').hidden=false; }
  function load() {
    accessible=true; readable=true; records=[];
    $('storage-warning').hidden=true;
    try { raw=window.localStorage.getItem(C.STORAGE_KEY); }
    catch { accessible=false; readable=false; raw=null; warn('This browser is not allowing saved data to be accessed. Saving is disabled. Check your browser settings, or use the printable BP log.'); }
    if(accessible) {
      try { records=C.parseSaved(raw); }
      catch { readable=false; warn('Your saved readings could not be opened. They have not been overwritten. Download all stored data below for a backup before asking for help or choosing to delete it.'); }
    }
    if(records.length && !records.some(r=>r.patient===selectedPatient)) selectedPatient=[...records].sort((a,b)=>new Date(b.time)-new Date(a.time))[0].patient;
    $('save-reading').disabled=!readable;
    $('clear-data').disabled=!accessible || raw===null;
    $('backup-data').disabled=raw===null;
    render();
  }
  function commit(next,message) {
    try {
      if(window.localStorage.getItem(C.STORAGE_KEY)!==raw) {
        load();warn('Readings changed in another tab. The latest saved data is now shown. Please try your change again.');return false;
      }
      C.save(window.localStorage,next);
    }
    catch { warn('The browser could not save this change. Your previous saved readings are unchanged. Check available storage or browser settings, then try again.'); return false; }
    records=next;raw=JSON.stringify(records);readable=true;
    $('storage-warning').hidden=true;
    $('clear-data').disabled=false;$('backup-data').disabled=false;
    render();setStatus(message);return true;
  }
  function current() { return C.filter(records,selectedPatient,$('period-filter').value); }
  function render() {
    const people=[...new Set(records.map(r=>r.patient))].sort((a,b)=>a.localeCompare(b));
    if(!people.length) people.push('');
    if(!people.includes(selectedPatient)) selectedPatient=people[0];
    const select=$('person-filter');select.replaceChildren();
    people.forEach(person=>{const option=element('option',person||'Unnamed readings');option.value=person;select.append(option);});select.value=selectedPatient;
    const rows=current();
    const period=$('period-filter').selectedOptions[0].textContent;
    $('view-caption').textContent=(selectedPatient||'Unnamed readings')+' · '+period+' · '+rows.length+' saved '+(rows.length===1?'entry':'entries')+' · Prepared '+new Date().toLocaleDateString();
    renderSummary(rows);renderChart(rows);renderHistory(rows);
    $('export-csv').disabled=!readable||!rows.length;$('print-readings').disabled=!readable||!rows.length;
  }
  function renderSummary(rows) {
    const s=C.summary(rows),target=$('summary');target.replaceChildren();
    const format=(v,decimals=0)=>v===null?'—':v.toFixed(decimals);
    const specs=[['Blood pressure',format(s.systolic.latest)+' / '+format(s.diastolic.latest)+' mmHg','Average: '+format(s.systolic.average)+' / '+format(s.diastolic.average),s.systolic],['Pulse',format(s.hr.latest)+' bpm','Average: '+format(s.hr.average),s.hr],['Weight',format(s.weight.latest,1)+' lb','Average: '+format(s.weight.average,1),s.weight]];
    specs.forEach(([label,last,average,item])=>{const card=element('div',undefined,'summary-card');card.append(element('h3',label),element('div',last,'summary-number'),element('p',item.time?'Latest: '+friendlyTime(item.time):'No measurements in this period'),element('p',average+' · n='+item.count));target.append(card);});
  }
  function renderHistory(rows) {
    const target=$('history');target.replaceChildren();
    if(!rows.length) { target.append(element('p',readable?'No readings in this view. Add a measurement, select another person, or choose a longer period.':'Saved readings could not be opened. See the notice above.'));return; }
    const table=element('table');table.append(element('caption','Saved measurements, newest first'));
    const thead=element('thead'),head=element('tr');
    ['Person / label','Date and time','BP (mmHg)','Pulse (bpm)','Weight (lb)','Action'].forEach((label,i)=>{const th=element('th',label,i===5?'action-column':undefined);th.scope='col';head.append(th);});thead.append(head);table.append(thead);
    const tbody=element('tbody');
    rows.forEach(record=>{
      const tr=element('tr');
      [record.patient||'Unnamed',friendlyTime(record.time),record.systolic===null?'—':record.systolic+' / '+record.diastolic,record.hr===null?'—':record.hr,record.weight===null?'—':record.weight].forEach((value,i)=>tr.append(element('td',value,i===0?'person-cell':undefined)));
      const action=element('td',undefined,'action-column');const remove=element('button','Delete','delete-reading');remove.type='button';remove.setAttribute('aria-label','Delete reading from '+friendlyTime(record.time));
      remove.addEventListener('click',()=>{if(window.confirm('Delete this reading from '+friendlyTime(record.time)+'?')) commit(records.filter(r=>r.id!==record.id),'Reading deleted.');});action.append(remove);tr.append(action);tbody.append(tr);
    });table.append(tbody);target.append(table);
  }
  function renderChart(rows) {
    const target=$('trend-chart');target.replaceChildren();
    const metric=$('metric-filter').value;
    const definitions=metric==='bp'?[['systolic','Systolic','#155d9f'],['diastolic','Diastolic','#99451b']]:metric==='hr'?[['hr','Pulse','#155d9f']]:[['weight','Weight','#155d9f']];
    const series=definitions.map(([field,label,color])=>({field,label,color,points:rows.filter(r=>Number.isFinite(r[field])).map(r=>({x:new Date(r.time).getTime(),y:r[field]})).sort((a,b)=>a.x-b.x)}));
    const points=series.flatMap(s=>s.points);
    if(!points.length){target.append(element('p','No '+(metric==='bp'?'blood pressure':metric==='hr'?'pulse':'weight')+' measurements in this view.'));return;}
    const ns='http://www.w3.org/2000/svg';
    function svgElement(tag,attrs,text){const node=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>node.setAttribute(k,String(v)));if(text!==undefined)node.textContent=text;return node;}
    const svg=svgElement('svg',{viewBox:'0 0 760 270',role:'img','aria-labelledby':'trend-title trend-desc'});
    const unit=metric==='bp'?'mmHg':metric==='hr'?'bpm':'lb';
    svg.append(svgElement('title',{id:'trend-title'},$('metric-filter').selectedOptions[0].textContent+' over time'),svgElement('desc',{id:'trend-desc'},'Measurements for '+(selectedPatient||'unnamed readings')+'. The same values are available in the measurement history table. Values are shown in '+unit+'.'));
    const xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x));
    let ymin=Math.min(...points.map(p=>p.y)),ymax=Math.max(...points.map(p=>p.y));
    const pad=Math.max((ymax-ymin)*.12,metric==='weight'?1:5);ymin=Math.max(0,Math.floor(ymin-pad));ymax=Math.ceil(ymax+pad);
    const X=x=>xmin===xmax?405:65+(x-xmin)/(xmax-xmin)*665;
    const Y=y=>220-(y-ymin)/(ymax-ymin)*185;
    svg.append(svgElement('text',{x:8,y:17,fill:'#42576d','font-size':13},unit));
    for(let i=0;i<5;i++){const value=ymin+(ymax-ymin)*i/4;const y=Y(value);svg.append(svgElement('line',{x1:65,x2:730,y1:y,y2:y,stroke:'#d4e0eb'}),svgElement('text',{x:54,y:y+4,'text-anchor':'end',fill:'#42576d','font-size':13},value.toFixed(metric==='weight'?1:0)));}
    series.forEach(s=>{svg.append(svgElement('polyline',{points:s.points.map(p=>X(p.x)+','+Y(p.y)).join(' '),fill:'none',stroke:s.color,'stroke-width':2.5}));s.points.forEach(p=>svg.append(svgElement('circle',{cx:X(p.x),cy:Y(p.y),r:3,fill:s.color})));});
    svg.append(svgElement('text',{x:65,y:249,fill:'#42576d','font-size':13},new Date(xmin).toLocaleDateString()),svgElement('text',{x:730,y:249,'text-anchor':'end',fill:'#42576d','font-size':13},new Date(xmax).toLocaleDateString()));
    target.append(svg);const legend=element('div',undefined,'chart-legend');series.forEach(s=>{const key=element('span',s.label+' ('+unit+')','chart-key');key.style.setProperty('--series-color',s.color);legend.append(key);});target.append(legend);
  }
  function download(contents,name,type) {const url=URL.createObjectURL(new Blob([contents],{type}));const a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  form.addEventListener('submit',event=>{
    event.preventDefault();$('form-error').hidden=true;
    if(!readable)return;
    if([...form.querySelectorAll('input[type="number"]')].some(input=>input.validity.badInput)) {
      $('form-error').textContent='Check the measurement fields and enter valid numbers.';$('form-error').hidden=false;return;
    }
    let record;
    try{record=C.validate({patient:$('patient-name').value,time:$('measurement-time').value,systolic:$('systolic').value,diastolic:$('diastolic').value,hr:$('pulse').value,weight:$('weight').value});if(new Date(record.time).getTime()>Date.now()+60000)throw new Error('The measurement time is in the future. Check the date and time.');}
    catch(error){$('form-error').textContent=error.message;$('form-error').hidden=false;return;}
    record.id=window.crypto&&crypto.randomUUID?crypto.randomUUID():'reading-'+Date.now()+'-'+Math.random().toString(16).slice(2);
    const oldSelected=selectedPatient;selectedPatient=record.patient;
    if(commit([record,...records],'Reading saved in this browser. It has not been sent to your care team.')){['systolic','diastolic','pulse','weight'].forEach(id=>$(id).value='');$('measurement-time').value=localNow();}
    else selectedPatient=oldSelected;
  });
  $('person-filter').addEventListener('change',()=>{selectedPatient=$('person-filter').value;$('patient-name').value=selectedPatient;render();});
  $('period-filter').addEventListener('change',render);$('metric-filter').addEventListener('change',()=>renderChart(current()));
  $('export-csv').addEventListener('click',()=>download(C.csv(current()),'heart-health-readings.csv','text/csv;charset=utf-8'));
  $('print-readings').addEventListener('click',()=>window.print());
  $('backup-data').addEventListener('click',()=>{if(raw!==null)download(raw,'heart-health-backup.json','application/json');});
  $('clear-data').addEventListener('click',()=>{
    if(!window.confirm('Delete ALL saved readings for every person in this browser? Download a backup first if you want to keep a copy. This cannot be undone.'))return;
    try{window.localStorage.removeItem(C.STORAGE_KEY);selectedPatient='';load();setStatus('All saved readings deleted from this browser.');}
    catch{warn('The browser could not delete the saved data.');}
  });
  window.addEventListener('storage',event=>{if(event.key===C.STORAGE_KEY||event.key===null){load();setStatus('Readings refreshed after a change in another tab.');}});
  $('measurement-time').value=localNow();load();$('patient-name').value=selectedPatient;
})();

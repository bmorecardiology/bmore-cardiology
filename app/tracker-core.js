/* Measurement handling shared by the browser and focused regression checks. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HeartTracker = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'vitalReadings';
  function numeric(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('Use numbers for measurements.');
    return number;
  }
  function validTime(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return false;
    const parts = match.slice(1).map(v => Number(v || 0));
    const date = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
    return date.getFullYear()===parts[0] && date.getMonth()===parts[1]-1 && date.getDate()===parts[2] && date.getHours()===parts[3] && date.getMinutes()===parts[4] && date.getSeconds()===parts[5];
  }
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('A saved reading is not in the expected format.');
    const patient = typeof input.patient === 'string' ? input.patient.trim() : '';
    if (patient.length > 100) throw new Error('Use a name or label of 100 characters or fewer.');
    if (!validTime(input.time)) throw new Error('Choose a valid measurement date and time.');
    const result = {patient, time: input.time, hr: numeric(input.hr), weight: numeric(input.weight), systolic: numeric(input.systolic), diastolic: numeric(input.diastolic)};
    if ([result.hr,result.weight,result.systolic,result.diastolic].every(v=>v===null)) throw new Error('Enter blood pressure, pulse, or weight. You do not need to fill every measurement.');
    if ((result.systolic===null)!==(result.diastolic===null)) throw new Error('Enter both blood pressure numbers, or leave both blank.');
    for (const [field,label,min,max,integer] of [['hr','Pulse',1,300,true],['weight','Weight',1,1500,false],['systolic','Systolic BP',1,350,true],['diastolic','Diastolic BP',1,250,true]]) {
      const value=result[field];
      if (value!==null && (value<min || value>max || (integer&&!Number.isInteger(value)))) throw new Error(label+' is outside the entry range. Check the number and units. These limits are for data entry, not a healthy range.');
    }
    if (result.systolic!==null && result.systolic<=result.diastolic) throw new Error('The top BP number should be greater than the bottom number. Check your entry.');
    return result;
  }
  function parseSaved(raw) {
    if (raw === null || raw === '') return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Saved data must be a list of readings.');
    const used = new Set();
    return parsed.map((record,index) => {
      const result=validate(record);
      let id=typeof record.id==='string' && record.id ? record.id : 'legacy-'+index+'-'+result.time;
      while (used.has(id)) id+='-'+index;
      used.add(id);
      return {...result,id};
    });
  }
  function save(storage,records) {
    // The caller changes its visible state only after this write succeeds.
    storage.setItem(STORAGE_KEY,JSON.stringify(records));
  }
  function filter(records,patient,days,now=Date.now()) {
    const since=days==='all' ? -Infinity : now-Number(days)*86400000;
    return records.filter(r=>r.patient===patient && new Date(r.time).getTime()>=since && new Date(r.time).getTime()<=now).sort((a,b)=>new Date(b.time)-new Date(a.time));
  }
  function summary(records) {
    const out={};
    for (const field of ['systolic','diastolic','hr','weight']) {
      const present=records.filter(r=>Number.isFinite(r[field])).sort((a,b)=>new Date(b.time)-new Date(a.time));
      out[field]={count:present.length,average:present.length ? present.reduce((sum,r)=>sum+r[field],0)/present.length : null,latest:present.length ? present[0][field] : null,time:present.length ? present[0].time : null};
    }
    return out;
  }
  function csv(records) {
    function cell(value,text=false) {
      let s=value===null || value===undefined ? '' : String(value);
      // Treat labels as text even when spreadsheet software recognizes a formula.
      if(text && /^[\s]*[=+@\-\t\r\n]/.test(s)) s="'"+s;
      return '"'+s.replace(/"/g,'""')+'"';
    }
    const rows=[['Person / label','Measurement time (local)','Systolic BP (mmHg)','Diastolic BP (mmHg)','Pulse (bpm)','Weight (lb)'].map(v=>cell(v)).join(',')];
    records.forEach(r=>rows.push([cell(r.patient,true),cell(r.time,true),cell(r.systolic),cell(r.diastolic),cell(r.hr),cell(r.weight)].join(',')));
    return '\uFEFF'+rows.join('\r\n')+'\r\n';
  }
  return {STORAGE_KEY,validate,validTime,parseSaved,save,filter,summary,csv};
});

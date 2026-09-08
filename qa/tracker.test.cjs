'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/tracker-core.js');
const base={patient:'Alex',time:'2026-09-08T08:00'};
test('BP, pulse and weight can each be saved independently',()=>{
  assert.deepEqual(C.validate({...base,systolic:'120',diastolic:'80'}),{...base,systolic:120,diastolic:80,hr:null,weight:null});
  assert.equal(C.validate({...base,hr:'72'}).hr,72);
  assert.equal(C.validate({...base,weight:'180.5'}).weight,180.5);
});
test('incomplete, empty, reversed or malformed measurements fail with useful errors',()=>{
  assert.throws(()=>C.validate(base),/Enter blood pressure/);
  assert.throws(()=>C.validate({...base,systolic:120}),/both blood pressure/);
  assert.throws(()=>C.validate({...base,systolic:80,diastolic:120}),/top BP/);
  for(const hr of ['abc',Infinity,0,301,72.5])assert.throws(()=>C.validate({...base,hr}));
  assert.throws(()=>C.validate({...base,weight:-10}));
  assert.throws(()=>C.validate({...base,patient:'x'.repeat(101),hr:70}));
});
test('invalid calendar dates cannot silently roll into another day',()=>{
  assert.equal(C.validTime('2024-02-29T09:00'),true);
  for(const date of ['2026-02-29T09:00','2026-04-31T09:00','2026-09-08T24:00','not-a-date','2026-09-08'])assert.equal(C.validTime(date),false);
});
test('the original vitalReadings schema loads without dropping measurements',()=>{
  const old=[{...base,hr:72,weight:181.5,systolic:125,diastolic:78},{...base,time:'2026-09-07T20:00',hr:75,weight:182,systolic:130,diastolic:82}];
  const raw=JSON.stringify(old),loaded=C.parseSaved(raw);
  assert.equal(C.STORAGE_KEY,'vitalReadings');
  assert.deepEqual(loaded.map(({id,...values})=>values),old);
  assert.equal(new Set(loaded.map(r=>r.id)).size,2);
  assert.deepEqual(C.parseSaved(JSON.stringify(loaded)),loaded);
  assert.equal(raw,JSON.stringify(old));
});
test('corrupt saved data is rejected so callers can preserve and back it up',()=>{
  for(const raw of ['{broken','{}','null','[null]','[{"time":"2026-09-08T08:00","hr":"bad"}]'])assert.throws(()=>C.parseSaved(raw));
  assert.deepEqual(C.parseSaved(null),[]);
});
test('duplicate IDs cannot cause one deletion to target multiple entries',()=>{
  const loaded=C.parseSaved(JSON.stringify(['same','same-2','same'].map(id=>({...base,hr:72,id}))));
  assert.equal(new Set(loaded.map(r=>r.id)).size,3);
});
test('filtering never combines people, excludes future values and sorts by measurement time',()=>{
  const now=new Date('2026-09-08T12:00').getTime();
  const rows=[{...base,time:'2026-09-07T09:00',hr:60},{...base,time:'2026-09-08T09:00',hr:70},{...base,patient:'Blair',hr:200},{...base,time:'2026-08-01T08:00',hr:80},{...base,time:'2026-09-09T08:00',hr:90}];
  assert.deepEqual(C.filter(rows,'Alex','7',now).map(r=>r.hr),[70,60]);
  assert.equal(C.filter(rows,'Alex','all',now).length,3);
  assert.equal(C.filter(rows,'Blair','7',now).length,1);
});
test('averages use available measurements and latest means measurement time, not entry order',()=>{
  const rows=[C.validate({...base,time:'2026-09-06T08:00',hr:60}),C.validate({...base,time:'2026-09-08T08:00',systolic:120,diastolic:80}),C.validate({...base,time:'2026-09-07T08:00',hr:80,weight:180.5})];
  const s=C.summary(rows);
  assert.equal(s.hr.average,70);assert.equal(s.hr.latest,80);assert.equal(s.hr.count,2);
  assert.equal(s.systolic.average,120);assert.equal(s.systolic.count,1);
  assert.equal(s.weight.latest,180.5);
  assert.equal(C.summary([]).weight.latest,null);
});
test('a failed storage write does not report success or change existing data',()=>{
  let stored='existing';
  const storage={setItem(){throw new Error('Quota exceeded');}};
  assert.throws(()=>C.save(storage,[base]),/Quota/);assert.equal(stored,'existing');
  C.save({setItem(key,value){assert.equal(key,'vitalReadings');stored=value;}},[{...base,hr:70}]);
  assert.equal(JSON.parse(stored)[0].hr,70);
});
test('CSV escapes labels, blanks absent values and protects spreadsheet formulas',()=>{
  const csv=C.csv([C.validate({...base,patient:' =1+1',hr:70}),C.validate({...base,patient:'Alex, "B"',weight:180})]);
  assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Alex, ""B"""'));assert.ok(csv.includes('"","","70",""'));
});

/* Run against a local checkout with a fresh browser profile and synthetic data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const playwright=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const base=process.env.SITE_URL||'http://127.0.0.1:8000';
const password=process.env.SITE_PASSWORD;
const browserName=process.env.BROWSER||'chromium';
const output=path.join(ROOT,'browser-artifacts',browserName);
const labels=['Home','Topics','Tests','Cardiac Longevity','Notes','Tracker','About'];
async function htmlFiles(dir){
  const result=[];
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if(e.name.startsWith('.')||['node_modules','browser-artifacts','test-results'].includes(e.name))continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory())result.push(...await htmlFiles(full));
    else if(e.name.endsWith('.html')&&e.name!=='tracker-fragment.html')result.push(path.relative(ROOT,full).split(path.sep).join('/'));
  }
  return result.sort();
}
async function run(){
  assert.ok(password,'Set SITE_PASSWORD to the site password before running.');
  assert.ok(playwright[browserName],'BROWSER must be chromium, firefox or webkit.');
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname),'Run this data-changing test against a local server.');
  await fs.mkdir(output,{recursive:true});
  const browser=await playwright[browserName].launch();
  try{
    const context=await browser.newContext({acceptDownloads:true,viewport:{width:1365,height:900}});
    const page=await context.newPage();const errors=[];const missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.status()+' '+r.url());});
    await page.goto(base+'/index.html');
    await page.locator('#bmore-password-input').fill('intentionally-incorrect');
    await page.locator('#bmore-password-btn').click();
    assert.equal(await page.locator('#bmore-password-error').isVisible(),true);
    await page.locator('#bmore-password-input').fill(password);
    await page.locator('#bmore-password-btn').click();
    await page.locator('#bmore-password-overlay').waitFor({state:'detached'});
    const files=await htmlFiles(ROOT);
    for(const width of [390,900,1365]){
      await page.setViewportSize({width,height:900});
      for(const file of files){
        const response=await page.goto(base+'/'+file);assert.equal(response.status(),200,file);
        assert.equal(await page.locator('h1').count(),1,file);
        assert.deepEqual(await page.locator('.nav__links a').allTextContents(),labels,file);
        assert.equal(await page.locator('.nav__links a[aria-current]').count(),1,file);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),file+' overflows at '+width);
        const broken=await page.locator('img').evaluateAll(images=>images.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));
        assert.deepEqual(broken,[],file+' images');
        if(width<=1100){
          const button=page.locator('.nav__hamburger');await button.click();
          assert.equal(await button.getAttribute('aria-expanded'),'true');
          await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-expanded'),'false');
          assert.equal(await button.evaluate(b=>b===document.activeElement),true);
        }
      }
      await page.goto(base+'/index.html');await page.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});
      await page.goto(base+'/tests/echocardiogram.html');await page.screenshot({path:path.join(output,'echo-'+width+'.png'),fullPage:true});
    }
    await page.setViewportSize({width:390,height:900});await page.goto(base+'/index.html');
    await page.locator('.nav__hamburger').click();await page.mouse.click(10,800);
    assert.equal(await page.locator('.nav__hamburger').getAttribute('aria-expanded'),'false');
    await page.locator('.nav__hamburger').click();await page.locator('.nav__links a').filter({hasText:'Topics'}).click();
    await page.waitForURL('**/topics.html');assert.equal(await page.locator('.nav__hamburger').getAttribute('aria-expanded'),'false');
    await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(e=>document.activeElement===e),true);

    await page.setViewportSize({width:1365,height:900});await page.goto(base+'/app/index.html');
    const legacy=[{patient:'Example A',time:'2026-01-01T08:00',hr:72,weight:180,systolic:120,diastolic:80}];
    await page.evaluate(data=>localStorage.setItem('vitalReadings',JSON.stringify(data)),legacy);await page.reload();
    await page.locator('#period-filter').selectOption('all');
    assert.equal(await page.locator('#history tbody tr').count(),1);
    await page.locator('#patient-name').fill('Example B');await page.locator('#weight').fill('185.5');await page.locator('#save-reading').click();
    assert.match(await page.locator('#reading-status').textContent(),/Reading saved/);
    assert.equal(await page.locator('#history tbody tr').count(),1);
    await page.reload();await page.locator('#period-filter').selectOption('all');
    await page.locator('#person-filter').selectOption('Example A');
    assert.equal(await page.locator('#history tbody tr').count(),1);
    await page.locator('#systolic').fill('130');await page.locator('#save-reading').click();
    assert.match(await page.locator('#form-error').textContent(),/both blood pressure/);
    await page.locator('#diastolic').fill('84');await page.locator('#save-reading').click();
    assert.equal(await page.locator('#history tbody tr').count(),2);
    assert.equal(await page.locator('#trend-chart svg').count(),1);
    assert.match(await page.locator('#summary').textContent(),/125 \/ 82/);
    const beforeFailure=await page.evaluate(()=>localStorage.getItem('vitalReadings'));
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Simulated quota failure','QuotaExceededError');};});
    await page.locator('#pulse').fill('73');await page.locator('#save-reading').click();
    assert.match(await page.locator('#storage-warning').textContent(),/could not save/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('vitalReadings')),beforeFailure);
    await page.reload();await page.locator('#period-filter').selectOption('all');await page.locator('#person-filter').selectOption('Example A');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-csv').click()]);
    await download.saveAs(path.join(output,'example-readings.csv'));
    const csv=await fs.readFile(path.join(output,'example-readings.csv'),'utf8');assert.ok(csv.includes('Example A'));assert.ok(!csv.includes('Example B'));
    await page.screenshot({path:path.join(output,'tracker-desktop.png'),fullPage:true});
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.entry-panel').isVisible(),false);
    if(browserName==='chromium')await page.pdf({path:path.join(output,'tracker-print.pdf'),format:'Letter',printBackground:true});
    await page.emulateMedia({media:'screen'});
    await page.setViewportSize({width:390,height:900});await page.screenshot({path:path.join(output,'tracker-mobile.png'),fullPage:true});
    page.once('dialog',d=>d.accept());await page.locator('.delete-reading').first().click();
    assert.equal(await page.locator('#history tbody tr').count(),1);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('vitalReadings')))).length,2);
    await page.locator('#patient-name').fill('<img src=x onerror=alert(1)>');await page.locator('#pulse').fill('70');await page.locator('#save-reading').click();
    assert.equal(await page.locator('#history td img').count(),0);
    assert.match(await page.locator('#history').textContent(),/<img src=x/);
    await page.evaluate(()=>localStorage.setItem('vitalReadings','{corrupt-example'));await page.reload();
    assert.equal(await page.locator('#save-reading').isDisabled(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('vitalReadings')),'{corrupt-example');
    const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#backup-data').click()]);
    await backup.saveAs(path.join(output,'corrupt-backup.json'));assert.equal(await fs.readFile(path.join(output,'corrupt-backup.json'),'utf8'),'{corrupt-example');
    page.once('dialog',d=>d.accept());await page.locator('#clear-data').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('vitalReadings')),null);
    assert.deepEqual(errors,[],'JavaScript errors');assert.deepEqual(missing,[],'Missing local resources');
    console.log('PASS: '+files.length+' pages at 3 widths; keyboard/menu behavior; legacy data; partial readings; filtering; charts; save failure; export/print; deletion; text safety; corrupt-data preservation.');
    console.log('Inspect screenshots and print output in '+output+'. Real-device checks remain separate.');
    await context.close();
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});

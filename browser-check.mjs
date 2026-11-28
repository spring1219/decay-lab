import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
try {
  const context = await browser.newContext({offline:true, acceptDownloads:true, viewport:{width:1280,height:900}});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(new URL("index.html",import.meta.url).href);

  const evidence = page.locator("#challenge-evidence");
  assert.match(await evidence.innerText(), /21 of 21/);
  assert.equal(await page.locator("#sample").isVisible(), false);
  assert.equal(await page.evaluate(() => dataset.full.raw.length),16);
  assert.equal(await page.locator("#save-decision").isVisible(),false);
  await page.locator("#advance").click();
  assert.equal(await page.evaluate(() => current.raw.length),16);
  await page.locator("#pick-model").selectOption("single");
  await page.locator("#pick-action").selectOption("stop");
  await page.locator("#reason").fill("Early agreement");
  await page.locator("#language").click();
  assert.equal(await page.locator("#pick-model").inputValue(),"single");
  await page.locator("#advance").click();
  assert.equal(await page.evaluate(() => current.raw.length),64);
  assert.equal(await page.locator("#pick-model").inputValue(),"");
  assert.equal(await page.locator("#reason").inputValue(),"");
  assert.equal(await page.locator("#save-decision").isVisible(),false);
  await page.locator("#pick-model").selectOption("uncertain");
  await page.locator("#pick-action").selectOption("more");
  await page.locator("#advance").click();
  const [record] = await Promise.all([page.waitForEvent("download"),page.locator("#save-decision").click()]);
  const answer = JSON.parse(await readFile(await record.path(),"utf8"));
  assert.deepEqual(answer.decisions,[
    {observations:16,model:"single",action:"stop",reason:"Early agreement"},
    {observations:64,model:"uncertain",action:"more",reason:""}
  ]);
  await page.locator("#language").click();
  assert.match(await evidence.innerText(),/two exponential components/);
  await page.locator('#challenge a').click();
  await page.locator('#sample').waitFor({state:'visible'});
  assert.equal(await page.locator("#sample").inputValue(),"1");
  await page.locator('#challenge-link a').click();
  await evidence.waitFor({state:'visible'});
  assert.match(await evidence.innerText(),/21 of 21/);
  assert.equal(await page.locator("#save-decision").isVisible(),false);
  await page.locator('#challenge a').click();
  await page.locator('#sample').waitFor({state:'visible'});

  async function importCsv(name,rows) {
    const csv = "time,signal\n" + rows.map(row => row.join(",")).join("\n");
    await page.locator("#file").setInputFiles({name,mimeType:"text/csv",buffer:Buffer.from(csv)});
    await page.waitForFunction(name => document.getElementById("dataset").textContent.includes(name),name);
  }

  async function exportReport() {
    const [file] = await Promise.all([page.waitForEvent("download"),page.locator("#export").click()]);
    assert.equal(await file.failure(),null);
    return JSON.parse(await readFile(await file.path(),"utf8"));
  }

  async function axes() {
    return page.evaluate(() => {
      const labels = {};
      const proto = CanvasRenderingContext2D.prototype;
      const fillText = proto.fillText;
      proto.fillText = function(label,x,y) {
        const axis = labels[this.canvas.id] ??= {x:[],y:[]};
        axis[this.textAlign === "center" ? "x" : "y"].push(label);
        return fillText.call(this,label,x,y);
      };
      try { drawCharts(); } finally { proto.fillText = fillText; }
      return labels;
    });
  }

  const baseline = 100000000000.32112;
  const rows = Array.from({length:64},(_,i)=>[1700000000+i,baseline+1.1*Math.exp(-2*i/63)]);
  await importCsv("offset.csv",rows);
  const report = await exportReport();
  const parameters = await page.evaluate(() => current.fits.map(fit => fit.output));
  for (const [i,output] of parameters.entries()) {
    for (const [key,value] of Object.entries(output)) assert.equal(report.fits[i][key],value,key);
  }
  assert.ok(Math.abs(report.fits[0].baseline-baseline)<0.0001);
  assert.ok((await page.locator("#params").innerText()).includes(String(parameters[0].baseline)));
  assert.ok((await page.locator("#window-count").innerText()).includes("1700000063"));
  for (const language of ["en","zh-CN"]) {
    if (language !== "en") await page.locator("#language").click();
    assert.equal(await page.locator("html").getAttribute("lang"),language);
    assert.ok((await page.locator("#predictor-axis").innerText()).includes("1700000000"));
    assert.ok((await page.locator("#signal-axis").innerText()).includes(String(rows.at(-1)[1])));
    for (const width of [1280,360]) {
      await page.setViewportSize({width,height:900});
      const {plot,residual} = await axes();
      assert.equal(new Set(plot.y).size,plot.y.length);
      assert.equal(new Set(plot.x).size,plot.x.length);
      assert.deepEqual(plot.x,residual.x);
      assert.equal(Number(plot.x.at(-1)),63);
    }
  }

  await importCsv("pulse.csv",Array.from({length:64},(_,i)=>[i,i === 1 ? 3 : 2]));
  for (const language of ["zh-CN","en"]) {
    if (language === "en") await page.locator("#language").click();
    assert.match(await page.locator("#leaders").innerText(),/无法判别|Unavailable/);
    assert.equal(await page.locator("#fits tr").count(),3);
    assert.equal(await page.locator("#votes meter").count(),0);
    assert.ok(await page.locator("#residual").isVisible());
    const result = await exportReport();
    assert.ok(result.warnings.includes("unresolvedShape"));
    assert.ok(!result.warnings.includes("tie") && !result.warnings.includes("disagree"));
    assert.equal(result.distanceToNearest,null);
    assert.deepEqual(result.neighbors,[]);
    assert.deepEqual(result.knnLeaders,[]);
    assert.equal(result.observationWindow.shapeChanged,null);
  }
  await page.locator("#window-end").evaluate(slider => {
    slider.value = "20";
    slider.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await page.waitForFunction(() => !document.getElementById("export").disabled);
  const prefix = await exportReport();
  assert.equal(prefix.observationWindow.included,20);
  assert.equal(prefix.observationWindow.fullKnnLead,null);
  assert.equal(prefix.observationWindow.shapeChanged,null);
  assert.equal(prefix.neighbors.reduce((sum,row)=>sum+row.votes,0),21);
  await page.locator("#window-full").click();
  assert.equal(await page.locator("#votes meter").count(),0);
  assert.deepEqual(errors,[]);
  console.log("Offline browser regressions passed.");
} finally {
  await browser.close();
}

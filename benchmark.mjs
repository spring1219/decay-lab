import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("index.html", import.meta.url), "utf8");
const text = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(text);
const stop = text.indexOf("/* UI START */");
assert.ok(stop > 0);
const core = vm.runInNewContext(text.slice(0, stop) +
  "\n({analyze, classify, features, normalized, fitWarningKeys, compareWindow, diagnose, generate, gaussian, makeTraining, observedSample, parseCsv, randomGenerator, sample, validateTraining})");

function stressedCurve(count, kind, rng, scenario) {
  const rate = 0.85 + 2.9 * rng();
  const fast = 3.5 + 11 * rng();
  const mix = 0.27 + 0.47 * rng();
  const beta = 0.42 + 0.43 * rng();
  const noise = 0.008 + 0.067 * rng();
  const correlated = scenario === "correlated";
  const rho = 0.8;
  let previous = correlated ? core.gaussian(rng) : 0;
  return Array.from({length:count}, (_, i) => {
    const grid = i / (count - 1);
    const x = !correlated && i > 0 && i < count - 1
      ? ((i + 0.65 * (rng() - 0.5)) / (count - 1)) ** 1.85
      : grid;
    const primary = Math.exp(-rate * x);
    const signal = kind === 0 ? primary : kind === 1
      ? (1 - mix) * primary + mix * Math.exp(-fast * x)
      : Math.exp(-((rate * x) ** beta));
    const innovation = core.gaussian(rng);
    previous = correlated ? rho * previous + Math.sqrt(1 - rho ** 2) * innovation : innovation;
    return [x, signal + noise * previous];
  });
}

const training = core.makeTraining();
const calibrationSeed = 417721;
const calibrated = core.validateTraining(training, calibrationSeed);
const definitions = [
  {id:"reference", seed:964239, perModel:120, samples:47},
  {id:"irregular", seed:164729, perModel:80, samples:27},
  {id:"correlated", seed:708731, perModel:80, samples:47}
];

const populations = definitions.map(definition => {
  const trials = [];
  const rng = core.randomGenerator(definition.seed);
  const count = { ...definition, total:0, aiccCorrect:0, knnCorrect:0, clearCount:0, clearCorrect:0 };
  for (let kind = 0; kind < 3; kind += 1) {
    for (let i = 0; i < definition.perModel; i += 1) {
      const rows = definition.id === "reference" ? core.generate(definition.samples, kind, rng)
        : stressedCurve(definition.samples, kind, rng, definition.id);
      const trial = prediction(rows, kind, training, calibrated.threshold);
      trials.push(trial);
      const aiccRight = trial.aicc === kind;
      count.total += 1;
      count.aiccCorrect += aiccRight;
      count.knnCorrect += trial.knn === kind;
      count.clearCount += trial.clear;
      count.clearCorrect += trial.clear && aiccRight;
    }
  }
  return { id: definition.id, count, trials };
});
const suite = populations.map(({count}) => count);

assert.equal(suite.reduce((sum, row) => sum + row.total, 0), 840);
const observed = core.observedSample();
assert.equal(observed.length, 14);
assert.deepEqual(Array.from(observed[0]), [77.6,-10.07]);
assert.deepEqual(Array.from(observed.at(-1)), [760,-81.78]);
const observedFit = core.analyze(observed, training);
assert.ok(Number.isFinite(observedFit.fits[0].sse));
assert.equal(core.parseCsv('x,signal\n' + observed.map(row => row.join(",")).join("\n")).length,14);
assert.throws(() => core.parseCsv("x,signal\n2,3"), /csvCount/);

function prediction(rows, kind, training, threshold) {
  const result = core.analyze(rows, training);
  const diagnostic = core.diagnose(result, threshold);
  return {
    kind, result, delta: diagnostic.delta,
    aicc: result.fits[0].kind, knn: result.guess.top,
    fitPass: diagnostic.warnings.every(key => !core.fitWarningKeys.includes(key)),
    clear: diagnostic.warnings.length === 0
  };
}

function matchedCoverage(id, trials) {
  const combined = trials.filter(trial => trial.clear);
  const baseline = [...trials].sort((a, b) => b.delta - a.delta).slice(0, combined.length);
  const fitOnly = [...trials].filter(trial => trial.fitPass).sort((a, b) => b.delta - a.delta).slice(0, combined.length);
  assert.equal(fitOnly.length, combined.length);
  function score(accepted) {
    return {
      errors: accepted.filter(trial => trial.aicc !== trial.kind).length,
      doubleAsSingle: accepted.filter(trial => trial.kind === 1 && trial.aicc === 0).length,
      doubleAccepted: accepted.filter(trial => trial.kind === 1).length
    };
  }
  return { id, total: trials.length, accepted: combined.length,
    aiccOnly: score(baseline), fitOnly:score(fitOnly), combined: score(combined) };
}

const pairedSeed = 713043;
const pairedPerModel = 80;
const pairedSamples = 24;
const shortFraction = 0.25;
const studyRng = core.randomGenerator(pairedSeed);
const fullTrials = [], shortTrials = [];
for (let kind = 0; kind < 3; kind += 1) {
  for (let i = 0; i < pairedPerModel; i += 1) {
    const config = {
      rate: 0.85 + 2.9 * studyRng(), fast: 3.5 + 11 * studyRng(),
      mix: 0.27 + 0.47 * studyRng(), beta: 0.42 + 0.43 * studyRng(),
      noise: 0.008 + 0.067 * studyRng(), scale: 0.35 + 2.4 * studyRng(),
      base: -0.15 + 0.45 * studyRng(), duration: 1
    };
    const seed = Math.floor(studyRng() * 2147483646) + 1;
    const make = fraction => core.generate(pairedSamples, kind, core.randomGenerator(seed), {
      ...config, rate: config.rate * fraction, fast: config.fast * fraction, duration: fraction
    });
    fullTrials.push(prediction(make(1), kind, training, calibrated.threshold));
    shortTrials.push(prediction(make(shortFraction), kind, training, calibrated.threshold));
  }
}
const rankChanges = shortTrials.map((short, index) => core.compareWindow(short.result, fullTrials[index].result));
const affectedByWindow = (change) => change.fitChanged || change.shapeChanged;
const hiddenShortMistakes = shortTrials.filter(trial => trial.clear && trial.aicc !== trial.kind);
const flaggedByComparison = rankChanges.filter((change, index) =>
  affectedByWindow(change) && shortTrials[index].clear && shortTrials[index].aicc !== shortTrials[index].kind).length;
const shortCorrect = shortTrials.filter(trial => trial.clear && trial.aicc === trial.kind).length;
const flaggedCorrect = rankChanges.filter((change,index) =>
  affectedByWindow(change) && shortTrials[index].clear && shortTrials[index].aicc === shortTrials[index].kind).length;
const matched = populations.map(({ id, trials }) => matchedCoverage(id, trials));
matched.push(matchedCoverage("pairedFull", fullTrials), matchedCoverage("pairedShort", shortTrials));
const demo = [16, 64].map(n => prediction(core.sample(1).slice(0,n), 1, training, calibrated.threshold));
assert.deepEqual(demo.map(({aicc,knn}) => [aicc,knn]), [[0,0],[1,1]]);
for (const index of [0,1,2]) {
  const {fits} = core.analyze(core.sample(index,0),training);
  assert.equal(fits[0].kind,index);
  assert.ok(fits[0].sse < 1e-18);
}
const tieRows = core.normalized(core.sample(0,0)).data;
const identicalShape = core.features(tieRows);
const tiedTraining = Array.from({length:21},(_,i)=>({kind:i < 10 ? 0 : i < 20 ? 1 : 2,vector:identicalShape}));
const tied = core.classify(tieRows,tiedTraining);
assert.equal(tied.top,null);
assert.deepEqual(Array.from(tied.leaders),[0,1]);
const noiselessDouble = core.analyze(core.sample(1,0),training).fits[0];
assert.ok(Math.abs(noiselessDouble.rate - 2.33) < 1e-6);
assert.ok(Math.abs(noiselessDouble.fast - 6.8) < 1e-6);
const slow = core.generate(64,0,core.randomGenerator(2),{rate:0.001,noise:0,scale:1,base:0,duration:1});
assert.ok(core.diagnose(core.analyze(slow,training),calibrated.threshold).warnings.includes("boundary"));
assert.deepEqual(core.sample(1,0.09), core.sample(3));
assert.equal(fullTrials.length, 240);
const report = {
  trainingCurves:training.length,
  calibrationSeed,
  distanceLimit:calibrated.threshold,
  rows:suite,
  matched,
  pairedWindow:{seed:pairedSeed, perModel:pairedPerModel, samples:pairedSamples, shortFraction,
    fitFlips:rankChanges.filter(change => change.fitChanged).length,
    shapeFlips:rankChanges.filter(change => change.shapeChanged).length,
    shortMistakesWithoutWarnings:hiddenShortMistakes.length, flaggedByComparison, shortCorrect, flaggedCorrect},
  observed:{reference:"single", aiccLead:["single","double","stretched"][observedFit.fits[0].kind],
    knnLead:["single","double","stretched"][observedFit.guess.top] ?? null, points:observed.length,
    deltaAicc:observedFit.fits[1].aicc-observedFit.fits[0].aicc,
    warnings:core.diagnose(observedFit, calibrated.threshold).warnings}
};

if (process.argv.includes("--check")) {
  const embedded = html.match(/^const benchmark = (\{[\s\S]*?^\});/m)?.[1];
  assert.ok(embedded,"Missing inline benchmark");
  const saved = readFileSync(new URL("benchmark-results.json",import.meta.url),"utf8");
  const bundled = JSON.parse(saved);
  assert.deepEqual(JSON.parse(embedded),bundled);
  const recomputed = JSON.parse(JSON.stringify(report));
  assert.ok(Math.abs(bundled.distanceLimit - recomputed.distanceLimit) < 1e-10);
  assert.ok(Math.abs(bundled.observed.deltaAicc - recomputed.observed.deltaAicc) < 1e-7);
  bundled.distanceLimit = recomputed.distanceLimit;
  bundled.observed.deltaAicc = recomputed.observed.deltaAicc;
  assert.deepEqual(bundled,recomputed);
  console.log("Recomputed benchmark matches HTML and JSON.");
} else {
  console.log(JSON.stringify(report,null,2));
}

# Decay Lab

How much can one decay curve tell you? Decay Lab compares single, double and stretched exponential models, then lets you inspect how the rankings change when you cut the observation window short.

## Start with the sampling challenge

Open `index.html` in a browser. The first screen shows only 16 simulated observations. Inspect the curve, model ranking and neighbor votes. Choose a model (or *undecided*) and decide whether to stop sampling. Record the evidence that guided you if you wish. The next screen adds 48 observations and asks for a second decision before revealing the generating model. Downloading the two decisions is optional. Answers stay in memory until you leave the activity or refresh the page.

To use the original CSV and simulation workspace directly, open `index.html#lab` or choose **Open the full lab**. For a first-time participant, use the default entry and save this walkthrough and the video for afterwards.

## Run a small classroom trial

Invite students who have studied exponential decay and have not seen this particular example. Have each person open a fresh copy individually. Ask *“What would you report and what would you do next?”* Let them choose without coaching. Both stages proceed even if they select *stop*. After the second decision, invite them to share their downloaded JSON voluntarily. It records their two decisions and optional explanations, with no name field. Ask them to omit identifying information and obtain permission before quoting an explanation.

Count actual first attempts separately from practice runs. Report the number invited, the number of paired records returned, and how many changed their model choice or sampling decision. Include unchanged and undecided answers. This fixed case can illustrate reasoning on one example. Measuring transfer or learning gains would require additional cases or a comparison group.

## Explore the full lab

1. Choose **Open the full lab**. The default example is a simulated double exponential. With all 64 points, both methods favor the double exponential.
2. Click **Try early window**. With the first 16 points, both methods favor the single exponential. The app flags the change against the full-window reference and shades the unused points. The dashed extension projects the early fit into the held-out region. The residual chart shares the same predictor axis.
3. Click **Use full window**. Increase **Simulated noise** to 2.5% to see AICc favor the single exponential and the shape check favor the double exponential. The underlying curve and random draws stay fixed as noise changes.
4. Import your own CSV or choose another example. The English interface includes a Chinese toggle.

The page runs offline with no installation or API key. CSV input needs 12–2,000 unique numeric predictor values and corresponding signals. Its optional header can be `time,signal` or `x,signal`. **Download selected data** writes the fitted window as CSV. **Export analysis** writes ranks, warnings, fitted parameters and the window comparison as JSON. The JSON export preserves the fitted parameter precision. When absolute chart ticks would display the same number, the axis shows differences from a labeled reference value. The noise control applies to simulations only. For extreme numerical scales, the app reports when predictor values lose precision or fitted quantities cannot be represented. Adjust the observation span or rescale the units before importing again.

## Methods and validation

The app ranks least-squares fits by AICc and shows residuals. The shape check compares 20 normalized samples against 1,500 simulated training curves and tallies the 21 nearest neighbors. Its votes are frequencies. If the 20 resampled points miss a localized signal, the app keeps the AICc fits and residuals, flags the unavailable shape check and exports empty vote and leader lists. A null shape-change flag means at least one window has no shape result to compare. Fit warnings cover weak trends, near ties, search bounds and near-degenerate double exponentials. The normalized-rate bounds are 0.08 to 70 and the stretch-exponent bounds are 0.35 to 0.95. The shape check reports vote ties, low vote share, disagreement and unusually distant matches. The window warning compares the selected prefix with the complete available dataset.

| Simulated condition | Decisions / trials | AICc-gap errors | Fit-only errors | Fit + kNN errors |
| --- | ---: | ---: | ---: | ---: |
| Regular sampling, independent noise | 139 / 360 | 33 / 139 | 30 / 139 | 16 / 139 |
| Sparse, irregular sampling | 118 / 240 | 26 / 118 | 31 / 118 | 20 / 118 |
| Regular sampling, correlated noise | 77 / 240 | 29 / 77 | 26 / 77 | 11 / 77 |
| Paired simulation, full span | 100 / 240 | 27 / 100 | 29 / 100 | 20 / 100 |
| Paired simulation, first quarter | 112 / 240 | 54 / 112 | 63 / 112 | 65 / 112 |

Each row uses identical test curves and gives all three policies the same decision count. The AICc-gap baseline chooses the largest gaps between the top two fits within the test condition. Fit-only applies the fit warnings before matching coverage. Fit + kNN additionally applies the shape warnings. The JSON output also records how often each policy accepted a double exponential as a single exponential, with the number of accepted true doubles as denominator. The matched AICc thresholds apply to this controlled test comparison.

The final two rows form **240 matched pairs** with 24 samples per window. Curve parameters and simulated noise draws are matched. The observation spans differ, while the number of samples is held fixed. The AICc lead changed for 59 pairs and the kNN lead changed for 107. Comparing short and long windows flagged 55 of 65 wrong short-window decisions and 2 of 47 correct ones that had passed the base warnings. This check uses longer observations already available to the app.

Run `node benchmark.mjs` to recompute the 1,320 fit evaluations and fixed-seed results. Run `node benchmark.mjs --check` to compare the recomputed results with both the embedded HTML data and the saved JSON. The script uses Node.js built-ins and reads the numerical routines directly from `index.html`. For the optional offline browser regressions, use a development environment with Playwright and Chromium installed and run `node browser-check.mjs`. Set `CHROMIUM_PATH` to use an existing Chromium executable.

## Measured example and limits

[NIST Misra1a](https://www.itl.nist.gov/div898/strd/nls/data/misra1a.shtml) contains 14 measurements of adsorption volume against pressure. The app plots negative measured volume to represent the increasing saturation as a declining curve. The AICc fit and shape check disagree on this example. NIST's reference model is a constrained single exponential, while Decay Lab's candidates allow a free baseline.

The simulation results do not establish accuracy on real decay experiments. AICc assumes approximately independent errors of similar variance. Agreement between methods can persist even when the data miss a physical scale.

## Development disclosure

ChatGPT Codex assisted with the interface, data simulator, fitting and classification implementation, and validation.

## Review materials

[Captioned walkthrough](media/decay-lab-v3.2-demo.webm) · [Challenge screenshot](media/sampling-challenge.jpg) · [Competition description](submission-notes.md)

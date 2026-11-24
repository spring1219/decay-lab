# Decay Lab · Devpost copy draft

## Tagline

See how the observation window changes what a decay curve can tell you.

## What it does

Decay Lab compares single, double and stretched exponential models in your browser. Choose a sample or import a two-column CSV. Move the observation endpoint and watch the fits, residuals and model rankings change. The default simulation uses the same double-exponential curve throughout. Its first 16 points favor a single exponential by both methods while all 64 favor a double exponential. The app highlights the new evidence that changes the ranking.

## How it works

The standalone HTML app pairs least-squares fitting and AICc with a k-nearest-neighbor shape check. The classifier uses 21 neighbors from 1,500 simulated training examples. All data processing happens locally. The analysis export records the selected window, warning reasons and the full-window reference. ChatGPT Codex assisted with development and validation.

## What we learned

At matched coverage on the regular independent-noise simulation, the fit-only approach made 30 errors and the combined fit and shape checks made 16 among 137 decisions. On the paired short-window simulation the same screening increased errors from 63 to 65 among 112 decisions. Comparing short and available full windows flagged 55 of 65 short-window mistakes that had passed the base warnings. It also flagged 2 of the 47 correct decisions. These are simulation results. The NIST adsorption example provides a separate walkthrough on measured data.

## Demo outline

1. Open the default example and show the two double-exponential leads.
2. Shorten the selected window to 16 points. Show the faded observations and two single-exponential leads.
3. Restore all 64 points. Adjust simulated noise with the underlying curve and random draws fixed.
4. Open validation and point out the short-window failure case, then show where users import CSV and export results.

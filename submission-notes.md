# Decay Lab · Devpost draft

## Tagline

All 21 neighbors favor one exponential. Would you stop collecting data?

## Problem and audience

In a physics or chemistry lab, students must decide whether they have observed a process for long enough. A short trace can look convincingly single-exponential even when a slower component emerges later.

## What the judge can try

Open the app before watching the walkthrough. Only the first 16 measurements are supplied to the analysis. Commit to a model and a sampling decision, then examine 48 additional measurements. Commit again before the simulator reveals the generating model. The full lab also accepts CSV data, plots residuals and compares observation windows. A measured NIST adsorption example lets users inspect disagreement when the physical truth is not supplied by a simulator.

## How AI contributes

A k-nearest-neighbor shape classifier compares 20 normalized samples to 1,500 simulated curves and tallies the closest 21. Alongside it, least-squares fitting ranks three candidate models using AICc. The two analyses use the same measurements. On the initial challenge trace, the single exponential receives all 21 votes, while its AICc advantage over the runner-up is only 2.74. Neither method sees the remaining observations until the second stage.

## Evidence and limits

In a fixed-seed independent-noise benchmark at matched decision counts, fit-only screening made 30 errors in 139 accepted decisions and combined screening made 16. On paired short-window simulations the counts were 63 and 65 errors in 112 accepted decisions. These numbers describe simulations. The classroom activity records voluntary, paired learner decisions locally. Classroom outcomes have yet to be measured.

The app works offline in one HTML file. Codex assisted with development, interface design and testing.

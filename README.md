# Decay Lab

Decay Lab compares single-, double-, and stretched-exponential models for a time-series decay experiment. A least-squares fit and AICc ranking are shown beside a separate k-nearest-neighbor shape check.

## Run it

1. Open index.html in a current browser. No build tools, server, account, or API key is needed.
2. Start with a synthetic example. Use **Import CSV** (导入 CSV) for your own data.
3. Provide 12–2,000 unique timestamps and a numeric signal as two columns. A header such as time,signal is optional.
4. Use **Download analysis** (下载分析结果) to save the JSON output.

The interface uses Chinese labels. The contest submission includes an English-captioned demo.

## Methods and limits

The classifier compares normalized decay shapes against 1,500 simulated training curves and takes a vote among the 21 nearest examples. It matched 284 of 360 labels (78.9%) in a separate synthetic validation set. Both sets use the same simulator family. The neighbor vote is not a calibrated probability, and real laboratory performance remains unmeasured.

ChatGPT Codex generated the initial interface, synthetic data generator, fitting and classification implementation, and validation checks.

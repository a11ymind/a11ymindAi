# Accessly GitHub Action v1

Accessly Action v1 is a lightweight JavaScript GitHub Action for scanning a preview or live URL in CI before deployment.

It complements the main Accessly app:

- Accessly app: post-deploy monitoring, saved sites, alerts, dashboards, reports
- Accessly Action v1: pre-deploy CI scan helper for preview URLs

## What v1 does

- scans one preview or live URL
- runs automated axe-based accessibility checks
- computes an Accessly score
- writes optional JSON and Markdown reports into the workspace
- adds a GitHub Actions job summary
- can fail the workflow step when risks at or above a configured severity are found

## Current v1 scope

This action is intentionally small and developer-facing. It is meant to help engineering teams catch accessibility risks during CI for a single deployed URL.

## Runner expectation

- v1 is best suited to GitHub-hosted Linux runners such as `ubuntu-latest`
- it expects Chrome to be available on the runner
- it does not use the Vercel serverless Chromium path from the main Accessly app

## Non-goals for v1

- no PR comments
- no AI fixes
- no crawling
- no monetization or API key model yet

## Inputs

### `url`

Required preview or live URL to scan.

### `fail-on`

Optional severity threshold that fails the step when matched.

Allowed values:

- `none`
- `minor`
- `moderate`
- `serious`
- `critical`

Default: `serious`

### `output-json`

Optional. Write a machine-readable JSON report file into the workspace.

Default: `true`

### `output-markdown`

Optional. Write a human-readable Markdown summary file into the workspace.

Default: `true`

### `output-dir`

Optional directory where generated files are written.

Default: `.accessly-action`

## Outputs

- `score`: Accessly score from `0` to `100`
- `total-risks`: total detected accessibility risks
- `critical-count`: count of critical risks
- `serious-count`: count of serious risks
- `moderate-count`: count of moderate risks
- `minor-count`: count of minor risks
- `json-path`: path to `accessly-report.json`, or empty when disabled
- `markdown-path`: path to `accessly-summary.md`, or empty when disabled
- `threshold-exceeded`: `true` or `false`

## Fail-on behavior

- `none`: never fail the step because of findings
- `minor`: fail on any detected risk
- `moderate`: fail on moderate, serious, or critical risks
- `serious`: fail on serious or critical risks
- `critical`: fail only on critical risks

The step still writes reports and a job summary before failing on the configured threshold.

## Generated report files

By default the action writes:

- `.accessly-action/accessly-report.json`
- `.accessly-action/accessly-summary.md`

If you change `output-dir`, the filenames remain the same and only the directory changes.

## Example workflow

For local testing inside this repository, use `uses: ./`.

For another repository, use `uses: <owner>/<repo>@v1`.

```yaml
- name: Checkout
  uses: actions/checkout@v6

- name: Accessly scan
  id: accessly
  uses: <owner>/<repo>@v1
  with:
    url: https://preview.example.com
    fail-on: serious
    output-json: true
    output-markdown: true

- name: Upload Accessly artifacts
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: accessly-report
    path: |
      ${{ steps.accessly.outputs.json-path }}
      ${{ steps.accessly.outputs.markdown-path }}
```

## Maintainer smoke test

This repository includes a dedicated smoke workflow at
`.github/workflows/action-smoke.yml`.

It validates the action end to end by:

- checking out the repository
- running the action with `uses: ./`
- scanning `https://www.example.com`
- asserting that `json-path`, `markdown-path`, and summary outputs are set
- checking that both report files exist
- uploading the generated JSON and Markdown files as artifacts

The smoke workflow uses `fail-on: none` so it validates action behavior without
turning expected findings on a public test page into a flaky pipeline failure.

## Limitations

- scans one URL only
- no authenticated/session-aware scanning flow yet
- no crawling across multiple pages
- no PR comment integration yet
- no AI remediation output yet
- currently best suited to GitHub-hosted Linux runners with Chrome available

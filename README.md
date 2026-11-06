# qaily-playwright-ts-framework

A small Playwright + TypeScript test framework that reports to
[Qaily](https://github.com/qaily/qaily-playwright-html-reporter): run history, weekly and monthly dashboards, failures
grouped by cause, a coverage heat map, and screenshots and traces stored in S3.

**[Report on GitHub Pages](https://qaily.github.io/qaily-playwright-ts-framework/)**, rebuilt after every run on `main`.

The tests run against **Taskboard**, a tiny to-do app in [`demo-app/`](demo-app/), so the project needs no outside
services.

## Layout

```
demo-app/              the app under test (one HTML file), served on http://127.0.0.1:3100
pages/                 page objects; pages/step.ts labels each step for the heat map
fixtures/test.ts       test fixtures: page objects and a signed-in user
tests/                 the specs
coverage/matrix.csv    the planned coverage matrix, shown as gaps on the heat map
scripts/               demo app server, report settings
.github/workflows/     tests → S3 → report on GitHub Pages
```

## Run locally

```bash
npm ci
npx playwright install chromium
npm test                # runs the tests; each run goes to reports/data/<run id>/
npm run report          # builds the Qaily report data into report-data/
npm run report:serve    # → http://127.0.0.1:4173
```

Run `npm test` a few times before `npm run report` to see history. `npm run app` opens the demo app on its own.

## Writing tests

Tests use the fixtures in [`fixtures/test.ts`](fixtures/test.ts) and page objects in [`pages/`](pages/):

```ts
import { test } from '../fixtures/test';

test.describe('Task lifecycle', () => {
  test('completes a task', { tag: ['@regression'] }, async ({ signedIn: tasks }) => {
    await tasks.add('Review pull request');
    await tasks.complete('Review pull request');
    await tasks.expectCounter('0 tasks left');
  });
});
```

Page object methods wrap their actions in `step(feature, area, title, body)` from [`pages/step.ts`](pages/step.ts). It
labels the step for the heat map: Component is `Taskboard`, Scenario is the test's `describe` title, and Feature and
Area come from the call. Add a row to [`coverage/matrix.csv`](coverage/matrix.csv) for each area you plan to cover;
rows no test reaches show as gaps.

Every test records a screenshot and a trace, so the report always has something to show.
`Activity › loads activity from a slow backend` is **flaky on purpose** (it waits 2 s for a load that takes up to
2.6 s), so the report also has flaky and failed results to show.

## How the report is published

[`.github/workflows/tests.yml`](.github/workflows/tests.yml) runs on every push to `main`, on weekdays at 06:00 UTC and
on demand:

1. **test:** runs the tests and uploads the run folder to S3, with a `.sync-complete` marker last.
2. **report:** downloads every run from the bucket (without attachments), builds the report data and deploys it to
   GitHub Pages with the report app.

Without S3 settings both jobs still work: the report then shows only the latest run, and its screenshots and traces
are published with the site.

## Connect S3

The bucket is configured in GitHub, not in the code. Anything in the repository variables ends up in the public site's
`data/settings.json`; the keys stay in secrets.

1. **Repository variables** (Settings → Secrets and variables → Actions → Variables):

   | Variable | Example | |
   |---|---|---|
   | `S3_BUCKET` | `my-test-reports` | Required |
   | `S3_REGION` | `eu-north-1`, or `auto` for Google Cloud Storage | Default `eu-north-1` |
   | `S3_PREFIX` | `qaily-playwright-ts-framework/jsonl-report` | The default |
   | `S3_ENDPOINT` | `https://storage.googleapis.com` | Only for S3-compatible storage |

2. **Repository secrets:** `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`, for a key that can list, read and write
   under the prefix (AWS: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`; Google Cloud Storage: an HMAC key of a
   service account). Use a key for this project only.

3. **Bucket CORS**, so the report and the Playwright trace viewer can read objects from the browser. Allow `GET` and
   `HEAD` from `https://qaily.github.io` and `https://trace.playwright.dev`, with the `Range` header. The JSON for AWS
   and Google Cloud Storage is in
   [s3-artifacts.md](https://github.com/qaily/qaily-playwright-html-reporter/blob/main/docs/s3-artifacts.md#2-bucket-settings).

4. Run the workflow (Actions → Tests and report → Run workflow).

### Viewing screenshots and traces

The dashboards are public, but attachments stay in the private bucket. To see them, open the report, go to
**Settings → Tokens → AWS credentials** and paste a **read-only** key (`s3:GetObject` on the prefix), for example:

```bash
aws configure export-credentials --profile <read-only profile> --format process
```

The report signs short-lived links in your browser; the key is kept in that tab only unless you choose otherwise.

## License

MIT

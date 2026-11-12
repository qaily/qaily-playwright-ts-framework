# qaily-playwright-ts-framework

A small Playwright + TypeScript test framework that reports to
[Qaily](https://github.com/qaily/qaily-playwright-html-reporter): run history, weekly and monthly dashboards, failures
grouped by cause, a coverage heat map, and screenshots and traces stored in S3.

The report is published in two ways, so they can be compared on the same runs:

| Report | Approach | What needs a key |
|---|---|---|
| **[Website](https://qaily.github.io/qaily-playwright-ts-framework/)** | Dashboard data is deployed with the site after every run; screenshots and traces come from S3 | Screenshots and traces |
| **[Bucket](https://qaily.github.io/qaily-playwright-ts-framework/bucket/)** | The site holds only the report app; all data comes from S3, so new runs show without redeploying | Everything |

The report's header says which one you are looking at (*Website data · S3 files* or *Bucket data*); hover it for
details. The Bucket report exists once S3 is connected (see [Connect S3](#connect-s3)).

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
on demand. Its steps are marked **[BOTH]**, **[WEBSITE]** or **[BUCKET]**, by the approach they serve.

1. **test:** runs the tests and uploads the run folder to S3, with a `.sync-complete` marker last. [BOTH]
2. **report:**
   - pulls the report data published last time, so only changed months are rebuilt [BUCKET];
   - downloads every run from the bucket (without attachments) and builds the report data [BOTH];
   - publishes the report data to S3, `catalog.json` last [BUCKET];
   - deploys GitHub Pages: the Website report at the root with all its data, and the Bucket report under `/bucket/`
     with only the app and `data/settings.json` [BOTH].

**Update without redeploying:** Actions → Tests and report → Run workflow, untick **Deploy the site**. The tests run
and the data is published to S3, but GitHub Pages isn't touched: the Bucket report shows the new run, the Website
report keeps its old data. Scheduled runs and pushes always deploy.

Without S3 settings both jobs still work, and only the Website report is built: it shows the latest run, with its
screenshots and traces published on the site.

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
   | `S3_DATA_PREFIX` | `qaily-playwright-ts-framework/qaily-data` | The default; where the Bucket report's data goes. Must be outside `S3_PREFIX` |

2. **Repository secrets:** `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`, for a key that can list, read and write
   under both prefixes (AWS: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`; Google Cloud Storage: an HMAC key of a
   service account). Use a key for this project only.

3. **Bucket CORS**, so the report and the Playwright trace viewer can read objects from the browser. Allow `GET` and
   `HEAD` from `https://qaily.github.io` and `https://trace.playwright.dev`, with the `Range` header. The JSON for AWS
   and Google Cloud Storage is in
   [s3-artifacts.md](https://github.com/qaily/qaily-playwright-html-reporter/blob/main/docs/s3-artifacts.md#2-bucket-settings).

4. Run the workflow (Actions → Tests and report → Run workflow).

### Viewing screenshots and traces

On the Website report the dashboards are public, but attachments stay in the private bucket. The Bucket report shows
nothing until you connect. In either, go to **Settings → Tokens → AWS credentials** and paste a **read-only** key
(`s3:GetObject` on both prefixes), for example:

```bash
aws configure export-credentials --profile <read-only profile> --format process
```

The report signs short-lived links in your browser; the key is kept in that tab only unless you choose otherwise.

### Team settings and other datasets (Bucket report)

The Bucket report also takes its team settings (lanes, thresholds, heat map rules) from the bucket: `team-settings.json`
in the data folder. The workflow's `publish` step creates it from `scripts/report-settings.mjs` the first time and then
leaves it alone. To change it, open Settings → **For the team** and press **Save for team**. That needs a key that can
write to the data folder, and `PUT` in the bucket's CORS rules
([details](https://github.com/qaily/qaily-playwright-html-reporter/blob/main/docs/s3-artifacts.md#team-settings-in-the-bucket)).

To look at another dataset without touching the site, change the location under Settings → **For me**, then reload:
**Report data key prefix** and **S3 key prefix** for another folder in the same bucket, or also **S3 bucket**, **S3 region**,
**S3 endpoint** (empty for AWS) and **Bucket in the URL path** for another bucket. Another bucket needs your credentials for it
and CORS rules for this site. The header shows where you are looking, and **Reset** takes you back. This only changes your
own browser ([details](https://github.com/qaily/qaily-playwright-html-reporter/blob/main/docs/s3-artifacts.md#looking-at-another-bucket-or-data-folder)).

## License

MIT

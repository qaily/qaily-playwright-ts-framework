// Writes <out>/settings.json, the Qaily report's team settings, from environment variables, so the bucket is
// configured in GitHub (repository variables) and never committed. Without S3_BUCKET the report has no bucket:
// attachments are then published with the site.
//
//   S3_BUCKET    bucket name
//   S3_REGION    bucket region; "auto" for Google Cloud Storage (default: eu-north-1)
//   S3_PREFIX    key prefix of the run folders (default: qaily-playwright-ts-framework/jsonl-report)
//   S3_ENDPOINT  only for S3-compatible storage, e.g. https://storage.googleapis.com
//
// Usage: node scripts/report-settings.mjs <out dir>

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'report-data';
const env = (name, fallback = '') => (process.env[name] ?? '').trim() || fallback;

const settings = {
  // Runs are grouped by branch: main, and everything else (manual runs from other branches).
  lanes: [
    { id: 'main', label: 'Main branch', match: { branch: '^main$' } },
    { id: 'branches', label: 'Other branches', match: {} },
  ],
};

const bucket = env('S3_BUCKET');
if (bucket) {
  settings.connections = {
    s3: {
      bucket,
      region: env('S3_REGION', 'eu-north-1'),
      prefix: env('S3_PREFIX', 'qaily-playwright-ts-framework/jsonl-report'),
      endpoint: env('S3_ENDPOINT'),
    },
  };
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'settings.json'), JSON.stringify(settings, null, 2) + '\n');
console.log(`Wrote ${join(out, 'settings.json')} (${bucket ? `bucket ${bucket}` : 'no bucket: attachments go with the site'})`);

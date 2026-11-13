// Writes <out>/settings.json, the Qaily report's team settings, from environment variables, so the bucket is
// configured in GitHub (repository variables) and never committed. Without S3_BUCKET the report has no bucket:
// attachments are then published with the site.
//
//   S3_BUCKET       bucket name
//   S3_REGION       bucket region; "auto" for Google Cloud Storage (default: eu-north-1)
//   S3_PREFIX       key prefix of the run folders (default: qaily-playwright-ts-framework/jsonl-report)
//   S3_ENDPOINT     only for S3-compatible storage, e.g. https://storage.googleapis.com
//   S3_DATA_PREFIX  key prefix of the published report data, for the Bucket data source
//                   (default: qaily-playwright-ts-framework/qaily-data)
//
// Usage: node scripts/report-settings.mjs <out dir> [website|bucket]
//   website (default): dashboard data is published with the site; attachments come from S3.
//   bucket:            the report reads everything from S3; the site holds only the app and this file.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'report-data';
const dataSource = process.argv[3] ?? 'website';
if (dataSource !== 'website' && dataSource !== 'bucket') throw new Error(`Unknown data source "${dataSource}": use website or bucket`);
const env = (name, fallback = '') => (process.env[name] ?? '').trim() || fallback;

const settings = {
  // Runs are grouped by branch: main, and everything else (manual runs from other branches).
  lanes: [
    { id: 'main', label: 'Main branch', match: { branch: '^main$' } },
    { id: 'branches', label: 'Other branches', match: {} },
  ],
  // The trace viewer CI copies next to the report (qaily-report trace-viewer); traces open there without CORS.
  connections: { traceViewer: 'trace/' },
};

const bucket = env('S3_BUCKET');
if (bucket) {
  settings.connections = {
    ...settings.connections,
    s3: {
      bucket,
      region: env('S3_REGION', 'eu-north-1'),
      prefix: env('S3_PREFIX', 'qaily-playwright-ts-framework/jsonl-report'),
      endpoint: env('S3_ENDPOINT'),
      dataSource,
      dataPrefix: env('S3_DATA_PREFIX', 'qaily-playwright-ts-framework/qaily-data'),
    },
  };
} else if (dataSource === 'bucket') {
  throw new Error('The bucket data source needs S3_BUCKET');
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'settings.json'), JSON.stringify(settings, null, 2) + '\n');
console.log(`Wrote ${join(out, 'settings.json')} (${bucket ? `bucket ${bucket}, ${dataSource} data source` : 'no bucket: attachments go with the site'})`);

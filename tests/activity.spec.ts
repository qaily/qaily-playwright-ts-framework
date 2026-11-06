import { test, WORKSPACE_CODE } from '../fixtures/test';

test.describe('Activity', () => {
  test('lists recent changes', { tag: ['@regression'] }, async ({ signedIn: tasks, activityPage }) => {
    await tasks.add('Water the plants');
    await tasks.complete('Water the plants');
    await activityPage.load();
    await activityPage.expectEntry('Completed "Water the plants"');
  });

  // Flaky on purpose, so the report has something to show: with ?latency=random the activity takes 0.2–2.6 s
  // to load, but this test waits only 2 s. About one attempt in four fails: the retry then usually passes (flaky),
  // and about one run in sixteen it fails twice.
  test(
    'loads activity from a slow backend',
    { tag: ['@regression'], annotation: { type: 'note', description: 'Intentionally flaky demo test' } },
    async ({ signInPage, activityPage }) => {
      await signInPage.open('?latency=random');
      await signInPage.signIn('Alex', WORKSPACE_CODE);
      await activityPage.load(2_000);
      await activityPage.expectEntry('Alex signed in');
    },
  );
});

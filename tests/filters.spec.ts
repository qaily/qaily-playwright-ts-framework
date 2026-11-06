import { test } from '../fixtures/test';

test.describe('Filters', () => {
  test.beforeEach(async ({ signedIn: tasks }) => {
    await tasks.add('Draft agenda', 'Send invites', 'Order snacks');
    await tasks.complete('Send invites');
  });

  test('shows only active tasks', { tag: ['@regression'] }, async ({ tasksPage: tasks }) => {
    await tasks.filter('Active');
    await tasks.expectTasks(['Draft agenda', 'Order snacks']);
  });

  test('shows only done tasks', { tag: ['@regression'] }, async ({ tasksPage: tasks }) => {
    await tasks.filter('Done');
    await tasks.expectTasks(['Send invites']);
  });

  test('shows all tasks again', { tag: ['@regression'] }, async ({ tasksPage: tasks }) => {
    await tasks.filter('Done');
    await tasks.filter('All');
    await tasks.expectTasks(['Draft agenda', 'Send invites', 'Order snacks']);
  });
});

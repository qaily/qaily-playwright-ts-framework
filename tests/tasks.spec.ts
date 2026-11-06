import { test, expect } from '../fixtures/test';

test.describe('Task lifecycle', () => {
  test('adds a task', { tag: ['@smoke'] }, async ({ signedIn: tasks }) => {
    await expect(tasks.empty).toBeVisible();
    await tasks.add('Write release notes');
    await tasks.expectTasks(['Write release notes']);
    await tasks.expectCounter('1 task left');
  });

  test('completes a task', { tag: ['@regression'] }, async ({ signedIn: tasks }) => {
    await tasks.add('Review pull request', 'Update docs');
    await tasks.complete('Review pull request');
    await tasks.expectCounter('1 task left');
  });

  test('deletes a task', { tag: ['@regression'] }, async ({ signedIn: tasks }) => {
    await tasks.add('Book meeting room', 'Plan sprint');
    await tasks.remove('Book meeting room');
    await tasks.expectTasks(['Plan sprint']);
  });

  test('ignores an empty task', { tag: ['@regression'] }, async ({ signedIn: tasks }) => {
    await tasks.add('Plan sprint');
    await tasks.newTask.press('Enter');
    await tasks.expectTasks(['Plan sprint']);
  });
});

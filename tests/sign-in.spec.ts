import { test, WORKSPACE_CODE } from '../fixtures/test';

test.describe('Sign in', () => {
  test.beforeEach(async ({ signInPage }) => {
    await signInPage.open();
  });

  test('signs in with the workspace code', { tag: ['@smoke'] }, async ({ signInPage }) => {
    await signInPage.signIn('Sam', WORKSPACE_CODE);
    await signInPage.expectSignedIn('Sam');
  });

  test('rejects a wrong workspace code', { tag: ['@regression'] }, async ({ signInPage }) => {
    await signInPage.signIn('Sam', '0000');
    await signInPage.expectError('Wrong workspace code');
  });

  test('asks for a name', { tag: ['@regression'] }, async ({ signInPage }) => {
    await signInPage.signIn('', WORKSPACE_CODE);
    await signInPage.expectError('Enter your name');
  });

  test('signs out', { tag: ['@regression'] }, async ({ signInPage }) => {
    await signInPage.signIn('Sam', WORKSPACE_CODE);
    await signInPage.signOut();
  });
});

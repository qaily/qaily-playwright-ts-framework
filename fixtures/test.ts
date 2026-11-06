import { test as base } from '@playwright/test';
import { ActivityPage } from '../pages/activity.page';
import { SignInPage } from '../pages/sign-in.page';
import { TasksPage } from '../pages/tasks.page';

/** Demo workspace code, shown on the app's sign-in screen. Not a secret. */
export const WORKSPACE_CODE = '2468';

interface Fixtures {
  signInPage: SignInPage;
  tasksPage: TasksPage;
  activityPage: ActivityPage;
  /** Opens the app and signs in as "Alex"; use it when the test isn't about signing in. */
  signedIn: TasksPage;
}

export const test = base.extend<Fixtures>({
  signInPage: async ({ page }, use) => use(new SignInPage(page)),
  tasksPage: async ({ page }, use) => use(new TasksPage(page)),
  activityPage: async ({ page }, use) => use(new ActivityPage(page)),
  signedIn: async ({ signInPage, tasksPage }, use) => {
    await signInPage.open();
    await signInPage.signIn('Alex', WORKSPACE_CODE);
    await signInPage.expectSignedIn('Alex');
    await use(tasksPage);
  },
});

export { expect } from '@playwright/test';

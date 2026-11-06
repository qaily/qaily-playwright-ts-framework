import { test } from '@playwright/test';
import { coverage } from '@qaily/playwright-html-reporter';

/**
 * A test step labelled for the Qaily heat map. Component is the app, Scenario is the test's describe block,
 * Feature and Area say which part of the app the step exercises.
 *
 * @example
 * await step('Tasks', 'Create', 'Add task "Buy milk"', async () => { ... });
 */
export async function step<T>(feature: string, area: string, title: string, body: () => Promise<T>): Promise<T> {
  return test.step(title, async (stepInfo) => {
    const info = test.info();
    // titlePath is [file, ...describe blocks, test title]; the first describe block is the scenario.
    const scenario = info.titlePath.length > 2 ? info.titlePath[1] : info.title;
    coverage(stepInfo, { component: 'Taskboard', scenario, feature, area });
    return body();
  });
}

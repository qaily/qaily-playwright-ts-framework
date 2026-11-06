import { expect, type Locator, type Page } from '@playwright/test';
import { step } from './step';

export class ActivityPage {
  readonly loadButton: Locator;
  readonly list: Locator;

  constructor(page: Page) {
    this.loadButton = page.getByRole('button', { name: 'Load activity' });
    this.list = page.getByRole('list', { name: 'Activity list' });
  }

  /** Waits at most `timeout` ms for the activity list, so a slow load fails the step. */
  async load(timeout = 5_000): Promise<void> {
    await step('Activity', 'Load', 'Load activity', async () => {
      await this.loadButton.click();
      await expect(this.list).toBeVisible({ timeout });
    });
  }

  async expectEntry(text: string): Promise<void> {
    await expect(this.list.getByRole('listitem').filter({ hasText: text })).toHaveCount(1);
  }
}

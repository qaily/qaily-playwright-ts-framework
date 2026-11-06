import { expect, type Locator, type Page } from '@playwright/test';
import { step } from './step';

export type TaskFilter = 'All' | 'Active' | 'Done';

export class TasksPage {
  readonly newTask: Locator;
  readonly list: Locator;
  readonly counter: Locator;
  readonly empty: Locator;

  constructor(private readonly page: Page) {
    this.newTask = page.getByLabel('New task');
    this.list = page.getByRole('list', { name: 'Task list' });
    this.counter = page.locator('#counter');
    this.empty = page.getByText('No tasks yet');
  }

  task(title: string): Locator {
    return this.list.getByRole('listitem').filter({ hasText: title });
  }

  async add(...titles: string[]): Promise<void> {
    for (const title of titles) {
      await step('Tasks', 'Create', `Add task "${title}"`, async () => {
        await this.newTask.fill(title);
        await this.newTask.press('Enter');
        await expect(this.task(title)).toBeVisible();
      });
    }
  }

  async complete(title: string): Promise<void> {
    await step('Tasks', 'Complete', `Complete task "${title}"`, async () => {
      await this.page.getByRole('checkbox', { name: `Complete ${title}` }).check();
      await expect(this.task(title)).toHaveClass(/done/);
    });
  }

  async remove(title: string): Promise<void> {
    await step('Tasks', 'Delete', `Delete task "${title}"`, async () => {
      await this.page.getByRole('button', { name: `Delete ${title}` }).click();
      await expect(this.task(title)).toHaveCount(0);
    });
  }

  async filter(by: TaskFilter): Promise<void> {
    await step('Filters', by, `Show ${by.toLowerCase()} tasks`, async () => {
      const button = this.page.getByRole('group', { name: 'Filter tasks' }).getByRole('button', { name: by });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  }

  async expectTasks(titles: string[]): Promise<void> {
    await expect(this.list.getByRole('listitem').locator('.title')).toHaveText(titles);
  }

  async expectCounter(text: string): Promise<void> {
    await step('Tasks', 'Counter', `Counter shows "${text}"`, async () => {
      await expect(this.counter).toHaveText(text);
    });
  }
}

import { expect, type Locator, type Page } from '@playwright/test';
import { step } from './step';

export class SignInPage {
  readonly name: Locator;
  readonly code: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly greeting: Locator;
  readonly signOutButton: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('Your name');
    this.code = page.getByLabel('Workspace code');
    this.submit = page.getByRole('button', { name: 'Sign in' });
    this.error = page.getByRole('alert');
    this.greeting = page.locator('#greeting');
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }

  async open(query = ''): Promise<void> {
    await step('Authentication', 'Open app', 'Open the app', async () => {
      await this.page.goto(`/${query}`);
      await expect(this.page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    });
  }

  async signIn(name: string, code: string): Promise<void> {
    await step('Authentication', 'Sign in', `Sign in as ${name}`, async () => {
      await this.name.fill(name);
      await this.code.fill(code);
      await this.submit.click();
    });
  }

  async expectSignedIn(name: string): Promise<void> {
    await expect(this.greeting).toHaveText(`Hello, ${name}`);
  }

  async expectError(message: string): Promise<void> {
    await step('Authentication', 'Validation', `See error "${message}"`, async () => {
      await expect(this.error).toHaveText(message);
    });
  }

  async signOut(): Promise<void> {
    await step('Authentication', 'Sign out', 'Sign out', async () => {
      await this.signOutButton.click();
      await expect(this.submit).toBeVisible();
    });
  }
}

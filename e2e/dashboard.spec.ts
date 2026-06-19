import { test, expect } from '@playwright/test';

test('dashboard redirects anonymous users to sign-in', async ({ page }) => {
  // Navigate including the app basename so client routing matches
  await page.goto('/qa-dashboard/dashboard');
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('homepage smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/?/);
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
});

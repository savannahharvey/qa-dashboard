import { test, expect } from '@playwright/test';

test('public navigation routes', async ({ page }) => {
  await page.goto('/');
  // There are multiple identical links in the header/footer; use first()
  const signIn = page.getByRole('link', { name: 'Sign in' }).first();
  const signUp = page.getByRole('link', { name: 'Sign up' }).first();

  await expect(signIn).toBeVisible();
  await expect(signUp).toBeVisible();

  await signIn.click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await page.goto('/');
  await signUp.click();
  await expect(page).toHaveURL(/\/sign-up/);
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
});

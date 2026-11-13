import { test, expect } from '@playwright/test';

test('loads the sign-in page and displays the input fields', async ({ page }) => {
  // 1. Navigate to the sign-in page (resolves to http://localhost:3000/aurixapp/signin)
  await page.goto('/signin');

  // 2. Assert that the title contains "Sign In" or "Aurix" (case-insensitive)
  await expect(page).toHaveTitle(/Sign In|Login|Aurix/i);
  
  // 3. Find username and password elements
  const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i]');
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]');
  
  // 4. Assert that they are visible on the screen
  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
});

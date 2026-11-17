import { test, expect } from '@playwright/test';

test('verify enter key opens lookup modals on empty fields in Sales Entry', async ({ page }) => {
  test.setTimeout(60000);

  // Capture console logs for diagnostics
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  // 1. Sign In
  await page.goto('./');
  await expect(page.locator('input[placeholder="USERNAME"]')).toBeVisible();
  await page.locator('input[placeholder="USERNAME"]').fill('BLOGTEC');
  await page.locator('input[placeholder="PASSWORD"]').fill('1234');
  await expect(page.locator('input[name="shopcode"]')).not.toHaveValue('', { timeout: 15000 });
  await page.locator('button[type="submit"]', { hasText: 'SIGN IN' }).click();

  // 2. Wait for dashboard
  await expect(page.locator('h2').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('h2', { hasText: 'Sign In' })).toBeHidden({ timeout: 10000 });

  // 3. Navigate to Sales Entry
  await page.goto('/aurixapp/salesentry');
  await page.waitForURL('**/salesentry', { timeout: 15000 });
  await expect(page.locator('h2', { hasText: 'Sales Entry' }).first()).toBeVisible({ timeout: 15000 });

  // 4. Click "New"
  await page.locator('button', { hasText: 'New' }).click();

  // 5. Test empty Salesman Code + Press Enter -> Select Salesman Lookup
  console.log('--- TEST 1: Press Enter on empty Salesman Code field ---');
  const salesManCard = page.locator('.compact-card').filter({ hasText: 'Sales Man' }).first();
  await salesManCard.click();
  const salesmanCodeInput = salesManCard.locator('input[placeholder="CODE"]').first();
  await expect(salesmanCodeInput).toBeEnabled({ timeout: 15000 });
  await salesmanCodeInput.focus();
  await salesmanCodeInput.press('Enter');

  const salesmanModal = page.locator('h2', { hasText: 'Select Salesman' });
  await expect(salesmanModal).toBeVisible({ timeout: 15000 });

  // Close Salesman Lookup modal
  await page.keyboard.press('Escape');
  await expect(salesmanModal).toBeHidden({ timeout: 10000 });

  // 6. Test empty Item Code + Press Enter -> Item Lookup Modal
  console.log('--- TEST 2: Press Enter on empty Item field ---');
  const itemInput = page.locator('input[placeholder="ITEM"]');
  await itemInput.focus();
  await itemInput.press('Enter');

  const itemLookupModal = page.locator('h2', { hasText: 'Item Lookup' });
  await expect(itemLookupModal).toBeVisible({ timeout: 15000 });

  // Close Item Lookup modal
  await page.keyboard.press('Escape');
  await expect(itemLookupModal).toBeHidden({ timeout: 10000 });

  // 7. Test empty Stone Code + Press Enter -> Select Stone Lookup Modal
  console.log('--- TEST 3: Press Enter on empty Stone Code field ---');
  const stoneCodeInput = page.locator('input[placeholder="CODE"]').nth(1);
  await stoneCodeInput.focus();
  await stoneCodeInput.press('Enter');

  const stoneLookupModal = page.locator('h2', { hasText: 'Select Stone' });
  await expect(stoneLookupModal).toBeVisible({ timeout: 15000 });

  // Close Stone Lookup modal
  await page.keyboard.press('Escape');
  await expect(stoneLookupModal).toBeHidden({ timeout: 10000 });

  // 8. Test empty Advance Name + Press Enter -> Select Advance Item Lookup Modal
  console.log('--- TEST 4: Press Enter on empty Advance Name field ---');
  const advNameInput = page.locator('input[placeholder="NAME"]').first();
  await advNameInput.focus();
  await advNameInput.press('Enter');

  const advLookupModal = page.locator('h2', { hasText: 'Select Advance Item' });
  await expect(advLookupModal).toBeVisible({ timeout: 15000 });

  // Close Advance Lookup modal
  await page.keyboard.press('Escape');
  await expect(advLookupModal).toBeHidden({ timeout: 10000 });

  console.log('--- ALL ENTER KEY LOOKUP TESTS PASSED SUCCESSFULLY ---');
});

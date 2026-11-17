import { test, expect } from '@playwright/test';

test('can perform Sales Entry calculation validation', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Sign In
  await page.goto('./');
  await expect(page).toHaveTitle(/AURIX/);
  await expect(page.locator('h2', { hasText: 'Sign In' })).toBeVisible();
  await page.locator('input[placeholder="USERNAME"]').fill('BLOGTEC');
  await page.locator('input[placeholder="PASSWORD"]').fill('1234');

  // Shop code is loaded async from API — wait for the hidden input to have a value
  await expect(page.locator('input[name="shopcode"]')).not.toHaveValue('', { timeout: 15000 });
  await page.locator('button[type="submit"]', { hasText: 'SIGN IN' }).click();

  // 2. Wait for dashboard
  await expect(page.locator('h2').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('h2', { hasText: 'Sign In' })).toBeHidden({ timeout: 5000 });

  // 3. Navigate to Sales Entry
  await page.goto('/aurixapp/salesentry');
  await page.waitForURL('**/salesentry', { timeout: 15000 });
  await expect(page.locator('h2', { hasText: 'Sales Entry' }).first()).toBeVisible({ timeout: 15000 });

  // 4. Click "New"
  await page.locator('button', { hasText: 'New' }).click();

  // 5. Enter Gold Rate
  const gRateInput = page.locator('input[placeholder="G-Rate"]');
  await gRateInput.fill('5000');
  await gRateInput.blur();

  // 6. Add Salesman
  const salesManCard = page.locator('.compact-card').filter({ hasText: 'Sales Man' }).first();
  await salesManCard.click();
  const salesmanCodeInput = salesManCard.locator('input[placeholder="CODE"]').first();
  await expect(salesmanCodeInput).toBeEnabled({ timeout: 30000 });
  await salesmanCodeInput.press('Enter');

  const salesmanModal = page.locator('h2', { hasText: 'Select Salesman' });
  await expect(salesmanModal).toBeVisible({ timeout: 30000 });
  await expect(page.locator('text=Fetching records...')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30000 });
  const searchInput = page.locator('input[placeholder*="Search by"]');
  await searchInput.click();
  await searchInput.press('Enter');
  await expect(salesmanModal).toBeHidden({ timeout: 30000 });

  // 7. Enter Item Details
  const itemInput = page.locator('input[placeholder="ITEM"]');
  await itemInput.click();
  await itemInput.dblclick();
  await expect(page.locator('h2', { hasText: 'Item Lookup' })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Fetching records...')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30000 });
  const itemSearchInput = page.locator('input[placeholder*="Search by"]');
  await itemSearchInput.click();
  await itemSearchInput.press('Enter');
  await expect(page.locator('h2', { hasText: 'Item Lookup' })).toBeHidden({ timeout: 30000 });
  
  // Wait for item details to populate
  await expect(itemInput).not.toHaveValue('', { timeout: 15000 });

  // 7.5. Press Enter on QTY to move focus to GROSS weight
  // Note: There is a duplicate QTY input in the Stone Details table, so we scope under the main table.
  const salesTable = page.locator('table').filter({ hasText: 'Gross Wt' });
  const qtyInput = salesTable.locator('input[placeholder="QTY"]');
  await expect(qtyInput).toBeFocused({ timeout: 10000 }).catch(() => qtyInput.focus());
  await qtyInput.press('Enter');

  // 8. Enter Gross Weight
  const grossInput = page.locator('input[placeholder="GROSS"]');
  await expect(grossInput).toBeFocused({ timeout: 10000 }).catch(() => grossInput.focus());
  await grossInput.fill('10.000');
  await grossInput.press('Enter');

  // 8.5. Press Enter on STONE weight to move focus to VA%
  const stoneWtInput = page.locator('input[placeholder="STONE"]');
  await expect(stoneWtInput).toBeFocused({ timeout: 10000 }).catch(() => stoneWtInput.focus());
  await stoneWtInput.press('Enter');

  // 9. Enter VA% → focuses VA.AMT
  const vaPerInput = page.locator('input[placeholder="VA%"]');
  await expect(vaPerInput).toBeFocused({ timeout: 10000 }).catch(() => vaPerInput.focus());
  await vaPerInput.fill('5.00');
  await vaPerInput.press('Enter');

  // 10. VA.AMT is now focused — wait for the calculation to fire and VA.AMT to become non-zero
  const vaAmtInput = page.locator('input[placeholder="VA.AMT"]');
  await expect(vaAmtInput).toBeFocused({ timeout: 10000 }).catch(() => vaAmtInput.focus());
  await expect(vaAmtInput).not.toHaveValue('0.00', { timeout: 15000 });

  // 11. Assert calculation values directly from input fields (before commit)
  //     goldAmt and amount are readonly cells computed by handleVaAmtEnter
  const vaAmt = await vaAmtInput.inputValue();

  // The gold amount cell is a readonly input right after STN.CH column
  const goldAmtInput = page.locator('input[placeholder="STN.CH"]')
    .locator('xpath=../following-sibling::td[1]/input');
  const totalAmtInput = page.locator('input[placeholder="STN.CH"]')
    .locator('xpath=../following-sibling::td[2]/input');

  const goldAmt = await goldAmtInput.inputValue().catch(() => '0.00');
  const totalAmt = await totalAmtInput.inputValue().catch(() => '0.00');

  console.log(`VA Amt: ${vaAmt}, Gold Amt: ${goldAmt}, Total: ${totalAmt}`);

  // All amounts must be non-zero (item was filled + gross=10 + valid rates)
  expect(parseFloat(vaAmt.replace(/,/g, ''))).toBeGreaterThan(0);
  expect(parseFloat(goldAmt.replace(/,/g, ''))).toBeGreaterThan(0);
  expect(parseFloat(totalAmt.replace(/,/g, ''))).toBeGreaterThan(0);

  // Total must equal Gold Amt + VA Amt + Stone Charge (basic math check)
  const total = parseFloat(totalAmt.replace(/,/g, ''));
  const gold = parseFloat(goldAmt.replace(/,/g, ''));
  const va = parseFloat(vaAmt.replace(/,/g, ''));
  const stnChg = parseFloat((await page.locator('input[placeholder="STN.CH"]').inputValue()).replace(/,/g, ''));
  console.log(`Math check: ${gold} + ${va} + ${stnChg} = ${gold + va + stnChg} (total: ${total})`);
  expect(Math.abs(total - (gold + va + stnChg))).toBeLessThan(1); // within ₹1 rounding

  // 12. Take a final screenshot
  await page.screenshot({ path: 'e2e-screenshots/sales-entry-calculation.png', fullPage: true });
});

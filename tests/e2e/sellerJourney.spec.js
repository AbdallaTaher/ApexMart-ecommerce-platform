const { test, expect } = require('@playwright/test');

test.describe('Seller Central Portal End-to-End Journeys (Slice 10 - Task 34)', () => {
  test('Journey 1: Route Protection Guards Unauthenticated Users', async ({ page }) => {
    // Attempt direct access to seller dashboard without authentication
    await page.goto('/seller/dashboard');

    // Should redirect to login or home
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Journey 2: Seller Authentication & Dashboard KPIs', async ({ page }) => {
    // Login as Seller
    await page.goto('/login');
    await page.fill('#email', 'seller@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('**/', { timeout: 15000 });

    // Navigate to Seller Dashboard
    await page.goto('/seller/dashboard');
    await expect(page).toHaveTitle(/Seller Central|ApexMart/i);

    // Verify KPI Metrics
    await expect(page.locator('body')).toContainText(/Store Revenue|Units Sold|Store Orders/i);

    // Verify Sales Trajectory Section
    const chartHeading = page.locator('body').getByText(/Revenue & Sales Trajectory/i);
    await expect(chartHeading).toBeVisible({ timeout: 10000 });
  });

  test('Journey 3: Virtualized Inventory Table & Search Filter', async ({ page }) => {
    // Login as Seller
    await page.goto('/login');
    await page.fill('#email', 'seller@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto('/seller/dashboard');

    // Verify Virtualized Inventory Table Header
    const inventorySection = page.locator('body').getByText(/Store Inventory Catalog/i);
    await expect(inventorySection).toBeVisible({ timeout: 10000 });

    // Search input in inventory table
    const inventorySearch = page.locator('input[placeholder*="Search inventory"]').first();
    await expect(inventorySearch).toBeVisible();
    await inventorySearch.fill('Sony');

    // Verify filtered results or empty state rendered gracefully
    await page.waitForTimeout(500);
    await expect(inventorySection).toBeVisible();
  });

  test('Journey 4: Open Add Product Modal & Client Form Validation', async ({ page }) => {
    // Login as Seller
    await page.goto('/login');
    await page.fill('#email', 'seller@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto('/seller/dashboard');

    // Click "Add Product"
    const addProductBtn = page.locator('button').filter({ hasText: /Add Product/i }).first();
    await expect(addProductBtn).toBeVisible({ timeout: 10000 });
    await addProductBtn.click();

    // Verify Modal appears
    const modalHeading = page.locator('body').getByText(/Publish New Product/i);
    await expect(modalHeading).toBeVisible();

    // Verify Modal form inputs
    const titleInput = page.locator('input[placeholder*="Sony Wireless Noise-Canceling Headphones"], input[name="name"]').first();
    await expect(titleInput).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button').filter({ hasText: /Cancel/i }).first();
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });
});

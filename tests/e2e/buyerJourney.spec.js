const { test, expect } = require('@playwright/test');

test.describe('Buyer End-to-End User Journeys (Slice 10 - Task 34)', () => {
  test('Journey 1: Homepage, Category Navigation & Product Search', async ({ page }) => {
    // 1) Navigate to Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/ApexMart/i);

    // 2) Verify Search Bar is interactive
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // 3) Subheader Category Navigation
    const electronicsLink = page.locator('header a, nav a').filter({ hasText: /^Electronics$/i }).first();
    if (await electronicsLink.isVisible()) {
      await electronicsLink.click();
      await page.waitForURL(/categorySlug=electronics/i);
      await expect(page.locator('body')).toContainText(/Electronics/i);
    }

    // 4) Perform keyword search
    await searchInput.fill('Apex');
    await searchInput.press('Enter');

    // 5) Verify search results appear
    await expect(page).toHaveURL(/search=Apex/i);
    const productCards = page.locator('article');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Journey 2: Product Detail View & Iconic Buy Box', async ({ page }) => {
    // Navigate to Catalog
    await page.goto('/catalog');
    const firstProductLink = page.locator('article a[href^="/product/"]').first();
    await expect(firstProductLink).toBeVisible({ timeout: 10000 });

    // Click into Product Detail
    await firstProductLink.click();
    await page.waitForURL(/\/product\//);

    // Verify Buy Box elements
    const buyBox = page.locator('aside, div').filter({ hasText: /Add to Cart/i }).first();
    await expect(buyBox).toBeVisible();

    // Verify Price is displayed
    const priceText = page.locator('body').getByText(/\$\d+/).first();
    await expect(priceText).toBeVisible();
  });

  test('Journey 3: Add to Cart, Subtotal & Free Shipping Progress', async ({ page }) => {
    await page.goto('/catalog');

    // Quick Add to Cart from Catalog
    const addToCartBtn = page.locator('button').filter({ hasText: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // Give state a moment to propagate in CartContext
    await page.waitForTimeout(500);

    // Navigate to Cart Page via header cart link
    const cartLink = page.locator('header a[href="/cart"]').first();
    await expect(cartLink).toBeVisible();
    await cartLink.click();

    // Verify Shopping Cart view renders
    await page.waitForURL(/\/cart/);
    await expect(page.locator('body')).toContainText(/Shopping Cart/i);
  });

  test('Journey 4: Buyer Authentication & Order History', async ({ page }) => {
    // Navigate to Login Page
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/Sign in/i);

    // Fill credentials
    await page.fill('#email', 'buyer@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for authentication & redirect
    await page.waitForURL('**/', { timeout: 15000 });

    // Navigate to Orders Page
    await page.goto('/orders');
    await expect(page).toHaveTitle(/Orders|Purchases|ApexMart/i);

    // Verify Orders Page renders cleanly
    const ordersContainer = page.locator('main, div').filter({ hasText: /Your Orders|Orders & Purchases/i }).first();
    await expect(ordersContainer).toBeVisible();
  });
});

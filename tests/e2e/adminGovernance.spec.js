const { test, expect } = require('@playwright/test');

test.describe('Platform Admin Governance & Audit Trail End-to-End Journeys (Slice 10 - Task 34)', () => {
  test('Journey 1: Route Protection Guards Non-Admin Users', async ({ page }) => {
    // Attempt direct access to admin dashboard without authentication
    await page.goto('/admin/dashboard');

    // Should redirect to login or home
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Journey 2: Admin Authentication & Executive Console Landing', async ({ page }) => {
    // Login as Platform Administrator
    await page.goto('/login');
    await page.fill('#email', 'admin@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/', { timeout: 15000 });

    // Navigate to Admin Dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveTitle(/Admin|Governance|ApexMart/i);

    // Verify Platform Banner & GMV KPI Cards
    await expect(page.locator('h1')).toContainText(/Executive Administration & Audit Trail/i);
    await expect(page.locator('body')).toContainText(/Gross Merchandise Value|GMV/i);
    await expect(page.locator('body')).toContainText(/Registered Users/i);
  });

  test('Journey 3: User & RBAC Governance Tab & Role Modal', async ({ page }) => {
    // Login as Platform Administrator
    await page.goto('/login');
    await page.fill('#email', 'admin@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto('/admin/dashboard');

    // Click "User & RBAC Governance" tab
    const usersTab = page.locator('button').filter({ hasText: /User & RBAC Governance/i });
    await expect(usersTab).toBeVisible();
    await usersTab.click();

    // Verify User Governance Table renders
    const tableHeader = page.locator('body').getByText(/User Accounts & RBAC Governance/i);
    await expect(tableHeader).toBeVisible({ timeout: 10000 });

    // Verify Search and Role Filter Tabs exist
    const searchInput = page.locator('input[placeholder*="Search by name"]').first();
    await expect(searchInput).toBeVisible();

    // Verify "Change Role" button exists on other users and opens RoleAssignmentModal
    const changeRoleBtn = page.locator('button').filter({ hasText: /^Change Role$/i }).first();
    if (await changeRoleBtn.isVisible()) {
      await changeRoleBtn.click();

      // Verify Modal opens cleanly
      const roleModal = page.locator('div[role="dialog"]').first();
      await expect(roleModal).toBeVisible();
      await expect(roleModal).toContainText(/Assign RBAC Role/i);
      await expect(roleModal).toContainText(/Merchant Seller Partner/i);

      // Close modal
      const cancelBtn = roleModal.locator('button').filter({ hasText: /Cancel/i });
      await cancelBtn.click();
      await expect(roleModal).not.toBeVisible();
    }
  });

  test('Journey 4: Security & Audit Trail Tab & Payload Inspection', async ({ page }) => {
    // Login as Platform Administrator
    await page.goto('/login');
    await page.fill('#email', 'admin@apexmart.com');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto('/admin/dashboard');

    // Click "Security & Audit Trail" tab
    const auditTab = page.locator('button').filter({ hasText: /Security & Audit Trail/i });
    await expect(auditTab).toBeVisible();
    await auditTab.click();

    // Verify Audit Trail table renders
    const auditHeader = page.locator('body').getByText(/Immutable Audit Trail & Compliance Log/i);
    await expect(auditHeader).toBeVisible({ timeout: 10000 });

    // Verify inspect button opens payload modal
    const inspectBtn = page.locator('button').filter({ hasText: /Inspect/i }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();

      const modal = page.locator('div:has-text("Audit Log Payload Inspection")').first();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Client IP & Origin|Sanitized Details Payload/i);

      // Close modal
      const closeBtn = modal.locator('button').filter({ hasText: /Close Inspector/i }).first();
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });
});

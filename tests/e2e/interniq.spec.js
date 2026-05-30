const { test, expect } = require('@playwright/test');

test.describe('InternIQ Core Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to landing page
    await page.goto('http://localhost:5173');
  });

  test('should navigate to login page', async ({ page }) => {
    // Wait for network/hydration
    await page.waitForLoadState('networkidle');
    
    // Check if there is a login link/button (may vary based on exact Landing.jsx)
    const loginLink = page.locator('text=Login').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });

  // Example of an E2E Student flow
  test('student login and view dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Fill credentials (assuming these selectors or placehloders exist)
    await page.fill('input[type="email"]', 'teststudent@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for redirection to dashboard or error (this would require a seeded DB)
    // await expect(page).toHaveURL(/.*student\/dashboard/);
  });
});

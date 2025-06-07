import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../routes/clientRoutes';

test.describe('Admin Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Simply navigate to the page without any auth mocks
    await page.goto(`${BASE_URL}/admin/dashboard`);
    
    // Wait for the dashboard to load using test ID
    await page.waitForSelector('[data-testid="admin-dashboard"]', { 
      state: 'visible',
      timeout: 15000 // 15 seconds timeout
    });
  });

  test('should display the admin dashboard title', async ({ page }) => {
    const title = page.getByTestId('dashboard-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Admin Dashboard');
  });

  test('should have "Manage Vehicles" link that navigates to vehicles page', async ({ page }) => {
    const vehiclesLink = page.getByTestId('vehicles-link');
    await expect(vehiclesLink).toBeVisible();
    await expect(vehiclesLink).toHaveText('Manage Vehicles');
    await expect(vehiclesLink).toHaveAttribute('href', '/vehicles');
    
    // Test navigation
    await vehiclesLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/vehicles`);
    await page.goBack(); // Return to dashboard for next tests
  });

  test('should have "Manage Users" link that navigates to users page', async ({ page }) => {
    const usersLink = page.getByTestId('users-link');
    await expect(usersLink).toBeVisible();
    await expect(usersLink).toHaveText('Manage Users');
    await expect(usersLink).toHaveAttribute('href', '/users');
    
    // Test navigation
    await usersLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/users`);
  });


});
import { test, expect } from '@playwright/test';

import { BASE_URL } from '../../routes/clientRoutes';
import serverRoutes from '../../routes/serverRoutes';
test.describe('Login Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });
  test('should render login form correctly', async ({ page }) => {
    // Use more specific selectors to avoid ambiguity
    await expect(page.locator('form').getByRole('heading', { name: 'Propelize' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('form').getByRole('button', { name: 'Log In' })).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.locator('form').getByRole('link', { name: 'Register' })).toBeVisible();
  });

  // Update other tests similarly to use more specific selectors
  test('should show validation errors when submitting empty form', async ({ page }) => {
    await page.locator('form').getByRole('button', { name: 'Log In' }).click();
    // Check required validation
    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toHaveJSProperty('validity.valid', false);
    
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveJSProperty('validity.valid', false);    
  });


  test('should handle successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          user: { name: 'Test User', role: 'user' }
        })
      });
    });

    // Fill and submit form
    await page.getByLabel('Name').fill('testuser');
    await page.getByLabel('Password').fill('password');
    await page.getByTestId('login-button').click();

    // Verify success flow
    const messageElement = page.getByTestId('auth-message');
    await expect(messageElement).toBeVisible();
    await expect(messageElement).toHaveText('Login successfully...');
    await expect(messageElement).toHaveClass(/text-green-600/);
    
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
  });

  test('should redirect to register for unregistered users', async ({ page }) => {
    // Mock 404 response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User not found' })
      });
    });

    // Fill and submit form
    await page.getByLabel('Name').fill('nonexistent');
    await page.getByLabel('Password').fill('wrong');
    await page.getByTestId('login-button').click();

    // Verify error flow
    const messageElement = page.getByTestId('auth-message');
    await expect(messageElement).toBeVisible();
    await expect(messageElement).toHaveText('failed to login...');
    await expect(messageElement).toHaveClass(/text-red-600/);
    
    await page.waitForURL(`${BASE_URL}/register`, { timeout: 5000 });
  });


  test('should navigate to register page when register link is clicked', async ({ page }) => {
    // Target the Register link specifically within the form
    await page.locator('form').getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

});
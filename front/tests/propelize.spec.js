import { test, expect } from '@playwright/test';

test.describe('Propelize Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses with more specific URL patterns
    await page.route('**/auth/login', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', name: 'testuser', role: 'user' },
        }),
      });
    });

    // Fix: More specific route pattern for vehicles endpoint
    await page.route('http://localhost:8081/front/vehicles', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: '1', marque: 'Toyota', model: 'Corolla', immatriculation: 'ABC123', annees: 2020, prixLocation: 50 },
        ]),
      });
    });

    await page.goto('http://192.168.56.1:8081'); // Adjust to your local server URL
  });

  // Test HTML: Verify authentication page rendering
  test('Verify authentication page rendering', async ({ page }) => {
    // Ensure the auth page is active
    await expect(page.locator('#auth-page')).toHaveClass(/active/);
    // Target the h1 specifically within the auth page
    await expect(page.locator('#auth-page h1.card-title')).toHaveText('Propelize');
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#register-form')).not.toBeVisible();
  });

  // Test CSS: Verify Sign In button styles
  test('Verify Sign In button styles', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign In")');
    const background = await signInButton.evaluate((el) => window.getComputedStyle(el).background);
    await expect(background).toContain('linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)');
    await expect(signInButton).toHaveClass(/btn/);
  });

  // Test JavaScript: Verify switch to register form
  test('Verify switch to register form', async ({ page }) => {
    await page.click('a:has-text("Create Account")');
    await expect(page.locator('#register-form')).toBeVisible();
    await expect(page.locator('#login-form')).not.toBeVisible();
  });

  // Test JavaScript: Verify login and dashboard display
  test('Verify login and dashboard display', async ({ page }) => {
    await page.fill('#login-name', 'testuser');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('#dashboard-page')).toBeVisible();
    await expect(page.locator('#nav-header')).not.toHaveClass(/hidden/);
    await expect(page.locator('#username-display')).toHaveText('Welcome, testuser');
  });

  // Test JavaScript: Verify navigation to Vehicle Management
  test('Verify navigation to Vehicle Management', async ({ page }) => {
    await page.fill('#login-name', 'testuser');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.click('.option-card:has-text("Vehicle Management")');
    await expect(page.locator('#vehicle-options-page')).toBeVisible();
    await expect(page.locator('.operation-btn:has-text("Add Vehicle")')).toBeVisible();
  });

  // Fixed test for vehicle list display
  test('Verify vehicle list display', async ({ page }) => {
    await page.fill('#login-name', 'testuser');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('#dashboard-page')).toBeVisible();
    
    await page.click('.option-card:has-text("Vehicle Management")');
    await expect(page.locator('#vehicle-options-page')).toBeVisible();
    
    // Set up a promise to wait for the network request
    const responsePromise = page.waitForResponse('http://localhost:8081/front/vehicles');
    
    await page.click('.operation-btn:has-text("View All")');
    
    // Wait for the API response
    await responsePromise;
    
    // Wait for vehicle-grid to be visible with a reasonable timeout
    await page.waitForSelector('#vehicle-grid', { state: 'visible', timeout: 10000 });
    
    // Check for vehicle data in vehicle-grid
    await expect(page.locator('#vehicle-grid .vehicle-card')).toContainText('Toyota');
    await expect(page.locator('#vehicle-grid .vehicle-card')).toContainText('ABC123');
  });

  // Test JavaScript: Verify logout
  test('Verify logout', async ({ page }) => {
    await page.route('**/auth/logout', (route) => {
      route.fulfill({ status: 200 });
    });
    await page.fill('#login-name', 'testuser');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.click('#logout-btn');
    await expect(page.locator('#auth-page')).toBeVisible();
    await expect(page.locator('#nav-header')).toHaveClass(/hidden/);
  });
});
import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../routes/clientRoutes';
import serverRoutes from '../../routes/serverRoutes';
test.describe('Register Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForSelector('text=Register');
  });

  test('should render registration form correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
    await expect(page.getByText('Already have an account?')).toBeVisible();
  });

test('should show password requirements', async ({ page }) => {
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('weak');
  await page.getByLabel('Password').blur(); // Trigger validation
  await page.waitForTimeout(300); // Allow animation
  await expect(page.getByText(/Password must have/)).toBeVisible();
});

  test('should show validation icons when fields are blurred', async ({ page }) => {
    // Test invalid name
    await page.getByLabel('Name').fill('a');
    await page.getByLabel('Name').blur();
    await expect(page.locator('.text-red-500')).toBeVisible();
    
    // Test valid name
    await page.getByLabel('Name').fill('ValidName123');
    await page.getByLabel('Name').blur();
    await expect(page.locator('.text-green-500')).toBeVisible();
    
    // Test invalid password
    await page.getByLabel('Password').fill('weak');
    await page.getByLabel('Password').blur();
    await expect(page.getByText('Password must have 8+ chars')).toBeVisible();
    
    // Test valid password
    await page.getByLabel('Password').fill('StrongPass123!');
    await page.getByLabel('Password').blur();
    await expect(page.getByText('Strong password ✅')).toBeVisible();
  });

  test('should enable submit button only when form is valid', async ({ page }) => {
    const registerButton = page.getByRole('button', { name: 'Register' });
    await expect(registerButton).toBeDisabled();
    
    // Fill with invalid data
    await page.getByLabel('Name').fill('a');
    await page.getByLabel('Password').fill('weak');
    await expect(registerButton).toBeDisabled();
    
    // Fill with valid data
    await page.getByLabel('Name').fill('ValidName123');
    await page.getByLabel('Password').fill('StrongPass123!');
    await expect(registerButton).toBeEnabled();
  });

  test('should show success message on successful registration', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/auth/register', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Registration successful' })
    }));

    await page.getByLabel('Name').fill('TestUser');
    await page.getByLabel('Password').fill('ValidPass123!');
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page.getByText('Successfully registered!')).toBeVisible();
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
  });


  test('should navigate to login page when login link is clicked', async ({ page }) => {
  // Target the main content login link specifically
  await page.getByRole('main').getByRole('link', { name: 'Login' }).click();
  await expect(page).toHaveURL(`${BASE_URL}/login`);
});
});
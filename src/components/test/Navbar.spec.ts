import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../routes/clientRoutes';

test.describe('Navbar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Clear all storage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should render navbar with logo and basic links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /🚀 Propelize/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vehicles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('should show admin links when admin user is logged in', async ({ page }) => {
    // Set user info matching the component's expected structure
    await page.evaluate(() => {
      localStorage.setItem('userInfo', JSON.stringify({
        user: {
          name: 'Admin User',
          role: 'admin'
        }
      }));
    });

    await page.reload();
    // Wait for React to hydrate and render
    await page.waitForSelector('[data-testid="navbar"]');

    // Check user display - note the component shows user.user.name
    await expect(page.getByText('Admin User')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible();
  });

test('should show mobile menu when menu button is clicked', async ({ page }) => {
  // Set mobile viewport (typical mobile size)
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
  
  // Navigate fresh to ensure proper mobile rendering
  await page.goto(BASE_URL);
  
  // Wait for navbar and mobile-specific elements
  await page.waitForSelector('[data-testid="navbar"]');
  
  // Use the test ID we added for reliability
  const menuButton = page.getByTestId('mobile-menu-button');
  
  // Debugging: Uncomment to see what's actually rendered
  // console.log(await page.innerHTML('body'));
  
  await expect(menuButton).toBeVisible({
    timeout: 10000 // Give more time for mobile rendering
  });
  
  // Verify mobile menu is initially hidden
  const mobileMenu = page.getByTestId('mobile-menu');
  await expect(mobileMenu).not.toBeVisible();
  
  // Click menu button with proper waiting
  await menuButton.click();
  
  // Wait for menu to animate in
  await expect(mobileMenu).toBeVisible({
    timeout: 5000
  });
  
  // Verify menu items appear
  await expect(mobileMenu.getByRole('link', { name: 'Home' })).toBeVisible();
});

 test('should show profile dropdown when user is logged in', async ({ page }) => {
  // Set user info with exact structure matching your component
  await page.evaluate(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      user: {
        name: 'Test User',
        role: 'user'
      }
    }));
  });

  // Reload and wait for hydration
  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="navbar"]');

  // Use test ID to find and click profile button
  const profileButton = page.getByText('Test User');
  await expect(profileButton).toBeVisible({
    timeout: 10000 // Extended timeout
  });

  // Click to open dropdown
  await profileButton.click();
  
  // Wait for dropdown animation
  await page.waitForTimeout(500);

  // Verify dropdown content using test IDs
  const dropdown = page.getByTestId('profile-dropdown');
  await expect(dropdown).toBeVisible();
  
  const profileInfo = page.getByTestId('profile-info');
  await expect(profileInfo).toContainText('Logged in as');
  await expect(profileInfo).toContainText('Test User');
  
  await expect(page.getByTestId('logout-button')).toBeVisible();
});

 test('should logout when logout button is clicked', async ({ page }) => {
  // Set user info matching the component's exact structure
  await page.evaluate(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      user: {  // Note the nested structure
        name: 'Test User',
        role: 'user'
      }
    }));
  });

  await page.reload();
  
  // Wait for the navbar to be visible and hydrated
  await page.waitForSelector('[data-testid="navbar"]');
  
  // More reliable way to find the user element
  const userElement = page.locator('nav').getByText('Test User');
  console.log(userElement)
  await expect(userElement).toBeVisible();
  
  // Debugging step - uncomment if still having issues
  // console.log(await page.content());
  
  // Click the user element to open dropdown
  await userElement.click();
  await page.waitForTimeout(300); // Small delay for dropdown animation
  
  // Now click logout
  const logoutButton = page.getByRole('button', { name: /logout/i });
  await expect(logoutButton).toBeVisible();
  
  // Handle navigation properly
  const navigationPromise = page.waitForURL(`${BASE_URL}/login`);
  await logoutButton.click();
  await navigationPromise;
  
  // Verify logout succeeded
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});
});
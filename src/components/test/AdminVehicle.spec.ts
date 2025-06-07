import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../routes/clientRoutes';
import serverRoutes from '../../routes/serverRoutes';
test.describe('Admin Vehicle Management', () => {
  let mockVehicles = [
    {
      id: 1,
      marque: 'Toyota',
      model: 'Corolla',
      immatriculation: 'ABC123',
      annees: 2022,
      prixLocation: 50000
    },
    {
      id: 2,
      marque: 'Honda',
      model: 'Civic',
      immatriculation: 'XYZ789',
      annees: 2021,
      prixLocation: 45000
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route(serverRoutes.GET_VEHICLES, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockVehicles)
    }));

    await page.route(`${serverRoutes.VEHICLES}/*`, async route => {
      if (route.request().method() === 'DELETE') {
        const vehicleId = route.request().url().split('/').pop();
        mockVehicles = mockVehicles.filter(v => v.id !== parseInt(vehicleId));
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ message: 'Vehicle deleted' })
        });
      }
      return route.continue();
    });

    // Go to the page
    await page.goto(`${BASE_URL}/admin/vehicles`);
    await page.waitForSelector('text=Vehicle Management');
  });

  test('should display vehicle management page', async ({ page }) => {
    await expect(page.getByTestId('vehicle-management-header')).toBeVisible();
    await expect(page.getByTestId('add-vehicle-button')).toBeVisible();
    await expect(page.getByTestId('vehicles-table')).toBeVisible();
  });

  test('should display vehicle list correctly', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('Toyota')).toBeVisible();
    await expect(page.getByText('Honda')).toBeVisible();
  });

  test('should filter vehicles by search', async ({ page }) => {
    await page.getByPlaceholder('Search...').fill('Toyota');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(page.getByText('Toyota')).toBeVisible();
    await expect(page.getByText('Honda')).not.toBeVisible();
  });

  test('should change filter field', async ({ page }) => {
    await page.locator('select').selectOption('model');
    await page.getByPlaceholder('Search...').fill('Civic');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(page.getByText('Civic')).toBeVisible();
  });

  test('should paginate through vehicles', async ({ page }) => {
    // Add more vehicles for pagination test
    mockVehicles = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      marque: `Brand ${i + 1}`,
      model: `Model ${i + 1}`,
      immatriculation: `PLATE${i + 1}`,
      annees: 2020 + i,
      prixLocation: 40000 + (i * 1000)
    }));

    await page.reload();
    
    await expect(page.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });
 
test('should delete a vehicle', async ({ page }) => {
  // Initial count
  const initialRows = await page.locator('[data-testid="vehicles-table"] tbody tr').count();
  
  // Mock DELETE request
  await page.route('**/api/vehicles/*', async route => {
    const id = route.request().url().split('/').pop();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Deleted successfully' })
    });
  });

  // Click delete button on first row
  await page.locator('[data-testid="delete-button"]').first().click();
  
  // Wait for both the API response and UI update
  await Promise.all([
    page.waitForResponse('**/api/vehicles/*'),
    page.waitForSelector('[data-testid="success-message"]')
  ]);

  // Verify row count decreased
  await expect(page.locator('[data-testid="vehicles-table"] tbody tr')).toHaveCount(initialRows - 1);
});

  test('should navigate to add vehicle page', async ({ page }) => {
    await page.getByRole('link', { name: 'Add Vehicle' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/admin/vehicles/add`);
  });

  test('should navigate to edit vehicle page', async ({ page }) => {
    // Wait for edit link to be visible
    const editLink = page.getByTestId('edit-vehicle-link').first();
    await editLink.waitFor({ state: 'visible' });
    
    // Click with retry logic
    await expect(async () => {
      await editLink.click();
      await expect(page).toHaveURL(/\/admin\/vehicles\/edit\?vehicleId=\d+/);
    }).toPass({ timeout: 10000 });
});
});
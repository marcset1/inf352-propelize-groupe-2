// tests/adminAddVehicle.spec.js
import { test, expect } from '@playwright/test';

test('Admin can add a vehicle', async ({ page }) => {
  // Go to the login page
  await page.goto('http://localhost:3000/login');

  // Log in (adjust selectors as needed)
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'adminpassword');
  await page.click('button[type="submit"]');

  // Navigate to Add Vehicle Page
  await page.goto('http://localhost:3000/admin/vehicles/add');

  // Fill the form
  await page.fill('input[name="marque"]', 'Toyota');
  await page.fill('input[name="model"]', 'Corolla');
  await page.fill('input[name="immatriculation"]', 'ABC-123');
  await page.fill('input[name="prixLocation"]', '45');

  // Select year in DatePicker (Year Picker only)
  await page.click('.react-datepicker__input-container input');
  await page.click('.react-datepicker__year-text >> text=2022');

  // Submit the form
  await page.click('button[type="submit"]');

  // Expect success message
  await expect(page.locator('text=Vehicle added successfully')).toBeVisible();

  // Expect redirection
  await page.waitForURL('**/admin/vehicles');
});

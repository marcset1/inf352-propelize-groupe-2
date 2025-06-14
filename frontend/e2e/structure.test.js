import { test, expect } from '@playwright/test';

test.describe("MUT: /login | /register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('Séparation claire entre login et signup', async ({ page }) => {
    // Vérifier que seul le login est visible au départ
    await expect(page.locator('#loginContainer')).toBeVisible();
    await expect(page.locator('#signupContainer')).toBeHidden();

    // Basculer vers signup
    await page.click('#showSignup');
    await expect(page.locator('#loginContainer')).toBeHidden();
    await expect(page.locator('#signupContainer')).toBeVisible();

    // Retour au login
    await page.click('#backToLogin');
    await expect(page.locator('#loginContainer')).toBeVisible();
    await expect(page.locator('#signupContainer')).toBeHidden();

    // Alternative pour revenir au login
    await page.click('#showSignup');
    await page.click('#showLogin');
    await expect(page.locator('#loginContainer')).toBeVisible();
    await expect(page.locator('#signupContainer')).toBeHidden();
  });

  test('Les deux formulaires ne sont jamais visibles simultanément', async ({ page }) => {
    const isOnlyOneVisible = async () => {
      const loginVisible = await page.locator('#loginContainer').isVisible();
      const signupVisible = await page.locator('#signupContainer').isVisible();
      return (loginVisible && !signupVisible) || (!loginVisible && signupVisible);
    };

    // Vérifications initiales
    await expect(isOnlyOneVisible()).resolves.toBeTruthy();

    // Tests de transitions
    await page.click('#showSignup');
    await expect(isOnlyOneVisible()).resolves.toBeTruthy();

    await page.click('#backToLogin');
    await expect(isOnlyOneVisible()).resolves.toBeTruthy();

    await page.click('#showSignup');
    await expect(isOnlyOneVisible()).resolves.toBeTruthy();

    await page.click('#showLogin');
    await expect(isOnlyOneVisible()).resolves.toBeTruthy();
  });
});

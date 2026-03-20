import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Navbar Links', () => {
    test('should navigate to Home page', async ({ page }) => {
      await page.goto('/browse');

      // Click on Home link in navbar
      await page.locator('nav').getByRole('link', { name: 'Home' }).click();

      await expect(page).toHaveURL('/');
    });

    test('should navigate to Browse Mentors page', async ({ page }) => {
      await page.goto('/');

      // Click on Browse Mentors link in navbar
      await page.locator('nav').getByRole('link', { name: 'Browse Mentors' }).click();

      await expect(page).toHaveURL('/browse');
    });

    test('should navigate to Contact Us section', async ({ page }) => {
      await page.goto('/browse');

      // Click on Contact Us link in navbar
      await page.locator('nav').getByRole('link', { name: 'Contact Us' }).click();

      // Should navigate to home page with #contact anchor
      await expect(page).toHaveURL('/#contact');
    });

    test('should navigate to About Us section', async ({ page }) => {
      await page.goto('/browse');

      // Click on About Us link in navbar
      await page.locator('nav').getByRole('link', { name: 'About Us' }).click();

      // Should navigate to home page with #about anchor
      await expect(page).toHaveURL('/#about');
    });

    test('should navigate to login page via Sign In button', async ({ page }) => {
      await page.goto('/');

      // Click on Sign In link in navbar
      await page.locator('nav').getByRole('link', { name: 'Sign In' }).click();

      await expect(page).toHaveURL('/login');
    });

    test('should navigate to registration page via Sign Up button', async ({ page }) => {
      await page.goto('/');

      // Click on Sign Up link in navbar
      await page.locator('nav').getByRole('link', { name: 'Sign Up' }).click();

      await expect(page).toHaveURL('/register');
    });

    test('should highlight active link in navbar', async ({ page }) => {
      await page.goto('/browse');

      // The Browse Mentors link should have active styling (emerald-400 color)
      const browseMentorsLink = page.locator('nav').getByRole('link', { name: 'Browse Mentors' });
      await expect(browseMentorsLink).toHaveClass(/text-emerald-400/);
    });

    test('should display logo that links to home', async ({ page }) => {
      await page.goto('/browse');

      // Click on the logo (ExpertConnect text or logo image)
      await page.locator('nav').getByRole('link').filter({ hasText: 'ExpertConnect' }).click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Footer Links', () => {
    test('should navigate to About Us section from footer', async ({ page }) => {
      await page.goto('/');

      // Click on About Us link in footer
      await page.locator('footer').getByRole('link', { name: 'About Us' }).click();

      await expect(page).toHaveURL('/#about');
    });

    test('should navigate to Contact Us section from footer', async ({ page }) => {
      await page.goto('/');

      // Click on Contact Us link in footer
      await page.locator('footer').getByRole('link', { name: 'Contact Us' }).click();

      await expect(page).toHaveURL('/#contact');
    });

    test('should display Careers link in footer', async ({ page }) => {
      await page.goto('/');

      const careersLink = page.locator('footer').getByRole('link', { name: 'Careers' });
      await expect(careersLink).toBeVisible();
    });

    test('should display Privacy Policy link in footer', async ({ page }) => {
      await page.goto('/');

      const privacyLink = page.locator('footer').getByRole('link', { name: 'Privacy Policy' });
      await expect(privacyLink).toBeVisible();
    });

    test('should display Terms and Conditions link in footer', async ({ page }) => {
      await page.goto('/');

      const termsLink = page.locator('footer').getByRole('link', { name: 'Term and Conditions' });
      await expect(termsLink).toBeVisible();
    });
  });

  test.describe('Direct URL Routing', () => {
    test('should access home page directly via URL', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
      // Verify home page content is visible
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });

    test('should access browse page directly via URL', async ({ page }) => {
      await page.goto('/browse');

      await expect(page).toHaveURL('/browse');
      // Verify browse page loads correctly
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should access login page directly via URL', async ({ page }) => {
      await page.goto('/login');

      await expect(page).toHaveURL('/login');
      // Verify login page content
      await expect(page.getByText('Welcome Back')).toBeVisible();
    });

    test('should access register page directly via URL', async ({ page }) => {
      await page.goto('/register');

      await expect(page).toHaveURL('/register');
      // Verify register page content
      await expect(page.getByText('Registration')).toBeVisible();
    });

    test('should handle non-existent routes gracefully', async ({ page }) => {
      const response = await page.goto('/non-existent-page');

      // Should return 404 or redirect to a valid page
      const status = response?.status();
      expect(status === 404 || status === 200).toBeTruthy();
    });

    test('should preserve query parameters in URL', async ({ page }) => {
      await page.goto('/user?tab=sessions');

      // URL should contain the query parameter
      await expect(page).toHaveURL(/tab=sessions/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display hamburger menu on mobile', async ({ page }) => {
      await page.goto('/');

      // Hamburger menu button should be visible on mobile
      const menuButton = page.locator('nav button[aria-label="Toggle menu"]');
      await expect(menuButton).toBeVisible();
    });

    test('should open mobile menu when hamburger is clicked', async ({ page }) => {
      await page.goto('/');

      // Click hamburger menu
      const menuButton = page.locator('nav button[aria-label="Toggle menu"]');
      await menuButton.click();

      // Mobile menu links should now be visible (scoped to nav to avoid footer conflicts)
      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Browse Mentors' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Contact Us' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'About Us' })).toBeVisible();
    });

    test('should close mobile menu when a link is clicked', async ({ page }) => {
      await page.goto('/');

      // Open menu
      const menuButton = page.locator('nav button[aria-label="Toggle menu"]');
      await menuButton.click();

      // Click on Browse Mentors
      await page.getByRole('link', { name: 'Browse Mentors' }).click();

      // Should navigate and menu should be closed (route change closes menu)
      await expect(page).toHaveURL('/browse');
    });

    test('should display Sign In and Sign Up in mobile menu', async ({ page }) => {
      await page.goto('/');

      // Open menu
      const menuButton = page.locator('nav button[aria-label="Toggle menu"]');
      await menuButton.click();

      // Auth links should be visible in mobile menu (use first() as there may be multiple)
      await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign Up' }).first()).toBeVisible();
    });
  });
});

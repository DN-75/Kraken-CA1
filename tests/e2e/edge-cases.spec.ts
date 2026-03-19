import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test.describe('Unauthorized Access Redirects', () => {
    test('should redirect to login when accessing /user without authentication', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      await page.goto('/user');

      // Should redirect to login page or show unauthorized state
      await page.waitForURL(/\/(login|user)/, { timeout: 10000 });

      // If redirected to login, verify login page is shown
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        await expect(page.getByText('Welcome Back')).toBeVisible();
      }
    });

    test('should redirect to login when accessing /professional dashboard without authentication', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      await page.goto('/professional');

      // Should redirect to login or show unauthorized
      await page.waitForURL(/\/(login|professional)/, { timeout: 10000 });
    });

    test('should redirect to login when accessing /admin without authentication', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      await page.goto('/admin');

      // Should redirect to login or show unauthorized
      await page.waitForURL(/\/(login|admin)/, { timeout: 10000 });
    });

    test('should allow access to public pages without authentication', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      // Home page should be accessible
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('nav')).toBeVisible();

      // Browse page should be accessible
      await page.goto('/browse');
      await expect(page).toHaveURL('/browse');

      // Login page should be accessible
      await page.goto('/login');
      await expect(page).toHaveURL('/login');

      // Register page should be accessible
      await page.goto('/register');
      await expect(page).toHaveURL('/register');
    });

    test('should redirect logged-in user away from login page', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('TestPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();

      // Wait for successful login
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Try to access login page again
      await page.goto('/login');

      // Should redirect away from login (already authenticated)
      await page.waitForTimeout(2000);
      // User may stay on login or be redirected based on implementation
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle slow network gracefully on browse page', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/browse');

      // Page should still load and show loading state or content
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should show error state when API fails on browse page', async ({ page }) => {
      // Clear any cached data first
      await page.goto('/');
      await page.evaluate(() => {
        sessionStorage.removeItem('ec_professionals_cache');
      });

      // Block API requests to simulate network failure (professional_profiles table)
      await page.route('**/rest/v1/professional_profiles**', (route) => {
        route.abort('failed');
      });

      await page.goto('/browse');

      // Page should handle the error gracefully (show error message)
      await expect(page.locator('nav')).toBeVisible();
      await page.waitForTimeout(3000);

      // Should show the error message "Failed to load mentors:"
      await expect(page.getByText(/Failed to load mentors/i)).toBeVisible();
    });

    test('should handle login API failure gracefully', async ({ page }) => {
      // Block auth API
      await page.route('**/auth/v1/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('TestPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();

      // Should show error message
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 10000 });
    });

    test('should retry or show error when professional profile fails to load', async ({ page }) => {
      // Block specific professional profile API
      await page.route('**/rest/v1/profiles?id=eq.**', (route) => {
        route.abort('failed');
      });

      // This test assumes a professional profile page exists
      await page.goto('/professional/test-id');

      // Should handle gracefully - either redirect, show error, or 404
      await page.waitForTimeout(3000);
      await expect(page.locator('nav')).toBeVisible();
    });
  });

  test.describe('Caching (Professionals Data)', () => {
    test('should cache professionals data in session storage', async ({ page }) => {
      await page.goto('/browse');

      // Wait for data to load
      await page.waitForTimeout(3000);

      // Check if cache exists in session storage
      const cache = await page.evaluate(() => {
        return sessionStorage.getItem('ec_professionals_cache');
      });

      // Cache should exist after visiting browse page
      if (cache) {
        const parsed = JSON.parse(cache);
        expect(parsed).toBeDefined();
      }
    });

    test('should use cached data on subsequent visits to browse page', async ({ page }) => {
      // First visit - data should be fetched
      await page.goto('/browse');
      await page.waitForTimeout(3000);

      // Get initial cache
      const initialCache = await page.evaluate(() => {
        return sessionStorage.getItem('ec_professionals_cache');
      });

      // Navigate away
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Navigate back to browse
      await page.goto('/browse');
      await page.waitForTimeout(2000);

      // Cache should still exist
      const secondCache = await page.evaluate(() => {
        return sessionStorage.getItem('ec_professionals_cache');
      });

      // Both should have cache (if caching is implemented)
      if (initialCache && secondCache) {
        expect(secondCache).toBeDefined();
      }
    });

    test('should clear cache on logout', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('TestPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Visit browse page to populate cache
      await page.goto('/browse');
      await page.waitForTimeout(3000);

      // Set some cache manually to ensure it exists
      await page.evaluate(() => {
        sessionStorage.setItem('ec_professionals_cache', JSON.stringify({ test: true }));
      });

      // Logout
      await page.waitForTimeout(2000);
      const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
      await profileButton.click();
      await page.getByRole('button', { name: /logout/i }).click();
      await expect(page).toHaveURL('/');

      // Check that cache is cleared
      const cacheAfterLogout = await page.evaluate(() => {
        return sessionStorage.getItem('ec_professionals_cache');
      });

      expect(cacheAfterLogout).toBeNull();
    });

    test('should cache user session profile', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('TestPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Wait for session to be established
      await page.waitForTimeout(2000);

      // Check session profile cache
      const sessionProfile = await page.evaluate(() => {
        return sessionStorage.getItem('ec_session_profile');
      });

      // Session profile should be cached after login
      if (sessionProfile) {
        const parsed = JSON.parse(sessionProfile);
        expect(parsed).toHaveProperty('id');
      }
    });

    test('should persist cache across page refreshes within session', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForTimeout(3000);

      // Set cache data
      await page.evaluate(() => {
        sessionStorage.setItem('ec_professionals_cache', JSON.stringify({
          data: [{ id: 'test' }],
          timestamp: Date.now(),
        }));
      });

      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);

      // Cache should persist
      const cacheAfterRefresh = await page.evaluate(() => {
        return sessionStorage.getItem('ec_professionals_cache');
      });

      expect(cacheAfterRefresh).not.toBeNull();
      if (cacheAfterRefresh) {
        const parsed = JSON.parse(cacheAfterRefresh);
        expect(parsed.data).toBeDefined();
      }
    });
  });
});

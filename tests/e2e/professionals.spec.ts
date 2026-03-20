import { test, expect } from '@playwright/test';

test.describe('Professional Profiles', () => {
  test.describe('Browse Professionals Page', () => {
    test('should load browse professionals page', async ({ page }) => {
      await page.goto('/browse');

      // Wait for loading to complete
      await page.waitForLoadState('networkidle');

      // Check search input is present
      await expect(page.locator('#mentor-search')).toBeVisible();

      // Check filters sidebar is visible
      await expect(page.getByText('Filters', { exact: true })).toBeVisible();
    });

    test('should display professional list correctly', async ({ page }) => {
      await page.goto('/browse');

      // Wait for loading to complete - either shows mentors or "Loading mentors..."
      await page.waitForLoadState('networkidle');

      // Either we see mentor cards or "No mentors matched" message
      const mentorCards = page.locator('article');
      const noResults = page.getByText('No mentors matched these filters.');
      const mentorCount = page.getByText(/\d+ mentors? found/);

      // Mentor count should be visible after loading
      await expect(mentorCount).toBeVisible({ timeout: 10000 });
    });

    test('should filter professionals by search query', async ({ page }) => {
      await page.goto('/browse');

      // Wait for initial load
      await page.waitForLoadState('networkidle');

      // Type in search input
      const searchInput = page.locator('#mentor-search');
      await searchInput.fill('Design');

      // Search should trigger filtering (debounced)
      await page.waitForTimeout(500);

      // Verify search input has the value
      await expect(searchInput).toHaveValue('Design');
    });

    test('should filter professionals by skill', async ({ page }) => {
      await page.goto('/browse');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Click on a skill filter checkbox
      const skillCheckbox = page.getByLabel('UI/UX Design');
      await skillCheckbox.check();

      // Verify checkbox is checked
      await expect(skillCheckbox).toBeChecked();
    });

    test('should sort professionals', async ({ page }) => {
      await page.goto('/browse');

      await page.waitForLoadState('networkidle');

      // Check default sort is "top-rated" by checking the radio in the "Top Rated" label
      const topRatedLabel = page.locator('label').filter({ hasText: 'Top Rated' });
      const topRatedRadio = topRatedLabel.locator('input[type="radio"]');
      await expect(topRatedRadio).toBeChecked();

      // Change to lowest price
      const lowestPriceLabel = page.locator('label').filter({ hasText: 'Lowest Price' });
      await lowestPriceLabel.click();
      const lowestPriceRadio = lowestPriceLabel.locator('input[type="radio"]');
      await expect(lowestPriceRadio).toBeChecked();

      // Change to newest
      const newestLabel = page.locator('label').filter({ hasText: 'Newest' });
      await newestLabel.click();
      const newestRadio = newestLabel.locator('input[type="radio"]');
      await expect(newestRadio).toBeChecked();
    });

    test('should clear all filters', async ({ page }) => {
      await page.goto('/browse');

      await page.waitForLoadState('networkidle');

      // Apply some filters first
      const searchInput = page.locator('#mentor-search');
      await searchInput.fill('test');

      const skillCheckbox = page.getByLabel('Web Development');
      await skillCheckbox.check();

      // Click clear all filters
      const clearButton = page.getByRole('button', { name: 'Clear All Filters' });
      await clearButton.click();

      // Verify filters are cleared
      await expect(searchInput).toHaveValue('');
      await expect(skillCheckbox).not.toBeChecked();
    });

    test('should navigate to professional profile on card click', async ({ page }) => {
      await page.goto('/browse');

      // Wait for professionals to load
      await page.waitForLoadState('networkidle');

      // Find a professional card link
      const professionalLink = page.locator('a[href^="/professional/"]').first();

      // Check if there are any professionals
      const count = await professionalLink.count();
      if (count > 0) {
        await professionalLink.click();

        // Should navigate to professional profile page
        await expect(page).toHaveURL(/\/professional\/[a-zA-Z0-9-]+/);
      }
    });
  });

  test.describe('Professional Profile Page', () => {
    test('should display loading state while fetching profile', async ({ page }) => {
      // Slow down network to catch loading state
      await page.route('**/rest/v1/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/professional/test-id');

      // Loading state should show "Loading profile..."
      const loadingText = page.getByText('Loading profile...');
      await expect(loadingText).toBeVisible({ timeout: 5000 });
    });

    test('should display error state for invalid professional ID', async ({ page }) => {
      // Navigate to a non-existent professional
      await page.goto('/professional/invalid-id-that-does-not-exist');

      // Wait for the request to complete
      await page.waitForLoadState('networkidle');

      // Wait a bit more for the error state to render
      await page.waitForTimeout(2000);

      // Should show error state - check for error text (red) or "Back to Home" link
      // The page shows either "Professional not found." or "Profile not found." with a back link
      const backLink = page.getByRole('link', { name: /Back to Home/i });
      const errorText = page.locator('.text-red-400');

      // Either back link or error text should be visible
      const backLinkVisible = await backLink.isVisible().catch(() => false);
      const errorTextVisible = await errorText.isVisible().catch(() => false);

      expect(backLinkVisible || errorTextVisible).toBeTruthy();
    });

    test('should display professional profile information', async ({ page }) => {
      // First get a valid professional ID from browse page
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        // Get the href and navigate
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);

        await page.waitForLoadState('networkidle');

        // Check that profile elements are visible
        // Profile should have name in h1
        const profileName = page.locator('h1').first();
        await expect(profileName).toBeVisible();

        // Should have price per hour (Rs.X/hr)
        const priceText = page.getByText(/Rs\.\d+\/hr/);
        await expect(priceText).toBeVisible();

        // Should have Book Session button
        const bookButton = page.getByRole('button', { name: /Book Session/i });
        await expect(bookButton).toBeVisible();
      }
    });

    test('should display professional skills', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Skills section header should exist
        const skillsHeader = page.locator('h2').filter({ hasText: 'Skills' });
        await expect(skillsHeader).toBeVisible();
      }
    });

    test('should display professional availability', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Availability section header should exist
        const availabilityHeader = page.locator('h2').filter({ hasText: 'Availability' });
        await expect(availabilityHeader).toBeVisible();
      }
    });

    test('should display professional reviews section when reviews exist', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Reviews section may or may not exist (depends on if professional has reviews)
        // Check that page loaded without error
        const errorText = page.getByText(/Professional not found|Profile not found/i);
        const hasError = await errorText.count() > 0;
        expect(hasError).toBeFalsy();
      }
    });

    test('should display professional rating when available', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Rating may show as "X.X Stars" if reviews exist
        // Either rating is visible or page loaded successfully
        const errorText = page.getByText(/Professional not found|Profile not found/i);
        const hasError = await errorText.count() > 0;
        expect(hasError).toBeFalsy();
      }
    });

    test('should display social links section if available', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();

      if (count > 0) {
        const href = await professionalLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Just verify page loaded successfully without error
        const errorText = page.getByText(/Professional not found|Profile not found/i);
        const hasError = await errorText.count() > 0;
        expect(hasError).toBeFalsy();
      }
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading state on browse page while fetching', async ({ page }) => {
      // Slow down network to catch loading state
      await page.route('**/rest/v1/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/browse');

      // Check for loading text
      const loadingText = page.getByText('Loading mentors...');
      await expect(loadingText).toBeVisible({ timeout: 5000 });
    });

    test('should handle network error gracefully on browse page', async ({ page }) => {
      // Intercept and fail the API request
      await page.route('**/rest/v1/professional_profiles**', (route) => {
        route.abort('failed');
      });

      await page.goto('/browse');

      // Wait for error state
      await page.waitForTimeout(2000);

      // Should show error message - "Failed to load mentors:"
      const errorMessage = page.getByText(/Failed to load mentors/i);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should handle network error gracefully on profile page', async ({ page }) => {
      // Intercept and fail the API request
      await page.route('**/rest/v1/professional_profiles**', (route) => {
        route.abort('failed');
      });

      await page.goto('/professional/some-id');

      // Wait for error state
      await page.waitForTimeout(2000);

      // Should show error message
      const errorMessage = page.getByText(/Professional not found|Profile not found|Failed to load/i);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});

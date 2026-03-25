import type { Locator, Page } from '@playwright/test';
import { test, expect, loginAs } from '../fixtures';

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasOverflow).toBeFalsy();
}

async function getFirstProfessionalUrl(page: Page): Promise<string | null> {
  for (const route of ['/', '/browse']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const profileLink = page.locator('a[href^="/professional/"]').first();
    if (await profileLink.isVisible().catch(() => false)) {
      return profileLink.getAttribute('href');
    }
  }

  return null;
}

async function openBookingDialog(page: Page): Promise<Locator> {
  const professionalUrl = await getFirstProfessionalUrl(page);
  test.skip(!professionalUrl, 'No professionals available for responsive booking tests');

  await page.goto(professionalUrl!, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Book Session/i }).click();

  const dialog = page.locator('.fixed.inset-0');
  await expect(dialog.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

  return dialog;
}

test.describe('Viewport / Responsive Testing', () => {
  test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should use a mobile navigation drawer on the home page', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.locator('nav button[aria-label="Toggle menu"]');
      await expect(menuButton).toBeVisible();
      await expect(page.locator('nav').getByRole('link', { name: 'Browse Mentors' })).not.toBeVisible();

      await menuButton.click();

      const navigation = page.getByRole('navigation');
      await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Browse Mentors' })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Sign Up' }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test('should keep browse filters and search usable on mobile', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const filtersHeading = page.getByText('Filters', { exact: true });
      const searchInput = page.locator('#mentor-search');
      await expect(filtersHeading).toBeVisible();
      await expect(searchInput).toBeVisible();

      const filtersBox = await filtersHeading.boundingBox();
      const searchBox = await searchInput.boundingBox();

      expect(filtersBox).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect((filtersBox?.y ?? 0) < (searchBox?.y ?? 0)).toBeTruthy();
      await expectNoHorizontalOverflow(page);
    });

    test('should keep the booking dialog within the mobile viewport width', async ({ page }) => {
      await loginAs(page, 'user');

      const dialog = await openBookingDialog(page);
      const dialogMetrics = await dialog.evaluate((element) => {
        const { width } = element.getBoundingClientRect();
        return {
          dialogWidth: width,
          viewportWidth: window.innerWidth,
        };
      });

      await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /Confirm Booking/i })).toBeVisible();
      expect(dialogMetrics.dialogWidth).toBeLessThanOrEqual(dialogMetrics.viewportWidth);
      await expectNoHorizontalOverflow(page);
    });
  });

  test.describe('Tablet', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should switch to desktop navigation links at tablet width', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('nav').getByRole('link', { name: 'Browse Mentors' })).toBeVisible();
      await expect(page.locator('nav button[aria-label="Toggle menu"]')).not.toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test('should render mentor cards in multiple columns on browse page', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('article');
      const cardCount = await cards.count();
      test.skip(cardCount < 2, 'Need at least two mentor cards for tablet layout verification');

      const firstBox = await cards.first().boundingBox();
      const secondBox = await cards.nth(1).boundingBox();

      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      expect(Math.abs((firstBox?.y ?? 0) - (secondBox?.y ?? 0)) < 20).toBeTruthy();
      await expectNoHorizontalOverflow(page);
    });
  });

  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('should display browse filters beside the results on desktop', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const filtersPanel = page.getByText('Filters', { exact: true });
      const searchInput = page.locator('#mentor-search');
      await expect(filtersPanel).toBeVisible();
      await expect(searchInput).toBeVisible();

      const filtersBox = await filtersPanel.boundingBox();
      const searchBox = await searchInput.boundingBox();

      expect(filtersBox).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect((filtersBox?.x ?? 0) < (searchBox?.x ?? 0)).toBeTruthy();
      await expectNoHorizontalOverflow(page);
    });
  });
});

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

async function getFirstProfessionalUrl(page: Page): Promise<string | null> {
  await page.goto('/browse');
  await page.waitForLoadState('networkidle');

  const professionalLink = page.locator('a[href^="/professional/"]').first();
  if ((await professionalLink.count()) === 0) {
    return null;
  }

  return professionalLink.getAttribute('href');
}

async function openBookingPopup(page: Page) {
  const professionalUrl = await getFirstProfessionalUrl(page);
  test.skip(!professionalUrl, 'No professionals available for styling verification');

  await page.goto(professionalUrl!);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Book Session/i }).click();
  await expect(page.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

  return page.locator('.fixed.inset-0');
}

test.describe('CSS/Styling State Verification', () => {
  test('should apply active desktop navbar styling to the current route', async ({ page }) => {
    await page.goto('/browse');

    const activeLink = page.locator('nav').getByRole('link', { name: 'Browse Mentors' });
    const inactiveLink = page.locator('nav').getByRole('link', { name: 'Home' });

    await expect(activeLink).toHaveClass(/text-emerald-400/);
    await expect(activeLink).toHaveClass(/font-semibold/);
    await expect(inactiveLink).toHaveClass(/text-white/);
    await expect(inactiveLink).toHaveClass(/hover:text-emerald-400/);
    await expect(inactiveLink).not.toHaveClass(/font-semibold/);
  });

  test('should apply active mobile menu styling to the current route', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/browse');

    await page.locator('nav button[aria-label="Toggle menu"]').click();

    const activeMobileLink = page.getByRole('navigation').getByRole('link', { name: 'Browse Mentors' });
    await expect(activeMobileLink).toHaveClass(/text-emerald-400/);
    await expect(activeMobileLink).toHaveClass(/bg-emerald-500\/10/);
  });

  test('should update time slot styling when a slot is selected', async ({ userPage }) => {
    const popup = await openBookingPopup(userPage);
    const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    const slotCount = await timeSlotButtons.count();

    test.skip(slotCount === 0, 'No time slots available for styling verification');

    const firstSlot = timeSlotButtons.first();
    await firstSlot.click();

    await expect(firstSlot).toHaveClass(/border-emerald-400/);
    await expect(firstSlot).toHaveClass(/bg-emerald-400\/20/);
    await expect(firstSlot).toHaveClass(/text-white/);
  });

  test('should change confirm button styling between disabled and enabled states', async ({ userPage }) => {
    const popup = await openBookingPopup(userPage);
    const confirmButton = popup.getByRole('button', { name: /Confirm Booking/i });
    const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    const slotCount = await timeSlotButtons.count();

    test.skip(slotCount === 0, 'No time slots available for styling verification');

    await expect(confirmButton).toBeDisabled();

    const disabledOpacity = await confirmButton.evaluate((element) => window.getComputedStyle(element).opacity);

    await timeSlotButtons.first().click();
    await expect(confirmButton).toBeEnabled();

    await expect
      .poll(() => confirmButton.evaluate((element) => window.getComputedStyle(element).opacity))
      .toBe('1');

    const enabledOpacity = await confirmButton.evaluate((element) => window.getComputedStyle(element).opacity);

    expect(disabledOpacity).toBe('0.6');
    expect(enabledOpacity).toBe('1');
  });

  test('should render error feedback with red styling after a failed booking request', async ({ userPage }) => {
    await userPage.route('**/api/bookings', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'This time slot is no longer available' }),
      });
    });

    const popup = await openBookingPopup(userPage);
    const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    const slotCount = await timeSlotButtons.count();

    test.skip(slotCount === 0, 'No time slots available for styling verification');

    await timeSlotButtons.first().click();
    await popup.getByRole('button', { name: /Confirm Booking/i }).click();

    const errorMessage = popup.locator('.text-red-200');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toHaveClass(/border-red-400\/30/);
    await expect(errorMessage).toHaveClass(/bg-red-500\/10/);
  });
});

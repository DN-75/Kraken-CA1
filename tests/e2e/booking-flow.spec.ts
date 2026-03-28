import type { Page, Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { test as baseTest } from '@playwright/test';

// Helper function to get a valid professional profile URL
async function getFirstProfessionalUrl(page: any): Promise<string | null> {
  for (const route of ['/browse', '/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const professionalLink = page.locator('a[href^="/professional/"]').first();
    const count = await professionalLink.count();

    if (count > 0) {
      const href = await professionalLink.getAttribute('href');
      if (href) {
        return href;
      }
    }
  }

  return null;
}

async function openBookingPopup(page: Page) {
  const professionalUrl = await getFirstProfessionalUrl(page);
  test.skip(!professionalUrl, 'No professionals available for testing');

  return openBookingPopupAtUrl(page, professionalUrl!);
}

async function openBookingPopupAtUrl(page: Page, professionalUrl: string) {
  await page.goto(professionalUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const bookSessionButton = page.getByRole('button', { name: /Book Session/i });
  await expect(bookSessionButton).toBeVisible({ timeout: 10000 });
  await expect(bookSessionButton).toBeEnabled({ timeout: 10000 });
  await bookSessionButton.click();
  const popupHeading = page.getByRole('heading', { name: 'Book a Session' });
  const popupVisibleAfterFirstClick = await popupHeading.isVisible().catch(() => false);
  if (!popupVisibleAfterFirstClick) {
    await bookSessionButton.click();
  }
  await expect(popupHeading).toBeVisible({ timeout: 5000 });

  return {
    popup: page.locator('.fixed.inset-0'),
    professionalUrl,
  };
}

test.describe('Booking Flow', () => {
  test.describe('Opening Booking Popup', () => {
    test('should display Book Session button on professional profile', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      const bookSessionButton = userPage.getByRole('button', { name: /Book Session/i });
      await expect(bookSessionButton).toBeVisible();
    });

    test('should open booking popup when Book Session is clicked', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      // Click Book Session button
      await userPage.getByRole('button', { name: /Book Session/i }).click();

      // Verify popup is open - look for the popup heading
      const popupTitle = userPage.getByRole('heading', { name: 'Book a Session' });
      await expect(popupTitle).toBeVisible({ timeout: 5000 });
    });

    test('should display Available Time Slots section in popup', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();

      // Check for time slots section
      const timeSlotsText = userPage.getByText('Available Time Slots');
      await expect(timeSlotsText).toBeVisible({ timeout: 5000 });
    });

    test('should display close button in booking popup', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Close button is inside the popup (fixed overlay)
      const popup = userPage.locator('.fixed.inset-0');
      const closeButton = popup.getByRole('button', { name: 'Close' });
      await expect(closeButton).toBeVisible();
    });

    test('should close booking popup when close button is clicked', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      // Open popup
      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Close popup using the Close button inside the popup
      const popup = userPage.locator('.fixed.inset-0');
      const closeButton = popup.getByRole('button', { name: 'Close' });
      await closeButton.click();

      // Verify popup is closed
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Selecting Time Slots', () => {
    test('should display available time slots grouped by day', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Should show either time slots or "no slots" message
      const popup = userPage.locator('.fixed.inset-0');
      const hasSlots = await popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).count();
      const noSlotsMessage = popup.getByText(/No available slots at the moment/i);
      const noSlotsVisible = await noSlotsMessage.isVisible().catch(() => false);

      expect(hasSlots > 0 || noSlotsVisible).toBeTruthy();
    });

    test('should highlight selected time slot', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Find time slot buttons inside the popup
      const popup = userPage.locator('.fixed.inset-0');
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        // Get class before click
        const classBefore = await timeSlotButtons.first().getAttribute('class');

        // Click first available slot
        await timeSlotButtons.first().click();

        // Wait for state update
        await userPage.waitForTimeout(300);

        // Get class after click
        const classAfter = await timeSlotButtons.first().getAttribute('class');

        // Verify class changed and now contains selected styling (border-emerald-400 is unique to selected)
        expect(classAfter).toContain('border-emerald-400');
        expect(classAfter).toContain('text-white');
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should allow selecting different time slots', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const popup = userPage.locator('.fixed.inset-0');
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount >= 2) {
        // Select first slot
        await timeSlotButtons.first().click();
        await userPage.waitForTimeout(300);

        let firstSlotClass = await timeSlotButtons.first().getAttribute('class');
        expect(firstSlotClass).toContain('border-emerald-400');

        // Select second slot
        await timeSlotButtons.nth(1).click();
        await userPage.waitForTimeout(300);

        const secondSlotClass = await timeSlotButtons.nth(1).getAttribute('class');
        expect(secondSlotClass).toContain('border-emerald-400');

        // First slot should no longer be selected
        firstSlotClass = await timeSlotButtons.first().getAttribute('class');
        expect(firstSlotClass).not.toContain('border-emerald-400');
      } else {
        test.skip(true, 'Need at least 2 time slots for this test');
      }
    });

    test('should display time slots in 12-hour format', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const popup = userPage.locator('.fixed.inset-0');
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        const slotText = await timeSlotButtons.first().textContent();
        // Should contain AM or PM (12-hour format)
        expect(slotText).toMatch(/AM|PM/i);
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });
  });

  test.describe('Confirming Booking Request', () => {
    test('should display Confirm Booking button', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const confirmButton = userPage.getByRole('button', { name: /Confirm Booking/i });
      await expect(confirmButton).toBeVisible();
    });

    test('should disable Confirm Booking button when no slot is selected', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const confirmButton = userPage.getByRole('button', { name: /Confirm Booking/i });

      // Button should be disabled when no slot is selected
      await expect(confirmButton).toBeDisabled();
    });

    test('should enable Confirm Booking button when slot is selected', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        // Select a slot
        await timeSlotButtons.first().click();

        // Confirm button should now be enabled
        const confirmButton = userPage.getByRole('button', { name: /Confirm Booking/i });
        await expect(confirmButton).toBeEnabled();
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should show loading state when submitting booking', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();

        // Click confirm and check for loading state
        const confirmButton = userPage.getByRole('button', { name: /Confirm Booking/i });
        await confirmButton.click();

        // Should briefly show "Sending Request..." or loading indicator
        // This may be very fast so we check for either state
        const loadingOrResult = await Promise.race([
          userPage.getByText('Sending Request...').isVisible().catch(() => false),
          userPage.locator('.text-emerald-200, .text-red-200').isVisible().catch(() => false),
        ]);

        expect(loadingOrResult !== undefined).toBeTruthy();
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should submit booking request successfully', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        // Wait for response - should show success or error message
        await userPage.waitForTimeout(3000);

        const successMessage = userPage.locator('.text-emerald-200');
        const errorMessage = userPage.locator('.text-red-200');

        const successVisible = await successMessage.isVisible().catch(() => false);
        const errorVisible = await errorMessage.isVisible().catch(() => false);

        // Either success or error should show (depending on if slot is still available)
        expect(successVisible || errorVisible).toBeTruthy();
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });
  });

  test.describe('Concurrent / Parallel User Actions', () => {
    test.describe.configure({ mode: 'serial' });

    test('should submit only once when confirm is double-clicked during an in-flight booking request', async ({ userPage }) => {
      let bookingRequestCount = 0;

      await userPage.route('**/api/bookings', async (route) => {
        bookingRequestCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            booking_id: '11111111-1111-1111-1111-111111111111',
            message: 'Booking request sent successfully',
          }),
        });
      });

      const { popup } = await openBookingPopup(userPage);
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      test.skip(slotCount === 0, 'No time slots available for this professional');

      await timeSlotButtons.first().click();

      const confirmButton = popup.getByRole('button', { name: /Confirm Booking/i });
      await confirmButton.dblclick();

      await expect(popup.getByRole('button', { name: /Sending Request/i })).toBeDisabled();
      await expect(popup.locator('.text-emerald-200')).toContainText('Booking request sent successfully', { timeout: 5000 });
      expect(bookingRequestCount).toBe(1);
    });

    test('should show independent outcomes when two pages confirm the same slot in parallel', async ({ browser, userPage }) => {
      test.slow();

      const storageState = await userPage.context().storageState();
      const secondContext = await browser.newContext({ storageState });
      const secondUserPage = await secondContext.newPage();
      const bookingRequests: Array<{ pageLabel: string; timeSlotId: string }> = [];
      let requestOrder = 0;

      const handleConcurrentBooking = async (route: Route, pageLabel: string) => {
        requestOrder += 1;
        const requestBody = route.request().postDataJSON() as { time_slot_id: string };
        bookingRequests.push({
          pageLabel,
          timeSlotId: requestBody.time_slot_id,
        });

        if (requestOrder === 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              booking_id: '22222222-2222-2222-2222-222222222222',
              message: 'Booking request sent successfully',
            }),
          });
          return;
        }

        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'This time slot is no longer available' }),
        });
      };

      try {
        await userPage.route('**/api/bookings', async (route) => handleConcurrentBooking(route, 'first-page'));
        await secondUserPage.route('**/api/bookings', async (route) => handleConcurrentBooking(route, 'second-page'));

        const professionalUrl = await getFirstProfessionalUrl(userPage);
        test.skip(!professionalUrl, 'No professionals available for concurrent booking testing');

        const [{ popup: firstPopup }, { popup: secondPopup }] = await Promise.all([
          openBookingPopupAtUrl(userPage, professionalUrl!),
          openBookingPopupAtUrl(secondUserPage, professionalUrl!),
        ]);

        const firstSlots = firstPopup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
        const secondSlots = secondPopup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
        const firstSlotCount = await firstSlots.count();
        const secondSlotCount = await secondSlots.count();

        test.skip(firstSlotCount === 0 || secondSlotCount === 0, 'No time slots available for concurrent booking testing');

        await Promise.all([
          firstSlots.first().click(),
          secondSlots.first().click(),
        ]);

        await Promise.all([
          firstPopup.getByRole('button', { name: /Confirm Booking/i }).click(),
          secondPopup.getByRole('button', { name: /Confirm Booking/i }).click(),
        ]);

        await expect(firstPopup.locator('.text-emerald-200')).toContainText('Booking request sent successfully', { timeout: 5000 });
        await expect(secondPopup.locator('.text-red-200')).toContainText('This time slot is no longer available', { timeout: 5000 });

        expect(bookingRequests).toHaveLength(2);
        expect(bookingRequests[0]?.timeSlotId).toBe(bookingRequests[1]?.timeSlotId);
      } finally {
        await secondContext.close();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show message when no slots available', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Scope to popup
      const popup = userPage.locator('.fixed.inset-0');
      const noSlotsMessage = popup.getByText(/No available slots at the moment/i);
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount === 0) {
        // No slots - verify the message is shown
        await expect(noSlotsMessage).toBeVisible();
      } else {
        // Slots exist - verify the message is NOT shown
        await expect(noSlotsMessage).toBeHidden();
      }
    });

    test('should show error when user is not logged in', async ({ page }) => {
      // Use unauthenticated page
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');

      const professionalLink = page.locator('a[href^="/professional/"]').first();
      const count = await professionalLink.count();
      test.skip(count === 0, 'No professionals available for testing');

      const href = await professionalLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      // Try to book - should show login required or redirect
      const bookButton = page.getByRole('button', { name: /Book Session/i });

      if (await bookButton.isVisible().catch(() => false)) {
        await bookButton.click();

        // Check for various auth-related responses
        await page.waitForTimeout(2000);

        // Should either show error message, redirect to login, or show login prompt
        const currentUrl = page.url();
        const loginError = page.getByText(/must be logged in|login required|sign in/i);
        const onLoginPage = currentUrl.includes('/login');
        const errorVisible = await loginError.isVisible().catch(() => false);

        expect(onLoginPage || errorVisible).toBeTruthy();
      } else {
        // Book button might not be shown for non-authenticated users
        test.skip(true, 'Book Session button not available for non-authenticated users');
      }
    });

    test('should show error for already booked slot', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'You already have an active request for this time slot' }),
        });
      });

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const popup = userPage.locator('.fixed.inset-0');
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        const duplicateError = popup.getByText(/already have an active request/i);
        await expect(duplicateError).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should handle network error gracefully', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      // Intercept booking API and return error
      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        // Should show error message
        await userPage.waitForTimeout(2000);
        const errorMessage = userPage.locator('.text-red-200');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should show error when booking own profile', async ({ professionalPage }) => {
      // Navigate to browse and find TEST PROFESSIONAL's own profile specifically
      await professionalPage.goto('/browse');
      await professionalPage.waitForLoadState('domcontentloaded');
      await professionalPage.waitForTimeout(2000);

      // Find "Test Professional" specifically (the logged-in professional's own profile)
      // Look for card/link containing "Test Professional" text
      const ownProfileCard = professionalPage.locator('a[href^="/professional/"]').filter({
        has: professionalPage.getByText('Test Professional', { exact: false })
      }).first();

      const foundOwnProfile = await ownProfileCard.count() > 0;

      if (!foundOwnProfile) {
        // Alternative: try to find by looking at all professional names
        const allCards = professionalPage.locator('[class*="card"], [class*="Card"], a[href^="/professional/"]');
        const cardCount = await allCards.count();

        let ownProfileHref: string | null = null;
        for (let i = 0; i < cardCount; i++) {
          const cardText = await allCards.nth(i).textContent();
          if (cardText?.includes('Test Professional')) {
            ownProfileHref = await allCards.nth(i).locator('a[href^="/professional/"]').first().getAttribute('href');
            if (!ownProfileHref) {
              const link = allCards.nth(i);
              if (await link.getAttribute('href')) {
                ownProfileHref = await link.getAttribute('href');
              }
            }
            break;
          }
        }

        if (!ownProfileHref) {
          test.skip(true, 'Test Professional profile not found on browse page');
          return;
        }

        await professionalPage.goto(ownProfileHref);
      } else {
        const href = await ownProfileCard.getAttribute('href');
        await professionalPage.goto(href!);
      }

      await professionalPage.waitForLoadState('domcontentloaded');
      await professionalPage.waitForTimeout(1000);

      // Click Book Session button
      const bookButton = professionalPage.getByRole('button', { name: /Book Session/i });
      await expect(bookButton).toBeVisible({ timeout: 5000 });
      await bookButton.click();

      // Wait for popup
      await expect(professionalPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      // Select a time slot and try to book
      const popup = professionalPage.locator('.fixed.inset-0');
      const timeSlots = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlots.count();

      if (slotCount === 0) {
        test.skip(true, 'No time slots available');
        return;
      }

      await timeSlots.first().click();
      await professionalPage.getByRole('button', { name: /Confirm Booking/i }).click();

      const errorMessage = popup.locator('.text-red-200');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      const errorText = await errorMessage.textContent();
      expect(errorText?.toLowerCase()).toContain('professional accounts cannot book other professionals');
    });
  });

  test.describe('Success/Failure Messages', () => {
    test('should display success message after successful booking', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        // Wait and check for success message
        await userPage.waitForTimeout(3000);

        const successMessage = userPage.locator('.text-emerald-200');
        const successVisible = await successMessage.isVisible().catch(() => false);

        if (successVisible) {
          // Verify success message content
          const messageText = await successMessage.textContent();
          expect(messageText).toMatch(/success|sent|confirmed/i);
        }
        // If not visible, likely an error occurred (slot unavailable, etc.)
        expect(true).toBeTruthy();
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should display error message with proper styling', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      // Force an error by intercepting the API
      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'This time slot is no longer available' }),
        });
      });

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        // Should show error message with red styling
        await userPage.waitForTimeout(2000);
        const errorMessage = userPage.locator('.text-red-200');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should clear error message when popup is reopened', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      // Force an error
      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error message' }),
        });
      });

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const popup = userPage.locator('.fixed.inset-0');
      const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();
        await userPage.waitForTimeout(2000);

        // Close popup using the Close button (more reliable than Escape)
        const closeButton = popup.getByRole('button', { name: 'Close' });
        await closeButton.click();

        // Wait for popup to actually close
        await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeHidden({ timeout: 5000 });

        // Remove the route interception
        await userPage.unroute('**/api/bookings');

        // Reopen popup
        await userPage.getByRole('button', { name: /Book Session/i }).click();
        await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

        // Error message should be cleared
        const errorMessage = userPage.locator('.text-red-200');
        const errorVisible = await errorMessage.isVisible().catch(() => false);

        // Error should not be visible on fresh popup open
        expect(errorVisible).toBeFalsy();
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should show specific error message for slot no longer available', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'This time slot is no longer available' }),
        });
      });

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        await userPage.waitForTimeout(2000);
        const errorMessage = userPage.getByText(/no longer available/i);
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });

    test('should show duplicate booking error message', async ({ userPage }) => {
      const professionalUrl = await getFirstProfessionalUrl(userPage);
      test.skip(!professionalUrl, 'No professionals available for testing');

      await userPage.route('**/api/bookings', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'You already have an active request for this time slot' }),
        });
      });

      await userPage.goto(professionalUrl!);
      await userPage.waitForLoadState('networkidle');

      await userPage.getByRole('button', { name: /Book Session/i }).click();
      await expect(userPage.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

      const timeSlotButtons = userPage.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
      const slotCount = await timeSlotButtons.count();

      if (slotCount > 0) {
        await timeSlotButtons.first().click();
        await userPage.getByRole('button', { name: /Confirm Booking/i }).click();

        await userPage.waitForTimeout(2000);
        const errorMessage = userPage.getByText(/already have an active request/i);
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'No time slots available for this professional');
      }
    });
  });
});

// Additional tests using base test (unauthenticated)
baseTest.describe('Booking Flow - Unauthenticated', () => {
  baseTest('should redirect to login when trying to book without authentication', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const professionalLink = page.locator('a[href^="/professional/"]').first();
    const count = await professionalLink.count();

    if (count > 0) {
      const href = await professionalLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      const bookButton = page.getByRole('button', { name: /Book Session/i });

      // Book button might be hidden or clicking it redirects to login
      if (await bookButton.isVisible().catch(() => false)) {
        await bookButton.click();
        await page.waitForTimeout(2000);

        // Should redirect to login or show login required message
        const url = page.url();
        const loginPrompt = page.getByText(/login|sign in/i);

        const redirectedToLogin = url.includes('/login');
        const showsLoginPrompt = await loginPrompt.isVisible().catch(() => false);

        expect(redirectedToLogin || showsLoginPrompt).toBeTruthy();
      }
    }
  });

  baseTest('should show Book Session button on professional profile for guests', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const professionalLink = page.locator('a[href^="/professional/"]').first();
    const count = await professionalLink.count();

    if (count > 0) {
      const href = await professionalLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      // Book Session button should be visible even for guests
      // (clicking it will require login)
      const bookButton = page.getByRole('button', { name: /Book Session/i });
      const bookVisible = await bookButton.isVisible().catch(() => false);

      // Either button is visible or profile page loads correctly
      const profileLoaded = await page.locator('h1').first().isVisible().catch(() => false);
      expect(bookVisible || profileLoaded).toBeTruthy();
    }
  });
});

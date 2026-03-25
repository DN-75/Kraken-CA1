import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const PROFESSIONALS_API = '**/rest/v1/professional_profiles**';
const BOOKINGS_API = '**/api/bookings';
const PROFESSIONALS_CACHE_KEY = 'ec_professionals_cache';

type ProfessionalRecord = {
  id: string;
  field: string;
  job: string | null;
  job_title: string | null;
  price_per_hour: number;
  created_at: string;
  profiles: {
    name: string;
    profile_photo: string | null;
  };
  professional_skills: Array<{
    skill: string;
    skill_other_label: string | null;
  }>;
  reviews: Array<{ rating: number }>;
};

function buildProfessional(name: string, jobTitle: string): ProfessionalRecord {
  return {
    id: `mock-${name.toLowerCase().replace(/\s+/g, '-')}`,
    field: 'Software Engineering',
    job: 'Mock Labs',
    job_title: jobTitle,
    price_per_hour: 120,
    created_at: '2026-01-01T00:00:00.000Z',
    profiles: {
      name,
      profile_photo: null,
    },
    professional_skills: [
      {
        skill: 'API Testing',
        skill_other_label: null,
      },
    ],
    reviews: [{ rating: 5 }],
  };
}

async function clearProfessionalsCache(page: Page) {
  await page.addInitScript((cacheKey) => {
    sessionStorage.removeItem(cacheKey);
  }, PROFESSIONALS_CACHE_KEY);
}

async function findFirstProfessionalUrl(page: Page): Promise<string | null> {
  for (const route of ['/browse', '/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const link = page.locator('a[href^="/professional/"]').first();
    if (await link.isVisible().catch(() => false)) {
      return link.getAttribute('href');
    }
  }

  return null;
}

async function openBookingDialog(page: Page): Promise<Locator> {
  const professionalUrl = await findFirstProfessionalUrl(page);
  test.skip(!professionalUrl, 'No professionals available for interception tests');

  await page.goto(professionalUrl!, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Book Session/i }).click();

  const dialog = page.locator('.fixed.inset-0');
  await expect(dialog.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

  return dialog;
}

test.describe('API Response Interception and Mocking', () => {
  test('should render mocked professionals on the browse page', async ({ page }) => {
    await clearProfessionalsCache(page);

    const mockedProfessionals: ProfessionalRecord[] = [
      buildProfessional('Mock Mentor One', 'Intercepted Frontend Mentor'),
      buildProfessional('Mock Mentor Two', 'Response Mock Engineer'),
    ];

    await page.route(PROFESSIONALS_API, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedProfessionals),
      });
    });

    await page.goto('/browse');

    await expect(page.getByText('Mock Mentor One')).toBeVisible();
    await expect(page.getByText('Mock Mentor Two')).toBeVisible();
    await expect(page.getByText('Intercepted Frontend Mentor')).toBeVisible();
    await expect(page.getByText('Response Mock Engineer')).toBeVisible();
  });

  test('should modify a fetched professionals response before rendering', async ({ page }) => {
    await clearProfessionalsCache(page);

    await page.route(PROFESSIONALS_API, async (route) => {
      const upstreamResponse = await route.fetch();
      const professionals = (await upstreamResponse.json()) as ProfessionalRecord[];

      const patchedProfessionals = [
        buildProfessional('Injected Mentor', 'Patched via route.fetch'),
        ...professionals,
      ];

      await route.fulfill({
        response: upstreamResponse,
        contentType: 'application/json',
        body: JSON.stringify(patchedProfessionals),
      });
    });

    await page.goto('/browse');

    await expect(page.getByText('Injected Mentor')).toBeVisible();
    await expect(page.getByText('Patched via route.fetch')).toBeVisible();
  });

  test('should intercept booking creation and confirm the selected slot was posted', async ({ userPage }) => {
    let interceptedTimeSlotId = '';

    await userPage.route(BOOKINGS_API, async (route) => {
      const requestBody = route.request().postDataJSON() as { time_slot_id?: string };
      interceptedTimeSlotId = requestBody.time_slot_id ?? '';

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          booking_id: '33333333-3333-3333-3333-333333333333',
          message: 'Mocked booking request sent successfully',
        }),
      });
    });

    const dialog = await openBookingDialog(userPage);
    const timeSlots = dialog.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    const slotCount = await timeSlots.count();

    test.skip(slotCount === 0, 'No time slots available for interception tests');

    await timeSlots.first().click();
    await dialog.getByRole('button', { name: /Confirm Booking/i }).click();

    await expect(dialog.locator('.text-emerald-200')).toContainText('Mocked booking request sent successfully', {
      timeout: 5000,
    });
    await expect.poll(() => interceptedTimeSlotId).not.toBe('');
  });
});

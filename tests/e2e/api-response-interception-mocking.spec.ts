import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

type MockProfessional = {
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

function buildMockProfessional(name: string, overrides: Partial<MockProfessional> = {}): MockProfessional {
  return {
    id: `mock-${name.toLowerCase().replace(/\s+/g, '-')}`,
    field: 'Software Engineering',
    job: 'Mock Labs',
    job_title: 'API Mock Specialist',
    price_per_hour: 150,
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
    ...overrides,
  };
}

async function clearProfessionalsCache(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('ec_professionals_cache');
  });
}

async function getFirstProfessionalUrl(page: Page): Promise<string | null> {
  for (const route of ['/browse', '/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const professionalLink = page.locator('a[href^="/professional/"]').first();
    if ((await professionalLink.count()) > 0) {
      return professionalLink.getAttribute('href');
    }
  }

  return null;
}

async function openBookingPopup(page: Page) {
  const professionalUrl = await getFirstProfessionalUrl(page);
  test.skip(!professionalUrl, 'No professionals available for booking interception tests');

  await page.goto(professionalUrl!, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  const bookSessionButton = page.getByRole('button', { name: /Book Session/i });
  await expect(bookSessionButton).toBeVisible({ timeout: 10000 });
  await bookSessionButton.click();

  const popup = page.locator('.fixed.inset-0');
  await expect(popup.getByRole('heading', { name: 'Book a Session' })).toBeVisible({ timeout: 5000 });

  return popup;
}

test.describe('API Response Interception and Mocking', () => {
  test('should render a mocked professionals response on the browse page', async ({ page }) => {
    await clearProfessionalsCache(page);

    const mockedProfessionals = [
      buildMockProfessional('Mocked Mentor Alpha'),
      buildMockProfessional('Mocked Mentor Beta', {
        field: 'Data Science',
        job_title: 'Principal Analyst',
      }),
    ];

    await page.route('**/rest/v1/professional_profiles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedProfessionals),
      });
    });

    await page.goto('/browse');

    await expect(page.getByText('Mocked Mentor Alpha')).toBeVisible();
    await expect(page.getByText('Mocked Mentor Beta')).toBeVisible();
    await expect(page.getByText('API Mock Specialist')).toBeVisible();
    await expect(page.getByText('Principal Analyst')).toBeVisible();
  });

  test('should patch the intercepted professionals response before the UI renders it', async ({ page }) => {
    await clearProfessionalsCache(page);

    await page.route('**/rest/v1/professional_profiles**', async (route) => {
      const response = await route.fetch();
      const professionals = (await response.json()) as MockProfessional[];

      professionals.unshift(
        buildMockProfessional('Injected Mentor Gamma', {
          field: 'Cybersecurity',
          job_title: 'Intercepted Response Mentor',
        })
      );

      await route.fulfill({
        response,
        contentType: 'application/json',
        body: JSON.stringify(professionals),
      });
    });

    await page.goto('/browse');

    await expect(page.getByText('Injected Mentor Gamma')).toBeVisible();
    await expect(page.getByText('Intercepted Response Mentor')).toBeVisible();
  });

  test('should mock booking creation and verify the intercepted request payload', async ({ userPage }) => {
    let interceptedPayload: { time_slot_id?: string } | null = null;

    await userPage.route('**/api/bookings', async (route) => {
      interceptedPayload = route.request().postDataJSON() as { time_slot_id?: string };

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

    const popup = await openBookingPopup(userPage);
    const timeSlotButtons = popup.locator('button').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i });
    const slotCount = await timeSlotButtons.count();

    test.skip(slotCount === 0, 'No time slots available for booking interception tests');

    await timeSlotButtons.first().click();
    await popup.getByRole('button', { name: /Confirm Booking/i }).click();

    await expect(popup.locator('.text-emerald-200')).toContainText('Mocked booking request sent successfully', {
      timeout: 5000,
    });
    if (!interceptedPayload?.time_slot_id) {
      throw new Error('Expected intercepted booking payload to include a time_slot_id');
    }

    expect(interceptedPayload.time_slot_id).toBeTruthy();
  });
});

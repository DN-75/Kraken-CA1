import type { Page } from '@playwright/test';
import { test, expect, loginAs } from '../fixtures';

const PROFESSIONALS_CACHE_KEY = 'ec_professionals_cache';
const SESSION_PROFILE_CACHE_KEY = 'ec_session_profile';
const CACHE_DURATION_MS = 5 * 60 * 1000;

type CachedProfessional = {
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
  avg_rating: number;
  review_count: number;
  skill_labels: string[];
};

function buildCachedProfessionals(name: string, timestamp: number) {
  const professionals: CachedProfessional[] = [
    {
      id: `cached-${name.toLowerCase().replace(/\s+/g, '-')}`,
      field: 'Web Development',
      job: 'Cached Company',
      job_title: 'Senior Mentor',
      price_per_hour: 120,
      created_at: '2026-01-01T00:00:00.000Z',
      profiles: {
        name,
        profile_photo: null,
      },
      professional_skills: [
        {
          skill: 'Web Development',
          skill_other_label: null,
        },
      ],
      reviews: [{ rating: 5 }],
      avg_rating: 5,
      review_count: 1,
      skill_labels: ['Web Development'],
    },
  ];

  return {
    professionals,
    timestamp,
  };
}

async function waitForProfessionalsCache(page: Page) {
  await expect
    .poll(async () => {
      return page.evaluate((cacheKey) => {
        return sessionStorage.getItem(cacheKey);
      }, PROFESSIONALS_CACHE_KEY);
    })
    .not.toBeNull();
}

async function waitForSessionProfileCache(page: Page) {
  await expect
    .poll(async () => {
      return page.evaluate((cacheKey) => {
        return sessionStorage.getItem(cacheKey);
      }, SESSION_PROFILE_CACHE_KEY);
    })
    .not.toBeNull();
}

async function openProfileMenu(page: Page) {
  const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
  await expect(profileButton).toBeVisible();
  await profileButton.click();
}

async function logoutFromNavbar(page: Page) {
  await openProfileMenu(page);
  await page.getByRole('button', { name: /logout/i }).click();
}

test.describe('Caching & Session Storage', () => {
  test('should cache professionals data in session storage after loading browse page', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByPlaceholder(/search members by name/i)).toBeVisible();

    await waitForProfessionalsCache(page);

    const cachedData = await page.evaluate((cacheKey) => {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    }, PROFESSIONALS_CACHE_KEY);

    expect(Array.isArray(cachedData?.professionals)).toBeTruthy();
    expect(cachedData.professionals.length).toBeGreaterThan(0);
    expect(typeof cachedData.timestamp).toBe('number');
  });

  test('should reuse a valid professionals cache without refetching from the API', async ({ page }) => {
    const cachedName = 'Cached Mentor Reuse';
    const cachedData = buildCachedProfessionals(cachedName, Date.now());
    let professionalsRequestCount = 0;

    await page.addInitScript(
      ({ cacheKey, payload }) => {
        sessionStorage.setItem(cacheKey, JSON.stringify(payload));
      },
      { cacheKey: PROFESSIONALS_CACHE_KEY, payload: cachedData }
    );

    await page.route('**/rest/v1/professional_profiles**', async (route) => {
      professionalsRequestCount += 1;
      await route.abort('failed');
    });

    await page.goto('/browse');

    await expect(page.getByText(cachedName)).toBeVisible();
    await expect(page.getByText(/failed to load mentors/i)).not.toBeVisible();
    expect(professionalsRequestCount).toBe(0);
  });

  test('should discard expired professionals cache and fetch fresh data', async ({ page }) => {
    const expiredName = 'Expired Mentor';
    const expiredTimestamp = Date.now() - CACHE_DURATION_MS - 30_000;
    const expiredCache = buildCachedProfessionals(expiredName, expiredTimestamp);
    let professionalsRequestCount = 0;

    await page.addInitScript(
      ({ cacheKey, payload }) => {
        sessionStorage.setItem(cacheKey, JSON.stringify(payload));
      },
      { cacheKey: PROFESSIONALS_CACHE_KEY, payload: expiredCache }
    );

    await page.route('**/rest/v1/professional_profiles**', async (route) => {
      professionalsRequestCount += 1;
      await route.continue();
    });

    await page.goto('/browse');
    await expect(page.getByPlaceholder(/search members by name/i)).toBeVisible();
    await expect(page.getByText(expiredName)).not.toBeVisible();

    await waitForProfessionalsCache(page);

    const refreshedCache = await page.evaluate((cacheKey) => {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    }, PROFESSIONALS_CACHE_KEY);

    expect(professionalsRequestCount).toBeGreaterThan(0);
    expect(refreshedCache).not.toBeNull();
    expect(refreshedCache.timestamp).toBeGreaterThan(expiredTimestamp);
    expect(JSON.stringify(refreshedCache.professionals)).not.toContain(expiredName);
  });

  test('should keep professionals cache across refreshes in the same session', async ({ page }) => {
    let professionalsRequestCount = 0;

    await page.route('**/rest/v1/professional_profiles**', async (route) => {
      professionalsRequestCount += 1;
      await route.continue();
    });

    await page.goto('/browse');
    await expect(page.getByPlaceholder(/search members by name/i)).toBeVisible();
    await waitForProfessionalsCache(page);

    const cacheBeforeReload = await page.evaluate((cacheKey) => {
      return sessionStorage.getItem(cacheKey);
    }, PROFESSIONALS_CACHE_KEY);

    const requestCountBeforeReload = professionalsRequestCount;

    await page.reload();
    await expect(page.getByPlaceholder(/search members by name/i)).toBeVisible();

    const cacheAfterReload = await page.evaluate((cacheKey) => {
      return sessionStorage.getItem(cacheKey);
    }, PROFESSIONALS_CACHE_KEY);

    expect(cacheAfterReload).toBe(cacheBeforeReload);
    expect(professionalsRequestCount).toBe(requestCountBeforeReload);
  });

  test('should cache the authenticated session profile after login', async ({ page }) => {
    await loginAs(page, 'user');
    await waitForSessionProfileCache(page);

    const cachedProfile = await page.evaluate((cacheKey) => {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    }, SESSION_PROFILE_CACHE_KEY);

    expect(cachedProfile?.email).toBe('test@example.com');
    expect(cachedProfile?.role).toBe('user');
    expect(typeof cachedProfile?.id).toBe('string');
  });

  test('should preserve the session profile cache across a page refresh while logged in', async ({ page }) => {
    await loginAs(page, 'user');
    await waitForSessionProfileCache(page);

    const cacheBeforeReload = await page.evaluate((cacheKey) => {
      return sessionStorage.getItem(cacheKey);
    }, SESSION_PROFILE_CACHE_KEY);

    await page.reload();
    await waitForSessionProfileCache(page);

    const cacheAfterReload = await page.evaluate((cacheKey) => {
      return sessionStorage.getItem(cacheKey);
    }, SESSION_PROFILE_CACHE_KEY);

    expect(cacheAfterReload).toBe(cacheBeforeReload);
    await expect(page.locator('nav').getByRole('link', { name: 'Sign In' })).not.toBeVisible();
  });

  test('should clear both session profile and professionals cache on logout', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/browse');
    await expect(page.getByPlaceholder(/search members by name/i)).toBeVisible();
    await waitForProfessionalsCache(page);
    await waitForSessionProfileCache(page);

    await logoutFromNavbar(page);
    await expect(page).toHaveURL(/\/login$/);

    const cacheState = await page.evaluate(({ professionalsKey, sessionKey }) => {
      return {
        professionalsCache: sessionStorage.getItem(professionalsKey),
        sessionProfileCache: sessionStorage.getItem(sessionKey),
      };
    }, { professionalsKey: PROFESSIONALS_CACHE_KEY, sessionKey: SESSION_PROFILE_CACHE_KEY });

    expect(cacheState.professionalsCache).toBeNull();
    expect(cacheState.sessionProfileCache).toBeNull();
  });
});

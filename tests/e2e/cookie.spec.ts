import type { Page } from '@playwright/test';
import { test, expect, loginAs, logout } from '../fixtures';

const ACCESS_TOKEN_COOKIE = 'ec_access_token';

async function getAccessTokenCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie: { name: string }) => cookie.name === ACCESS_TOKEN_COOKIE);
}

test.describe('Cookie & Token Verification', () => {
  test('should set a non-empty access token cookie after login', async ({ page, baseURL }) => {
    await loginAs(page, 'user');

    const accessTokenCookie = await getAccessTokenCookie(page);

    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.value).toBeTruthy();
    expect(accessTokenCookie?.value?.length ?? 0).toBeGreaterThan(20);
    expect(accessTokenCookie?.path).toBe('/');
    expect(accessTokenCookie?.sameSite).toBe('Lax');
    expect(accessTokenCookie?.expires ?? 0).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(accessTokenCookie?.domain).toContain(new URL(baseURL!).hostname);
  });

  test('should keep the access token cookie after a page refresh', async ({ page }) => {
    await loginAs(page, 'user');

    const cookieBeforeReload = await getAccessTokenCookie(page);

    await page.reload();
    await expect(page.locator('nav').getByRole('link', { name: 'Sign In' })).not.toBeVisible();

    const cookieAfterReload = await getAccessTokenCookie(page);

    expect(cookieAfterReload?.value).toBe(cookieBeforeReload?.value);
  });

  test('should redirect to login when an invalid token cookie is used on a protected route', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: ACCESS_TOKEN_COOKIE,
        value: 'invalid-test-token',
        url: baseURL!,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin$/);
  });

  test('should clear the access token cookie on logout', async ({ page }) => {
    await loginAs(page, 'user');

    await logout(page);

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(async () => getAccessTokenCookie(page)).toBeUndefined();
  });
});

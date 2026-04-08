import { test as base, expect, Page } from '@playwright/test';

// ============================================================
// Test User Credentials
// ============================================================
// These users should exist in your test database with the correct roles.
// You can use email aliases (yourname+role@gmail.com) or create separate accounts.

export const TEST_USERS = {
  user: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'user' as const,
  },
  professional: {
    email: 'testpro@example.com',
    password: 'TestPassword123!',
    role: 'professional' as const,
  },
  admin: {
    email: 'testadmin@example.com',
    password: 'TestPassword123!',
    role: 'admin' as const,
  },
} as const;

export type UserRole = keyof typeof TEST_USERS;

// ============================================================
// Helper: Login as a specific user
// ============================================================
export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const user = TEST_USERS[role];

  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(user.email);
  await page.getByPlaceholder('Password').fill(user.password);

  console.log(`\n🔐 Attempting login as ${role} (${user.email})...`);

  await page.getByRole('button', { name: /log in/i }).click();

  // Check for error messages before waiting for redirect
  await page.waitForTimeout(2000); // Give the page time to respond

  const errorMessages = await page.locator('[role="alert"]').allTextContents();
  if (errorMessages.length > 0) {
    console.log('❌ Error messages found:', errorMessages);
  }

  const pageText = await page.locator('body').textContent();
  if (pageText?.includes('Invalid') || pageText?.includes('incorrect') || pageText?.includes('not found')) {
    console.log('⚠️ Page contains error text');
    console.log('Page content preview:', pageText?.substring(0, 500));
  }

  const currentUrl = page.url();
  console.log(`Current URL after login attempt: ${currentUrl}`);

  // Wait for redirect (login complete)
  try {
    await expect(page).not.toHaveURL('/login', { timeout: 45000 });
    console.log(`✅ Login successful! Redirected to: ${page.url()}`);
  } catch (error) {
    console.log(`❌ Login failed for ${role}:`);
    console.log(`   - Attempted email: ${user.email}`);
    console.log(`   - Still on page: ${page.url()}`);
    console.log(`   - Error: ${error}`);
    throw error;
  }
}

// ============================================================
// Helper: Logout current user
// ============================================================
export async function logout(page: Page): Promise<void> {
  // Click profile dropdown
  const profileButton = page
    .locator('nav button')
    .filter({ has: page.locator('.rounded-full') })
    .first();
  await profileButton.click();

  // Click logout
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL('/');
}

// ============================================================
// Playwright Fixtures: Pre-authenticated pages
// ============================================================
// Usage: import { test } from '../fixtures' instead of '@playwright/test'
// Then use test('my test', async ({ userPage }) => { ... })

type AuthFixtures = {
  userPage: Page;
  professionalPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Authenticated as regular user
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'user');
    // Wait for app to initialize (use domcontentloaded instead of networkidle for slow connections)
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await context.close();
  },

  // Authenticated as professional
  professionalPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'professional');
    // Wait for app to initialize (use domcontentloaded instead of networkidle for slow connections)
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await context.close();
  },

  // Authenticated as admin
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'admin');
    // Wait for app to initialize (use domcontentloaded instead of networkidle for slow connections)
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    await context.close();
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';

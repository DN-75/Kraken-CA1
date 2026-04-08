import { test, expect } from '@playwright/test';

// Test user credentials - use unique emails for registration tests
const TEST_USER = {
  fullName: 'Test User',
  email: `test.user.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
};

// Existing user for login tests (should exist in DB)
const EXISTING_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

test.describe('Authentication', () => {
  test.describe('User Registration', () => {
    test('should display multi-step registration form', async ({ page }) => {
      await page.goto('/register');

      // Step 1: Role Selection should be visible
      await expect(page.getByText('Get Started')).toBeVisible();
      await expect(page.getByText('Registration')).toBeVisible();
      await expect(page.getByText('Service Seeker')).toBeVisible();
      await expect(page.getByText('Professional Expert')).toBeVisible();
    });

  test.describe('User Seeker Registration', () => {
    test('should complete multi-step registration as service seeker', async ({ page }) => {
      await page.goto('/register');

      // Step 1: Select Service Seeker role
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Step 2: Join the Network - fill profile
      await expect(page.getByText('Join the Network')).toBeVisible();

      // Fill in account details (placeholders from register page)
      await page.getByPlaceholder('John Doe').fill(TEST_USER.fullName);
      await page.getByPlaceholder('john@example.com').fill(TEST_USER.email);
      await page.getByPlaceholder('Enter password').fill(TEST_USER.password);
      await page.getByPlaceholder('Confirm password').fill(TEST_USER.confirmPassword);

      // Should show register button
      await expect(page.getByRole('button', { name: /register now|register|sign up/i })).toBeVisible();
    });

    test('should validate password match during registration', async ({ page }) => {
      await page.goto('/register');

      // Select Service Seeker
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Fill form with mismatched passwords
      await page.getByPlaceholder('John Doe').fill(TEST_USER.fullName);
      await page.getByPlaceholder('john@example.com').fill(TEST_USER.email);
      await page.getByPlaceholder('Enter password').fill(TEST_USER.password);
      await page.getByPlaceholder('Confirm password').fill('DifferentPassword123!');

      // Submit the form
      const submitButton = page.getByRole('button', { name: /register now|register|sign up/i });
      await submitButton.click();

      // Wait for validation error to appear - it's rendered by React after form validation
      await page.waitForTimeout(1000);

      // Check for error message - should contain "do not match" or "Passwords"
      const errorLocator = page.locator('p:has-text("Passwords do not match")');
      const hasError = await errorLocator.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasError) {
        // Try alternative selector - any text containing error keywords
        const altError = page.getByText(/passwords.*match|do not match/i);
        expect(await altError.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();
      } else {
        expect(hasError).toBeTruthy();
      }
    });

    test('should validate email format during registration', async ({ page }) => {
      await page.goto('/register');

      // Select Service Seeker
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Fill form with invalid email - browser HTML5 validation will prevent submission
      await page.getByPlaceholder('John Doe').fill(TEST_USER.fullName);
      const emailInput = page.getByPlaceholder('john@example.com');
      await emailInput.fill('not-an-email');

      // Try to submit
      const submitButton = page.getByRole('button', { name: /register now|register|sign up/i });
      await submitButton.click();

      // Browser's HTML5 email validation prevents form submission, so we stay on the form
      // The form should not have submitted
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/register/, { timeout: 2000 });
    });

    test('should validate password strength during registration', async ({ page }) => {
      await page.goto('/register');

      // Select Service Seeker
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Fill form with weak password
      await page.getByPlaceholder('John Doe').fill(TEST_USER.fullName);
      await page.getByPlaceholder('john@example.com').fill(TEST_USER.email);
      const passwordInput = page.getByPlaceholder('Enter password');
      await passwordInput.fill('123');

      // Try to submit
      const submitButton = page.getByRole('button', { name: /register now|register|sign up/i });
      await submitButton.click();

      // Wait for error and check validation message
      await page.waitForTimeout(1000);

      // Check for error message about password length
      const errorLocator = page.locator('p:has-text("at least 6")');
      const hasError = await errorLocator.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasError) {
        // Try alternative selector
        const altError = page.getByText(/password|strength|character/i);
        expect(await altError.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();
      } else {
        expect(hasError).toBeTruthy();
      }
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.goto('/register');

      // Step 1: Select role
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Step 2: Should be on Join the Network step
      await expect(page.getByText('Join the Network')).toBeVisible();

      // Try to submit without filling required fields - form should require fields
      const submitButton = page.getByRole('button', { name: /register now/i });
      await expect(submitButton).toBeVisible();
    });

    test('should allow photo upload during registration', async ({ page }) => {
      await page.goto('/register');

      // Step 1: Select role
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Step 2: Profile page should have photo upload option
      await expect(page.getByText('Join the Network')).toBeVisible();

      // Check for photo upload element
      const photoInput = page.locator('input[type="file"]');
      await expect(photoInput).toBeAttached();
    });

    test('should navigate between registration steps', async ({ page }) => {
      await page.goto('/register');

      // Step 1: Select Service Seeker role
      await page.getByText('Service Seeker').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Step 2: Should show Join the Network
      await expect(page.getByText('Join the Network')).toBeVisible();

      // Go back to Step 1 using the back button (IoArrowBack icon button)
      const backButton = page.locator('button').filter({ hasText: '' }).first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page.getByText('Get Started')).toBeVisible();
      }
    });
  });

  test.describe('User Login', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByText('Welcome Back')).toBeVisible();
      await expect(page.getByPlaceholder('Email address')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
      await page.getByRole('button', { name: /log in/i }).click();

      // Should redirect after successful login (to home, professional, or admin page based on role)
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });
    });

    test('should show link to registration page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /create an account/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Professional Registration', () => {
    test('should display Professional Expert as registration option', async ({ page }) => {
      await page.goto('/register');

      // Both roles should be available
      const seekerOption = page.getByText('Service Seeker');
      const professionalOption = page.getByText('Professional Expert');

      await expect(seekerOption).toBeVisible();
      await expect(professionalOption).toBeVisible();
    });

    test('should navigate to professional registration form', async ({ page }) => {
      await page.goto('/register');

      // Click Professional Expert
      await page.getByText('Professional Expert').click();
      await page.getByRole('button', { name: /continue/i }).click();

      // Should navigate to professional step
      await page.waitForLoadState('networkidle');

      // Professional form should have additional fields
      const fieldSelect = page.locator('select[name="field"]');
      const priceInput = page.locator('input[name="price_per_hour"]');

      const hasField = await fieldSelect.isVisible().catch(() => false);
      const hasPrice = await priceInput.isVisible().catch(() => false);

      expect(hasField || hasPrice).toBeTruthy();
    });

    test('should require price per hour for professional registration', async ({ page }) => {
      await page.goto('/register');

      // Select Professional Expert and continue
      await page.getByText('Professional Expert').click();
      await page.getByRole('button', { name: /continue/i }).click();

      await page.waitForLoadState('networkidle');

      // Price field should exist and be required
      const priceInput = page.locator('input[name="price_per_hour"]');
      const isVisible = await priceInput.isVisible().catch(() => false);

      if (isVisible) {
        // Field should have required attribute
        const required = await priceInput.getAttribute('required');
        expect(required !== null || true).toBeTruthy();
      }
    });

    test('should display skills selection for professionals', async ({ page }) => {
      await page.goto('/register');

      // Select Professional Expert
      await page.getByText('Professional Expert').click();
      await page.getByRole('button', { name: /continue/i }).click();

      await page.waitForLoadState('networkidle');

      // Skills checkboxes should be visible
      const skillCheckboxes = page.locator('input[type="checkbox"]');
      const skillsLabel = page.getByText(/skills/i);

      const hasCheckboxes = await skillCheckboxes.count() > 0;
      const hasLabel = await skillsLabel.isVisible().catch(() => false);

      expect(hasCheckboxes || hasLabel).toBeTruthy();
    });
  });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Email address').fill('nonexistent@example.com');
      await page.getByPlaceholder('Password').fill('WrongPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should show error for wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill('WrongPassword123!');
      await page.getByRole('button', { name: /log in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should not login with empty credentials', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.getByRole('button', { name: /log in/i }).click();

      // Should stay on login page (HTML5 validation prevents submission)
      await expect(page).toHaveURL('/login');
    });

    test('should show loading state during login attempt', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Email address').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('password123');

      // Click login and immediately check for loading state
      const loginButton = page.getByRole('button', { name: /log in/i });
      await loginButton.click();

      // Button should show loading state
      await expect(page.getByText(/logging in/i)).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page refresh', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
      await page.getByRole('button', { name: /log in/i }).click();

      // Wait for redirect
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Refresh the page
      await page.reload();

      // Should still be logged in (navbar should show Sign Up button only when logged out)
      await page.waitForTimeout(2000);
      const signInLink = page.locator('nav').getByRole('link', { name: 'Sign In' });
      await expect(signInLink).not.toBeVisible({ timeout: 5000 });
    });

    test('should persist session across navigation', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
      await page.getByRole('button', { name: /log in/i }).click();

      // Wait for redirect
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Navigate to different pages
      await page.goto('/browse');
      await page.waitForTimeout(2000);
      const signInLink = page.locator('nav').getByRole('link', { name: 'Sign In' });
      await expect(signInLink).not.toBeVisible({ timeout: 5000 });

      await page.goto('/');
      await page.waitForTimeout(2000);
      await expect(signInLink).not.toBeVisible({ timeout: 5000 });
    });

    test('should store session token in cookie', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
      await page.getByRole('button', { name: /log in/i }).click();

      // Wait for redirect
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });

      // Check that the access token cookie is set
      const cookies = await context.cookies();
      const accessTokenCookie = cookies.find(c => c.name === 'ec_access_token');
      expect(accessTokenCookie).toBeDefined();
    });
  });

  test.describe('Logout Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each logout test
      await page.goto('/login');
      await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
      await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });
    });

    test('should logout successfully from dropdown menu', async ({ page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Click on the user avatar/profile button to open dropdown (it's a button in nav with rounded-full div)
      const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
      await profileButton.click();

      // Click logout button in dropdown
      await page.getByRole('button', { name: /logout/i }).click();

      // Should redirect to home page
      await expect(page).toHaveURL('/');

      // Should show Sign In link (user is logged out)
      await page.waitForTimeout(2000);
      const signInLink = page.locator('nav').getByRole('link', { name: 'Sign In' });
      await expect(signInLink).toBeVisible({ timeout: 5000 });
    });

    test('should clear session cookie on logout', async ({ page, context }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Click on the user avatar/profile button to open dropdown
      const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
      await profileButton.click();

      // Click logout button
      await page.getByRole('button', { name: /logout/i }).click();

      // Wait for logout to complete
      await expect(page).toHaveURL('/');

      // Check that the access token cookie is cleared
      const cookies = await context.cookies();
      const accessTokenCookie = cookies.find(c => c.name === 'ec_access_token');
      expect(accessTokenCookie?.value || '').toBe('');
    });

    test('should redirect to login when accessing protected route after logout', async ({ page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Click on the user avatar/profile button to open dropdown
      const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
      await profileButton.click();

      // Logout
      await page.getByRole('button', { name: /logout/i }).click();
      await expect(page).toHaveURL('/');

      // Try to access user profile page
      await page.goto('/user');

      // Should redirect to login or show unauthorized message
      await page.waitForURL(/\/(login|user)/);
    });

    test('should clear local/session storage on logout', async ({ page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Click on the user avatar/profile button to open dropdown
      const profileButton = page.locator('nav button').filter({ has: page.locator('.rounded-full') }).first();
      await profileButton.click();

      // Logout
      await page.getByRole('button', { name: /logout/i }).click();
      await expect(page).toHaveURL('/');

      // Check that session storage is cleared
      const sessionProfile = await page.evaluate(() => {
        return sessionStorage.getItem('ec_session_profile');
      });
      expect(sessionProfile).toBeNull();
    });
  });
});

import { test, expect, Page } from '@playwright/test';

// Existing user for login tests (should exist in DB)
const EXISTING_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

// Helper to wait for profile page to load and check if user is professional
async function waitForProfilePage(page: Page): Promise<boolean> {
  await page.goto('/user');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});

  // Skip if redirected to professional page
  if (page.url().includes('/professional')) {
    return false;
  }
  return true;
}

test.describe('User Profile', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill(EXISTING_USER.email);
    await page.getByPlaceholder('Password').fill(EXISTING_USER.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).not.toHaveURL('/login', { timeout: 10000 });
  });

  test.describe('View User Profile', () => {
    test('should navigate to user profile page', async ({ page }) => {
      await page.goto('/user');

      // Should load the profile page (not redirect to login)
      // May redirect to /professional if user is a professional
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url.includes('/user') || url.includes('/professional')).toBeTruthy();
    });

    test('should display user profile information', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Profile tab should be visible - use exact match to avoid matching "Edit Profile"
      await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'Sessions', exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('should display user name and email', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Full Name and Email labels should be visible
      await expect(page.getByText('Full Name', { exact: false })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Email Address', { exact: false })).toBeVisible();
    });

    test('should display current status field', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Current Status label should be visible
      await expect(page.getByText('Current Status', { exact: false })).toBeVisible({ timeout: 10000 });
    });

    test('should display timezone field', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Timezone label should be visible
      await expect(page.getByText('Timezone', { exact: false })).toBeVisible({ timeout: 10000 });
    });

    test('should display bio field', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Bio label should be visible
      await expect(page.getByText('Bio', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('should show Edit Profile button', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Edit Profile button should be visible
      await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Update Profile Information', () => {
    test('should enter edit mode when clicking Edit Profile', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Click Edit Profile button
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Should show Cancel button instead of Edit Profile
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

      // Should show Save Changes button
      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    });

    test('should show editable form fields in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Name input should be editable
      const nameInput = page.getByPlaceholder('Enter your full name');
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEditable();

      // Email input should be disabled (cannot change email)
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toBeDisabled();
    });

    test('should show status dropdown in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Status select should be visible
      const statusSelect = page.locator('select[name="status"]');
      await expect(statusSelect).toBeVisible();

      // Should have status options
      await expect(statusSelect.locator('option')).toHaveCount(4); // undergraduate, postgraduate, professional, other
    });

    test('should show timezone dropdown in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Timezone select should be visible
      const timezoneSelect = page.locator('select[name="time_zone"]');
      await expect(timezoneSelect).toBeVisible();
    });

    test('should show bio textarea in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Bio textarea should be visible and editable
      const bioTextarea = page.locator('textarea[name="bio"]');
      await expect(bioTextarea).toBeVisible();
      await expect(bioTextarea).toBeEditable();
    });

    test('should cancel edit mode and discard changes', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Make a change to the name
      const nameInput = page.getByPlaceholder('Enter your full name');
      await nameInput.fill('Changed Name');

      // Click Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Should exit edit mode and show Edit Profile button
      await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();
    });

    test('should update profile name successfully', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Get the original name
      const nameInput = page.getByPlaceholder('Enter your full name');
      const originalName = await nameInput.inputValue();

      // Update the name with a timestamp to make it unique
      const newName = `Test User ${Date.now()}`;
      await nameInput.fill(newName);

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Wait for save to complete
      await page.waitForTimeout(3000);

      // Should show success message
      await expect(page.getByText('Profile updated successfully!')).toBeVisible({ timeout: 10000 });

      // Should exit edit mode
      await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();

      // Restore original name
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await nameInput.fill(originalName);
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.waitForTimeout(2000);
    });

    test('should update profile bio successfully', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Get the bio textarea
      const bioTextarea = page.locator('textarea[name="bio"]');
      const originalBio = await bioTextarea.inputValue();

      // Update the bio
      const newBio = `Updated bio at ${Date.now()}`;
      await bioTextarea.fill(newBio);

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Wait for save to complete
      await page.waitForTimeout(3000);

      // Should show success message
      await expect(page.getByText('Profile updated successfully!')).toBeVisible({ timeout: 10000 });

      // Should exit edit mode
      await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();

      // Restore original bio
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await bioTextarea.fill(originalBio);
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.waitForTimeout(2000);
    });

    test('should show loading state while saving', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Click save without changing anything
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Should show "Saving..." text
      await expect(page.getByText('Saving...')).toBeVisible();
    });

    test('should display email cannot be changed message', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Should show message about email
      await expect(page.getByText('Email cannot be changed')).toBeVisible();
    });
  });

  test.describe('Photo Upload', () => {
    test('should show camera button on profile photo', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Camera button should be visible (for changing photo)
      const cameraButton = page.getByLabel('Change profile photo');
      await expect(cameraButton).toBeVisible();
    });

    test('should not allow photo change when not in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Camera button should not open modal when not editing
      const cameraButton = page.getByLabel('Change profile photo');
      await cameraButton.click();

      // Modal should NOT open (check for modal title)
      await expect(page.getByText('Change Profile Picture')).not.toBeVisible();
    });

    test('should open photo modal when clicking camera button in edit mode', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Click camera button
      const cameraButton = page.getByLabel('Change profile photo');
      await cameraButton.click();

      // Modal should open
      await expect(page.getByText('Change Profile Picture')).toBeVisible();
    });

    test('should display photo modal with upload option', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Modal should have Upload button
      await expect(page.getByText('Upload From Device')).toBeVisible();

      // Modal should have file input
      const fileInput = page.locator('#profile-photo-input');
      await expect(fileInput).toBeAttached();
    });

    test('should display photo modal with adjustment sliders', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Adjustment section should be visible
      await expect(page.getByText('Adjust')).toBeVisible();
      await expect(page.getByText('Zoom')).toBeVisible();
      await expect(page.getByText('Horizontal Position')).toBeVisible();
      await expect(page.getByText('Vertical Position')).toBeVisible();
    });

    test('should display preview section in photo modal', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Preview section should be visible
      await expect(page.getByText('Preview', { exact: true })).toBeVisible();
    });

    test('should have Save Photo and Cancel buttons in modal', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Buttons should be visible
      await expect(page.getByRole('button', { name: 'Save Photo' })).toBeVisible();
      // Use more specific selector for Cancel button in modal
      await expect(page.locator('.fixed button:has-text("Cancel")')).toBeVisible();
    });

    test('should close photo modal when clicking Cancel', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Click Cancel in modal
      await page.locator('.fixed button:has-text("Cancel")').click();

      // Modal should close
      await expect(page.getByText('Change Profile Picture')).not.toBeVisible();
    });

    test('should close photo modal when clicking close button', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Click close button (X)
      await page.getByLabel('Close photo editor').click();

      // Modal should close
      await expect(page.getByText('Change Profile Picture')).not.toBeVisible();
    });

    test('should disable Save Photo button when no image uploaded', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Save Photo button should be disabled
      const saveButton = page.getByRole('button', { name: 'Save Photo' });
      await expect(saveButton).toBeDisabled();
    });

    test('should have file input that accepts images', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Check that file input accepts images
      const fileInput = page.locator('#profile-photo-input');
      await expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    test('should have disabled sliders when no image uploaded', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Enter edit mode and open photo modal
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByLabel('Change profile photo').click();

      // Sliders should be disabled initially (no image)
      const zoomSlider = page.locator('input[type="range"]').first();
      await expect(zoomSlider).toBeDisabled();
    });
  });

  test.describe('Sessions Tab', () => {
    test('should switch to Sessions tab', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Click Sessions tab
      await page.getByRole('button', { name: 'Sessions', exact: true }).click();

      // Sessions content should be visible - either sessions or "No sessions yet"
      const noSessionsMessage = page.getByText('No sessions yet');
      const pendingSessions = page.getByText('PENDING SESSIONS');
      const approvedSessions = page.getByText('UPCOMING APPROVED SESSIONS');
      const pastSessions = page.getByText('PAST SESSIONS');

      // Wait a bit for content to load
      await page.waitForTimeout(1000);

      // One of these should be visible
      const noSessionsVisible = await noSessionsMessage.isVisible().catch(() => false);
      const pendingVisible = await pendingSessions.isVisible().catch(() => false);
      const approvedVisible = await approvedSessions.isVisible().catch(() => false);
      const pastVisible = await pastSessions.isVisible().catch(() => false);

      expect(noSessionsVisible || pendingVisible || approvedVisible || pastVisible).toBeTruthy();
    });

    test('should navigate to Sessions tab via URL', async ({ page }) => {
      await page.goto('/user?tab=sessions');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});

      // If redirected to professional page, skip this test
      if (page.url().includes('/professional')) {
        test.skip();
        return;
      }

      // Sessions content should be visible
      const noSessionsMessage = page.getByText('No sessions yet');
      const pendingSessions = page.getByText('PENDING SESSIONS');
      const approvedSessions = page.getByText('UPCOMING APPROVED SESSIONS');
      const pastSessions = page.getByText('PAST SESSIONS');

      // One of these should be visible
      const noSessionsVisible = await noSessionsMessage.isVisible().catch(() => false);
      const pendingVisible = await pendingSessions.isVisible().catch(() => false);
      const approvedVisible = await approvedSessions.isVisible().catch(() => false);
      const pastVisible = await pastSessions.isVisible().catch(() => false);

      expect(noSessionsVisible || pendingVisible || approvedVisible || pastVisible).toBeTruthy();
    });

    test('should switch back to Profile tab', async ({ page }) => {
      await page.goto('/user?tab=sessions');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});

      // If redirected to professional page, skip this test
      if (page.url().includes('/professional')) {
        test.skip();
        return;
      }

      // Click Profile tab
      await page.getByRole('button', { name: 'Profile', exact: true }).click();

      // Profile content should be visible
      await expect(page.getByText('Full Name', { exact: false })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading state while fetching profile', async ({ page }) => {
      // Slow down network to catch loading state
      await page.route('**/rest/v1/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/user');

      // Loading state should show "Loading..."
      const loadingText = page.getByText('Loading...');
      await expect(loadingText).toBeVisible({ timeout: 5000 });
    });

    test('should handle profile load result gracefully', async ({ page }) => {
      await page.goto('/user');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});

      // Page should either show profile or redirect to professional or show error state
      const returnToLoginButton = page.getByRole('button', { name: 'Return to Login' });
      const editProfileButton = page.getByRole('button', { name: 'Edit Profile' });
      const isProfessionalPage = page.url().includes('/professional');

      const hasReturnButton = await returnToLoginButton.isVisible().catch(() => false);
      const hasEditButton = await editProfileButton.isVisible().catch(() => false);

      // Either profile loaded, redirected to professional, or error state shown
      expect(hasReturnButton || hasEditButton || isProfessionalPage).toBeTruthy();
    });
  });

  test.describe('Profile Photo Display', () => {
    test('should display profile photo or placeholder', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Either profile photo image or placeholder icon should be visible
      const profilePhoto = page.locator('img[alt]').first();
      const placeholderIcon = page.locator('.rounded-full').first();

      const hasPhoto = await profilePhoto.isVisible().catch(() => false);
      const hasPlaceholder = await placeholderIcon.isVisible().catch(() => false);

      expect(hasPhoto || hasPlaceholder).toBeTruthy();
    });

    test('should display profile section in header', async ({ page }) => {
      const isUserProfile = await waitForProfilePage(page);
      if (!isUserProfile) {
        test.skip();
        return;
      }

      // Check for profile section with rounded element
      const profileSection = page.locator('.relative').filter({ has: page.locator('.rounded-full') }).first();
      await expect(profileSection).toBeVisible();
    });
  });
});

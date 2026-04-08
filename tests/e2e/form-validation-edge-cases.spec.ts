import { test, expect, type Locator, type Page } from '@playwright/test';

async function setControlledValue(
  locator: Locator,
  value: string
) {
  await locator.evaluate(
    (element, nextValue) => {
      const field = element as HTMLInputElement | HTMLTextAreaElement;
      field.focus();
      field.value = nextValue as string;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function triggerClick(locator: Locator) {
  await locator.evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
}

async function goToSeekerRegistration(page: Page) {
  await page.goto('/register');
  await page.getByText('Service Seeker').click();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Join the Network')).toBeVisible();
}

async function goToProfessionalProfile(page: Page) {
  await page.goto('/register');
  await page.getByText('Professional Expert').click();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Professional Account')).toBeVisible();

  await page.getByPlaceholder('your_username').fill('edge_case_pro');
  await page.getByPlaceholder('expert@example.com').fill('edge.case.pro@example.com');
  await page.getByPlaceholder('Enter password').fill('TestPassword123!');
  await page.getByPlaceholder('Confirm password').fill('TestPassword123!');

  const continueButton = page.getByRole('button', { name: /^continue$/i });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page.getByText('Professional Profile')).toBeVisible();
}

test.describe('Form Validation Edge Cases', () => {
  test('should keep the first register step blocked until a role is selected', async ({ page }) => {
    await page.goto('/register');9

    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeDisabled();

    await continueButton.click({ force: true });

    await expect(page.getByText('Get Started')).toBeVisible();
    await expect(page.getByText('Join the Network')).not.toBeVisible();
    await expect(page.getByText('Professional Account')).not.toBeVisible();
  });

  test('should reject whitespace-only seeker identity fields with trimmed validation', async ({ page }) => {
    await goToSeekerRegistration(page);

    await page.getByPlaceholder('John Doe').fill('   ');
    await page.getByPlaceholder('john@example.com').fill('   valid@example.com   ');
    await page.getByPlaceholder('Enter password').fill('TestPassword123!');
    await page.getByPlaceholder('Confirm password').fill('TestPassword123!');

    await page.getByRole('button', { name: /register now/i }).click();

    await expect(page.getByText('Full name and email are required.')).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should keep professional account continue disabled until passwords are long enough and match', async ({ page }) => {
    await page.goto('/register');
    await page.getByText('Professional Expert').click();
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText('Professional Account')).toBeVisible();

    const continueButton = page.getByRole('button', { name: /^continue$/i });

    await page.getByPlaceholder('your_username').fill('mentor_edge');
    await page.getByPlaceholder('expert@example.com').fill('mentor.edge@example.com');
    await page.getByPlaceholder('Enter password').fill('12345');
    await page.getByPlaceholder('Confirm password').fill('12345');

    await expect(page.getByText(/must be at least 6 characters/i)).toBeVisible();
    await expect(continueButton).toBeDisabled();

    await page.getByPlaceholder('Enter password').fill('TestPassword123!');
    await page.getByPlaceholder('Confirm password').fill('DifferentPassword123!');

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    await expect(continueButton).toBeDisabled();

    await page.getByPlaceholder('Confirm password').fill('TestPassword123!');

    await expect(page.getByText(/passwords match/i)).toBeVisible();
    await expect(continueButton).toBeEnabled();
  });

  test('should preserve professional registration state across multi-step navigation', async ({ page }) => {
    await page.goto('/register');
    await page.getByText('Professional Expert').click();
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText('Professional Account')).toBeVisible();

    await page.getByPlaceholder('your_username').fill('stateful_expert');
    await page.getByPlaceholder('expert@example.com').fill('stateful.expert@example.com');
    await page.getByPlaceholder('Enter password').fill('TestPassword123!');
    await page.getByPlaceholder('Confirm password').fill('TestPassword123!');

    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(page.getByText('Professional Profile')).toBeVisible();

    await page.getByPlaceholder('Dr. Sarah Jenkins').fill('Dr. State Keeper');
    await page.getByPlaceholder('Senior AI Research Lead').fill('Principal Consultant');
    await page.getByPlaceholder('Google LLC').fill('State Labs');
    await page.getByPlaceholder('19**********').fill('199012345678');
    await page.getByPlaceholder('0712345678').fill('0712345678');
    await page.locator('select').filter({ has: page.locator('option[value="Data Science"]') }).selectOption('Data Science');
    await page.getByPlaceholder('Stanford University').fill('University of Moratuwa');
    await page.getByPlaceholder('Ph.D. Computer Science').fill('MSc Computer Science');
    await page.getByPlaceholder('https://linkedin.com/in/username').fill('https://linkedin.com/in/stateful-expert');
    await page.getByPlaceholder('Briefly describe your journey and accomplishments...').fill('Keeping form state stable across steps.');

    await page.getByRole('button', { name: /back/i }).click();

    await expect(page.getByText('Professional Account')).toBeVisible();
    await expect(page.getByPlaceholder('your_username')).toHaveValue('stateful_expert');
    await expect(page.getByPlaceholder('expert@example.com')).toHaveValue('stateful.expert@example.com');
    await expect(page.getByPlaceholder('Enter password')).toHaveValue('TestPassword123!');
    await expect(page.getByPlaceholder('Confirm password')).toHaveValue('TestPassword123!');

    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(page.getByText('Professional Profile')).toBeVisible();
    await expect(page.getByPlaceholder('Dr. Sarah Jenkins')).toHaveValue('Dr. State Keeper');
    await expect(page.getByPlaceholder('Senior AI Research Lead')).toHaveValue('Principal Consultant');
    await expect(page.getByPlaceholder('Google LLC')).toHaveValue('State Labs');
    await expect(page.getByPlaceholder('19**********')).toHaveValue('199012345678');
    await expect(page.getByPlaceholder('0712345678')).toHaveValue('0712345678');
    await expect(page.locator('select').filter({ has: page.locator('option[value="Data Science"]') })).toHaveValue('Data Science');
    await expect(page.getByPlaceholder('Stanford University')).toHaveValue('University of Moratuwa');
    await expect(page.getByPlaceholder('Ph.D. Computer Science')).toHaveValue('MSc Computer Science');
    await expect(page.getByPlaceholder('https://linkedin.com/in/username')).toHaveValue('https://linkedin.com/in/stateful-expert');
    await expect(page.getByPlaceholder('Briefly describe your journey and accomplishments...')).toHaveValue('Keeping form state stable across steps.');

    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByText('Professional Account')).toBeVisible();

    await page.getByRole('button', { name: /back/i }).click();

    await expect(page.getByText('Get Started')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeEnabled();

    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText('Professional Account')).toBeVisible();
    await expect(page.getByPlaceholder('your_username')).toHaveValue('stateful_expert');
    await expect(page.getByPlaceholder('expert@example.com')).toHaveValue('stateful.expert@example.com');
  });

  test('should sanitize professional phone input to digits and enforce the 10-digit local format', async ({ page }) => {
    await goToProfessionalProfile(page);

    const phoneInput = page.getByPlaceholder('0712345678');
    await phoneInput.click();
    await page.keyboard.type('07a1-23b456789');

    await expect(phoneInput).toHaveValue('0712345678');

    await page.getByPlaceholder('Dr. Sarah Jenkins').fill('Dr. Edge Case');
    await page.getByPlaceholder('Senior AI Research Lead').fill('Principal Engineer');
    await page.getByPlaceholder('Google LLC').fill('Example Labs');
    await page.getByPlaceholder('19**********').fill('199012345678');
    await page.locator('select').filter({ has: page.locator('option[value="Software Engineering"]') }).selectOption('Software Engineering');
    await page.getByPlaceholder('Stanford University').fill('MIT');
    await page.getByPlaceholder('Ph.D. Computer Science').fill('BSc Computer Science');
    const linkedinInput = page.locator('input[placeholder="https://linkedin.com/in/username"]');
    await setControlledValue(linkedinInput, 'https://linkedin.com/in/edge-case');
    const professionalBio = page.getByPlaceholder('Briefly describe your journey and accomplishments...');
    await setControlledValue(professionalBio, 'Experienced mentor helping validate edge cases.');

    await phoneInput.fill('8123456789');
    expect(await phoneInput.evaluate((input: HTMLInputElement) => input.checkValidity())).toBeFalsy();
    const validationMessage = await phoneInput.evaluate(
      (input: HTMLInputElement) => input.validationMessage
    );
    expect(validationMessage).not.toBe('');
  });

  test('should require a custom label when the Other skill field is shown for professionals', async ({ page }) => {
    await goToProfessionalProfile(page);

    await page.getByPlaceholder('Dr. Sarah Jenkins').fill('Dr. Skill Edge');
    await page.getByPlaceholder('Senior AI Research Lead').fill('Consultant');
    await page.getByPlaceholder('Google LLC').fill('Edge Advisory');
    await page.getByPlaceholder('19**********').fill('199045678912');
    await page.getByPlaceholder('0712345678').fill('0712345678');
    await page.locator('select').filter({ has: page.locator('option[value="Software Engineering"]') }).selectOption('Software Engineering');
    await page.getByPlaceholder('Stanford University').fill('University of Colombo');
    await page.getByPlaceholder('Ph.D. Computer Science').fill('MBA');
    const linkedinInput = page.locator('input[placeholder="https://linkedin.com/in/username"]');
    await setControlledValue(linkedinInput, 'https://linkedin.com/in/skill-edge');
    const professionalBio = page.getByPlaceholder('Briefly describe your journey and accomplishments...');
    await setControlledValue(professionalBio, 'Validation-focused professional profile.');

    await page.getByRole('button', { name: /web development/i }).click();

    await triggerClick(page.getByRole('button', { name: /other/i }));
    const otherSkillInput = page.getByPlaceholder('e.g. Technical Writing');
    await expect(otherSkillInput).toBeVisible();
    await expect(otherSkillInput).toHaveAttribute('required', '');
    expect(await otherSkillInput.evaluate((input: HTMLInputElement) => input.checkValidity())).toBeFalsy();
    await expect(page.getByText('Professional Profile')).toBeVisible();
  });

  test('should let browser URL validation stop malformed professional links before submit', async ({ page }) => {
    await goToProfessionalProfile(page);

    await page.getByPlaceholder('Dr. Sarah Jenkins').fill('Dr. Url Guard');
    await page.getByPlaceholder('Senior AI Research Lead').fill('Lead Mentor');
    await page.getByPlaceholder('Google LLC').fill('Validations Inc');
    await page.getByPlaceholder('19**********').fill('199078945612');
    await page.getByPlaceholder('0712345678').fill('0712345678');
    await page.locator('select').filter({ has: page.locator('option[value="Software Engineering"]') }).selectOption('Software Engineering');
    await page.getByPlaceholder('Stanford University').fill('Oxford');
    await page.getByPlaceholder('Ph.D. Computer Science').fill('MSc AI');
    await page.getByPlaceholder('https://linkedin.com/in/username').fill('not-a-link');
    await page.getByPlaceholder('Briefly describe your journey and accomplishments...').fill('Checking browser-native URL validation.');

    await page.getByRole('button', { name: /register now/i }).click();

    const validationMessage = await page
      .getByPlaceholder('https://linkedin.com/in/username')
      .evaluate((input: HTMLInputElement) => input.validationMessage);

    expect(validationMessage).not.toBe('');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Professional Profile')).toBeVisible();
  });
});

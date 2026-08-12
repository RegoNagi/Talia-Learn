import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('المعلم يقدر يسجّل دخول ويشوف داشبورده', async ({ page }) => {
  page.on('response', (res) => {
    if (res.url().includes('supabase')) {
      console.log(`SUPABASE RESPONSE: ${res.status()} ${res.url()}`);
    }
  });
  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.goto('/');
  await expect(page.getByPlaceholder('name@school.com')).toBeVisible();

  const emailInput = page.getByPlaceholder('name@school.com');
  const passwordInput = page.getByPlaceholder('••••••••');

  await emailInput.click();
  await emailInput.fill(process.env.TEST_TEACHER_EMAIL!);
  await passwordInput.click();
  await passwordInput.fill(process.env.TEST_TEACHER_PASSWORD!);

  // بنستخدم Enter بدل الدوس على الزرار — بيشغّل الفورم مباشرة
  await passwordInput.press('Enter');

  await page.waitForTimeout(3000);
  console.log('CURRENT URL:', page.url());
  console.log('BUTTON COUNT:', await page.locator('form button').count());

  await expect(page.getByPlaceholder('name@school.com')).toBeHidden({ timeout: 40000 });
});

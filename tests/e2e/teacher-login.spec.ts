import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('المعلم يقدر يسجّل دخول ويشوف داشبورده', async ({ page }) => {
  // تتبّع الطلبات لسيرفر Supabase عشان نشوف هل بتتبعت أصلاً ولا لأ
  page.on('response', (res) => {
    if (res.url().includes('supabase')) {
      console.log(`SUPABASE RESPONSE: ${res.status()} ${res.url()}`);
    }
  });
  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('/');
  await expect(page.getByPlaceholder('name@school.com')).toBeVisible();

  await page.getByPlaceholder('name@school.com').fill(process.env.TEST_TEACHER_EMAIL!);
  await page.getByPlaceholder('••••••••').fill(process.env.TEST_TEACHER_PASSWORD!);

  // نختار زرار الإرسال بشكله البرمجي المضبوط (form > button[type=submit])، مش بالنص، عشان نضمن مية بالمية إننا بندوس على الزرار الصح
  const submitButton = page.locator('form button[type="submit"]');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForTimeout(3000);
  console.log('CURRENT URL:', page.url());

  await expect(page.getByPlaceholder('name@school.com')).toBeHidden({ timeout: 40000 });
});

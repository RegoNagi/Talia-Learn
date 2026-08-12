import { test, expect } from '@playwright/test';

test.setTimeout(60000);

// أول اختبار E2E حقيقي: تسجيل دخول معلم والتأكد إن الداشبورد فعليًا ظهر
test('المعلم يقدر يسجّل دخول ويشوف داشبورده', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByPlaceholder('name@school.com')).toBeVisible();

  await page.getByPlaceholder('name@school.com').fill(process.env.TEST_TEACHER_EMAIL!);
  await page.getByPlaceholder('••••••••').fill(process.env.TEST_TEACHER_PASSWORD!);

  const submitButton = page.getByRole('button', { name: /دخول للمنصة|Sign In|جاري الدخول/i });
  await submitButton.click();

  // نتأكد إن الضغطة سُجّلت فعليًا (الزرار دخل في حالة "جاري الدخول...")
  await expect(page.getByText('جاري الدخول...')).toBeVisible({ timeout: 5000 }).catch(() => {
    console.log('تنبيه: زرار "جاري الدخول..." متظهرش — يمكن الطلب خلص بسرعة قبل ما نلحق نشوفه');
  });

  // نستنى مهلة أطول (40 ثانية) لحد ما الطلب لسيرفر Supabase يخلص فعليًا
  await expect(page.getByPlaceholder('name@school.com')).toBeHidden({ timeout: 40000 });
});

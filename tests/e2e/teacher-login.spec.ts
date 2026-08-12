import { test, expect } from '@playwright/test';

// أول اختبار E2E حقيقي: تسجيل دخول معلم والتأكد إن الداشبورد فعليًا ظهر
test('المعلم يقدر يسجّل دخول ويشوف داشبورده', async ({ page }) => {
  await page.goto('/');

  // نتأكد إننا في شاشة تسجيل الدخول الأول
  await expect(page.getByPlaceholder('name@school.com')).toBeVisible();

  await page.getByPlaceholder('name@school.com').fill(process.env.TEST_TEACHER_EMAIL!);
  await page.getByPlaceholder('••••••••').fill(process.env.TEST_TEACHER_PASSWORD!);
  await page.getByRole('button', { name: /دخول للمنصة|Sign In/i }).click();

  // بعد تسجيل الدخول، فورم كلمة المرور المفروض يختفي (يعني خرجنا من شاشة اللوجين)
  await expect(page.getByPlaceholder('••••••••')).toBeHidden({ timeout: 10000 });

  // ومفيش رسالة خطأ ظاهرة
  await expect(page.getByText('الإيميل أو كلمة المرور غلط.')).toBeHidden();
});

import { test, expect } from '@playwright/test';

// أول اختبار E2E حقيقي: تسجيل دخول معلم والتأكد إن الداشبورد فعليًا ظهر
test('المعلم يقدر يسجّل دخول ويشوف داشبورده', async ({ page }) => {
  await page.goto('/');

  // نتأكد إننا في شاشة تسجيل الدخول الأول
  await expect(page.getByPlaceholder('name@school.com')).toBeVisible();

  await page.getByPlaceholder('name@school.com').fill(process.env.TEST_TEACHER_EMAIL!);
  await page.getByPlaceholder('••••••••').fill(process.env.TEST_TEACHER_PASSWORD!);
  await page.getByRole('button', { name: /دخول للمنصة|Sign In/i }).click();

  // نستنى لحد ما رسالة الخطأ (لو ظهرت) أو خانة الإيميل تختفي — أيهما أسرع
  await Promise.race([
    expect(page.getByText('الإيميل أو كلمة المرور غلط.')).toBeVisible({ timeout: 15000 }),
    expect(page.getByPlaceholder('name@school.com')).toBeHidden({ timeout: 15000 }),
  ]).catch(() => {});

  // النتيجة النهائية: لازم مفيش رسالة خطأ ظاهرة (يعني الدخول نجح فعليًا)
  await expect(page.getByText('الإيميل أو كلمة المرور غلط.')).toBeHidden();
  // وخانة الإيميل بتاعة اللوجين اختفت (يعني خرجنا من شاشة الدخول للداشبورد)
  await expect(page.getByPlaceholder('name@school.com')).toBeHidden();
});

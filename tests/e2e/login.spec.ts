import { expect, test } from "@playwright/test";

test("login and open dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Horizon Sustainability Platform")).toBeVisible();
  await page.getByLabel(/Email|E-posta/i).fill("admin@demo.com");
  await page.getByLabel(/Password|Parola/i).fill("Demo1234!");
  await page.getByRole("button", { name: /Sign in|Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Reporting Readiness" })).toBeVisible();
});

test("open questionnaire module", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/Email|E-posta/i).fill("admin@demo.com");
  await page.getByLabel(/Password|Parola/i).fill("Demo1234!");
  await page.getByRole("button", { name: /Sign in|Giriş Yap/i }).click();
  await page.getByRole("link", { name: /Questionnaire|Anket/i }).click();
  await expect(page).toHaveURL(/\/questionnaire/);
  await expect(page.getByRole("heading", { name: /^Questionnaire$|^Anket$/i })).toBeVisible();
});

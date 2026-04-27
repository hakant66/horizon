import { expect, test } from "@playwright/test";

test("login and open dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Horizon Sustainability Platform")).toBeVisible();
  await page.getByLabel("Email").fill("admin@demo.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Reporting Readiness" })).toBeVisible();
});

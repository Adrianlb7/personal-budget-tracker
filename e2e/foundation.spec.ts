import { expect, test } from "@playwright/test";

test("loads the foundation and app-shell placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /clearer view/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /preview the app shell/i }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

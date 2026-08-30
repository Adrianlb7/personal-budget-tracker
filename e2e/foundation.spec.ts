import { expect, test } from "@playwright/test";

test("loads the foundation and sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /clearer view/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("redirects an unauthenticated visitor away from the app", async ({
  page,
}) => {
  await page.goto("/app");

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

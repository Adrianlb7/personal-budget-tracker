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

test("publishes the Orba install manifest", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  const manifest = await response.json();

  expect(response.ok()).toBe(true);
  expect(manifest).toMatchObject({
    display: "standalone",
    name: "Orba",
    short_name: "Orba",
    start_url: "/app",
  });
});

test("does not export financial data without authentication", async ({
  request,
}) => {
  const response = await request.get("/api/export");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["content-disposition"]).toBeUndefined();
});

test("keeps account images private without authentication", async ({
  request,
}) => {
  const response = await request.get(
    "/api/account-icons/b8e69e52-77d1-4e72-8403-17e8f7d7a2f9",
  );
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("appearance choice persists and auto follows the device", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dark appearance" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Dark appearance" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Auto appearance" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("dark entry screens stay within a narrow phone viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Dark appearance" }).click();
  await page.getByRole("link", { name: "Sign in" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
});

test("offers password recovery without exposing account state", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send recovery email" }),
  ).toBeVisible();

  await page.goto("/reset-password");
  await expect(
    page.getByText("This recovery link is invalid or has expired."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save new password" }),
  ).toHaveCount(0);
});

test("shows a useful recovery delivery error", async ({ page }) => {
  await page.route("**/api/auth/recover", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        code: "email_address_not_authorized",
        status: 403,
      }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByRole("button", { name: "Send recovery email" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "default mailer" }),
  ).toBeVisible();
});

test("recovery link waits for a person before verifying its token", async ({
  page,
}) => {
  const verificationRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/verify")) {
      verificationRequests.push(request.method());
    }
  });

  await page.goto("/auth/callback#token_hash=fixture&type=recovery");
  await expect(
    page.getByRole("button", { name: "Continue to reset password" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  expect(verificationRequests).toEqual([]);
});

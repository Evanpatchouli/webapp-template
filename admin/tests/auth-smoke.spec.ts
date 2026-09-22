import { expect, test } from "@playwright/test";

test("匿名深链接进入 Nexus Auth 登录页并不发送旧 Bearer", async ({ page }) => {
  let authorizationHeader: string | undefined;
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("status of 401")) {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.route("**/api/auth/me", async (route) => {
    authorizationHeader = route.request().headers().authorization;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: "UNAUTHORIZED", message: "anonymous", data: null }),
    });
  });

  await page.route("**/api/auth/login**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>OIDC login stub</title>",
    });
  });

  await page.goto("/#/dashboard");
  await expect(page.getByRole("heading", { name: "欢迎登录" })).toBeVisible();
  await expect(page.getByText("使用 Nexus Auth 统一身份认证")).toBeVisible();
  expect(authorizationHeader).toBeUndefined();

  await page.getByRole("button", { name: "使用 Nexus Auth 登录" }).click();
  await expect(page).toHaveURL(/\/api\/auth\/login\?returnTo=/);
  await expect(page).toHaveTitle("OIDC login stub");
  expect(browserErrors).toEqual([]);
});

import test, { expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("로그인 페이지가 열린다", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
});

test("올바른 계정으로 로그인하면 대시보드로 이동한다", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!,
  );

  await expect(page).toHaveURL("/dashboard");
});

test("빈 값으로 제출하면 페이지를 벗어나지 않는다", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginButton.click();

  await expect(page).toHaveURL("/login");
});

import { Locator, Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("이메일");
    this.passwordInput = page.getByLabel("비밀번호");
    this.loginButton = page.getByRole("button", { name: "로그인" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    // fill 대신 한 글자씩 타이핑 → React onChange가 확실히 발생
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email);
    await expect(this.emailInput).toHaveValue(email);

    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password);
    await expect(this.passwordInput).toHaveValue(password);

    await this.loginButton.click();
  }
}

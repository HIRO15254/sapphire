import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

describe("SignUpForm", () => {
  const defaultProps = {
    email: "",
    password: "",
    name: "",
    error: null,
    isLoading: false,
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onNameChange: vi.fn(),
    onSubmit: vi.fn(),
    onGoogleSignIn: vi.fn(),
    onGitHubSignIn: vi.fn(),
  };

  it("アカウント作成タイトルが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "アカウント作成" })).toBeInTheDocument();
  });

  it("表示名入力フィールドが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("お名前")).toBeInTheDocument();
  });

  it("メールアドレス入力フィールドが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  it("パスワード入力フィールドが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("8文字以上")).toBeInTheDocument();
  });

  it("パスワード要件の説明が表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByText("8文字以上で入力してください")).toBeInTheDocument();
  });

  it("Googleで登録ボタンが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Googleで登録" })).toBeInTheDocument();
  });

  it("GitHubで登録ボタンが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "GitHubで登録" })).toBeInTheDocument();
  });

  it("アカウントを作成ボタンが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "アカウントを作成" })).toBeInTheDocument();
  });

  it("ログインリンクが表示される", () => {
    render(<SignUpForm {...defaultProps} />);

    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/auth/signin");
  });

  it("表示名変更でonNameChangeが呼ばれる", () => {
    const onNameChange = vi.fn();
    render(<SignUpForm {...defaultProps} onNameChange={onNameChange} />);

    const nameInput = screen.getByPlaceholderText("お名前");
    fireEvent.change(nameInput, { target: { value: "Test User" } });

    expect(onNameChange).toHaveBeenCalledWith("Test User");
  });

  it("メールアドレス変更でonEmailChangeが呼ばれる", () => {
    const onEmailChange = vi.fn();
    render(<SignUpForm {...defaultProps} onEmailChange={onEmailChange} />);

    const emailInput = screen.getByPlaceholderText("your@email.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(onEmailChange).toHaveBeenCalledWith("test@example.com");
  });

  it("パスワード変更でonPasswordChangeが呼ばれる", () => {
    const onPasswordChange = vi.fn();
    render(<SignUpForm {...defaultProps} onPasswordChange={onPasswordChange} />);

    const passwordInput = screen.getByPlaceholderText("8文字以上");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(onPasswordChange).toHaveBeenCalledWith("password123");
  });

  it("フォーム送信でonSubmitが呼ばれる", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(<SignUpForm {...defaultProps} onSubmit={onSubmit} />);

    const form = screen.getByRole("button", { name: "アカウントを作成" }).closest("form");
    fireEvent.submit(form!);

    expect(onSubmit).toHaveBeenCalled();
  });

  it("Googleボタンクリックでon GoogleSignInが呼ばれる", () => {
    const onGoogleSignIn = vi.fn();
    render(<SignUpForm {...defaultProps} onGoogleSignIn={onGoogleSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Googleで登録" }));

    expect(onGoogleSignIn).toHaveBeenCalled();
  });

  it("GitHubボタンクリックでonGitHubSignInが呼ばれる", () => {
    const onGitHubSignIn = vi.fn();
    render(<SignUpForm {...defaultProps} onGitHubSignIn={onGitHubSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "GitHubで登録" }));

    expect(onGitHubSignIn).toHaveBeenCalled();
  });

  it("エラーメッセージが表示される", () => {
    render(<SignUpForm {...defaultProps} error="このメールアドレスは既に登録されています" />);

    expect(screen.getByText("このメールアドレスは既に登録されています")).toBeInTheDocument();
  });

  it("ローディング中はボタンが無効化される", () => {
    render(<SignUpForm {...defaultProps} isLoading={true} />);

    expect(screen.getByRole("button", { name: "Googleで登録" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "GitHubで登録" })).toBeDisabled();
  });
});

import { SignInForm } from "@/features/auth/components/SignInForm";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "./test-utils";

describe("SignInForm", () => {
  const defaultProps = {
    email: "",
    password: "",
    error: null,
    isLoading: false,
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onSubmit: vi.fn(),
    onGoogleSignIn: vi.fn(),
    onGitHubSignIn: vi.fn(),
  };

  it("ログインタイトルが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
  });

  it("メールアドレス入力フィールドが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  it("パスワード入力フィールドが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("パスワードを入力")).toBeInTheDocument();
  });

  it("Googleログインボタンが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeInTheDocument();
  });

  it("GitHubログインボタンが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "GitHubでログイン" })).toBeInTheDocument();
  });

  it("ログインボタンが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
  });

  it("新規登録リンクが表示される", () => {
    render(<SignInForm {...defaultProps} />);

    expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute("href", "/auth/signup");
  });

  it("メールアドレス変更でonEmailChangeが呼ばれる", () => {
    const onEmailChange = vi.fn();
    render(<SignInForm {...defaultProps} onEmailChange={onEmailChange} />);

    const emailInput = screen.getByPlaceholderText("your@email.com");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(onEmailChange).toHaveBeenCalledWith("test@example.com");
  });

  it("パスワード変更でonPasswordChangeが呼ばれる", () => {
    const onPasswordChange = vi.fn();
    render(<SignInForm {...defaultProps} onPasswordChange={onPasswordChange} />);

    const passwordInput = screen.getByPlaceholderText("パスワードを入力");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(onPasswordChange).toHaveBeenCalledWith("password123");
  });

  it("フォーム送信でonSubmitが呼ばれる", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(<SignInForm {...defaultProps} onSubmit={onSubmit} />);

    const form = screen.getByRole("button", { name: "ログイン" }).closest("form");
    fireEvent.submit(form!);

    expect(onSubmit).toHaveBeenCalled();
  });

  it("Googleボタンクリックでonーoogleクリックが呼ばれる", () => {
    const onGoogleSignIn = vi.fn();
    render(<SignInForm {...defaultProps} onGoogleSignIn={onGoogleSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));

    expect(onGoogleSignIn).toHaveBeenCalled();
  });

  it("GitHubボタンクリックでonGitHubSignInが呼ばれる", () => {
    const onGitHubSignIn = vi.fn();
    render(<SignInForm {...defaultProps} onGitHubSignIn={onGitHubSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "GitHubでログイン" }));

    expect(onGitHubSignIn).toHaveBeenCalled();
  });

  it("エラーメッセージが表示される", () => {
    render(<SignInForm {...defaultProps} error="認証に失敗しました" />);

    expect(screen.getByText("認証に失敗しました")).toBeInTheDocument();
  });

  it("ローディング中はボタンが無効化される", () => {
    render(<SignInForm {...defaultProps} isLoading={true} />);

    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "GitHubでログイン" })).toBeDisabled();
  });
});

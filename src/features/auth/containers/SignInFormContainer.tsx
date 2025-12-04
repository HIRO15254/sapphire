"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SignInForm } from "../components/SignInForm";

export function SignInFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "CredentialsSignin" ? "認証に失敗しました" : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("認証に失敗しました");
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl });
  };

  const handleGitHubSignIn = () => {
    void signIn("github", { callbackUrl });
  };

  return (
    <SignInForm
      email={email}
      password={password}
      error={error}
      isLoading={isLoading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onGitHubSignIn={handleGitHubSignIn}
    />
  );
}

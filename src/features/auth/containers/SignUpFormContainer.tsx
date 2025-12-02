"use client";

import { api } from "@/trpc/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SignUpForm } from "../components/SignUpForm";

export function SignUpFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = api.auth.signup.useMutation({
    onSuccess: async () => {
      // 登録成功後、自動的にサインイン
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("登録は成功しましたが、ログインに失敗しました。ログイン画面からお試しください。");
      } else if (result?.ok) {
        // signIn成功時はcallbackUrlにリダイレクト
        router.push(callbackUrl);
        router.refresh();
      }
    },
    onError: (err) => {
      setError(err.message);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    signupMutation.mutate({
      email,
      password,
      name: name || undefined,
    });
  };

  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl });
  };

  const handleGitHubSignIn = () => {
    void signIn("github", { callbackUrl });
  };

  return (
    <SignUpForm
      email={email}
      password={password}
      name={name}
      error={error}
      isLoading={isLoading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onNameChange={setName}
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onGitHubSignIn={handleGitHubSignIn}
    />
  );
}

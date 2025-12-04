import { SignInFormContainer } from "@/features/auth/containers/SignInFormContainer";
import { Container, Paper } from "@mantine/core";
import { Suspense } from "react";

export const metadata = {
  title: "ログイン | Sapphire",
  description: "Sapphireにログインしてポーカーセッションを管理しましょう",
};

export default function SignInPage() {
  return (
    <Container size={420} py={40}>
      <Paper radius="md" p="xl" withBorder>
        <Suspense fallback={null}>
          <SignInFormContainer />
        </Suspense>
      </Paper>
    </Container>
  );
}

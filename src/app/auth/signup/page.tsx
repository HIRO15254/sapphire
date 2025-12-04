import { SignUpFormContainer } from "@/features/auth/containers/SignUpFormContainer";
import { Container, Paper } from "@mantine/core";
import { Suspense } from "react";

export const metadata = {
  title: "アカウント作成 | Sapphire",
  description: "Sapphireで新しいアカウントを作成してポーカーセッションを記録しましょう",
};

export default function SignUpPage() {
  return (
    <Container size={420} py={40}>
      <Paper radius="md" p="xl" withBorder>
        <Suspense fallback={null}>
          <SignUpFormContainer />
        </Suspense>
      </Paper>
    </Container>
  );
}

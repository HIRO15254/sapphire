"use client";

import { Container, Paper, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

import {
  SessionForm,
  type SessionFormValues,
} from "@/features/poker-sessions/components/SessionForm";
import { api } from "@/trpc/react";

export function NewSessionPage() {
  const router = useRouter();

  const createMutation = api.sessions.create.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "作成成功",
        message: "セッションを作成しました",
        color: "green",
      });
      router.push("/poker-sessions");
      router.refresh(); // 一覧ページのデータを再フェッチ
    },
    onError: (error) => {
      notifications.show({
        title: "作成失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleSubmit = (values: SessionFormValues) => {
    createMutation.mutate({
      date: values.date,
      location: values.location,
      buyIn: values.buyIn,
      cashOut: values.cashOut,
      durationMinutes: values.durationMinutes,
      notes: values.notes || undefined,
    });
  };

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="xl">
        新規セッション
      </Title>
      <Paper shadow="sm" p="md" withBorder>
        <SessionForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
      </Paper>
    </Container>
  );
}

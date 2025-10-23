"use client";

import { Container, Paper, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

import {
  SessionForm,
  type SessionFormValues,
} from "@/features/poker-sessions/components/SessionForm";
import { api } from "@/trpc/react";

interface EditSessionPageProps {
  session: {
    id: number;
    date: Date;
    location: string;
    buyIn: string;
    cashOut: string;
    durationMinutes: number;
    notes: string | null;
  };
}

export function EditSessionPage({ session }: EditSessionPageProps) {
  const router = useRouter();

  const updateMutation = api.sessions.update.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "更新成功",
        message: "セッションを更新しました",
        color: "green",
      });
      router.push(`/poker-sessions/${session.id}`);
      router.refresh(); // 詳細ページのデータを再フェッチ
    },
    onError: (error) => {
      notifications.show({
        title: "更新失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleSubmit = (values: SessionFormValues) => {
    updateMutation.mutate({
      id: session.id,
      date: values.date,
      location: values.location,
      buyIn: values.buyIn,
      cashOut: values.cashOut,
      durationMinutes: values.durationMinutes,
      notes: values.notes || null,
    });
  };

  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="xl">
        セッション編集
      </Title>
      <Paper shadow="sm" p="md" withBorder>
        <SessionForm
          initialValues={{
            date: new Date(session.date),
            location: session.location,
            buyIn: Number.parseFloat(session.buyIn),
            cashOut: Number.parseFloat(session.cashOut),
            durationMinutes: session.durationMinutes,
            notes: session.notes || "",
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="更新"
        />
      </Paper>
    </Container>
  );
}

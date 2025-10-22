"use client";

import { Button, Container, Group, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SessionList } from "@/features/poker-sessions/components/SessionList";
import { api } from "@/trpc/react";

interface SessionsPageProps {
  initialSessions: Array<{
    id: number;
    date: Date;
    location: string;
    buyIn: string;
    cashOut: string;
    durationMinutes: number;
    profit: number;
    notes: string | null;
  }>;
}

export function SessionsPage({ initialSessions }: SessionsPageProps) {
  const router = useRouter();

  const deleteMutation = api.sessions.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "削除成功",
        message: "セッションを削除しました",
        color: "green",
      });
      router.refresh(); // Server Componentを再フェッチ
    },
    onError: (error) => {
      notifications.show({
        title: "削除失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleEdit = (id: number) => {
    router.push(`/poker-sessions/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("このセッションを削除してもよろしいですか？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1}>ポーカーセッション</Title>
          <Button component={Link} href="/poker-sessions/new" leftSection={<IconPlus size={20} />}>
            新規セッション
          </Button>
        </Group>

        <SessionList sessions={initialSessions} onEdit={handleEdit} onDelete={handleDelete} />
      </Stack>
    </Container>
  );
}

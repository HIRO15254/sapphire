"use client";

import { Center, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

import { SessionDetail } from "@/features/poker-sessions/components/SessionDetail";
import { api } from "@/trpc/react";

interface SessionDetailContainerProps {
  /** セッションID */
  sessionId: number;
}

/**
 * セッション詳細コンテナ
 *
 * 責務:
 * - tRPCを使用してセッションデータを取得
 * - 削除処理の実行
 * - ローディング状態とエラー状態の管理
 */
export function SessionDetailContainer({ sessionId }: SessionDetailContainerProps) {
  const router = useRouter();
  const ctx = api.useUtils();

  const { data: session, isLoading, error } = api.sessions.getById.useQuery({ id: sessionId });

  const deleteMutation = api.sessions.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "削除成功",
        message: "セッションを削除しました",
        color: "green",
      });
      // キャッシュを無効化
      void ctx.sessions.getAll.invalidate();
      void ctx.sessions.getStats.invalidate();
      // 一覧ページにリダイレクト
      router.push("/poker-sessions");
    },
    onError: (error) => {
      notifications.show({
        title: "削除失敗",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("このセッションを削除しますか？")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">データを読み込み中...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Title order={3} c="red">
            エラーが発生しました
          </Title>
          <Text c="dimmed">{error.message}</Text>
        </Stack>
      </Center>
    );
  }

  if (!session) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Title order={3} c="dimmed">
            セッションが見つかりませんでした
          </Title>
          <Text c="dimmed">指定されたセッションは存在しないか、アクセス権限がありません。</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <SessionDetail
      session={session}
      onDelete={handleDelete}
      isDeleting={deleteMutation.isPending}
    />
  );
}

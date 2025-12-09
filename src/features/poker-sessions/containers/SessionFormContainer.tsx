"use client";

import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

import type { SessionFormValues } from "@/features/poker-sessions/components/SessionForm";
import { SessionForm } from "@/features/poker-sessions/components/SessionForm";
import { api } from "@/trpc/react";

export interface SessionFormContainerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  sessionId?: number;
  initialValues?: Partial<SessionFormValues>;
  submitLabel?: string;
}

/**
 * SessionFormコンポーネントのContainer
 *
 * @remarks
 * - tRPC mutationを使用してセッションを作成または更新
 * - 成功時にキャッシュを無効化してモーダルを閉じる
 * - エラー時に通知を表示
 */
export function SessionFormContainer({
  onSuccess,
  onCancel,
  sessionId,
  initialValues,
  submitLabel = "保存",
}: SessionFormContainerProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const createSession = api.sessions.create.useMutation({
    onSuccess: async () => {
      await utils.sessions.getAll.invalidate();
      await utils.sessions.getStats.invalidate();

      notifications.show({
        title: "成功",
        message: "セッションを保存しました",
        color: "green",
      });

      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      notifications.show({
        title: "エラー",
        message: error.message || "セッションの保存に失敗しました",
        color: "red",
      });
    },
  });

  const updateSession = api.sessions.update.useMutation({
    onSuccess: async () => {
      await utils.sessions.getAll.invalidate();
      await utils.sessions.getStats.invalidate();
      if (sessionId) {
        await utils.sessions.getById.invalidate({ id: sessionId });
      }

      notifications.show({
        title: "成功",
        message: "セッションを更新しました",
        color: "green",
      });

      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      notifications.show({
        title: "エラー",
        message: error.message || "セッションの更新に失敗しました",
        color: "red",
      });
    },
  });

  const handleSubmit = (values: SessionFormValues) => {
    if (sessionId) {
      // 編集モード
      updateSession.mutate({
        id: sessionId,
        date: values.date,
        newLocationName: values.location,
        gameId: values.gameId,
        buyIn: values.buyIn,
        cashOut: values.cashOut,
        durationMinutes: values.durationMinutes,
        newTagNames: values.tags,
        notes: values.notes,
      });
    } else {
      // 新規作成モード
      createSession.mutate({
        date: values.date,
        newLocationName: values.location,
        gameId: values.gameId,
        buyIn: values.buyIn,
        cashOut: values.cashOut,
        durationMinutes: values.durationMinutes,
        newTagNames: values.tags,
        notes: values.notes,
      });
    }
  };

  return (
    <SessionForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={createSession.isPending || updateSession.isPending}
      submitLabel={submitLabel}
    />
  );
}

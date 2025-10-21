"use client";

import { api } from "@/trpc/react";

export function useTasks() {
  const utils = api.useUtils();

  const { data: tasks, isLoading } = api.tasks.getAll.useQuery();

  const createTask = api.tasks.create.useMutation({
    onSuccess: async () => {
      // タスク作成後、リストを再取得
      await utils.tasks.getAll.invalidate();
    },
  });

  const toggleComplete = api.tasks.toggleComplete.useMutation({
    onSuccess: async () => {
      // 完了状態変更後、リストを再取得
      await utils.tasks.getAll.invalidate();
    },
  });

  const handleCreateTask = (content: string) => {
    createTask.mutate({ content });
  };

  const deleteTask = api.tasks.delete.useMutation({
    onSuccess: async () => {
      // 削除後、リストを再取得
      await utils.tasks.getAll.invalidate();
    },
  });

  const handleToggleComplete = (id: string) => {
    toggleComplete.mutate({ id });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate({ id });
  };

  return {
    tasks,
    isLoading,
    createTask: handleCreateTask,
    isCreating: createTask.isPending,
    toggleComplete: handleToggleComplete,
    isToggling: toggleComplete.isPending,
    deleteTask: handleDeleteTask,
    isDeleting: deleteTask.isPending,
  };
}

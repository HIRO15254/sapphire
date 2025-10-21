"use client";

import type { Task } from "@/server/db/schema";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks?: Task[];
  isLoading?: boolean;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskList({ tasks = [], isLoading = false, onToggle, onDelete }: TaskListProps) {
  if (isLoading) {
    return (
      <Center p="xl">
        <Loader size="md" />
        <Text ml="md" c="dimmed">
          読み込み中...
        </Text>
      </Center>
    );
  }

  if (tasks.length === 0) {
    return (
      <Center p="xl">
        <Text c="dimmed">タスクがありません</Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </Stack>
  );
}

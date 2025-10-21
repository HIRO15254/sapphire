"use client";

import type { Task } from "@/server/db/schema";
import { ActionIcon, Button, Checkbox, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);

  const handleDeleteClick = () => {
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
    setDeleteModalOpened(false);
  };

  return (
    <>
      <Paper p="md" shadow="xs" withBorder>
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" style={{ flex: 1 }}>
            <Checkbox
              checked={task.completed}
              onChange={() => onToggle(task.id)}
              aria-label={`${task.content}を完了済みにする`}
              size="sm"
              styles={{
                input: {
                  cursor: "pointer",
                },
              }}
            />
            <Text
              style={{
                textDecoration: task.completed ? "line-through" : "none",
                color: task.completed ? "var(--mantine-color-dimmed)" : "inherit",
                flex: 1,
                wordBreak: "break-word",
              }}
            >
              {task.content}
            </Text>
          </Group>

          {onDelete && (
            <ActionIcon color="red" variant="subtle" onClick={handleDeleteClick} aria-label="削除">
              <IconTrash size={18} />
            </ActionIcon>
          )}
        </Group>
      </Paper>

      {/* 削除確認ダイアログ（FR-009） */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="タスクの削除"
        centered
      >
        <Stack gap="md">
          <Text>このタスクを削除してもよろしいですか？</Text>
          <Text c="dimmed" size="sm">
            {task.content}
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
              キャンセル
            </Button>
            <Button color="red" onClick={handleConfirmDelete}>
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

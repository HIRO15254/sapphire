"use client";

import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";

interface TaskInputProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export function TaskInput({ onSubmit, isLoading = false }: TaskInputProps) {
  const [content, setContent] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (content.trim().length === 0) {
      return;
    }

    onSubmit(content);
    setContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // モバイルでは縦積み、デスクトップでは横並び
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            placeholder="タスクを入力してください"
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="md"
            aria-label="タスク入力"
          />
          <Button type="submit" loading={isLoading} size="md" fullWidth>
            追加
          </Button>
        </Stack>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="sm" align="flex-end">
        <TextInput
          placeholder="タスクを入力してください"
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          style={{ flex: 1 }}
          size="md"
          aria-label="タスク入力"
        />
        <Button type="submit" loading={isLoading} size="md">
          追加
        </Button>
      </Group>
    </form>
  );
}

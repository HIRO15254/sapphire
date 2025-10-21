"use client";

import { Container, Stack, Title } from "@mantine/core";
import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";
import { useTasks } from "../hooks/useTasks";

export function TaskListContainer() {
  const { tasks, isLoading, createTask, isCreating, toggleComplete, deleteTask } = useTasks();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">
          Todoアプリ
        </Title>

        <TaskInput onSubmit={createTask} isLoading={isCreating} />

        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onToggle={toggleComplete}
          onDelete={deleteTask}
        />
      </Stack>
    </Container>
  );
}

import { Stack, Text } from "@mantine/core";
import { SessionCard, type SessionCardProps } from "./SessionCard";

export interface SessionListProps {
  sessions: SessionCardProps["session"][];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  emptyMessage?: string;
}

export function SessionList({
  sessions,
  onEdit,
  onDelete,
  emptyMessage = "セッションがまだありません",
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </Stack>
  );
}

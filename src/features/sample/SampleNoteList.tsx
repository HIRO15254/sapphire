import { ActionIcon, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { SampleNote } from "./types";

interface SampleNoteListProps {
  notes: SampleNote[];
  onNoteDeleted: (id: number) => void;
}

export function SampleNoteList({ notes, onNoteDeleted }: SampleNoteListProps) {
  const handleDeleteNote = (id: number) => {
    onNoteDeleted(id);
  };

  return (
    <Card withBorder padding="lg">
      <Title order={3} mb="md">
        Sample Notes ({notes.length})
      </Title>
      {notes.length > 0 ? (
        <Stack gap="md">
          {notes.map((note) => (
            <Card key={note.id} withBorder padding="md" bg="gray.0">
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{note.title}</Text>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    {note.user.name}
                  </Text>
                  <ActionIcon
                    color="red"
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label={`Delete note ${note.title}`}
                    data-testid={`delete-note-${note.id}`}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              {note.content && (
                <Text size="sm" mb="xs">
                  {note.content}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Created:{" "}
                {new Date(note.created_at).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {note.updated_at !== note.created_at && (
                  <>
                    {" "}
                    | Updated:{" "}
                    {new Date(note.updated_at).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </Text>
            </Card>
          ))}
        </Stack>
      ) : (
        <Text c="dimmed">No notes yet. Add one above!</Text>
      )}
    </Card>
  );
}

import { Button, Card, Group, Select, Stack, Textarea, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { SampleNote, SampleUser } from "./types";

interface SampleNoteFormProps {
  note?: SampleNote;
  users: SampleUser[];
  onNoteSaved: () => void;
  onCancel?: () => void;
}

export function SampleNoteForm({ note, users, onNoteSaved, onCancel }: SampleNoteFormProps) {
  const isEditing = !!note;

  const sampleNoteForm = useForm({
    initialValues: {
      title: note?.title || "",
      content: note?.content || "",
      user_id: note?.user_id || 0,
    },
    validate: {
      title: (value) => (value ? null : "Title is required"),
      user_id: (value) => (value > 0 ? null : "Please select a user"),
    },
  });

  useEffect(() => {
    if (note) {
      sampleNoteForm.setValues({
        title: note.title,
        content: note.content || "",
        user_id: note.user_id,
      });
    }
  }, [note]);

  const handleSubmit = async (values: typeof sampleNoteForm.values) => {
    try {
      if (isEditing && note?.id) {
        await invoke("update_note", {
          id: note.id,
          note: values,
        });
        showNotification({
          title: "Success",
          message: "Sample note updated successfully",
          color: "green",
        });
      } else {
        await invoke("create_note", { note: values });
        showNotification({
          title: "Success",
          message: "Sample note created successfully",
          color: "green",
        });
      }

      sampleNoteForm.reset();
      onNoteSaved();
    } catch (error) {
      console.error(`Failed to ${isEditing ? "update" : "create"} sample note:`, error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to ${isEditing ? "update" : "create"} sample note: ${errorMessage}`,
        color: "red",
      });
    }
  };

  const userSelectData = users.map((user) => ({
    value: user.id?.toString() || "0",
    label: user.name,
  }));

  return (
    <Card withBorder padding="lg">
      <Title order={3} mb="md">
        {isEditing ? "Edit Sample Note" : "Add New Sample Note"}
      </Title>
      <form onSubmit={sampleNoteForm.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group gap="md">
            <TextInput
              placeholder="Note title"
              flex={2}
              {...sampleNoteForm.getInputProps("title")}
            />
            <Select
              placeholder="Select User"
              flex={1}
              data={userSelectData}
              value={
                sampleNoteForm.values.user_id > 0 ? sampleNoteForm.values.user_id.toString() : null
              }
              onChange={(value) => sampleNoteForm.setFieldValue("user_id", Number(value) || 0)}
              error={sampleNoteForm.errors.user_id}
            />
          </Group>
          <Textarea
            placeholder="Note content (optional)"
            minRows={3}
            {...sampleNoteForm.getInputProps("content")}
          />
          <Group gap="sm">
            <Button type="submit">{isEditing ? "Update Sample Note" : "Add Sample Note"}</Button>
            {isEditing && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Card>
  );
}

import { Button, Card, Group, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { SampleUser } from "./types";

interface SampleUserFormProps {
  user?: SampleUser;
  onUserSaved: () => void;
  onCancel?: () => void;
}

export function SampleUserForm({ user, onUserSaved, onCancel }: SampleUserFormProps) {
  const isEditing = !!user;

  const sampleUserForm = useForm({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
    validate: {
      name: (value) => (value ? null : "Name is required"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  useEffect(() => {
    if (user) {
      sampleUserForm.setValues({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, sampleUserForm.setValues]);

  const handleSubmit = async (values: typeof sampleUserForm.values) => {
    try {
      if (isEditing && user?.id) {
        await invoke("update_user", {
          id: user.id,
          user: values,
        });
        showNotification({
          title: "Success",
          message: "User updated successfully",
          color: "green",
        });
      } else {
        await invoke("create_user", { user: values });
        showNotification({
          title: "Success",
          message: "User created successfully",
          color: "green",
        });
      }

      sampleUserForm.reset();
      onUserSaved();
    } catch (error) {
      console.error(`Failed to ${isEditing ? "update" : "create"} sample user:`, error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to ${isEditing ? "update" : "create"} sample user: ${errorMessage}`,
        color: "red",
      });
    }
  };

  return (
    <Card withBorder padding="lg">
      <Title order={3} mb="md">
        {isEditing ? "Edit Sample User" : "Add New Sample User"}
      </Title>
      <form onSubmit={sampleUserForm.onSubmit(handleSubmit)}>
        <Group gap="md">
          <TextInput placeholder="Name" flex={1} {...sampleUserForm.getInputProps("name")} />
          <TextInput placeholder="Email" flex={1} {...sampleUserForm.getInputProps("email")} />
          <Group gap="sm">
            <Button type="submit">{isEditing ? "Update Sample User" : "Add Sample User"}</Button>
            {isEditing && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Group>
        </Group>
      </form>
    </Card>
  );
}

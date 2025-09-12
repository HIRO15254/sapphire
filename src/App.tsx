import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Center,
  Container,
  Group,
  Image,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";

// TypeScript interfaces matching Rust structs
interface User {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
}

interface Note {
  id?: number;
  title: string;
  content?: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  // Database states are now handled by Rust
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [newNote, setNewNote] = useState({ title: "", content: "", user_id: 0 });
  const [activeTab, setActiveTab] = useState<string | null>("demo");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  // Database is now initialized on Rust side

  const loadUsers = useCallback(async () => {
    try {
      const result = await invoke<User[]>("get_users");
      setUsers(result);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Failed to load users",
        color: "red",
      });
      console.error(error);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const result = await invoke<Note[]>("get_notes");
      setNotes(result);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Failed to load notes",
        color: "red",
      });
      console.error(error);
    }
  }, []);

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      showNotification({
        title: "Error",
        message: "Please fill in all fields",
        color: "red",
      });
      return;
    }

    try {
      await invoke("create_user", { user: newUser });
      setNewUser({ name: "", email: "" });
      showNotification({
        title: "Success",
        message: "User created successfully",
        color: "green",
      });
      loadUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to create user: ${errorMessage}`,
        color: "red",
      });
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await invoke("delete_user", { id });
      showNotification({
        title: "Success",
        message: "User deleted successfully",
        color: "green",
      });
      loadUsers();
      loadNotes(); // Refresh notes in case they were linked to this user
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to delete user: ${errorMessage}`,
        color: "red",
      });
    }
  };

  const createNote = async () => {
    if (!newNote.title || newNote.user_id === 0) {
      showNotification({
        title: "Error",
        message: "Please fill in title and select a user",
        color: "red",
      });
      return;
    }

    try {
      await invoke("create_note", { note: newNote });
      setNewNote({ title: "", content: "", user_id: 0 });
      showNotification({
        title: "Success",
        message: "Note created successfully",
        color: "green",
      });
      loadNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to create note: ${errorMessage}`,
        color: "red",
      });
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await invoke("delete_note", { id });
      showNotification({
        title: "Success",
        message: "Note deleted successfully",
        color: "green",
      });
      loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification({
        title: "Error",
        message: `Failed to delete note: ${errorMessage}`,
        color: "red",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadUsers();
        await loadNotes();
      } catch (error) {
        console.error("Failed to load data:", error);
        showNotification({
          title: "Error",
          message: "Failed to load application data",
          color: "red",
        });
      }
    };
    loadData();
  }, [loadUsers, loadNotes]);

  return (
    <Container size="xl" py={40}>
      <Title order={1} ta="center" mb="xl">
        Sapphire - SQLite Database Demo
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="demo">Original Demo</Tabs.Tab>
          <Tabs.Tab value="users">Users</Tabs.Tab>
          <Tabs.Tab value="notes">Notes</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="demo" pt="md">
          <Center>
            <Stack align="center" gap="xl">
              <Group gap="xl">
                <Anchor href="https://vite.dev" target="_blank">
                  <Image src="/vite.svg" alt="Vite logo" w={80} h={80} />
                </Anchor>
                <Anchor href="https://tauri.app" target="_blank">
                  <Image src="/tauri.svg" alt="Tauri logo" w={80} h={80} />
                </Anchor>
                <Anchor href="https://react.dev" target="_blank">
                  <Image src={reactLogo} alt="React logo" w={80} h={80} />
                </Anchor>
              </Group>

              <Card withBorder padding="lg" radius="md" w={400}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                  }}
                >
                  <Stack gap="md">
                    <TextInput
                      placeholder="Enter a name..."
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      size="md"
                    />
                    <Button type="submit" size="md" fullWidth>
                      Greet
                    </Button>
                  </Stack>
                </form>

                {greetMsg && (
                  <Text mt="md" ta="center" fw={500}>
                    {greetMsg}
                  </Text>
                )}
              </Card>
            </Stack>
          </Center>
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="md">
          <Stack gap="md">
            <Card withBorder padding="lg">
              <Title order={3} mb="md">
                Add New User
              </Title>
              <Group gap="md">
                <TextInput
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.currentTarget.value })}
                  flex={1}
                />
                <TextInput
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.currentTarget.value })}
                  flex={1}
                />
                <Button onClick={createUser}>Add User</Button>
              </Group>
            </Card>

            <Card withBorder padding="lg">
              <Title order={3} mb="md">
                Users ({users.length})
              </Title>
              {users.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>{user.id}</Table.Td>
                        <Table.Td>{user.name}</Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon color="red" onClick={() => user.id && deleteUser(user.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c="dimmed">No users yet. Add one above!</Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="md">
          <Stack gap="md">
            <Card withBorder padding="lg">
              <Title order={3} mb="md">
                Add New Note
              </Title>
              <Stack gap="md">
                <Group gap="md">
                  <TextInput
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.currentTarget.value })}
                    flex={2}
                  />
                  <select
                    value={newNote.user_id}
                    onChange={(e) => setNewNote({ ...newNote, user_id: Number(e.target.value) })}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                      flex: 1,
                    }}
                  >
                    <option value={0}>Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </Group>
                <Textarea
                  placeholder="Note content (optional)"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.currentTarget.value })}
                  minRows={3}
                />
                <Button onClick={createNote}>Add Note</Button>
              </Stack>
            </Card>

            <Card withBorder padding="lg">
              <Title order={3} mb="md">
                Notes ({notes.length})
              </Title>
              {notes.length > 0 ? (
                <Stack gap="md">
                  {notes.map((note) => (
                    <Card key={note.id} withBorder padding="md" bg="gray.0">
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>{note.title}</Text>
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">
                            User ID: {note.user_id}
                          </Text>
                          <ActionIcon color="red" onClick={() => note.id && deleteNote(note.id)}>
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
                        {note.created_at ? new Date(note.created_at).toLocaleString() : "-"}
                        {note.updated_at !== note.created_at && (
                          <> | Updated: {new Date(note.updated_at!).toLocaleString()}</>
                        )}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">No notes yet. Add one above!</Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

export default App;

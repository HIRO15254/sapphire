import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  Center,
  Container,
  Group,
  Image,
  Notification,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
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

  // Database states
  const [db, setDb] = useState<Database | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [newNote, setNewNote] = useState({ title: "", content: "", user_id: 0 });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("demo");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Initialize database on app start
  const initDatabase = useCallback(async () => {
    try {
      const database = await Database.load("sqlite:sapphire.db");
      setDb(database);
      
      // Create tables
      await database.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await database.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      showNotification("Failed to initialize database", "error");
    }
  }, [showNotification]);

  const loadUsers = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.select<User[]>("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC");
      setUsers(result);
    } catch (error) {
      showNotification("Failed to load users", "error");
      console.error(error);
    }
  }, [db, showNotification]);

  const loadNotes = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.select<Note[]>("SELECT id, title, content, user_id, created_at, updated_at FROM notes ORDER BY updated_at DESC");
      setNotes(result);
    } catch (error) {
      showNotification("Failed to load notes", "error");
      console.error(error);
    }
  }, [db, showNotification]);

  const createUser = async () => {
    if (!db || !newUser.name || !newUser.email) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    try {
      await db.execute("INSERT INTO users (name, email) VALUES ($1, $2)", [newUser.name, newUser.email]);
      setNewUser({ name: "", email: "" });
      showNotification("User created successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification(`Failed to create user: ${errorMessage}`, "error");
    }
  };

  const deleteUser = async (id: number) => {
    if (!db) return;
    try {
      await db.execute("DELETE FROM users WHERE id = $1", [id]);
      showNotification("User deleted successfully");
      loadUsers();
      loadNotes(); // Refresh notes in case they were linked to this user
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification(`Failed to delete user: ${errorMessage}`, "error");
    }
  };

  const createNote = async () => {
    if (!db || !newNote.title || newNote.user_id === 0) {
      showNotification("Please fill in title and select a user", "error");
      return;
    }

    try {
      await db.execute("INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3)", [
        newNote.title,
        newNote.content || null,
        newNote.user_id,
      ]);
      setNewNote({ title: "", content: "", user_id: 0 });
      showNotification("Note created successfully");
      loadNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification(`Failed to create note: ${errorMessage}`, "error");
    }
  };

  const deleteNote = async (id: number) => {
    if (!db) return;
    try {
      await db.execute("DELETE FROM notes WHERE id = $1", [id]);
      showNotification("Note deleted successfully");
      loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      const errorMessage = typeof error === "string" ? error : "Unknown error occurred";
      showNotification(`Failed to delete note: ${errorMessage}`, "error");
    }
  };

  useEffect(() => {
    const initAndLoad = async () => {
      try {
        // Initialize database
        await initDatabase();
        
        // Wait a bit for database to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        // Load data
        await loadUsers();
        await loadNotes();
      } catch (error) {
        console.error("Failed to initialize app:", error);
        showNotification("Failed to initialize application", "error");
      }
    };
    initAndLoad();
  }, [initDatabase, loadUsers, loadNotes, showNotification]);

  return (
    <Container size="xl" py={40}>
      {notification && (
        <Notification
          color={notification.type === "error" ? "red" : "green"}
          title={notification.type === "error" ? "Error" : "Success"}
          onClose={() => setNotification(null)}
          mb="md"
        >
          {notification.message}
        </Notification>
      )}

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

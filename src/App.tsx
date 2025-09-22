import { Container, Stack, Tabs, Title } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconBell,
  IconDashboard,
  IconHeart,
  IconHome,
  IconNotes,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import ResponsiveLayout from "./components/layout/ResponsiveLayout";
import type { NavigationConfig } from "./components/layout/ResponsiveLayout/types";
import { SampleNoteForm } from "./features/sample/SampleNoteForm";
import { SampleNoteList } from "./features/sample/SampleNoteList";
import { SampleUserForm } from "./features/sample/SampleUserForm.tsx";
import { SampleUserList } from "./features/sample/SampleUserList";
import type { SampleNote, SampleUser } from "./features/sample/types";

function App() {
  const [users, setUsers] = useState<SampleUser[]>([]);
  const [notes, setNotes] = useState<SampleNote[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("users");

  const navigationConfig: NavigationConfig = {
    primary: [
      {
        id: "home",
        label: "ホーム",
        path: "/",
        icon: IconHome,
      },
      {
        id: "users",
        label: "ユーザー",
        path: "/users",
        icon: IconUsers,
      },
      {
        id: "notes",
        label: "ノート",
        path: "/notes",
        icon: IconNotes,
      },
      {
        id: "search",
        label: "検索",
        path: "/search",
        icon: IconSearch,
      },
      {
        id: "notifications",
        label: "通知",
        path: "/notifications",
        icon: IconBell,
        badge: "3",
      },
    ],
    secondary: [
      {
        id: "dashboard",
        label: "ダッシュボード",
        path: "/dashboard",
        icon: IconDashboard,
        group: "main",
      },
      {
        id: "favorites",
        label: "お気に入り",
        path: "/favorites",
        icon: IconHeart,
        group: "main",
      },
      {
        id: "settings",
        label: "設定",
        path: "/settings",
        icon: IconSettings,
        group: "system",
      },
    ],
  };

  // Database is now initialized on Rust side

  const loadUsers = useCallback(async () => {
    try {
      const result = await invoke<SampleUser[]>("get_users");
      setUsers(result);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Failed to load sample users",
        color: "red",
      });
      console.error(error);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const result = await invoke<SampleNote[]>("get_notes");
      setNotes(result);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Failed to load sample notes",
        color: "red",
      });
      console.error(error);
    }
  }, []);

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
    <ResponsiveLayout navigationConfig={navigationConfig}>
      <Container size="xl" py={40}>
        <Title order={1} ta="center" mb="xl">
          Sapphire - SQLite Database Demo
        </Title>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="users">Users</Tabs.Tab>
            <Tabs.Tab value="notes">Notes</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="md">
            <Stack gap="md">
              <SampleUserForm onUserSaved={loadUsers} />
              <SampleUserList users={users} onUserDeleted={deleteUser} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="md">
            <Stack gap="md">
              <SampleNoteForm users={users} onNoteSaved={loadNotes} />
              <SampleNoteList notes={notes} onNoteDeleted={deleteNote} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </ResponsiveLayout>
  );
}

export default App;

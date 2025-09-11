import {
  Anchor,
  Button,
  Card,
  Center,
  Container,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import reactLogo from "./assets/react.svg";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <Container size="md" py={40}>
      <Center>
        <Stack align="center" gap="xl">
          <Title order={1} ta="center">
            Welcome to Tauri + React
          </Title>

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

          <Text ta="center" c="dimmed">
            Click on the Tauri, Vite, and React logos to learn more.
          </Text>

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
    </Container>
  );
}

export default App;

import React from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider, Text, Card, Button, Image, Group, Center, Space } from '@mantine/core';

import '@mantine/core/styles.css';
import { Supabase } from './supabase';
import { theme } from './common';

const Popup = () => {
  const version = chrome.runtime.getManifest().version;

  function deleteBlacklist() {
    if(confirm('WARNING: Are you sure you want to delete the local blacklist? You will need to close and re-open any Facebook tabs you have open.')) {
      Supabase.deleteLocalBlacklist();
    }

    // TODO: reinitialize ?
  }

  return (
    <>
      <Card padding="large">
        <Card.Section>
          <Image src="icon-128.png"/>
        </Card.Section>

        <Card.Section withBorder>
          <Group justify="space-between">
            <Button variant="outline" fullWidth onClick={deleteBlacklist}>Delete Blacklist</Button>
          </Group>
        </Card.Section>

        <Card.Section>
          <Space />
          <Center>
            <Text size="xs">Version {version}</Text>
          </Center>
        </Card.Section>
      </Card>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
        <Popup/>
    </MantineProvider>
  </React.StrictMode>
);

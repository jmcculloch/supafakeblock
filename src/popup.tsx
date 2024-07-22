import React, { useState } from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider, Text, Card, Button, Image, Group, Center, Space, NumberFormatter } from '@mantine/core';

import '@mantine/core/styles.css';
import { Supabase } from './supabase';
import { theme } from './common';
import { Command } from './types';

const Popup = () => {
  const version = chrome.runtime.getManifest().version;

  const [blacklistCount, setBlacklistCount] = useState<number>(0);

  chrome.runtime.sendMessage({
    command: Command.BlacklistCount
  }, (c) => setBlacklistCount(c));

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
          <Text>Blacklist Size <NumberFormatter value={blacklistCount} thousandSeparator /></Text>
        </Card.Section>

        <Card.Section withBorder>
          <Space />
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

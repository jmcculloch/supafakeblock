import React, { useState } from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider, Text, Card, Button, Image, Group, Center, Space, NumberFormatter } from '@mantine/core';

import '@mantine/core/styles.css';
import { Supabase } from './supabase';
import { sendMessage, theme } from './common';
import { Command } from './types';
import { User } from '@supabase/supabase-js';

let blacklistCount: number = 0;
let user: User | undefined;

chrome.runtime.sendMessage({
    command: Command.BlacklistCount
}, (c) => blacklistCount = c);

chrome.runtime.sendMessage({
    command: Command.GetUser
}, (u) => user = u);

interface PopupProps {
    blacklistCount: number
    user: User | undefined,
}

function Popup(props: PopupProps) {
    const version = chrome.runtime.getManifest().version;

    const [blacklistCount, setBlacklistCount] = useState<number>(props.blacklistCount);
    const [user, setUser] = useState<User | undefined>(props.user);

    function deleteBlacklist() {
        if(confirm('WARNING: Are you sure you want to delete the local blacklist? You will need to close and re-open any Facebook tabs you have open.')) {
          Supabase.deleteLocalBlacklist();
        }

        // TODO: reinitialize ?
    }

    function signin() {
        sendMessage(Command.SignIn);
    }

    function signout() {
        sendMessage(Command.SignOut);
    }

    return (<>
        <Card padding="large">
            <Card.Section>
                <Image src="icon-128.png"/>
            </Card.Section>

            <Card.Section withBorder>
                <Text>{user?.user_metadata?.name}</Text>
                <Text>Blacklist Size <NumberFormatter value={blacklistCount} thousandSeparator /></Text>
            </Card.Section>

          <Card.Section withBorder>
              <Space />
              <Group justify="space-between">
                  <Button variant="outline" fullWidth onClick={deleteBlacklist}>Delete Blacklist</Button>
                  <Button disabled={user !== undefined} variant="outline" fullWidth onClick={signin}>Sign In</Button>
                  <Button disabled={user == undefined} variant="outline" fullWidth onClick={signout}>Sign Out</Button>
              </Group>
          </Card.Section>

          <Card.Section>
              <Space />
              <Center>
                  <Text size="xs">Version {version}</Text>
              </Center>
            </Card.Section>
        </Card>
    </>);
};

const root = createRoot(document.getElementById("root")!);
root.render(
<React.StrictMode>
    <MantineProvider theme={theme}>
        <Popup blacklistCount={blacklistCount} user={user} />
    </MantineProvider>
</React.StrictMode>
);

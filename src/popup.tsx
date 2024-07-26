import React, { useState } from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider, Text, Card, Button, Image, Group, Center, Space, NumberFormatter } from '@mantine/core';

import '@mantine/core/styles.css';
import { Supabase } from './supabase';
import { sendMessageToBackground, theme } from './common';
import { Command } from './types';
import { User } from '@supabase/supabase-js';

interface PopupProps {
    blacklistCount: number
    user: User | undefined,
}

function Popup(props: PopupProps) {
    const version = chrome.runtime.getManifest().version;

    function deleteBlacklist() {
        if(confirm('WARNING: Are you sure you want to delete the local blacklist? You will need to close and re-open any Facebook tabs you have open.')) {
          Supabase.deleteLocalBlacklist();
        }

        // TODO: reinitialize ?
    }

    function signin() {
        sendMessageToBackground(Command.SignIn);
    }

    function signout() {
        sendMessageToBackground(Command.SignOut);
    }

    return (<>
        <Card padding="large">
            <Card.Section>
                <Image src="icon-128.png"/>
            </Card.Section>

            {/* <Card.Section withBorder>
                <Text>{props.user?.user_metadata?.name}</Text>
                <Text>Blacklist Size <NumberFormatter value={props.blacklistCount} thousandSeparator /></Text>
            </Card.Section> */}

          <Card.Section withBorder>
              <Space />
              <Group justify="space-between">
                  <Button variant="outline" fullWidth onClick={deleteBlacklist}>Delete Blacklist</Button>
                  {/* TODO: fix w/ state - props.user !== undefined */}
                  <Button disabled={false} variant="outline" fullWidth onClick={signin}>Sign In</Button>
                  {/* TODO: fix w/ state - props.user == undefined */}
                  <Button disabled={false} variant="outline" fullWidth onClick={signout}>Sign Out</Button>
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

function PopupApp() {
    const [blacklistCount, setBlacklistCount] = useState<number>(0);
    const [user, setUser] = useState<User | undefined>();

    // TODO: retrieve blacklistCount, User w/out creating react render loop

    return (<>
        <Popup blacklistCount={blacklistCount} user={user}/>
    </>);
};

const root = createRoot(document.getElementById("root")!);
root.render(
<React.StrictMode>
    <MantineProvider theme={theme}>
        <PopupApp />
    </MantineProvider>
</React.StrictMode>
);

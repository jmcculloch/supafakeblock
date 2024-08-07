import React, { useEffect, useState } from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider, Text, Card, Button, Image, Group, Center, Space, NumberFormatter } from '@mantine/core';
import { Supabase } from './supabase';
import { emojiForReportType, sendMessageToActiveTab, sendMessageToBackground, theme } from './common';
import { Command, ReportType } from './types';
import { User } from '@supabase/supabase-js';

import '@mantine/core/styles.css';

interface PopupProps {
    blacklistCount: number
    user?: User,
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

            <Card.Section withBorder>
                <Text>{props.user?.user_metadata?.name}</Text>
                <Text>Blacklist Size <NumberFormatter value={props.blacklistCount} thousandSeparator /></Text>
            </Card.Section>

            <Card.Section withBorder>
                <Space />
                <Group justify="space-between">
                    <Button variant="outline" fullWidth onClick={deleteBlacklist}>Delete Blacklist</Button>
                    <Button variant="outline" fullWidth onClick={() => sendMessageToActiveTab(Command.Detection)}>Detection</Button>
                    <Button disabled={props.user !== null} variant="outline" fullWidth onClick={signin}>Sign In</Button>
                    <Button disabled={props.user == null} variant="outline" fullWidth onClick={signout}>Sign Out</Button>
                </Group>
            </Card.Section>

            <Card.Section withBorder>
                <div>
                    <div className="sfb_SCAMMER">{emojiForReportType(ReportType.SCAMMER)} Scammer</div>
                    <div className="sfb_SPAMMER">{emojiForReportType(ReportType.SPAMMER)} Spammer</div>
                    <div className="sfb_FAKE_PROFILE">{emojiForReportType(ReportType.FAKE_PROFILE)} Fake Profile</div>
                </div>
            </Card.Section>

            <Card.Section withBorder>
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
    const [user, setUser] = useState<User>();

    useEffect(() => {
       sendMessageToBackground(Command.BlacklistCount, null, (c) => setBlacklistCount(c));
       sendMessageToBackground(Command.GetUser, null, (u) => setUser(u));

        return () => {
        };
    });

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

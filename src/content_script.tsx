import { queryGroupProfileLinks, updateGroupProfileLinks, markAsScammer } from './common';
import React, { useState } from 'react'
import { MantineProvider, createTheme } from '@mantine/core';
import { createRoot } from "react-dom/client";
import { Modal, Button, Text, SegmentedControl, Slider, Textarea, Stack } from '@mantine/core';

import '@mantine/core/styles.css';
import { Command, Message, PromptRequest, ScammerType } from './types';
import { useDisclosure, useInputState } from '@mantine/hooks';

'use strict';

const theme = createTheme({
/** Put your mantine theme override here */
});

updateGroupProfileLinks();

const observer = new MutationObserver((mutationList, observer) => updateGroupProfileLinks());
// TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
observer.observe(document.body, { attributes: false, childList: true, subtree: true });

function App() {
    const [opened, { close, open }] = useDisclosure(false);
    const [profileId, setProfileId] = useState<number>();
    const [notes, setNotes] = useInputState<string>('');
    const [scammerType, setScammerType] = useInputState<string>('Scammer');
    const [confidence, setConfidence] = useInputState<number>(0.5);

    /**
     * Register a message listener from the background service -> this context menu handler.
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove console log
        console.log(`content script received message: `, request, sender, sendResponse);

        switch(request.command) {
            case Command.Prompt:
                showModal((request.body as PromptRequest).profileId);
                break;
            default:
                console.log(`Received unknown command: `, request.command);
        }
    });

    function showModal(profileId: number) {
        setProfileId(profileId);
        // TODO: lookup name from profileId->link?
        open();
    }

    function report() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Report,
            body: {
                profileId: profileId,
                type: scammerType,
                notes: notes,
                confidence: confidence
            }
        });

        // Update UI
        updateProfile(profileId!);

        close();
        // TODO: better way to clear state? leave scammerType as previously set
        setConfidence(0.5);
        setNotes('');
        setProfileId(undefined);
    }

    function updateProfile(profileId: number) {
        queryGroupProfileLinks((e) => markAsScammer(e as HTMLAnchorElement), profileId);
    }

    return (
        <>
            <Modal opened={opened} onClose={close} title="Report Profile" centered>
                <Stack
                    align="stretch"
                    justify="center"
                    gap="xs">
                    <Text size="md" >Are you sure you want to report PROFILE_NAME ({profileId})?</Text>

                    <SegmentedControl fullWidth size="md" radius="xl" data={[
                            ScammerType.SCAMMER.toString(),
                            ScammerType.SPAMMER.toString(),
                            ScammerType.FAKE_PROFILE.toString()
                        ]} value={scammerType} onChange={setScammerType}/>

                    <Slider color="red" value={confidence} onChange={setConfidence} marks={[
                        { value: 0, label: 'Not Sure' },
                        { value: 50, label: 'Meh?' },
                        { value: 100, label: 'Positive' },
                    ]} />

                    <Textarea
                        placeholder="Optional: Enter contextual notes about this profile here."
                        label="Notes"
                        autosize
                        minRows={4}
                        value={notes} onChange={setNotes} />

                    <Button onClick={report} color="red">Report Profile</Button>
                </Stack>
            </Modal>
        </>
    );
}

const root = createRoot(document.createElement('div'));
root.render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
        <App/>
    </MantineProvider>
  </React.StrictMode>
);
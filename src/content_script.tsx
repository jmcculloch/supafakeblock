import { queryGroupProfileLinks, updateGroupProfileLinks, blacklistProfileLink, getFacebookProfileId } from './common';
import React, { useState } from 'react'
import { Accordion, AccordionItem, HoverCard, MantineProvider, Tooltip, Text } from '@mantine/core';
import { createRoot } from "react-dom/client";
import { Modal, Button, Slider, Textarea, Stack } from '@mantine/core';

import '@mantine/core/styles.css';
import { Command, Message, ReportType } from './types';
import { useDisclosure, useInputState } from '@mantine/hooks';

'use strict';

const reporterProfileId = getFacebookProfileId();

updateGroupProfileLinks();

const observer = new MutationObserver((mutationList, observer) => updateGroupProfileLinks());
// TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
observer.observe(document.body, { attributes: false, childList: true, subtree: true });

function App() {
    const [opened, { close, open }] = useDisclosure(false);
    const [profileId, setProfileId] = useState<number>();
    const [notes, setNotes] = useInputState<string>('');
    const [reportType, setReportType] = useInputState<string>(ReportType.SCAMMER);
    const [confidence, setConfidence] = useInputState<number>(50);

    // TODO: Temporary display of previously known profile stats
    const [upVotes, setUpVotes] = useInputState<number>(0);
    const [downVotes, setDownVotes] = useState<number>(0);
    const [avgConfidence, setAvgConfidence] = useState<number>(0);

    /**
     * Register a message listener from the background service -> this context menu handler.
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove console log
        //console.log(`content script received message: `, request, sender, sendResponse);
        switch(request.command) {
            case Command.Prompt:
                showModal(request.body as number);
                break;
            default:
                console.log(`Received unknown command: `, request.command);
        }
    });

    function showModal(profileId: number) {
        // TODO: fix kludgey state cleanup
        setNotes(null);
        setUpVotes(0);
        setDownVotes(0);
        setAvgConfidence(0);

        setProfileId(profileId);

        chrome.runtime.sendMessage({
            command: Command.GetReportStats,
            body: profileId,
        }, (response: any) => {
            setUpVotes(response.up_votes);
            setDownVotes(response.down_votes);
            setAvgConfidence(response.avg_confidence);
        });

        open();
    }

    function report() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Report,
            body: {
                profileId: profileId,
                type: reportType,
                notes: notes,
                // Convert 0-100 scale -> 0.0 - 1.0
                confidence: confidence * 0.01,
                reporter: reporterProfileId,
            }
        });

        // Render blacklisted group profile links
        queryGroupProfileLinks((e) => blacklistProfileLink(e as HTMLAnchorElement), profileId);

        close();
    }

    // TODO: reduce copy-pasta from report()
    function dispute() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Report,
            body: {
                profileId: profileId,
                type: reportType,
                notes: notes,
                // Convert 0-100 scale -> 0.0 - 1.0
                confidence: confidence * 0.01,
                reporter: reporterProfileId,
            }
        });

        // TODO: what to do on UI in a dispute case?

        close();
    }

    return (
        <>
            <Modal opened={opened} onClose={close} title="Report Profile" centered>
                <Stack align="stretch" justify="center" gap="md">
                    <Accordion value={reportType} onChange={setReportType}>
                        <AccordionItem value={ReportType.SCAMMER}>
                            <Accordion.Control icon="🦹">Scammer</Accordion.Control>
                            <Accordion.Panel>
                                A scammer is someone actively trying to ...
                            </Accordion.Panel>
                        </AccordionItem>
                        <AccordionItem value={ReportType.SPAMMER}>
                            <Accordion.Control icon="🤖">Spammer</Accordion.Control>
                            <Accordion.Panel>
                                A spammer is someone who ...
                            </Accordion.Panel>
                        </AccordionItem>
                        <AccordionItem value={ReportType.FAKE_PROFILE}>
                            <Accordion.Control icon="🧟">Fake Profile</Accordion.Control>
                            <Accordion.Panel>
                                A fake profile is ...
                            </Accordion.Panel>
                        </AccordionItem>
                    </Accordion>

                    <Tooltip label="How confident are you that this profile is fraudulent?" position="bottom">
                        <Slider color="red" value={confidence} onChange={setConfidence} />
                    </Tooltip>

                    <Textarea
                        placeholder="Optional: Enter notes about the fraudulent profile here."
                        label="Notes"
                        autosize
                        minRows={4}
                        value={notes} onChange={setNotes} />

                    <Tooltip label="Report this is a fraudulent profile.">
                        <Button onClick={report} color="red">Report Profile</Button>
                    </Tooltip>
                    <HoverCard width="280">
                        <HoverCard.Target>
                            <Button onClick={dispute} color="red" variant="outline">Dispute Profile</Button>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                            <Text size="sm">
                            Dispute the fact that this is a fraudulent profile.
                            Please fill out the notes section with the reasons you believe this account should not be considered a fraudulent profile.
                            </Text>
                        </HoverCard.Dropdown>
                    </HoverCard>

                    Profile Stats:
                    👍 {upVotes} &nbsp;
                    👎 {downVotes} &nbsp;
                    🎰 {avgConfidence.toFixed(2)}
                </Stack>
            </Modal>
        </>
    );
}

const root = createRoot(document.createElement('div'));
root.render(
  <React.StrictMode>
    <MantineProvider>
        <App/>
    </MantineProvider>
  </React.StrictMode>
);
import React, { useState } from 'react'
import { HoverCard, Tooltip, Text, RadioGroup, Radio } from '@mantine/core';
import { Modal, Button, Textarea, Stack } from '@mantine/core';
import { Command, ReportConfidence, ReportType } from './types';
import { blacklistProfileLink, queryGroupProfileLinks } from './common';
import { useInputState } from '@mantine/hooks';

/**
 *
 */
export function ReportModal(props: ReportModalProps) {
    const [notes, setNotes] = useInputState<string>('');
    const [reportType, setReportType] = useState<string>(ReportType.SCAMMER);
    const [confidence, setConfidence] = useInputState<string>(ReportConfidence.PROBABLY);

    function report() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Report,
            body: {
                profileId: props.profileId,
                type: reportType,
                notes: notes,
                confidence: confidence
            }
        });

        // Render blacklisted group profile links
        queryGroupProfileLinks((e) => blacklistProfileLink(e as HTMLAnchorElement), props.profileId);

        props.close();
    }

    // TODO: reduce copy-pasta from report()
    function dispute() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Report,
            body: {
                profileId: props.profileId,
                type: reportType,
                notes: notes,
                confidence: confidence
            }
        });

        // TODO: what to do on UI in a dispute case?

        props.close();
    }
  
    return (<>
        <Modal opened={props.opened} onClose={props.close} title="Report Profile" centered>
            <Stack align="stretch" justify="center" gap="md">

                <RadioGroup variant="vertical" label="Type:" value={reportType} onChange={setReportType}>
                    <Radio value={ReportType.SCAMMER} label="🦹 Scammer" />
                    <Radio value={ReportType.SPAMMER} label="🤖 Spammer" />
                    <Radio value={ReportType.FAKE_PROFILE} label="🧟 Fake Profile" />
                </RadioGroup>

                <RadioGroup variant="vertical" label="Confidence:" value={confidence} onChange={setConfidence}>
                    <Radio value={ReportConfidence.NOT_SURE} label="Not Sure?" />
                    <Radio value={ReportConfidence.MEH} label="Meh" />
                    <Radio value={ReportConfidence.PROBABLY} label="Probably" />
                    <Radio value={ReportConfidence.ABSOLUTELY} label="Absolutely!" />
                </RadioGroup>

                {/*  */}
                <Textarea
                    placeholder="Optional: Enter notes about the fraudulent profile here."
                    label="Notes"
                    autosize
                    minRows={4}
                    value={notes}
                    onChange={setNotes} />

                <Tooltip label="Report this is a fraudulent profile.">
                    <Button onClick={report}>Report Profile</Button>
                </Tooltip>
                <HoverCard width="280">
                    <HoverCard.Target>
                        <Button onClick={dispute} variant="outline">Dispute Profile</Button>
                    </HoverCard.Target>
                    <HoverCard.Dropdown>
                        <Text size="sm">
                        Dispute the fact that this is a fraudulent profile.
                        Please fill out the notes section with the reasons you believe this account should not be considered a fraudulent profile.
                        </Text>
                    </HoverCard.Dropdown>
                </HoverCard>

                Profile Stats:
                👍 {props.upVotes} &nbsp;
                👎 {props.downVotes} &nbsp;
                🎰 {props.avgConfidence}
            </Stack>
        </Modal>
    </>);
}

interface ReportModalProps {
    opened: boolean;
    close: () => void;
    profileId: number;
    upVotes: number;
    downVotes: number;
    avgConfidence: number;
    notes: string;
}
  
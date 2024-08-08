import React, { useState } from 'react'
import { HoverCard, Tooltip, Text, RadioGroup, Radio } from '@mantine/core';
import { Modal, Button, Textarea, Stack } from '@mantine/core';
import { Command, ReportConfidence, ReportType } from './types';
import { blacklistProfileLink, emojiForReportType, queryProfileLinks } from './common';
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
                confidence: confidence,
                dispute: false
            }
        });

        // Render blacklisted group profile links
        queryProfileLinks((e) => blacklistProfileLink(e as HTMLAnchorElement, {
            type: reportType,
            avgConfidence: confidence,
        }), props.profileId);

        setNotes('');
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
                confidence: confidence,
                dispute: true
            }
        });

        // TODO: what to do to UI in a dispute case?

        setNotes('');
        props.close();
    }

    function watch() {
        // Submit report to background/supabase
        chrome.runtime.sendMessage({
            command: Command.Watch,
            body: {
                profileId: props.profileId,
                // TODO: are the other parameters necessary?
                type: reportType,
                notes: notes,
                confidence: confidence
            }
        });

        // Render blacklisted group profile links
        queryProfileLinks((e) => blacklistProfileLink(e as HTMLAnchorElement, {
            type: ReportType.WATCH,
            avgConfidence: confidence,
        }), props.profileId);

        setNotes('');
        props.close();
    }
  
    return (<>
        <Modal opened={props.opened} onClose={props.close} title="Report Profile" centered>
            <Stack align="stretch" justify="center" gap="md">

                <RadioGroup variant="vertical" label="Type:" value={reportType} onChange={setReportType}>
                    <Radio value={ReportType.SCAMMER} label={`${emojiForReportType(ReportType.SCAMMER)} Scammer`} />
                    <Radio value={ReportType.SPAMMER} label={`${emojiForReportType(ReportType.SPAMMER)} Spammer`} />
                    <Radio value={ReportType.FAKE_PROFILE} label={`${emojiForReportType(ReportType.FAKE_PROFILE)} Fake Profile`} />
                </RadioGroup>

                <RadioGroup variant="vertical" label="Confidence:" value={confidence} onChange={setConfidence}>
                    <Radio value={ReportConfidence.NOT_SURE} label="Not Sure?" />
                    <Radio value={ReportConfidence.MEH} label="Meh" />
                    <Radio value={ReportConfidence.PROBABLY} label="Probably" />
                    <Radio value={ReportConfidence.ABSOLUTELY} label="Absolutely!" />
                </RadioGroup>

                <Textarea
                    placeholder="Optional: Enter notes about the fraudulent profile here."
                    label="Notes"
                    autosize
                    minRows={4}
                    value={notes}
                    onChange={setNotes}
                    data-autofocus />

                <Tooltip label="Report this is a fraudulent profile.">
                    <Button onClick={report}>Report Profile</Button>
                </Tooltip>
                {props.upVotes > 0 ?
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
                :
                    <HoverCard width="280">
                        <HoverCard.Target>
                            <Button onClick={watch} variant="outline">{emojiForReportType(ReportType.WATCH)} Watch Profile</Button>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                            <Text size="sm">
                            Watch a potential fraudulent profile.
                            </Text>
                        </HoverCard.Dropdown>
                    </HoverCard>
                }

                {(props.upVotes || props.downVotes) &&
                    <div>
                        Profile Stats:
                        👍 {props.upVotes} &nbsp;
                        👎 {props.downVotes} &nbsp;
                        🎰 {props.avgConfidence}
                    </div>
                }
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
}
  
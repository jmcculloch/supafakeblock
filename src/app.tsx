import React, { useEffect, useState } from 'react'
import { ReportModal } from './report_modal';
import { Command, Message, PromptRequest } from './types';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { SignInModal } from './sign_in_modal';
import { detection } from './detection';
import { Report } from './types';
import { blacklistProfileLink, queryProfileLinks } from './common';

/**
 *
 */
export function App() {
    const [reportOpened, reportHandlers] = useDisclosure(false);
    const [signInOpened, signInHandlers] = useDisclosure(false);
    const [profileId, setProfileId] = useState<number>(0);

    const [upVotes, setUpVotes] = useState<number>(0);
    const [downVotes, setDownVotes] = useState<number>(0);
    const [avgConfidence, setAvgConfidence] = useState<number>(0);
    const [reports, setReports] = useState<Report[]>();

    function onMessageCallback(request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove console log
        // console.log(`content script received message: `, request, sender, sendResponse);

        switch(request.command) {
            case Command.Prompt:
                showReportModal(request.body as PromptRequest);
                break;
            case Command.Notification:
                notifications.show(request.body as any);
                break;
            case Command.SignInRequired:
                showSignInModal();
                break;
            case Command.Detection:
                detection();
                break;
            case Command.UpdateProfile:
                const report = request.body as Report;
                // Render blacklisted group profile links
                queryProfileLinks((e) => blacklistProfileLink(e as HTMLAnchorElement, {
                    type: report.type,
                    avgConfidence: parseFloat(report.confidence),
                }), report.profileId);
                break;
            default:
                console.log(`Received unknown command: `, request.command);
                break;
        }
    }

    useEffect(() => {
        /**
         * Register a message listener from the background service -> this context menu handler.
         */
        chrome.runtime.onMessage.addListener(onMessageCallback);

        return () => {
            chrome.runtime.onMessage.removeListener(onMessageCallback);
        };
    });

    function showReportModal(promptRequest: PromptRequest) {
        setProfileId(promptRequest.profileId);
        setUpVotes(promptRequest.upVotes);
        setDownVotes(promptRequest.downVotes);
        setAvgConfidence(promptRequest.avgConfidence);
        setReports(promptRequest.reports);

        reportHandlers.open();
    }

    function showSignInModal() {
        signInHandlers.open();
    }

    return (<>
        <ReportModal opened={reportOpened} close={reportHandlers.close} profileId={profileId} upVotes={upVotes} downVotes={downVotes} avgConfidence={avgConfidence} reports={reports || []} />
        <SignInModal opened={signInOpened} close={signInHandlers.close} />
    </>);
}
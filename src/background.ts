import { Supabase } from './supabase';
import { profileIdFromGroupProfileUrl } from './common';
import { Command, Message, QueryRequest, ReportRequest } from './types';

'use strict';

/**
 * Register a context menu item to "Report Profile" for:
 * - group profile links
 * - generic profile links by ID
 * 
 * TODO: how to support links with "nickname", e.g. https://www.facebook.com/nickname/?
 */
chrome.runtime.onInstalled.addListener(function (details: chrome.runtime.InstalledDetails) {
    chrome.contextMenus.create({
        title: 'Report Profile',
        contexts: ['link'],
        id: 'test',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            'https://www.facebook.com/profile.php?id=*',
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ],
    });
});

(async function () {
    const supabase: Supabase = await Supabase.init();

    /**
     * 
     */
    chrome.contextMenus.onClicked.addListener(function(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
        const profileId = profileIdFromGroupProfileUrl(info.linkUrl!);

        // Send a message back to the content script/DOM to actively flag the profile
        if(tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                command: Command.Prompt,
                body: {
                    profileId: profileId
                }
            });
        }
    });

    /**
     * 
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        console.log(`Received message: `, request, sender, sendResponse);
        switch((request as Message).command) {
            case Command.Report:
                const report = (request.body as ReportRequest);

                // Update database
                supabase.report({
                    profileId: report.profileId,
                    type: report.type,
                    confidence: report.confidence
                });
                break;
            case Command.Query:
                (async () => {
                    sendResponse(await supabase.getScammer((request.body as QueryRequest).profileId));
                })();
                break;
            default:
        }

        // NOTE: We must return true in order to allow the asynchronous response above
        return true;
    });
})();

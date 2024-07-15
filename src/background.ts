import { Supabase } from './supabase';
import { profileIdFromGroupProfileUrl } from './common';
import { Command, Message } from './types';

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
            // 'https://www.facebook.com/profile.php?id=*',
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

        // Send a message back to the content script/DOM to prompt user for report data
        if(tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                command: Command.Prompt,
                body: profileId
            });
        }
    });

    /**
     * 
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove
        // console.log(`Received message: `, request, sender, sendResponse);
        switch((request as Message).command) {
            case Command.Report:
                // Update database
                // TODO: fix typing on structured Message request
                supabase.report(request.body as any);
                break;
            case Command.IsBlacklisted:
                (async () => {
                    sendResponse(await supabase.isBlacklisted(request.body as number));
                })();
                break;
            case Command.GetReportStats:
                (async () => {
                    sendResponse(await supabase.getReportStats(request.body as number));
                })();
                break;
            default:
        }

        // NOTE: We must return true in order to allow the asynchronous response above
        return true;
    });
})();

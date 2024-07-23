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
        id: 'report',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            // 'https://www.facebook.com/profile.php?id=*',
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ],
    });

    chrome.contextMenus.create({
        title: 'Search Facebook',
        contexts: ['link'],
        id: 'search',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            // 'https://www.facebook.com/profile.php?id=*',
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ],
    });
});

/**
 * Register contextmenu handler
 */
chrome.contextMenus.onClicked.addListener(function(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void {
    const profileId = profileIdFromGroupProfileUrl(info.linkUrl!);
    if(tab && tab.id) {
        switch(info.menuItemId) {
            // Send a message back to the content script/DOM to prompt user for report data
            case 'report':
                chrome.tabs.sendMessage(tab.id, {
                    command: Command.Prompt,
                    body: profileId
                });
                break;
            // Open a new tab with a facebook search against the selected text (in a group profile link)
            case 'search':
                chrome.tabs.create({
                    url: `https://www.facebook.com/search/top?q=${encodeURIComponent(info.selectionText ?? '')}`,
                    active: true
                });
                break;
            default:
                console.log('Unknown context menu ID: ', info.menuItemId);
        }
    }
});

(async function () {
    const supabase: Supabase = await Supabase.init();

    /**
     * Register message handler
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove
        //console.log(`Received message: `, request, sender, sendResponse);

        (async () => {
            // TODO: refactor non-switch statement
            switch((request as Message).command) {
                case Command.Report:
                    // Update database
                    // TODO: fix typing on structured Message request
                    supabase.report(request.body as any);
                    break;
                case Command.IsBlacklisted:
                    sendResponse(await supabase.isBlacklisted(request.body as number));
                    break;
                case Command.GetReportStats:
                    sendResponse(await supabase.getReportStats(request.body as number));
                    break;
                case Command.BlacklistCount:
                    sendResponse(await supabase.getBlacklistCount());
                    break;
                case Command.SignIn:
                    supabase.signIn();
                    break;
                case Command.SignOut:
                    supabase.signOut();
                    break;
                default:
                    break;
            }
        })();

        // NOTE: We must return true in order to allow the asynchronous response above
        return true;
    });
})();

import { Supabase } from './supabase';
import { errorNotification, notification, profileIdFromGroupProfileUrl, sendMessageToActiveTab } from './common';
import { Command, Message } from './types';
import { User } from '@supabase/supabase-js';

'use strict';

/**
 * TODO: update doc
 * Register a context menu item to "Report Profile" for:
 * - group profile links
 * - generic profile links by ID
 */
chrome.runtime.onInstalled.addListener(function (details: chrome.runtime.InstalledDetails) {
    // TODO: doc
    chrome.contextMenus.create({
        title: 'Report',
        contexts: ['link'],
        id: 'report',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            // 'https://www.facebook.com/profile.php?id=*',
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ],
    });

    // TODO: doc
    chrome.contextMenus.create({
        title: 'Search',
        contexts: ['link'],
        id: 'search',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            // TODO: other patterns or just for groups?
        ],
    });
});

(async function () {
    const supabase: Supabase = await Supabase.init();

    let user : User | null = await supabase.getUserFromLocalStorage();
    // TODO: remove
    // console.log(`background init current user is: `, user);

    /**
     * Register message handler
     */
    chrome.runtime.onMessage.addListener(function (request: Message, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // TODO: remove
        // console.log(`Received message: `, request, sender, sendResponse);

        (async () => {
            // TODO: refactor non-switch statement
            switch((request as Message).command) {
                case Command.Report:
                    // Update database
                    // TODO: fix typing on structured Message request
                    const error = await supabase.report(request.body as any);
                    if(error) {
                        console.log(`Error: `, error);
                        errorNotification(error.name, error.message, sender.tab);
                    }
                    break;
                case Command.IsBlacklisted:
                    sendResponse(await supabase.isBlacklisted(request.body as number));
                    break;
                case Command.BlacklistCount:
                    sendResponse(await supabase.getBlacklistCount());
                    break;
                case Command.GetUser:
                    sendResponse(user);
                    break;
                case Command.SignIn:
                    await supabase.signIn((u: User) => {
                        // Update local auth state
                        user = u;

                        notification('User Signed In');
                    });
                    break;
                case Command.SignOut:
                    supabase.signOut();

                    // Update local auth state
                    user = null;

                    notification('User Signed Out');
                    break;
                default:
                    break;
            }
        })();

        // NOTE: We must return true in order to allow the asynchronous response above
        return true;
    });

    /**
     * Register contextmenu handler
     */
    chrome.contextMenus.onClicked.addListener(function(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void {
        const profileId = profileIdFromGroupProfileUrl(info.linkUrl!);
        if(tab && tab.id) {
            switch(info.menuItemId) {
                // Send a message back to the content script/DOM to prompt user for report data
                // with additional statistics on the profile if it already exists (prompt is overloaded)
                case 'report':
                    // Auth Guard
                    if(user == null) {
                        sendMessageToActiveTab(Command.SignInRequired, tab);
                        return;
                    }

                    (async () => {
                        const response = {
                            profileId: profileId,
                            ...(await supabase.getReportStats(profileId))
                        };

                        chrome.tabs.sendMessage(tab.id!, {
                            command: Command.Prompt,
                            body: response
                        });
                    })();
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
                    break;
            }
        }
    });
})();

import { Supabase } from './supabase';
import { profileIdFromGroupProfileUrl } from './common';

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
    chrome.contextMenus.onClicked.addListener(async function(info: chrome.contextMenus.OnClickData) {
        const profileId = profileIdFromGroupProfileUrl(info.linkUrl!);

        // Get the current active tab that the context menu was activated on
        // TODO: Is this available in the OnClickedData?
        // NOTE: [tab] destructuring
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

        // Report profile to the server
        // TODO: In the future this should involve a dialog that collections additional information such as profile type, confidence, etc.
        supabase.report(profileId);

        // Send a message back to the content script/DOM to actively flag the profile
        chrome.tabs.sendMessage(tab.id!, {
            profileId: profileId
        });
    });

    /**
     * 
     */
    chrome.runtime.onMessage.addListener(function (request: any, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        // console.log(`Received message: `, request, sender, sendResponse);
        (async () => {
            const isScammer = await supabase.isScammer(request.profileId);
            sendResponse({
                isScammer: isScammer
            });
        })();

        // NOTE: We must return true in order to allow the asynchronous response above
        return true;
    });
})();

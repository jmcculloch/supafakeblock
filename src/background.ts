import { Supabase } from './supabase';

(async function () {
    'use strict';

    chrome.runtime.onInstalled.addListener(function (details: chrome.runtime.InstalledDetails) {
        chrome.contextMenus.create({
            title: 'Report',
            contexts: ['link'],
            id: 'test',
            targetUrlPatterns: [
                'https://www.facebook.com/groups/*/user/*',
            ],
        });
    });

    chrome.contextMenus.onClicked.addListener(function(info: chrome.contextMenus.OnClickData) {
        console.log(`hello ${info.menuItemId} - ${info.linkUrl}`);
        supabase.report(profileIdFromGroupProfileUrl(info.linkUrl!));
    });

    // TODO: copypasta from content_script.tsx
    function profileIdFromGroupProfileUrl(url: string): number {
        // TODO: is regex compiled only once as a function scoped const?
        const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;
        const matches = url.match(GROUP_PROFILE_LINK_REGEX);
        if (matches) {
            return parseInt(matches[1]);
        }
        else {
            return Number.NaN;
        }
    }

    const supabase: Supabase = await Supabase.init();
})();

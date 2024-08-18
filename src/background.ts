import { Supabase } from './supabase';
import { errorNotification, notification, profileIdFromUrl, sendMessageToActiveTab } from './common';
import { Command, Message, PromptRequest, Report, ReportType } from './types';
import { User } from '@supabase/supabase-js';

'use strict';

/**
 * Fired when the extension is first installed, when the extension is updated or when chrome is updated
 *
 * Disables action icon, enables when on https://www.facebook.com
 *
 * Register a context menu item to "Report Profile" for:
 * - group profile links
 * - generic profile links by ID
 */
chrome.runtime.onInstalled.addListener(function (details: chrome.runtime.InstalledDetails) {
    // Set action icon to disabled state
    chrome.action.disable();

    // Only enable on https://www.facebook.com
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                  new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: { schemes: ['https'], hostEquals: 'www.facebook.com' }
                  })
                ],
                actions: [ new chrome.declarativeContent.ShowAction() ]
            }
        ]);
    });

    // TODO: doc
    chrome.contextMenus.create({
        title: 'Report',
        contexts: ['link'],
        id: 'report',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            'https://www.facebook.com/profile.php?id=*'
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ]
    });

    // TODO: doc
    chrome.contextMenus.create({
        title: 'Watch',
        contexts: ['link'],
        id: 'watch',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            'https://www.facebook.com/profile.php?id=*'
            // TODO: how to register a pattern to support account nicknames, e.g. https://www.facebook.com/nickname/?
        ]
    });

    // TODO: doc
    chrome.contextMenus.create({
        title: 'Search',
        contexts: ['link'],
        id: 'search',
        targetUrlPatterns: [
            'https://www.facebook.com/groups/*/user/*',
            'https://www.facebook.com/profile.php?id=*'
        ]
    });

    // TODO: doc
    chrome.contextMenus.create({
        title: 'Detection',
        contexts: ['page'],
        id: 'detection',
        documentUrlPatterns: [
            'https://www.facebook.com/profile.php?id=*',
            // TODO: figure out a pattern to identify aliases profile links
            //'https://www.facebook.com/*/$',
            'https://www.facebook.com/*'
        ]
    });

    chrome.contextMenus.create({
        title: 'Report',
        contexts: ['page'],
        id: 'report_page',
        documentUrlPatterns: [
            'https://www.facebook.com/profile.php?id=*',
            // TODO: figure out a pattern to identify aliases profile links
            //'https://www.facebook.com/*/$',
            'https://www.facebook.com/*'
        ]
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
                    const report = (request.body as unknown) as Report;
                    const error = await supabase.report(report);
                    if(error) {
                        console.log(`Error: `, error);
                        errorNotification(error.message, error.name, sender.tab);
                    }
                    sendMessageToActiveTab<Report>(Command.UpdateProfile, report, sender.tab);
                    break;
                case Command.Watch:
                    const watchReport = (request.body as unknown) as Report;
                    supabase.watch(watchReport.profileId);
                    sendMessageToActiveTab<Report>(Command.UpdateProfile, watchReport, sender.tab);
                    break;
                case Command.Delete:
                    supabase.deleteFromLocalBlacklist(request.body as number);
                    break;
                case Command.IsBlacklisted:
                    sendResponse(await supabase.isBlacklisted(request.body as number));
                    break;
                case Command.BlacklistCount:
                    sendResponse(await supabase.getBlacklistCount());
                    break;
                case Command.GetPromptRequest:
                    const profileId = (request.body as number);
                    const reportStats = await supabase.getReportStats(profileId);
                    const reoprts = await supabase.getReports(profileId);
                    sendResponse({
                        profileId: profileId,
                        upVotes: reportStats?.upVotes,
                        downVotes: reportStats?.downVotes,
                        avgConfidence: reportStats?.avgConfidence,
                        reports: reoprts
                    } as PromptRequest);
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
        let profileId: number | null = null;

        // If a linkUrl is clicked (e.g. a 'link' context menu)
        if(info.linkUrl) {
            // Parse the profileId from the link
            profileId = profileIdFromUrl(info.linkUrl);

            // TODO: document this better
            // NOTE: profileIdFromUrl will return null if the REGEX doesn't match, excluding certain URLs
            if(!profileId) {
                return;
            }
        }

        if(tab && tab.id) {
            switch(info.menuItemId) {
                // Send a message back to the content script/DOM to prompt user for report data
                // with additional statistics on the profile if it already exists (prompt is overloaded)
                case 'report':
                    // Auth Guard
                    // TODO: re-eneable when supabase RLS policies are back in place with viable FB Login
                    /*if(user == null) {
                        sendMessageToActiveTab(Command.SignInRequired, tab);
                        return;
                    }*/

                    (async () => {
                        const response = {
                            profileId: profileId,
                            ...(await supabase.getReportStats(profileId!)),
                            reports: (await supabase.getReports(profileId!))
                        };

                        sendMessageToActiveTab(Command.Prompt, response, tab);
                    })();
                    break;
                // TODO: auth guard
                case 'report_page':
                    sendMessageToActiveTab(Command.PromptPage, null, tab);
                    break;
                case 'watch':
                    supabase.watch(profileId!);
                    sendMessageToActiveTab<Report>(Command.UpdateProfile, {
                        profileId: profileId!,
                        type: ReportType.WATCH,
                        confidence: '1.0'
                    }, tab);
                    break;
                case 'detection':
                    sendMessageToActiveTab(Command.Detection, null, tab);
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

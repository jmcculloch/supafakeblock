// TODO: rename to "facebook.ts"?

import { createTheme } from "@mantine/core";
import { Command } from "./types";

export const theme = createTheme({
    primaryColor: 'red'
});

/**
 *
 */
const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;

/**
 * Parses a Facebook group profile link and extracts the profile ID
 *
 * @param url a relative URL composed of the numeric group and profile IDs (and sometimes some other query string information)
 * @returns number
 */
export function profileIdFromGroupProfileUrl(url: string): number {
    return parseInt(url.match(GROUP_PROFILE_LINK_REGEX)![1]);
}

/**
 * Search DOM for <a href="/groups/{groupId}/user/{profileId}"> elements.
 *
 * @param callback invokes callback on matching elements
 * @param profileId optional parameter to limit to a specific profileId (will search pre-evaluated links)
 */
export function queryGroupProfileLinks(callback: (e: Element) => void, profileId?: number): void {
    // TODO: better query selector to not evaluate the entire DOM/MutationObserver node?
    // TODO: document logic at this point
    // TODO: exclude when aria-hidden=true (but allow when aria-hidden is not specified)
    const matches = document.querySelectorAll(`a[href^="/groups/"][href*="/user/${profileId ?? ''}"]${profileId?'':':not(.sfb_evaluated)'}`);

    // TODO: remove
    //console.log(`queryGroupProfileLinks profileId:${profileId}, count ${matches.length}`);

    matches.forEach((e: Element) => {
        // TODO: port this to the querySelector ?
        if(e.getAttribute('aria-hidden') !== 'true' && e.textContent !== '') {
            callback(e);
        }
    });
}

/**
 * TODO: rename?
 * TODO: document
 */
export function updateGroupProfileLinks(): void {
    queryGroupProfileLinks(async (e: Element) => {
        const profileLink = e as HTMLAnchorElement;

        profileLink.classList.add('sfb_evaluated');
        isBlacklisted(profileIdFromGroupProfileUrl(profileLink.href), () => blacklistProfileLink(profileLink))
    });
}

function isBlacklisted(profileId: number, performIfBlacklisted: Function): void {
    chrome.runtime.sendMessage({
            command: Command.IsBlacklisted,
            body: profileId,
        },
        (isInBlacklist: boolean) => {
            if(isInBlacklist) performIfBlacklisted()
        }
    );
}

export function blacklistProfileLink(profileLink: HTMLAnchorElement): void {
    profileLink.classList.add('sfb_blacklisted');
}

/**
 * Sends a message to the background service worker
 *
 * @param command
 * @param body?
 */
export function sendMessage(command: Command, body?: any): void {
    chrome.runtime.sendMessage({
        command: command,
        body: body
    });
}

/**
 * Sends a message to the active tab -- this is intended to target the content script
 *
 * @param command
 * @param body?
 */
export async function sendMessageToActiveTab(command: Command, body?: any): Promise<void> {
    // TODO: add current tabId to Message payload to return messages to proper tab?
    const [tab] = await chrome.tabs.query({ active: true });

    if(tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            command: command,
            body: body
        });
    }
}
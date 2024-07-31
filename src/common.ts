// TODO: rename to "facebook.ts"?

import { createTheme } from "@mantine/core";
import { Command } from "./types";

export const theme = createTheme({
    primaryColor: 'red'
});

const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;
// NOTE: Adding a '$' to the end of the regex will limit to profileId=12345 and ignore links
// with additional search params this cuts down on links to navigate a profile page but also
// prevents links from popup cards, etc
const PROFILE_LINK_REGEX = /.*\/profile.php\?id=(\d+)/;

/**
 * TODO:
 * @param url
 * @returns number
 */
export function profileIdFromUrl(url: string): number | null {
    const regexes = [GROUP_PROFILE_LINK_REGEX, PROFILE_LINK_REGEX];
    for(let regexIndex in regexes) {
        let regex = regexes[regexIndex];

        const matches = url.match(regex);
        if(matches) {
            return parseInt(matches[1]);
        }
    }

    return null;
}

/**
 * Search DOM for A elements containing profile links
 *
 * @param callback invokes callback on matching elements
 * @param profileId optional parameter to limit to a specific profileId (will search pre-evaluated links)
 */
export function queryProfileLinks(callback: (e: HTMLAnchorElement) => void, profileId?: number): void {
    // TODO: better query selector to not evaluate the entire DOM/MutationObserver node?
    // TODO: document logic at this point
    // TODO: exclude when aria-hidden=true (but allow when aria-hidden is not specified)
    [
        `a[href^="/groups/"][href*="/user/${profileId ?? ''}"]${profileId?'':':not(.sfb_evaluated)'}`,
        `a[href*="profile.php?id=${profileId ?? ''}"]${profileId?'':':not(.sfb_evaluated)'}`
    ].forEach((querySelector) => {
        const matches = document.querySelectorAll(querySelector);
        matches.forEach((e: Element) => {
            const profileLink = e as HTMLAnchorElement;
            if(includeElement(profileLink)) {
                callback(profileLink);
            }
        });
    });
}

/**
 * Query selectors can only do so much, this function will evaluate an Element
 * and exclude known links
 *
 * @param e Element
 * @returns true if Element should be included, false if Element should be ignored
 */

function includeElement(e: HTMLAnchorElement): boolean {
    // TODO: port this to the querySelector ?
    return e.getAttribute('aria-hidden') !== 'true' && e.textContent !== '';
}

/**
 * TODO: rename?
 * TODO: document
 */
export function updateProfileLinks(): void {
    queryProfileLinks(async (profileLink: HTMLAnchorElement) => {
        const profileId = profileIdFromUrl(profileLink.href);

        // NOTE: Hokey but since CSS attribute selectors aren't very powerful we rely on REGEX to
        // validate URLs, e.g. skipping profile links with additional "search params"
        if(profileId) {
            markAsEvaluated(profileLink);
            isBlacklisted(profileId, () => blacklistProfileLink(profileLink));
        }
    });
}

export function markAsEvaluated(e: Element) {
    e.classList.add('sfb_evaluated');
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
export function sendMessageToBackground<R = any>(command: Command, body?: any, responseCallback?: (response: R) => void): void {
    if(responseCallback) {
        chrome.runtime.sendMessage({
            command: command,
            body: body
        }, responseCallback);
    }
    else {
        chrome.runtime.sendMessage({
            command: command,
            body: body
        });
    }
}

/**
 * Sends a message to the active tab -- this is intended to target the content script
 *
 * @param command
 * @param body?
 * @param tab?
 */
export async function sendMessageToActiveTab(command: Command, body?: any, tab?: chrome.tabs.Tab): Promise<void> {
    tab ??= (await chrome.tabs.query({ active: true }))[0];

    if(tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            command: command,
            body: body
        });
    }
}

export async function notification(title: string, message?: string, isError: boolean = false, tab?: chrome.tabs.Tab): Promise<void> {
    sendMessageToActiveTab(Command.Notification, {
        title: title,
        ...(message && { message: message }),
        ...(isError && { color: 'red' })
    }, tab);
}

export async function errorNotification(title: string, message?: string, tab?: chrome.tabs.Tab): Promise<void> {
    notification(title, message, true, tab);
}
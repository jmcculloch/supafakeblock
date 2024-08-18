// TODO: rename to "facebook.ts"?

import { createTheme } from "@mantine/core";
import { Command, ReportStats, ReportType } from "./types";
import { NotificationData } from "@mantine/notifications";

export const theme = createTheme({
    primaryColor: 'red'
});

const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;
// NOTE: Adding a '$' to the end of the regex will limit to profileId=12345 and ignore links
// with additional search params this cuts down on links to navigate a profile page but also
// prevents links from popup cards, etc
const PROFILE_LINK_REGEX = /.*\/profile.php\?id=(\d+)/;

const PROFILE_ID_FROM_PHOTO_REGEX = /.*set=\D+(\d+)/;

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
 * Attempts to determine profile ID from current page
 *
 * @returns the profile ID or null
 */
export function profileIdFromPage(): number | null {
    const fromLocationHref = window.location.href.match(PROFILE_LINK_REGEX);
    if(fromLocationHref) {
        console.log(`from window.location.href: `, fromLocationHref[1]);
        return parseInt(fromLocationHref[1]);
    }

    const fromPhotos = (document.querySelector('a[href^="/photo/?fbid="]') as HTMLAnchorElement)?.href.match(PROFILE_ID_FROM_PHOTO_REGEX);
    if(fromPhotos) {
        console.log(`from photo: `, fromPhotos[1]);
        return parseInt(fromPhotos[1]);
    }

    // TODO: from document.querySelectorAll('script[type="application/json"]')
    // const SCRIPT_MEMBER_ID_REGEX = /.*\"member_id\"\:\s*\"(\d+)\"/;

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
            isBlacklisted(profileId, profileLink, blacklistProfileLink);
        }
    });
}

export function markAsEvaluated(e: Element) {
    e.classList.add('sfb_evaluated');
}

export function isBlacklisted(profileId: number, profileLink: HTMLAnchorElement, performIfBlacklisted: (profileLink: HTMLAnchorElement, reportStats: ReportStats) => void): void {
    chrome.runtime.sendMessage({
            command: Command.IsBlacklisted,
            body: profileId,
        },
        (reportStats: ReportStats) => {
            if(reportStats != null) {
                performIfBlacklisted(profileLink, reportStats);
            }
        }
    );
}

export function blacklistProfileLink(profileLink: HTMLAnchorElement, reportStats: ReportStats): void {
    clearProfileLink(profileLink);

    profileLink.classList.add(
        `sfb_${reportStats.type}`
    );

    if(reportStats.type != ReportType.WATCH) {
        profileLink.classList.add('sfb_blacklisted', `sfb_blacklisted_${confidenceToString(reportStats.avgConfidence)}`);
    }
}

export function clearProfileLink(profileLink: HTMLAnchorElement) {
    profileLink.classList.remove('sfb_blacklisted', 'sfb_SCAMMER', 'sfb_SPAMMER', 'sfb_FAKE_PROFILE', 'sfb_WATCH');
}

export function emojiForReportType(type: ReportType | string): string {

    switch(type) {
        case ReportType.SCAMMER: return '🦹';
        case ReportType.SPAMMER: return '🤖';
        case ReportType.FAKE_PROFILE: return '🧟';
        case ReportType.WATCH: return '👀';
    }

    return '';
}

function confidenceToString(confidence: number): string {
    if(confidence <= 0.75) return 'not_sure';
    if(confidence <= 0.50) return 'meh';
    if(confidence <= 0.25) return 'probably';

    return 'absolutely;'
}

/**
 * Sends a message to the background service worker
 *
 * @param command
 * @param body?
 */
export function sendMessageToBackground<B, R>(command: Command, body?: B, responseCallback?: (response: R) => void): void {
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
export async function sendMessageToActiveTab<B>(command: Command, body?: B, tab?: chrome.tabs.Tab): Promise<void> {
    tab ??= (await chrome.tabs.query({ active: true }))[0];

    if(tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            command: command,
            body: body
        });
    }
}

// TODO: simplify notification call(s) below with (await chrome.tabs.query({ active: true }))[0]; ?
export async function notification(message: string, title?: string, isError: boolean = false, tab?: chrome.tabs.Tab): Promise<void> {
    sendMessageToActiveTab<NotificationData>(Command.Notification, {
        title: title,
        message: message,
        ...(isError && { color: 'red' })
    }, tab);
}

export async function errorNotification(message: string, title?: string, tab?: chrome.tabs.Tab): Promise<void> {
    notification(message, title, true, tab);
}
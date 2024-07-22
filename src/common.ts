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
 * Lookup the current user's Facebook profile ID
 *
 * @returns number | null
 */
export function getFacebookProfileId(): number | null {
    const matches = document.getElementById('__eqmc')?.textContent?.match(/.*__user=(\d+)/);

    return matches ? parseInt(matches[1]) : null;
}

/**
 * Search DOM for <a href="/groups/{groupId}/user/{profileId}"> elements.
 *
 * @param callback invokes callback on matching elements
 * @param profileId optional parameter to limit to a specific profileId (will search pre-evaluated links)
 */
export function queryGroupProfileLinks(callback: (e: Element) => void, profileId?: number) {
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

function isBlacklisted(profileId: number, performIfBlacklisted: Function) {
    chrome.runtime.sendMessage({
            command: Command.IsBlacklisted,
            body: profileId,
        },
        (isInBlacklist: boolean) => {
            if(isInBlacklist) performIfBlacklisted()
        }
    );
}

export function blacklistProfileLink(profileLink: HTMLAnchorElement) {
    profileLink.classList.add('sfb_blacklisted');
}


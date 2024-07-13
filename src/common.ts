// TODO: rename to "facebook.ts"

import { Command, Scammer } from "./types";

/**
 *
 */
const GROUP_PROFILE_LINK_REGEX = /.*\/groups\/\d+\/user\/(\d+)\//;
const EVALUATED_FOR_SCAMMER = 'evaluatedForScammer';

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
function getFacebookUserId(): number | null{
    const matches = document.getElementById('__eqmc')?.textContent?.match(/.*__user=(\d+)/);

    return matches ? parseInt(matches[1]) : null;
}

/**
 * Search DOM for <a href="/groups/{groupId}/user/{profileId}"> elements.
 *
 * @param callback invokes callback on matching elements
 * @param profileId optional parameter to limit to a specific profileId
 */
export function queryGroupProfileLinks(callback: (e: Element) => void, profileId?: number) {
    // TODO: better query selector to not evaluate the entire DOM/MutationObserver node?
    document.querySelectorAll(`a[href^="/groups/"][href*="/user/${profileId ?? ''}"]`).forEach(callback);
}

/**
 * TODO: rename?
 * TODO: document
 */
export function updateGroupProfileLinks(): void {
    queryGroupProfileLinks(async (e: Element) => {
        const profileLink = e as HTMLAnchorElement;

        // NOTE: hack to prevent infinite MutationObserver loops when manipulating links
        if (isEvaluated(profileLink)) {
            markEvaluated(profileLink);

            if(e.textContent !== '') {
                const profileId: number = profileIdFromGroupProfileUrl(profileLink.href);

                chrome.runtime.sendMessage({
                        command: Command.Query,
                        body: {
                            profileId: profileId
                        },
                    },
                    (scammer: Scammer) => { if(scammer) markAsScammer(profileLink) }
                );
            }
        }
    });
}

export function markAsScammer(profileLink: HTMLAnchorElement) {
    profileLink.style.background = '#ff0000';
}

function isEvaluated(profileLink: HTMLAnchorElement) {
    return !profileLink.hasAttribute(EVALUATED_FOR_SCAMMER);
}

export function markEvaluated(profileLink: HTMLAnchorElement) {
    profileLink.setAttribute(EVALUATED_FOR_SCAMMER, 'true');
}

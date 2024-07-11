import { profileIdFromGroupProfileUrl } from './common';
import { Scammer } from './types';

'use strict';

const EVALUATED_FOR_SCAMMER = 'evaluatedForScammer';

updateGroupProfileLinks();

const observer = new MutationObserver((mutationList, observer) => updateGroupProfileLinks());
// TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
observer.observe(document.body, { attributes: false, childList: true, subtree: true });

/**
 * Search DOM for <a href="/groups/{groupId}/user/{profileId}"> elements.
 * 
 * @param callback invokes callback on matching elements
 */
function queryGroupProfileLinks(callback: (e: Element) => void) {
    // TODO: better query selector to not evaluate the entire DOM/MutationObserver node?
    document.querySelectorAll('a[href^="/groups/"][href*="/user/"]').forEach(callback);
}

function queryGroupProfileLinksForSpecificId(profileId: number, callback: (e: Element) => void) {
    // TODO: possible to refactor to include the profileId in the querySelector, e.g. `[href*="/user/${profileId}"]`
    // rather than evaluating below
    document.querySelectorAll('a[href^="/groups/"][href*="/user/"]').forEach(function(e: Element) {
        const profileLink = e as HTMLAnchorElement;

        if(e.textContent !== '') {
            const elementProfileId: number = profileIdFromGroupProfileUrl(profileLink.href);
            if(elementProfileId == profileId) {
                callback(e);
            }
        }
    });
}

/**
 * TODO: rename?
 * TODO: document
 */
function updateGroupProfileLinks(): void {
    queryGroupProfileLinks(async (e: Element) => {
        const profileLink = e as HTMLAnchorElement;
        // NOTE: hack to prevent infinite MutationObserver loops when manipulating links
        if (isEvaluated(profileLink)) {
            markEvaluated(profileLink);

            if(e.textContent !== '') {
                const profileId: number = profileIdFromGroupProfileUrl(profileLink.href);

                chrome.runtime.sendMessage({ profileId: profileId }, function(response) {
                    if(response.isScammer) {
                        markAsScammer(profileLink);
                    }
                });
            }
        }
    });
}

function markAsScammer(profileLink: HTMLAnchorElement) {
    profileLink.style.background = '#ff0000';
}

function isEvaluated(profileLink: HTMLAnchorElement) {
    return !profileLink.hasAttribute(EVALUATED_FOR_SCAMMER);
}

function markEvaluated(profileLink: HTMLAnchorElement) {
    profileLink.setAttribute(EVALUATED_FOR_SCAMMER, 'true');
}

(async function () {
    /**
     * Register a message listener from the background service / context menu handler.
     * Currently this is only to submit a profileId to search the DOM and invoke markAsScammer.
     */
    chrome.runtime.onMessage.addListener(function (request: Scammer, sender: chrome.runtime.MessageSender, sendResponse?: any) {
        console.log(`content script Received message: `, request, sender, sendResponse);
        queryGroupProfileLinksForSpecificId(request.profileId, function(e: Element) {
            // TODO: is there a cleaner way to cast this?
            const profileLink = e as HTMLAnchorElement;
            markAsScammer(profileLink);
            markEvaluated(profileLink);
        })
    });
})();
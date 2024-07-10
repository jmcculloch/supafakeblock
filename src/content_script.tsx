import { Supabase } from './supabase';

(async function () {
    'use strict';

    // TODO: make sure there is a single instance of this
    const supabase: Supabase = await Supabase.init();

    updateGroupProfileLinks();

    const observer = new MutationObserver((mutationList, observer) => updateGroupProfileLinks());
    // TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    function queryGroupProfileLinks(func: (e: Element) => void) {
        // TODO: better query selector to not evaluate the entire DOM/MutationObserver node? assume
        // CSS classes etc are volatile
        document.querySelectorAll('a[href^="/groups/"][href*="/user/"]').forEach(func);
    }

    function updateGroupProfileLinks(): void {
        queryGroupProfileLinks(async (e: Element) => {
            const profileLink = e as HTMLAnchorElement;
            // NOTE: hack to prevent infinite MutationObserver loops when manipulating links
            if (!profileLink.hasAttribute('evaluatedForScammer')) {
                profileLink.setAttribute('evaluatedForScammer', 'true');

                if(e.textContent !== '') {
                    const profileId: number = profileIdFromGroupProfileUrl(profileLink.href);

                    if (await supabase.isScammer(profileId)) {
                        profileLink.style.background = '#ff0000';
                    }
                }
            }

        });
    }

    function profileIdFromGroupProfileUrl(url: string): number {
        // TODO: is regex compiled only once as a function scoped const?
        const GROUP_PROFILE_LINK_REGEX = /\/groups\/\d+\/user\/(\d+)\//;
        const matches = url.match(GROUP_PROFILE_LINK_REGEX);
        if (matches) {
            return parseInt(matches[1]);
        }
        else {
            return Number.NaN;
        }
    }
})();
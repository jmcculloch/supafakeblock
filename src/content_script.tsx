import { Supabase } from './background';

import React from "react";
import { createRoot } from "react-dom/client";


(async function () {
    'use strict';

    const supabase: Supabase = await Supabase.init();

    updateGroupProfileLinks();

    const observer = new MutationObserver((mutationList, observer) => updateGroupProfileLinks());
    // TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
    // TODO: tweaks to Options to perform better?
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    function updateGroupProfileLinks(): void {
        // TODO: better query selector to not evaluate the entire DOM/MutationObserver node? assume
        // CSS classes etc are volatile
        document.querySelectorAll('a[href^="/groups/"][href*="/user/"]').forEach(async function (e: Element) {
            const profileLink = e as HTMLAnchorElement;
            // NOTE: hack to prevent infinite MutationObserver loops when manipulating links
            if (!profileLink.hasAttribute('evaluatedForScammer')) {
                profileLink.setAttribute('evaluatedForScammer', 'true');

                if(e.textContent !== '') {
                    const profileId: number = profileIdFromGroupProfileUrl(profileLink.href);

                    if (await supabase.isScammer(profileId)) {
                        profileLink.style.background = '#ff0000';
                    }
                    else {
                        // TODO: react already included in project template but could use a simpler template engine?
                        const root = createRoot(profileLink.appendChild(document.createElement("span")));
                        root.render(<ReportLink profileName={profileLink.textContent!} profileId={profileId} profileLink={profileLink}/>);
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

    class ReportLink extends React.Component<{ profileId: number, profileName: string, profileLink: HTMLAnchorElement }> {
        handleClick(e: React.MouseEvent<HTMLElement>) {
            e.stopPropagation();
            e.preventDefault();
    
            if (confirm(`Are you sure you want to report ${this.props.profileName} (${this.props.profileId}) as a scammer?`)) {
                supabase.report(this.props.profileId);
    
                // TODO: there may be multiple matching links but only the clicked link will be re-evaluated
                this.props.profileLink.removeAttribute('evaluatedForScammer');
                updateGroupProfileLinks();
                alert(`Reported ${this.props.profileName}`);
            }
        }
    
        render() {
            return (
                <span onClick={this.handleClick.bind(this)}>🚨</span>
            );
        }
    };
})();
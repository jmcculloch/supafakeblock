import { NotificationData, notifications } from '@mantine/notifications';
import { isBlacklisted, profileIdFromUrl } from './common';

const CLONED_NICKNAME_REGEX = /^https:\/\/www.facebook.com\/.*\d+.*\D+\/$/;
const PRONOUN_REGEX = /updated (.*) profile picture/;

// TODO: work out some profile page level state to avoid repeated error notifications
// TODO: how to track/reset state?
export function detection() {
    checkForPronoun();
    checkForClonedNickname();
    checkForAngryReactions();
    checkForBackdatedPosts();

    engagement();
}

enum DetectionTypes {
    ClonedNickname,
    Pronoun,
    AngryReactions,
    BackdatedPosts,
    BlacklistedEngagement,
    SelfEngagement,
    MissingEngagement
}

function checkForClonedNickname(): void {
    if(window.location.href.match(CLONED_NICKNAME_REGEX)) {
        showNotification({
            title: 'Potential Cloned Nickname',
            message: '🧪 Potential Cloned Nickname Detected',
            color: 'red'
        });
    }
}

function checkForPronoun(): void {
    // TODO: this is a questionable query selector
    Array.from(document.querySelectorAll('h2[id^=":"][id$=":"]')).some((e: Element) => {
        const matches = e.textContent?.match(PRONOUN_REGEX);
        if(matches) {
            showNotification({
                title: 'Pronoun',
                message: `🧑 Pronoun Detected: ${matches[1]}`,
            });

            return true;
        }
    });
}

function checkForAngryReactions(): void {
    Array.from(document.querySelectorAll('div[aria-label^="Angry"]')).some((e: Element) => {
        showNotification({
            title: 'Angry Reaction',
            message: '😡 Angry Reaction Detected',
            color: 'red'
        });

        return true;
    });
}

// TODO: exclude "life events"
function checkForBackdatedPosts(): void {
    // TODO: this is subject to change but looks for backdated posts
    Array.from(document.querySelectorAll('i[data-visualcompletion="css-img"][style*="/5fllXikzFvB.png"]')).some((e: Element) => {
        showNotification({
            title: 'Back Dated Posts',
            message: '📆 Back Dated Posts Detected',
            color: 'red'
        });

        return true;
    });
}

function engagement(): void {
    const profileName = getProfileName();

    const engagementRules = new Set();
    const reactionSet = new Set();

    const observer = new MutationObserver((mutationList, observer) => {
        console.log(`within MutationObserver`);

        const reactions = document.querySelectorAll('div[data-visualcompletion="ignore-dynamic"] span[dir="auto"] a[role="link"]');
        console.log(`MO reactions: `, reactions);
        if(reactions.length == 0) {
            return;
        }

        // Try to find the engagement count. This is repeated in multiple elemenets (screenreader?) so attempt to parse out last numerical value 
        // const expectedCountMatch = reactionButton.textContent.match(/\s(\d+)$/);
        // if(expectedCountMatch) {
        //     console.log(`expectedCountMatch: `, reactions.length, expectedCountMatch[1]);
        //     if(reactions.length != expectedCountMatch[1]) {
        //         engagementRules.add(DetectionTypes.MissingEngagement);
        //     }
        // }

        reactions.forEach((e) => {
            reactionSet.add(e.textContent);

            const profileLink = e as HTMLAnchorElement;

            const profileId = profileIdFromUrl(profileLink.href);
            if(profileId) {
                isBlacklisted(profileId, profileLink, () => {
                    engagementRules.add(DetectionTypes.BlacklistedEngagement);
                });
            }
        });

        if(reactionSet.has(profileName)) {
            engagementRules.add(DetectionTypes.SelfEngagement);
        }
    });

    // Get a list of post reaction links
    Array.from(document.querySelectorAll('div[data-visualcompletion="ignore-dynamic"] span[aria-label="See who reacted to this"]')).some((e: Element) => {
        console.log(`See who reacted to this loop: `, e);

         // @ts-ignore
         const reactionButton = e.nextSibling?.querySelector('div[role="button"]');
         if(reactionButton) {
             reactionButton.click();
         }

        // TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
        observer.observe(document.body, { attributes: false, childList: true, subtree: true });

        observer.disconnect();

        // @ts-ignore
        const close = document.querySelector('div[aria-label="Close"]')?.click();
    });

    console.log(`after engagement loop, engagementRules: `, engagementRules);
    
}

function getProfileName(): string {
    // TODO: null safety
    return document.querySelector('div[data-visualcompletion="ignore-dynamic"] a[role="link"]')!.textContent!
}

function showNotification(notification: NotificationData): void {
    notifications.show({
        ...notification,
        // TODO: rather than autoClose=false, set longer TTL
        autoClose: false
    })
}
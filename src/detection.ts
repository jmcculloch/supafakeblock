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

    const reactionSet = new Set();

    let selfReaction = false;
    let blacklistedReaction = false;

    Array.from(document.querySelectorAll('div[data-visualcompletion="ignore-dynamic"] span[aria-label="See who reacted to this"]')).some((e: Element) => {

        if(selfReaction) {
            return true;
        }

        // @ts-ignore
        const reactionButton = e.nextSibling?.querySelector('div[role="button"]');

        if(reactionButton) {
            reactionButton.click();
        }

        // TODO: This needs to be ported to a mutation observer and get rid of setTimeout
        setTimeout(() => {
            const reactions = document.querySelectorAll('div[data-visualcompletion="ignore-dynamic"] span[dir="auto"] a[role="link"]');
            reactions.forEach((e) => {
                reactionSet.add(e.textContent);

                if(blacklistedReaction) {
                    return;
                }

                const profileLink = e as HTMLAnchorElement;

                const profileId = profileIdFromUrl(profileLink.href);
                if(profileId) {
                    isBlacklisted(profileId, profileLink, () => {
                        showNotification({
                            title: 'Blacklisted Engagement',
                            message: '🤬 Blacklisted Profile Engagement Detected',
                            color: 'red'
                        });

                        blacklistedReaction = true;
                    });
                }
            });

            // @ts-ignore
            const close = document.querySelector('div[aria-label="Close"]')?.click();

            if(reactionSet.has(profileName)) {
                if(!selfReaction) {
                    showNotification({
                        title: 'Self Engagement',
                        message: '🤡 Self Engagement Detected',
                        color: 'red'
                    });
                }

                selfReaction = true;
            }
        }, 500);
    });
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
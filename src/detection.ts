import { NotificationData, notifications } from '@mantine/notifications';
import { markAsEvaluated } from "./common";

const CLONED_NICKNAME_REGEX = /^https:\/\/www.facebook.com\/.*\d+.*\D+\/$/;
const PRONOUN_REGEX = /updated (.*) profile picture/;

// TODO: work out some profile page level state to avoid repeated error notifications
// TODO: how to track/reset state?
export function detection() {
    checkForPronoun();
    checkForClonedNickname();
    checkForAngryReactions();
    checkForBackdatedPosts();
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
    Array.from(document.querySelectorAll('h2[id^=":"][id$=":"]:not(.sfb_evaluated)')).some((e: Element) => {
        markAsEvaluated(e);

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
    Array.from(document.querySelectorAll('div[aria-label^="Angry"]:not(.sfb_evaluated)')).some((e: Element) => {
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
    Array.from(document.querySelectorAll('i[data-visualcompletion="css-img"][style*="/5fllXikzFvB.png"]:not(.sfb_evaluated)')).some((e: Element) => {
        showNotification({
            title: 'Back Dated Posts',
            message: '📆 Back Dated Posts Detected',
            color: 'red'
        });

        return true;
    });
}

function showNotification(notification: NotificationData): void {
    notifications.show({
        ...notification,
        // TODO: rather than autoClose=false, set longer TTL
        autoClose: false
    })
}
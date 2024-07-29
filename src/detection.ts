import { NotificationData, notifications } from '@mantine/notifications';
import { markAsEvaluated } from "./common";

const CLONED_NICKNAME_REGEX = /^https:\/\/www.facebook.com\/.*\d+.*\/$/;
const PRONOUN_REGEX = /updated (.*) profile picture/;

let clonedNicknameCheck = false;
let pronounFound = false;
let angryReaction = false;
let backdatedPosts = false;

// TODO: work out some profile page level state to avoid repeated error notifications
// TODO: how to track/reset state?
export function detection() {
    checkForPronoun();
    checkForClonedNickname();
    checkForAngryReactions();
    checkForBackdatedPosts();
}

function checkForClonedNickname(): void {
    if(clonedNicknameCheck) {
        return;
    }

    clonedNicknameCheck = true;

    if(window.location.href.match(CLONED_NICKNAME_REGEX)) {
        showNotification({
            title: 'Potential Cloned Nickname',
            message: '🧪 Potential Cloned Nickname Detected',
            color: 'red'
        });
    }
}

function checkForPronoun(): void {
    if(pronounFound) {
        return;
    }

    document.querySelectorAll('h2[id^=":"][id$=":"]:not(.sfb_evaluated)').forEach((e: Element) => {
        markAsEvaluated(e);

        const matches = e.textContent?.match(PRONOUN_REGEX);
        if(matches) {
            console.log(`Found a pronoun match: `, matches);
            pronounFound = true;

            showNotification({
                title: 'Pronoun',
                message: `🧑 Pronoun Detected: ${matches[1]}`,
            });

            return;
        }
    });
}

function checkForAngryReactions(): void {
    if(angryReaction) {
        return;
    }

    document.querySelectorAll('div[aria-label^="Angry"]:not(.sfb_evaluated)').forEach((e: Element) => {
        // TODO: use sfb_evaluated/markAsEvaluated?
        markAsEvaluated(e);
        angryReaction = true;

        showNotification({
            title: 'Angry Reaction',
            message: '😡 Angry Reaction Detected',
            color: 'red'
        });

        return;
    });
}

function checkForBackdatedPosts(): void {
    if(backdatedPosts) {
        return;
    }

    // TODO: this is subject to change but looks for backdated posts
    document.querySelectorAll('i[data-visualcompletion="css-img"][style*="/5fllXikzFvB.png"]:not(.sfb_evaluated)').forEach((e: Element) => {
        // TODO: use sfb_evaluated/markAsEvaluated?
        markAsEvaluated(e);
        backdatedPosts = true;

        showNotification({
            title: 'Back Dated Posts',
            message: '📆 Back Dated Posts Detected',
            color: 'red'
        });

        return;
    });
}

function showNotification(notification: NotificationData): void {
    notifications.show({
        ...notification,
        autoClose: false
    })
}
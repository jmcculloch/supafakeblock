import { updateGroupProfileLinks, theme } from './common';
import React from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from './app';
import { detection } from './detection';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

'use strict';

updateGroupProfileLinks();

const observer = new MutationObserver((mutationList, observer) => {
    updateGroupProfileLinks();
    // TODO: is this required in a MutationObserver? (scroll to see more info)
    detection();
});
// TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
observer.observe(document.body, { attributes: false, childList: true, subtree: true });

/*
// TODO: work in progress, only certain "group profile links" are target of the event, in other cases it is the containing span/div
// Can use this for menuing/sidebar/etc
window.addEventListener('mouseover', function(ev: MouseEvent) {
    // @ts-ignore
    console.log(`mouseover listener: `, ev.target?.nodeName, ev.target?.classList.contains('sfb_blacklisted'));
})
*/

const root = createRoot(document.createElement('div'));
root.render(
<React.StrictMode>
    <MantineProvider theme={theme}>
        <Notifications />
        <App/>
    </MantineProvider>
</React.StrictMode>
);
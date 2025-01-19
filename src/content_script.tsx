import { theme, updateProfileLinks } from './common';
import React from 'react'
import { createRoot } from "react-dom/client";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from './app';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

'use strict';

updateProfileLinks();

const observer = new MutationObserver((mutationList, observer) => {
    updateProfileLinks();
});
// TODO: is there a more precise node to monitor Facebook/React? DOM manipulation?
observer.observe(document.body, { attributes: false, childList: true, subtree: true });

const root = createRoot(document.createElement('div'));
root.render(
<React.StrictMode>
    <MantineProvider theme={theme}>
        <Notifications />
        <App/>
    </MantineProvider>
</React.StrictMode>
);
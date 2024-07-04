# Supafakeblock

![build](https://github.com/jmcculloch/supafakeblock/workflows/build/badge.svg)

Supafakeblock is composed of a distributed blacklist and a browser extension that augments Facebook group content.

A blacklist of malicious accounts is stored on [Supabase](https://supabase.com/) using [rxdb-supabase](https://github.com/marceljuenemann/rxdb-supabase). A local copy of the blacklist is synchronized at extension intialization. Profiles are queried against this local copy and are not remote network calls.

The browser extension will montitor Facebook group content and highlights blacklisted profile links including in:
* Group posts, comments, member lists
* Group admin activities, e.g. participation requests
* Any group content in your personal feed

Unknown group profile links will have an icon to report the profile to the distributed blacklist. The UI is rudementary and will change over time. If the report icons are too distracting the extension can be [disabled](#disable-extension).

Only Google Chrome is supported but Firefox, Safari, etc could be supported in the future. If there is enough interest I will give this some attention.

## Installation
At the moment this plugin must be installed manually, as an "unpacked extension". If this plugin gets enough usage it will be published on the [Chrome Web Store](https://chromewebstore.google.com/) and installed as any other extension.

* Build or download the plugin source code. `TODO: link to build artifacts`
* Open [chrome://extensions](chrome://extensions)
    * Click `Load unpacked` button
    * Navigate to the directory with the downloaded extension source and click the `Select` button.

You should close and reopen any Facebook tabs.

## Updates
* Download new extension source code to the same directory you initially installed the extension.
* Find the extension in [chrome://extensions](chrome://extensions) and click the `↻` button.

You should close and reopen any Facebook tabs.

## Disable extension
The extension can be disabled by finding the extension in [chrome://extensions](chrome://extensions) and toggling the switch in the bottom right hand corner.

You should close and reopen any Facebook tabs.

## Remove extension
The extension can be disabled by finding the extension in [chrome://extensions](chrome://extensions) and clicking the `Remove` button.
`TODO: This may leave copies of the blacklist. Describe how to remove`

You should close and reopen any Facebook tabs.
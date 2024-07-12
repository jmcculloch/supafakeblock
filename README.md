# Supafakeblock

![build](https://github.com/jmcculloch/supafakeblock/workflows/build/badge.svg)

Supafakeblock is composed of a distributed blacklist and a browser extension that augments Facebook group content.

A blacklist of malicious accounts is stored on [Supabase](https://supabase.com/) using [rxdb-supabase](https://github.com/marceljuenemann/rxdb-supabase). A local copy of the blacklist is synchronized at extension intialization. Profiles are queried against this local copy and are not remote network calls.

The browser extension will montitor Facebook group content and highlights blacklisted profile links including in:
* Group posts, comments, member lists
* Group admin activities, e.g. participation requests
* Any group content in your personal feed

## Building
### Requirements
* `node`
* `npm`
* `make`
* `jq` https://jqlang.github.io/jq/ (to parse manifest.json for version)

This project is based on https://github.com/chibat/chrome-extension-typescript-starter but with some `Makefile` helpers:
* `make` - builds project in `dev` mode into `dist/`
* `make watch` - watches for changes and builds in real time
* `make package` - builds project in `prod` mode and packages project into a versioned zipfile `dist/supafakeblock-VERSION.zip`

### Installation
For more details, see the Wiki.

 * `TODO: link to build artifacts`

#### Chrome
At the moment this plugin must be installed manually, as an "unpacked extension".

If this plugin gets enough usage it will be published on the [Chrome Web Store](https://chromewebstore.google.com/) and installed as any other extension.

* Build (`make`) or download a pre-built extension package
    * If you downloaded a `.zip` file, it must first be extracted, e.g. `unzip supafakeblock-VERSION.zip -d /path/to/destination/folder`
* Open `about:extensions`
    * Toggle the `Developer mode` switch in the upper right hand corner
    * Click `Load unpacked` button
    * Navigate to the directory with unzipped package from earlier step and click the `Select` button.
* Close and reopen any Facebook tabs or they will be running a previous build.

#### Firefox
Firefox only allows "unsigned" extensions to be installed on a temporary basis. The extension will not be reloaded next time Firefox restarts 

If this plugin gets enough usage it will be published on the [Firefox Add Ons](https://addons.mozilla.org/) and installed as any other extension.

* Build (`make package`) or download a pre-built extension package
* Open `about:debugging#/runtime/this-firefox`
    * Click the `Load Temporary Add-on...` button
    * Select `supafakeblock-VERSION.zip` and click `Open`

#### Safari
With a local build? `¯\_(ツ)_/¯`

If this plugin gets enough usage it will be published on the [Chrome Web Store](https://chromewebstore.google.com/) and installed as any other extension.
![ci](https://github.com/NaphatrB/browser-extension/actions/workflows/ci.yml/badge.svg)

# Mullvad Browser Extension

> **Fork** of [mullvad/browser-extension](https://github.com/mullvad/browser-extension) with
> additional routing features and Firefox Mobile support.

Mullvad Browser Extension is a Firefox extension improving your browser experience while using
Mullvad VPN. It also displays information about the connection, recommends optimal DNS settings, and
a one-click access to [proxy servers](https://mullvad.net/en/help/socks5-proxy/).

## Features

### Proxy per domain

Route individual domains (or subdomains) through a specific Mullvad proxy server. The minimum
required identifier is a second-level domain (e.g. `example.com`). Subdomains are matched
hierarchically — adding `sub.example.com` routes only that subdomain, while `example.com` covers all
subdomains not otherwise overridden.

### Automatic TLD routing _(new)_

Enable **Route by TLD** in the Proxy settings tab to automatically route requests for
country-specific top-level domains through the matching Mullvad proxy. For example, `.th` traffic is
routed via Thailand, `.de` via Germany, and so on. Generic TLDs (`.com`, `.org`, `.net`, etc.) are
not affected — they continue using the global proxy setting (if any).

The feature requires proxy servers to be available for the destination country. If no matching
server exists the request falls through to the next rule.

### Blocklist domain routing _(new)_

Provide a URL to a domain blocklist (plain-text one-per-line or
[Adblock Plus format](https://adblockplus.org/filter-cheatsheet)) and choose which country to route
those domains through. The extension fetches the list, extracts the domains, and applies the chosen
proxy for every matching request.

- Multiple blocklist entries are supported, each with its own target country.
- Lists can be refreshed manually at any time.
- Individual entries can be toggled on/off without removing them.

Example public lists: [oisd.nl](https://oisd.nl/),
[StevenBlack hosts](https://github.com/StevenBlack/hosts).

### Firefox for Android support _(new)_

The extension is compatible with **Firefox for Android 120+**. Core proxy features work on mobile.
Desktop-only APIs (`browser.privacy`, `browser.management`, `browser.search`) are silently skipped
on Android — the WebRTC toggle and Privacy Recommendations panel are hidden on devices where those
APIs are unavailable.

## Download

The upstream release is available on Mullvad's
[download page](https://mullvad.net/en/download/browser/extension) and in the upstream
[Releases](https://github.com/mullvad/browser-extension/releases).

Builds from this fork can be found in the
[fork's Releases](https://github.com/NaphatrB/browser-extension/releases).

## Development

### **Environment**

Build with:

- Node 24 LTS
- Npm 11

_If you use `nvm`, run `nvm use` to automatically set these versions._

For:

- Firefox: last version (>91.1.0), or Firefox for Android 120+

### **Developing**

The first time, use `npm install` to install the necessary packages.

To start the extension in a temporary and clean browser:

- use `npm run dev` to automatically rebuild the extension when changes are saved.
- use `npm start` in another terminal to start a development instance of Firefox with the extension
  loaded. The extension will automatically reload when changes are saved.

The developer tools can be started by clicking on the `inspect` in the debugging tab (automatically
opened).

### **Building**

- use `npm run build` to build the extension **first**
- use `npm run pack:xpi` to create `.xpi` file in the root folder

_There are other build options which you can view in `package.json`._

### **Testing**

#### Unit tests

```bash
npm test
```

#### End-to-end tests (Playwright + Firefox)

```bash
npm run test:e2e
```

E2E tests use [Playwright](https://playwright.dev/) with a real Firefox browser and cover proxy
toggling, per-domain routing, TLD routing, and blocklist routing flows.

#### Testing the extension in your browser

You can only install the extension temporarily when it is not signed by Mozilla. To do so:

- open Firefox
- enter `about:debugging#/runtime/this-firefox` in the URL bar
- click "Load Temporary Add-on"
- open `extension.xpi` file.

The extension will automatically unload when Firefox is closed.

#### Testing restart and persisting features

You can use the `restart` script to test restart and persisting features (like settings saved to
local storage). It will require some manual configuration:

- go to `about:profiles` and create a new Firefox profile
- go to `package.json` and change the `restart` script with your own Firefox profile path
- go to `about:config` and set both `extensions.webextensions.keepStorageOnUninstall` and
  `extensions.webextensions.keepUuidOnUninstall` to `true`.

[Learn more](https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/)

## Permissions

Mullvad Browser Extension requires the following permissions:

- `management` to be able to recommend third party extensions (desktop only)
- `privacy` to disable webRTC and check HTTPS-Only status (desktop only)
- `storage` to save preferences
- `search` to recommend other search engines (desktop only)
- `*://*.mullvad.net/*` to get proxy servers list and display your connection information (see
  `Network requests` for details)

The following permissions are optional, but are needed to use the proxy feature:

- `proxy` to configure and use Mullvad proxy servers
- `tabs` to show proxy settings from active tab
- `<all_urls>` to specify a proxy configuration per domain (each request needs to be intercepted)

_Permissions are automatically accepted when testing the extension._

## Network requests

The extension makes the following external network requests:

- `api.mullvad.net` — fetch the latest proxy servers (triggered each time the
  `Select proxy server location` drawer is opened)
- `am.i.mullvad.net` — fetch connection information (triggered each time the popup is started and
  each time the proxy is connected/disconnected)
- **User-configured blocklist URLs** — fetch domain lists for blocklist routing (triggered on
  extension startup and on manual refresh)

_External links are marked with this icon_
![External Link icon](https://github.com/feathericon/feathericon/blob/master/src/svg/link-external.svg)

## Source code

This fork's source code:
[github.com/NaphatrB/browser-extension](https://github.com/NaphatrB/browser-extension)

Upstream source code:
[github.com/mullvad/browser-extension](https://github.com/mullvad/browser-extension)

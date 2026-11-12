# Nexus Dash

English | [日本語](README.md)

A Chrome extension that replaces the new tab page with a dashboard combining a clock, weather, to-dos, calendar import, AI chat, Spotify, RSS feeds, and GitHub integration.

It is built with plain HTML, CSS, and vanilla JavaScript only. There is no build step and no external library.

> **Status**: This is a personal tool the author uses every day. It is not being promoted for general use on the Chrome Web Store.
> The source is released under the MIT License, so feel free to fork it and adapt it for yourself. Responses to issues and pull requests are not guaranteed.
>
> The UI is in Japanese only. This English README is a localized copy of the Japanese one; if they disagree, the Japanese version is authoritative.

## Features

### Dashboard

- Clock and date
- Background from a local image
- Random Chrome-style backgrounds
- Show / hide each widget
- Free placement (drag) and resizing (drag the bottom-right handle) of widgets
- Add and remove quick links
- API connection diagnostics
- Unified agenda view (events and tasks)
- Automatic position correction (clamping to the screen) when the window is resized or widgets are shown / hidden, and restoration of the original layout

### Weather

- Current weather, temperature, and precipitation from the Open-Meteo API (Japan Meteorological Agency model)
- Location setting by city search
- Line chart of hourly precipitation (mm) for the next 6 hours

### To-do

- Add tasks manually
- Mark tasks as done
- Delete tasks
- Saved automatically to `localStorage`

### Unified agenda view

- Shows Google Calendar, Google Tasks, and local to-dos on one timeline
- Items with a date and time come first; tasks without a due date are shown in a separate section
- Reads the caches of the existing widgets, so syncing is done from each integration widget

### Google Calendar to to-do

- Fetches events from a Google Calendar iCal URL
- Converts events in the next 3 / 7 / 14 / 30 days into to-dos
- Shows a label on to-dos that came from Google Calendar
- Uses the event `UID` to avoid importing the same event twice

This uses an iCal URL, not OAuth. Get the "Secret address in iCal format" or the public iCal URL of a calendar from the Google Calendar settings.

### Google OAuth integration

- Google integration with an OAuth client ID for Chrome extensions
- Sync Google Calendar events and add new events
- Get Google Tasks lists, and add, complete, and delete tasks
- Simple list of unread Gmail messages
- If the Calendar / Tasks / Gmail scopes are not all granted, the integration is not treated as connected and you are asked to reconnect

You need to enable the Google Calendar API, Google Tasks API, and Gmail API in the Google Cloud Console. Add the Calendar / Tasks / Gmail scopes to the OAuth consent screen. While the app is in testing, add the Google accounts you will use as test users.

### Multi-AI

- Send one prompt to OpenAI / Anthropic / Gemini at the same time
- Show each AI's answer side by side in panels
- API keys are stored in the browser's `localStorage`

### Spotify

- Spotify authentication with the Chrome extension `identity` API
- Shows the current track, artist, and artwork
- Play / pause, previous, and next controls
- Refreshes the access token automatically when it expires
- Falls back to a normal tab when the `identity` API cannot open the sign-in page

### Stocks

- Shows the current price and the change from the previous day, calculated with the `GOOGLEFINANCE` function in Google Sheets
- Requires a Google Sheets URL that can be fetched as a published CSV
- If fetching fails, shows the cached data and an error notice

### RSS / Discover

- Load multiple RSS / Atom feeds and switch display mode (mixed / per feed)
- "Mixed": all articles sorted newest first, with duplicate removal (including stripping tracking parameters) and the source feed name
- "Per feed": articles grouped by feed in the configured order. If some feeds fail, the others are still shown
- Article search and favorites (saved to `localStorage`)
- Article preview in a modal, and opening the original article in a new tab
- Safe preview display by sanitizing HTML (removes `script`, event attributes, and dangerous URL schemes)
- Timeout (10 seconds per feed) and a concurrency limit (up to 4 at once) to reduce load and stay stable
- Stale cache: shows the most recent cache (up to 24 hours) while offline or when a feed is down

### GitHub integration

- Uses a GitHub PAT (personal access token) to show up to 10 open issues and pull requests assigned to you
- Caches synced data and shows the cache automatically when a sync fails

### GitHub contribution graph

- Shows your yearly contributions as a grid on the dashboard, using the GitHub GraphQL API
- Colors adapt to the dark and light themes (`getAdaptiveColor`)

### API diagnostics

- Lists the configuration status of Google, GitHub, GoogleFinance, Spotify, the AI APIs, RSS, and weather
- Reflects each widget's sync success, failure, cache display, or missing configuration
- The diagnostics widget itself never calls paid APIs automatically; it shows the configuration status and the latest request results

## Setup

1. Open `chrome://extensions/` in Chrome
2. Turn on "Developer mode" in the top right
3. Click "Load unpacked"
4. Select this directory
5. Open a new tab

You can also open `index.html` directly as a local HTML file. However, Spotify authentication and some external API requests assume the page is loaded as a Chrome extension.

## Publishing on the Chrome Web Store

To publish on the Chrome Web Store, host `docs/privacy.html` at a public URL such as GitHub Pages, and enter that URL in the privacy policy field.

Example:

```text
https://<user-name>.github.io/<repository-name>/docs/privacy.html
```

## Using Google Calendar

1. Open Google Calendar
2. Open the settings of the calendar you want
3. Copy the "Secret address in iCal format" or the public address
4. Open the Nexus Dash settings sidebar
5. Paste the URL into "Google カレンダー ToDo 化" (Google Calendar to to-do)
6. Choose the import range
7. Click "予定をToDo化" (Convert events to to-dos)

Importing the same events again does not create duplicate to-dos.

## Using the stocks widget

The browser does not run the `GOOGLEFINANCE` function directly. Instead, Nexus Dash reads the results calculated in Google Sheets as a published CSV.

1. Create a sheet for stocks in Google Sheets
2. Put `symbol`, `name`, `price`, `change`, `changepct`, `currency`, `updatedAt`, `prices` in the first row
3. From the second row, add symbols and `GOOGLEFINANCE` formulas
4. Use "Share" or "Publish to the web" from the "File" menu to get a URL that can be read as CSV
5. Save the Google Sheets CSV URL in the Nexus Dash settings sidebar
6. Register the symbols you want to show, in the form `NASDAQ:AAPL` or `TYO:7203`

Example formulas:

```text
A2: NASDAQ:AAPL
B2: Apple
C2: =GOOGLEFINANCE(A2, "price")
D2: =GOOGLEFINANCE(A2, "change")
E2: =GOOGLEFINANCE(A2, "changepct")
F2: =GOOGLEFINANCE(A2, "currency")
G2: =GOOGLEFINANCE(A2, "tradetime")
H2: 190;192;191;195
```

The `prices` column is optional and is used for the sparkline. If you leave it out, a flat line at the current price is shown.

## Setting up Google OAuth

The Google Calendar, Google Tasks, and Gmail widgets need an OAuth client ID for a web application. The extension opens the Google sign-in page with `chrome.identity.launchWebAuthFlow` and uses the access token returned to the Chrome extension redirect URI.

1. Create or select a project in the Google Cloud Console
2. Under "APIs & Services", enable the Google Calendar API, Google Tasks API, and Gmail API
3. Add the Calendar / Tasks / Gmail scopes on the "OAuth consent screen"
4. While the app is in testing, add the Google accounts you will use as test users
5. Create an OAuth client ID under "Credentials"
6. Choose "Web application" as the application type
7. Register `https://<extension-id>.chromiumapp.org/` under "Authorized redirect URIs"
8. Make sure the created client ID matches `oauth2.client_id` in `manifest.json`
9. Reload Nexus Dash on the Chrome extensions page
10. In the Nexus Dash settings sidebar, click "Googleと連携" (Connect to Google) and allow all Calendar / Tasks / Gmail permissions

If Calendar, Tasks, or Gmail cannot be accessed after signing in, disconnect Google in the settings sidebar and connect again. If you deny some permissions when reconnecting, those APIs cannot be used.

## Setting up GitHub and the contribution graph

To show GitHub issues / pull requests and the contribution graph, you need a GitHub personal access token (PAT).

1. Open GitHub "Settings" > "Developer settings" > "Personal access tokens" > "Tokens (classic)"
2. Click "Generate new token (classic)"
3. Select the scopes you need:
   - Grant `repo` or `read:user` to fetch the contribution graph and the issues / pull requests assigned to you
4. Copy the generated token
5. Open the Nexus Dash settings sidebar
6. Paste the PAT into "GitHub 連携設定" (GitHub settings) and click "保存" (Save)
7. Check that the contribution graph and the list of assigned issues / pull requests appear

To remove the token, clear the input in the settings sidebar and click "保存" (Save).

## Setting up Spotify

For Spotify integration, **create your own Spotify app and set its Client ID in `.env`**.

The code contains the Client ID of the author's Spotify app as a default, but it is for the author only. A Spotify app in development mode can only be used by accounts that the app owner has allowed, so if you fork this project you need your own app. Play / pause, next, and previous require Spotify Premium.

### 1. Create a Spotify app

1. Sign in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with your Spotify account
2. Create an app with "Create app". For "Which API/SDKs are you planning to use?", choose Web API
3. Open the app's "Settings" and copy the Client ID (the Client Secret is not used)
4. To use the app with Spotify accounts other than the owner's, add their email addresses under "User Management"

### 2. Set the Client ID in `.env`

1. In the repository root, copy `.env.example` to `.env`

   ```sh
   cp .env.example .env
   ```

2. Put the Client ID you copied into `NEXUS_SPOTIFY_CLIENT_ID` in `.env`

   ```text
   NEXUS_SPOTIFY_CLIENT_ID=your-client-id
   ```

3. Reload Nexus Dash on the Chrome extensions page

`.env` is ignored by Git, so your Client ID never ends up in the repository. `.env` is read only when the extension is loaded as an unpacked extension. It is not included in the distribution zip (`scripts/package.sh`).

### 3. Register the redirect URI and connect

1. Open the settings sidebar on a new tab
2. In "Spotify 連携設定" (Spotify settings), click "URI と設定手順を別タブで開く" (Open the URI and setup steps in a new tab)
3. Copy the redirect URI shown
4. Add the same value to Redirect URIs in your app settings on the Spotify Developer Dashboard, and save
5. Click "連携する" (Connect) in the Nexus Dash Spotify widget

The redirect URI must match exactly. This app uses the form `https://<extension-id>.chromiumapp.org/spotify`. If `/spotify`, a trailing slash, or letter case differs, Spotify returns `redirect_uri: Not matching configuration`. Do not build the value by hand; use the one shown in the settings sidebar as is.

If authentication fails, the latest error is shown in the settings sidebar and on the Spotify settings page. After registering on the Spotify side, reload Nexus Dash on the Chrome extensions page and open a new tab again.

## Settings and storage

The extension stores its settings mainly in `localStorage`. Values such as AI API keys can also be read from `.env` / `.env.local` for local development. The Google OAuth Client ID is set in `oauth2.client_id` in `manifest.json`, as required for Chrome extensions.

To use `.env`, copy `.env.example` and fill in only the values you need. If a value is already saved in `localStorage`, it takes priority; `.env` is used only for items that are not saved.

```text
NEXUS_OPENAI_API_KEY=
NEXUS_ANTHROPIC_API_KEY=
NEXUS_GEMINI_API_KEY=
NEXUS_GOOGLE_CLIENT_ID=
NEXUS_GITHUB_PAT=
NEXUS_GOOGLEFINANCE_CSV_URL=
NEXUS_OPENAI_MODEL=gpt-4o
NEXUS_ANTHROPIC_MODEL=claude-sonnet-4-6
NEXUS_GEMINI_MODEL=gemini-3.5-flash
NEXUS_SPOTIFY_CLIENT_ID=   # Client ID of your own Spotify app (see "Setting up Spotify")
```

`.env.local` is read after `.env`, so you can use it for per-machine overrides. Both files are ignored by Git.

The following are stored in `localStorage`:

- RSS feed URLs
- Background image
- Widget visibility settings
- To-dos
- Google Calendar iCal URL
- Sync caches for Google Calendar / Tasks / Gmail
- Google OAuth access token and granted scopes
- AI API keys
- GoogleFinance CSV URL
- GitHub PAT
- Spotify access token
- Spotify refresh token
- Quick links
- Latest API diagnostics status

Be careful with API keys and the iCal URL on a shared PC.

## Permissions

`manifest.json` uses the following permissions:

- `identity`: for Google / Spotify authentication
- `tabs`: for the fallback that opens the sign-in page in a normal tab, and to find YouTube tabs
- `scripting`: to control playback in YouTube tabs
- `host_permissions`: set to `<all_urls>` (cannot be narrowed, because users can enter any iCal URL) to access RSS, weather, calendars, Google, the AI APIs, the Spotify API, and so on

## File structure

See the [Japanese README](README.md#ファイル構成) for the annotated file tree. The main entry points are:

- `index.html`: page structure and the load order of scripts and stylesheets
- `manifest.json`: Chrome extension settings
- `js/app.js`: `DOMContentLoaded` handling and initialization order
- `js/<feature>/`: one directory per feature (`ai`, `feed`, `weather`, `google`, `github`, `spotify`, `layout`, `core`)
- `styles/widgets/`: CSS for each widget
- `docs/`: privacy policy (`privacy.html`, `privacy.en.html`) and requirements (`要件.md`, `requirements.en.md`)
- `tests/`: tests

## Development notes

No build step is needed. After making changes, reload the extension on the Chrome extensions page and open a new tab again.

Run all tests:

```sh
node tests/run-all.js
```

Check the syntax of all JavaScript files:

```sh
for file in js/*.js js/*/*.js tests/*.js; do node --check "$file" || exit 1; done
```

## Notes

- Treat the iCal URL almost like a secret. Do not put it in a public repository or in screenshots.
- AI API keys can lead to charges from the external services, so do not save them in a shared environment.
- Spotify authentication requires the app settings on the Spotify side and the redirect URI to match.

## License

[MIT](LICENSE)

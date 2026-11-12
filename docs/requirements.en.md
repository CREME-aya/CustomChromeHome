# Nexus Dash Requirements

[日本語](要件.md)

Last updated: November 12, 2026

> These are the author's design notes. If they disagree with the implementation, the code is authoritative. For values that change often, such as model names and storage keys, refer to the relevant source files.
>
> This is a localized copy of the Japanese document. If the two disagree, the Japanese version is authoritative. UI strings quoted below are shown in Japanese in the app, with an English gloss.

## 1. Overview

Nexus Dash is a Chrome extension that replaces Chrome's new tab page with a personal dashboard. It combines a clock, weather, to-dos, Google Calendar / Google Tasks / Gmail integration, a unified agenda view, AI chat, Spotify / YouTube controls, RSS / Atom feed reading, GitHub integration, stocks, quick links, and background images on one screen.

The project is built only with HTML, CSS, and vanilla JavaScript, and has no build step or external npm dependencies.

It is a personal tool the author uses for themselves, and is not being promoted for general use on the Chrome Web Store.

## 2. Target environment

- Runs as a Chrome extension using Manifest V3.
- Shows `index.html` on the new tab page through `chrome_url_overrides.newtab`.
- It can be opened directly as a local HTML file, but features that depend on Chrome extension APIs, such as Google / Spotify authentication, work fully only when loaded as a Chrome extension.
- Main settings and user data are stored in the browser's `localStorage`.

## 3. Screen layout

### 3.1 Main screen

- The header shows the app name and a button that opens the settings menu.
- The Spotify widget is shown on the right side of the header.
- The top section shows the clock and weather widgets.
- The center shows a shared AI input field and a response panel for each AI.
- The utility area shows the to-do list.
- The quick links area shows registered links and an add button.
- The Discover area shows the RSS / Atom article list, a search field, and an All / Favorites switch.

### 3.2 Settings sidebar

The following can be edited in the settings sidebar:

- RSS / Atom feed URLs (multi-line input)
- Local image, random background, and clearing the background
- Widget visibility
- Google Calendar iCal URL and import range
- Weather location
- OpenAI, Anthropic, and Gemini API keys
- Google OAuth client ID and the calendars / task list to use
- GitHub personal access token
- Published CSV URL of the Google Sheet for stocks

## 4. Functional requirements

### 4.1 Clock

- Shows the current time in `HH:mm` format.
- Shows the date as month, day, and weekday in the Japanese locale.
- Updates the display every second.

### 4.2 Background image

- A random background can be applied from preset landscape image URLs.
- A local image selected by the user can be read as a Data URL and applied as the background.
- The applied background is saved to `localStorage` and restored next time.
- If saving the image fails, an alert says the file may be too large.
- Clearing the background removes the saved background and the input value.

### 4.3 Widget display settings

- Each widget (clock, weather, to-do, unified agenda, Spotify, quick links, AI panels, Google Calendar, Google Tasks, Gmail, GitHub, GitHub contribution graph, stocks, API diagnostics, and so on) can be shown or hidden individually. The authoritative list is in `js/widget-toggles.js`.
- Each visibility state is saved to `localStorage` and restored next time.
- In edit mode, widgets can be moved by dragging and resized with the handle in the bottom-right corner. The layout is saved to `localStorage`.
- When the window size changes or widgets are shown / hidden, widgets are moved back inside the screen, and the original layout can be restored.

### 4.4 Quick links

- Google, YouTube, and GitHub are shown by default.
- Users can add a link by entering a URL and a title.
- The URL format is validated with `new URL()`.
- If no title is entered, a default title is generated from the URL's hostname.
- Each link shows a favicon from the Google Favicon API.
- Users can delete a link after a confirmation dialog.
- The link list is saved to `localStorage`.

### 4.5 RSS / Atom Discover

- The default feed is `https://qiita.com/popular-items/feed`.
- Multiple RSS / Atom URLs can be entered directly, one per line, in the settings sidebar.
- When multiple feeds are configured, articles from the feeds that were fetched successfully are shown together.
- RSS / Atom feeds are fetched directly from the feed publisher, and the XML is parsed inside the extension (`js/feed/xml.js`). rss2json is used only as a development fallback when direct fetching fails outside the extension (as local HTML) because of CORS or similar restrictions.
- Up to 20 articles are shown.
- Each article shows its title, publication date, and action buttons.
- Clicking an article shows a preview of its content in a modal.
- The original article can be opened in a new tab from the modal.
- A search filter on article titles is provided.
- An All / Favorites tab switch is provided.
- Favorite articles are saved to `localStorage`.
- If fetching or parsing a feed fails, an error message is shown on screen.

### 4.6 AI article summary

- The summary button in the article list sends a summary prompt using the article's title, link, and description to the AI input.
- Summaries require a Gemini API key.
- If no Gemini API key is set, an alert asks the user to enter one in the settings sidebar.
- In the current implementation, the link and description may be missing from the article data; in that case the request is mainly based on the title.

### 4.7 AI chat

- One prompt from the shared input field can be sent to OpenAI, Anthropic, and Gemini at the same time.
- Only AI panels that are turned on are sent the prompt.
- If all AI panels are hidden, an alert is shown and nothing is sent.
- The prompt can be sent with the Enter key or the send button.
- While sending, the send button is disabled and each panel shows "考え中..." (Thinking...).
- OpenAI uses `https://api.openai.com/v1/chat/completions`.
- Anthropic uses `https://api.anthropic.com/v1/messages` with `max_tokens` set to 1024.
- Gemini uses `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- The models used are the defaults in `js/env-config.js`, and can be overridden with `NEXUS_*_MODEL` in `.env`.
- Each API key can be saved from the settings sidebar and is stored in `localStorage`.
- If an API key is missing or an API error occurs, the affected panel shows an error message.

## 5. Weather requirements

- The default location is Tokyo.
- Shows the current weather, temperature, and hourly precipitation (mm) for the next 6 hours.
- WMO weather codes are converted to Japanese weather descriptions and emoji.
- Forecasts are fetched from the Open-Meteo Forecast API. The model is fixed to the Japan Meteorological Agency model (`models=jma_seamless`).
- The API parameters are `current_weather=true`, `hourly=precipitation`, `timezone=Asia/Tokyo`, and `models=jma_seamless`.
- Because the JMA model does not provide precipitation probability, precipitation is shown as a line chart with time on the horizontal axis and mm on the vertical axis.
- City search uses the Open-Meteo Geocoding API with `count=1`, `language=ja`, and `format=json`.
- If a result is found, the latitude, longitude, and place name are saved and the weather display is updated.
- If no result is found, "見つかりませんでした" (Not found) is shown.
- If fetching the weather fails, "天気情報の取得に失敗しました" (Failed to get weather information) is shown.

## 5.1 Other integrations (overview)

See the README for detailed behavior and setup steps.

- Google OAuth integration: authenticates with `chrome.identity.launchWebAuthFlow`, then shows and adds Google Calendar events, gets Google Tasks lists and adds / completes / deletes tasks, and shows a simple list of unread Gmail messages. If required scopes are missing, the integration is not treated as connected and the user is asked to reconnect.
- Unified agenda view: shows Google Calendar, Google Tasks, and local to-dos on one timeline. It reads the caches of each integration widget and does not sync by itself.
- GitHub integration: uses a personal access token to show open issues assigned to the user and the contribution graph.
- Stocks: fetches values calculated with the `GOOGLEFINANCE` function in Google Sheets as a published CSV, and shows the current price and the change from the previous day. If fetching fails, the cache is shown.
- Media controls: users can switch between controlling Spotify and YouTube. YouTube is controlled by running a script in an open YouTube tab.
- API diagnostics: lists the configuration status and the latest request result of each integration. It never calls paid APIs automatically.

## 6. To-do requirements

- Users can add a to-do with the input field and the add button.
- Pressing Enter in the input field adds a to-do.
- Empty or whitespace-only to-dos are not added.
- New to-dos are added to the top of the list.
- Each to-do can be marked as done and deleted.
- Completed to-dos are shown as completed.
- The to-do list is saved to `localStorage` and restored next time.
- If parsing the saved to-dos as JSON fails, they are treated as an empty array.

## 7. Google Calendar to to-do

- As a feature separate from the Google OAuth integration, events are fetched from a Google Calendar iCal URL entered by the user.
- The iCal URL and the import range can be saved in the settings sidebar.
- The import range can be 3, 7, 14, or 30 days.
- An unsupported value is treated as the default of 7 days.
- Can be run from "予定をToDo化" (Convert events to to-dos) in the settings sidebar or "予定を取込" (Import events) in the to-do widget.
- If no iCal URL is set, "iCal URLを設定してください" (Please set an iCal URL) is shown.
- The iCal data is fetched and its `VEVENT` entries are parsed.
- Supported iCal fields are `UID`, `SUMMARY`, and `DTSTART`.
- Folded lines, all-day events in DATE format, UTC format, and local date-time format are supported.
- Only events from 00:00 today up to (but not including) the end of the import range are included.
- Events are sorted by start time, ascending, and up to 30 are imported.
- If a Google Calendar to-do with the same `UID` already exists, it is not added again.
- The result is shown as "added count / skipped count".
- If fetching or parsing fails, "予定の取得に失敗しました" (Failed to get events) is shown.

## 8. Spotify requirements

- Spotify authentication uses the Chrome extension API `chrome.identity.launchWebAuthFlow`.
- If `chrome.identity.launchWebAuthFlow` cannot open the sign-in page, the Spotify authorization URL is opened in a normal tab, and the authorization code is obtained by detecting the navigation to the redirect URI.
- The authentication method is the Authorization Code Flow with PKCE.
- The Client ID of the Spotify app must be from an app the user created, set in `NEXUS_SPOTIFY_CLIENT_ID` in `.env`. If it is not set, the default value in the code (the author's app) is used, but it cannot authenticate accounts other than those the author has allowed.
- The redirect URI obtained from `chrome.identity.getRedirectURL('spotify')` must be registered in the Spotify Developer Dashboard.
- The redirect URI has the form `https://<extension-id>.chromiumapp.org/spotify` and must be registered on the Spotify side as an exact match.
- The Spotify scopes are `user-read-playback-state`, `user-modify-playback-state`, and `user-read-currently-playing`.
- The authorization request includes `state`, which is checked when the response comes back.
- If Spotify returns `error`, the reason is shown in an alert.
- After getting the authorization code, the access token and refresh token are obtained from `https://accounts.spotify.com/api/token`.
- The access token, refresh token, and token expiry time are saved to `localStorage`.
- Before the access token expires, or when the Spotify API returns 401, the app tries to get a new token with the refresh token.
- If the refresh fails, the Spotify credentials are deleted and the app returns to the disconnected state.
- When authenticated, the player UI is shown; otherwise, the connect UI is shown.
- The playback state is fetched from `https://api.spotify.com/v1/me/player` every 5 seconds.
- Shows the current track name, artist name, album art, and play / pause state.
- If Spotify returns 204 or 202, "デバイスで再生されていません" (Nothing is playing on a device) is shown.
- Users can play / pause, go to the previous track, and go to the next track.
- The disconnect button deletes the Spotify credentials and stops polling.

## 9. Data storage requirements

Settings, user data, credentials, and caches of fetched results are stored in the browser's `localStorage`. Keys follow the naming below; the constant definitions in each module are authoritative for individual keys.

| Prefix | Contents | Examples |
| --- | --- | --- |
| `custom_` | Settings, user data, API keys, caches | `custom_todos`, `custom_feed_url`, `custom_weather_lat`, `custom_openai_api_key`, `custom_github_pat` |
| `google_` | Google OAuth tokens and granted scopes | `google_access_token`, `google_refresh_token`, `google_granted_scopes` |
| `spotify_` | Spotify tokens and authentication state | `spotify_access_token`, `spotify_refresh_token`, `spotify_token_expires_at` |
| `toggle-` | Visibility of each widget | `toggle-weather`, `toggle-todo` |

## 10. External communication requirements

The extension communicates with the following external services.

| Service | Purpose |
| --- | --- |
| rss2json | Development-only fallback (not used inside the extension) |
| RSS / Atom feed publishers | Fetching articles |
| Google Favicon API | Favicons for quick links |
| Open-Meteo Forecast API | Weather forecasts |
| Open-Meteo Geocoding API | Location search |
| Google Calendar iCal URL | Fetching calendar events |
| Google Calendar / Tasks / Gmail API | Getting and updating events, tasks, and unread mail |
| Google OAuth | Authentication for the Google integration |
| GitHub API | Getting issues and contributions |
| Google Sheets (published CSV) | Getting stock data |
| OpenAI API | Generating answers in the ChatGPT panel |
| Anthropic API | Generating answers in the Claude panel |
| Google Gemini API | Generating answers in the Gemini panel, and article summaries |
| Spotify Accounts API | Getting and refreshing OAuth tokens |
| Spotify Web API | Getting playback state and controlling playback |

## 11. Permission requirements

`manifest.json` uses the following:

- `identity`: for Google and Spotify authentication.
- `tabs`: for the fallback that opens the sign-in page in a normal tab, detecting the redirect URI, and finding YouTube tabs.
- `scripting`: for controlling playback in YouTube tabs.
- `oauth2`: declares the scopes for Google Calendar, Google Tasks, and Gmail (read-only).
- `host_permissions`: set to `<all_urls>`. Domains cannot be narrowed because users can specify any RSS / Atom or iCal URL.

## 12. Security and privacy requirements

- API keys, the iCal URL, the GitHub personal access token, and Google / Spotify tokens are stored in the browser's `localStorage`.
- User data is not sent to any server run by the developer.
- When external API features are used, only the information needed to provide the feature is sent to each external service.
- No executable code, such as JavaScript or WebAssembly, is loaded from external servers.
- On a shared PC, take care when saving API keys, the iCal URL, and tokens.

## 13. Known limitations

- When not loaded as a Chrome extension, Google and Spotify authentication cannot be used.
- Spotify authentication depends on the exact-match redirect URI setting in the Spotify Developer Dashboard.
- Spotify playback control depends on an active Spotify device and the state of the Spotify account.
- Importing via iCal URL is read-only, and there is no two-way sync with to-dos.
- The Google OAuth integration requires users to set up their own OAuth client and APIs in the Google Cloud Console.
- iCal parsing is limited to basic `VEVENT` fields; recurring events and time zone definitions are not fully interpreted.
- Fetching RSS / Atom depends on the feed publisher being reachable. Outside the extension, CORS restrictions apply and it depends on the availability of the rss2json fallback.
- When a local image is saved as the background, large images may not be saved because of the `localStorage` size limit.
- AI API keys are stored in the browser, and requests to each API are sent directly from the browser.

## 14. Verification points

- When loaded as a Chrome extension, the new tab page is replaced by Nexus Dash.
- Saving RSS URLs, showing articles from multiple feeds, search, favorites, and the modal work.
- Local image, random background, and clearing work.
- The visibility of each widget is saved and restored.
- Weather location search, weather display, and the error display on fetch failure work.
- Adding, completing, deleting, saving, and restoring to-dos work.
- Events in the target range from a Google Calendar iCal URL are converted to to-dos without duplicates.
- After saving AI API keys, answers appear in the AI panels that are turned on.
- After setting the Spotify redirect URI, authentication, token saving, getting playback state, playback control, token refresh, and disconnecting work.
- `node tests/run-all.js` passes completely.

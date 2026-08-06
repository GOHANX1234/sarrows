# Sarrows push notifications

This document describes the server-side Firebase Cloud Messaging (FCM) work completed for Sarrows and the remaining native Android work.

## Server implementation completed

The server now supports:

- Firebase Admin SDK initialization from the `FIREBASE_SERVICE_ACCOUNT_JSON` secret.
- A Mongoose `DeviceToken` collection for Android FCM registration tokens.
- Mobile login using the existing Sarrows email/password accounts.
- A 30-day encrypted Bearer access token for native API calls.
- Authenticated device-token registration and removal.
- FCM multicast delivery in batches of up to 500 devices.
- Automatic removal of invalid or expired FCM registration tokens.
- Notifications after a new movie, anime, or web-series record is created.
- Notification failures being logged without changing a successful upload into a failed upload.
- Content deep-link data for the Android app.

The service-account JSON that was uploaded during setup was removed from the project workspace. Its contents must only live in a secret manager. Rotate that Firebase service-account key before production if it was ever downloaded, copied, or exposed outside the secure secret flow.

## Production environment configuration

The Vercel deployment must have these environment variables:

```text
MONGODB_URI
NEXTAUTH_SECRET or AUTH_SECRET
NEXTAUTH_URL=https://sarrows.vercel.app
PUBLIC_APP_URL=https://sarrows.vercel.app
FIREBASE_SERVICE_ACCOUNT_JSON=<complete Firebase Admin service-account JSON>
```

`FIREBASE_SERVICE_ACCOUNT_JSON` must be added as a Vercel encrypted environment variable for the environments that run the API. Never commit it, put it under `public/`, or place it in the Android app.

The credential must belong to the same Firebase project as the Android `google-services.json`. The Android client file and the server service-account file serve different purposes:

- `google-services.json`: safe client configuration for the Android build.
- Firebase Admin service-account JSON: private server credential for sending notifications.

## Native authentication API

The native app should log in using:

```http
POST https://sarrows.vercel.app/api/auth/mobile/login
Content-Type: application/json
```

Request:

```json
{
  "email": "user@example.com",
  "password": "the-user-password"
}
```

Successful response:

```json
{
  "accessToken": "encrypted-token",
  "tokenType": "Bearer",
  "expiresIn": 2592000,
  "user": {
    "id": "mongodb-user-id",
    "nickname": "nickname",
    "email": "user@example.com",
    "image": null,
    "role": "user"
  }
}
```

Store the access token in Android encrypted storage, not in plain preferences. Send it on native API requests as:

```http
Authorization: Bearer <accessToken>
```

The mobile login uses the same account database and the same failed-login lockout behavior as the web login.

## Device-token API

### Register or refresh a device token

```http
POST https://sarrows.vercel.app/api/notifications/device-token
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Request:

```json
{
  "token": "<FCM-registration-token>",
  "platform": "android",
  "deviceId": "optional-stable-device-id",
  "appVersion": "1.0.0"
}
```

The endpoint is idempotent. Call it after login, on every app start if appropriate, and whenever Firebase gives the app a refreshed token. If a `deviceId` is supplied, the server replaces the old token for that device.

### Remove a device token

```http
DELETE https://sarrows.vercel.app/api/notifications/device-token
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Request:

```json
{
  "token": "<FCM-registration-token>"
}
```

Call this when the user logs out or disables push notifications. The server also removes tokens that Firebase reports as invalid.

## Notification payload

When an admin creates content, the server sends:

- App name: `Sarrows`
- Notification title: `New Movie on Sarrows`, `New Anime on Sarrows`, or `New Web Series on Sarrows`
- Content title
- A shortened content description
- Poster image, falling back to the banner image
- Sarrows logo URL in the data payload
- Content type and MongoDB content ID
- A path that can be used for deep linking

The data fields are:

```json
{
  "action": "open_content",
  "contentType": "movie | anime | series",
  "contentId": "mongodb-id",
  "contentTitle": "Content title",
  "contentPath": "/movies/content-slug",
  "appName": "Sarrows",
  "appLogoUrl": "https://sarrows.vercel.app/logo.svg",
  "contentImageUrl": "https://..."
}
```

The server sends the notification through FCM after the database insert succeeds. It currently sends for every new movie/series record created by the admin API, including draft records. If drafts should not notify users, change the hooks to require `status === "published"` for movies and `publishStatus === "published"` for anime/web series.

## Native Android work still required

### 1. Add Firebase Messaging

Add the Google Services plugin and Firebase Messaging dependency using the versions already used by the Android project. Put the provided `google-services.json` in the Android app module, normally:

```text
app/google-services.json
```

Do not put the Firebase Admin service-account JSON in the Android project.

### 2. Declare notification permission

For Android 13/API 33 and newer, add and request:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Ask at an appropriate point in the user experience. Respect denial and provide an in-app settings path if notifications can be enabled later.

### 3. Create the notification channel and icon

Create a channel whose ID is exactly:

```text
sarrows_updates
```

The server sends this channel ID. The app must create it before notifications arrive.

Add a monochrome Android small notification icon resource named:

```text
ic_notification
```

The server cannot send a URL as the Android small icon. The app resource is required and should be a white/transparent notification glyph, not a full-color launcher icon. The app name and launcher logo should remain configured in the Android manifest/resources.

### 4. Receive FCM tokens

Implement `FirebaseMessagingService.onNewToken(token)`. Also fetch the current token after Firebase initialization:

```kotlin
FirebaseMessaging.getInstance().token
```

After the user is authenticated, call the registration endpoint with the current token, platform, device ID if available, and app version.

Do not register the token before the user has a Sarrows access token unless the app has a deliberate anonymous-device design. The current server contract associates each token with a user.

### 5. Handle foreground and background messages

Implement `FirebaseMessagingService.onMessageReceived`. For a data payload, read:

```text
action
contentType
contentId
contentPath
contentImageUrl
```

Display a local notification when appropriate. When the notification is tapped:

- `movie` opens the movie detail screen.
- `anime` opens the anime detail screen.
- `series` opens the web-series detail screen.

Use `contentId` as the reliable identifier. `contentPath` is convenient for navigation but should not be trusted as an authorization mechanism.

If the app relies on FCM's automatic notification display for background messages, ensure the manifest metadata points to the Sarrows channel and icon. For consistent deep linking and image handling, handling data messages in the app is usually preferable.

### 6. Register and remove tokens in the app lifecycle

Recommended flow:

1. User logs in through `/api/auth/mobile/login`.
2. App stores the Bearer token securely.
3. App gets the current FCM token.
4. App calls `POST /api/notifications/device-token`.
5. App repeats registration in `onNewToken`.
6. App calls `DELETE /api/notifications/device-token` when the user logs out.
7. App clears the local access token.

If the API returns `401`, clear the access token and require login again. If registration fails because of a temporary network error, retry with bounded backoff; do not repeatedly register in a tight loop.

### 7. Test the native app

Test all of these cases on a physical Android device:

- App open when a new movie is uploaded.
- App in the background when a new anime is uploaded.
- App fully closed when a new web series is uploaded.
- Android 13+ permission accepted and denied.
- Notification tap opens the correct detail page.
- Token refresh updates the server record.
- Logout removes the device token.
- Invalid/expired tokens are removed after a server send.
- Content with no poster uses the banner or no image without crashing.

## Operational notes

- Use `https://sarrows.vercel.app` in the release build.
- Do not use the Replit preview URL as the production API base URL.
- Keep Firebase Admin credentials only in Vercel/Replit secret storage.
- The native app's Firebase project and the server service-account project must match.
- A successful content upload does not depend on FCM being available.
- Episodes are not currently notification triggers. The current requirement covers movies, anime, and web-series creation only.
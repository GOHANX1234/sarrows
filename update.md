# Sarrows — Native App OTA Update Integration Guide

This document describes the complete over-the-air (OTA) update system built into the Sarrows backend. It covers the API contract, response semantics, and ready-to-copy implementation patterns for the native Android (and iOS) app.

---

## Table of Contents

1. [How It Works](#1-how-it-works)
2. [API Reference](#2-api-reference)
3. [Response Fields Explained](#3-response-fields-explained)
4. [Update Scenarios & Decision Tree](#4-update-scenarios--decision-tree)
5. [Android Integration — Step by Step](#5-android-integration--step-by-step)
6. [Kotlin Code Samples](#6-kotlin-code-samples)
7. [iOS Integration Notes](#7-ios-integration-notes)
8. [Admin Panel — How to Manage Versions](#8-admin-panel--how-to-manage-versions)
9. [Version Code Rules](#9-version-code-rules)
10. [Testing the API Locally](#10-testing-the-api-locally)
11. [FAQ](#11-faq)

---

## 1. How It Works

```
Native App starts
      │
      ▼
POST /api/app/version/check
  { versionCode: <current>, platform: "android" }
      │
      ▼
Server looks up the latest *active* version record
for that platform + channel in MongoDB
      │
      ├─ updateAvailable: false  →  All good, continue
      │
      ├─ updateAvailable: true, forceUpdate: false  →  Show optional update dialog
      │
      ├─ updateAvailable: true, forceUpdate: true   →  Block app, force update screen
      │
      └─ currentVersionSupported: false  →  Always block — version too old
```

The admin creates version records in the **Admin → App Updates** panel. Each record stores:

| Field | Purpose |
|---|---|
| `versionName` | Human-readable string shown to the user (e.g. `"1.2.3"`) |
| `versionCode` | Integer compared against the app's build code |
| `platform` | `android`, `ios`, or `all` |
| `channel` | `stable` (all users) or `beta` (opted-in users) |
| `downloadUrl` | Direct APK link or Play Store URL |
| `releaseNotes` | Changelog shown in the update dialog |
| `forceUpdate` | If `true`, user cannot skip |
| `minSupportedVersionCode` | Any app below this code is force-blocked |
| `rolloutPercentage` | `0–100` — for gradual rollouts |
| `isActive` | Only active records are returned by the check API |

---

## 2. API Reference

### Endpoint

```
POST /api/app/version/check
Content-Type: application/json
```

> No authentication required. This is a public endpoint.

### Request Body

```json
{
  "versionCode": 12,
  "platform": "android",
  "channel": "stable"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `versionCode` | `integer` | ✅ | Your app's current build/version code (`BuildConfig.VERSION_CODE`) |
| `platform` | `"android" \| "ios"` | ✅ | Target platform |
| `channel` | `"stable" \| "beta"` | ❌ | Defaults to `"stable"` if omitted |

### Response Body

```json
{
  "updateAvailable": true,
  "forceUpdate": false,
  "currentVersionSupported": true,
  "latestVersionCode": 15,
  "latestVersionName": "1.5.0",
  "downloadUrl": "https://cdn.example.com/sarrows-1.5.0.apk",
  "releaseNotes": "• Fixed login bug\n• Smoother player\n• Dark mode improvements",
  "channel": "stable",
  "rolloutPercentage": 100,
  "minSupportedVersionCode": 10
}
```

| Field | Type | Description |
|---|---|---|
| `updateAvailable` | `boolean` | `true` if `latestVersionCode > versionCode` |
| `forceUpdate` | `boolean` | `true` if the update is mandatory (cannot be skipped) |
| `currentVersionSupported` | `boolean` | `false` if `versionCode < minSupportedVersionCode` — always block |
| `latestVersionCode` | `integer \| null` | Latest version code on the server |
| `latestVersionName` | `string \| null` | Human-readable version string |
| `downloadUrl` | `string \| null` | Download link (only present when `updateAvailable = true`) |
| `releaseNotes` | `string \| null` | Changelog (only present when `updateAvailable = true`) |
| `channel` | `string \| null` | Channel this version belongs to |
| `rolloutPercentage` | `integer \| null` | `0–100`. Use this for gradual rollout logic in the app. |
| `minSupportedVersionCode` | `integer \| null` | Minimum supported version code |

---

## 3. Response Fields Explained

### `updateAvailable`

`true` whenever `latestVersionCode > versionCode`. Use this to decide whether to show the update UI.

### `forceUpdate`

`true` in two cases:
1. The admin explicitly enabled **Force Update** on the new version record.
2. The app's `versionCode` is below `minSupportedVersionCode` (the app is too old and must update).

When `forceUpdate` is `true`, the app must **block all navigation** and show a non-dismissible update screen.

### `currentVersionSupported`

`false` if the app's `versionCode < minSupportedVersionCode`. This is checked independently of whether an update is available — use it as a hard gate even if `updateAvailable` is somehow `false`.

### `rolloutPercentage`

The admin controls what percentage of users should receive the update prompt. Implement on the native side like this:

```kotlin
// Deterministic per-device rollout: use a hash of the device ID
val deviceBucket = (deviceId.hashCode().absoluteValue % 100) + 1  // 1..100
val inRollout = deviceBucket <= (response.rolloutPercentage ?: 100)
val shouldPrompt = response.updateAvailable && inRollout
```

---

## 4. Update Scenarios & Decision Tree

```
After receiving the API response:

is currentVersionSupported == false?
  YES → Show "App Too Old" blocking screen. Link to downloadUrl. No dismiss.

is updateAvailable == true?
  NO  → Do nothing. App is up to date.
  YES →
        is forceUpdate == true?
          YES → Show non-dismissible update dialog.
                Open downloadUrl. Exit app on dismiss attempt.
          NO  →
                is deviceBucket <= rolloutPercentage?
                  YES → Show optional "Update Available" dialog.
                        User can dismiss and continue.
                  NO  → Do nothing (user not in this rollout slice).
```

---

## 5. Android Integration — Step by Step

### Step 1 — Add to your build config

In `app/build.gradle`:

```groovy
android {
    defaultConfig {
        versionCode 12          // ALWAYS increment this for every release
        versionName "1.2.0"
    }
}
```

### Step 2 — Create a data class

```kotlin
data class VersionCheckRequest(
    val versionCode: Int,
    val platform: String = "android",
    val channel: String = "stable"
)

data class VersionCheckResponse(
    val updateAvailable: Boolean,
    val forceUpdate: Boolean,
    val currentVersionSupported: Boolean,
    val latestVersionCode: Int?,
    val latestVersionName: String?,
    val downloadUrl: String?,
    val releaseNotes: String?,
    val channel: String?,
    val rolloutPercentage: Int?,
    val minSupportedVersionCode: Int?
)
```

### Step 3 — Add the API call

```kotlin
// Replace with your actual base URL (production domain)
const val BASE_URL = "https://your-sarrows-domain.com"

suspend fun checkForUpdate(currentVersionCode: Int): VersionCheckResponse {
    val client = OkHttpClient()
    val json = """{"versionCode":$currentVersionCode,"platform":"android","channel":"stable"}"""
    val body = json.toRequestBody("application/json".toMediaType())
    val request = Request.Builder()
        .url("$BASE_URL/api/app/version/check")
        .post(body)
        .build()

    val response = client.newCall(request).execute()
    val responseBody = response.body?.string() ?: throw IOException("Empty response")
    return Gson().fromJson(responseBody, VersionCheckResponse::class.java)
}
```

> **If you use Retrofit**, see the Retrofit sample in the next section.

### Step 4 — Run on app startup

Call `checkForUpdate()` in your `MainActivity` (or `SplashActivity`) after the splash screen:

```kotlin
override fun onResume() {
    super.onResume()
    lifecycleScope.launch {
        try {
            val result = checkForUpdate(BuildConfig.VERSION_CODE)
            handleUpdateResult(result)
        } catch (e: Exception) {
            // Network error — fail silently, don't block the user
        }
    }
}
```

### Step 5 — Handle the result

```kotlin
fun handleUpdateResult(result: VersionCheckResponse) {
    when {
        // Hard block — version too old
        !result.currentVersionSupported -> showForceUpdateDialog(result, reason = "tooOld")

        // Optional or forced update available
        result.updateAvailable -> {
            val inRollout = isInRollout(result.rolloutPercentage ?: 100)
            when {
                result.forceUpdate        -> showForceUpdateDialog(result)
                inRollout                 -> showOptionalUpdateDialog(result)
                // else: user not in rollout slice — do nothing
            }
        }

        // All good
        else -> { /* continue normally */ }
    }
}

fun isInRollout(rolloutPct: Int): Boolean {
    val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
    val bucket = (deviceId.hashCode().absoluteValue % 100) + 1
    return bucket <= rolloutPct
}
```

---

## 6. Kotlin Code Samples

### Retrofit interface

```kotlin
interface SarrowsApi {
    @POST("api/app/version/check")
    suspend fun checkVersion(@Body body: VersionCheckRequest): VersionCheckResponse
}

// Usage
val api = Retrofit.Builder()
    .baseUrl("https://your-sarrows-domain.com/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()
    .create(SarrowsApi::class.java)

val result = api.checkVersion(VersionCheckRequest(versionCode = BuildConfig.VERSION_CODE))
```

### Force-update dialog (non-dismissible)

```kotlin
fun showForceUpdateDialog(result: VersionCheckResponse, reason: String = "forced") {
    AlertDialog.Builder(this)
        .setTitle("Update Required")
        .setMessage(
            if (reason == "tooOld")
                "This version of the app is no longer supported. Please update to continue."
            else
                "A required update is available (v${result.latestVersionName}).\n\n${result.releaseNotes ?: ""}"
        )
        .setPositiveButton("Update Now") { _, _ ->
            openDownloadUrl(result.downloadUrl)
        }
        .setCancelable(false)   // ← Non-dismissible
        .show()
}

fun openDownloadUrl(url: String?) {
    if (url.isNullOrBlank()) return
    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
}
```

### Optional update dialog (dismissible)

```kotlin
fun showOptionalUpdateDialog(result: VersionCheckResponse) {
    AlertDialog.Builder(this)
        .setTitle("Update Available — v${result.latestVersionName}")
        .setMessage(result.releaseNotes ?: "A new version is available.")
        .setPositiveButton("Update") { _, _ -> openDownloadUrl(result.downloadUrl) }
        .setNegativeButton("Later") { dialog, _ -> dialog.dismiss() }
        .show()
}
```

### Beta channel opt-in

Store the user's beta preference in `SharedPreferences`:

```kotlin
val prefs = getSharedPreferences("sarrows", Context.MODE_PRIVATE)
val isBeta = prefs.getBoolean("betaOptIn", false)
val channel = if (isBeta) "beta" else "stable"

val result = api.checkVersion(VersionCheckRequest(
    versionCode = BuildConfig.VERSION_CODE,
    platform = "android",
    channel = channel
))
```

---

## 7. iOS Integration Notes

The same endpoint works for iOS. Send `"platform": "ios"` in the request body.

```swift
struct VersionCheckRequest: Codable {
    let versionCode: Int
    let platform: String
    let channel: String
}

struct VersionCheckResponse: Codable {
    let updateAvailable: Bool
    let forceUpdate: Bool
    let currentVersionSupported: Bool
    let latestVersionCode: Int?
    let latestVersionName: String?
    let downloadUrl: String?
    let releaseNotes: String?
    let rolloutPercentage: Int?
    let minSupportedVersionCode: Int?
}

// versionCode on iOS = your CFBundleVersion (integer build number)
let currentBuild = Int(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0") ?? 0

let body = VersionCheckRequest(versionCode: currentBuild, platform: "ios", channel: "stable")
// Send to POST https://your-sarrows-domain.com/api/app/version/check
```

For iOS, `downloadUrl` should point to the App Store URL or a TestFlight link. Deep-linking into the App Store:

```swift
if let url = URL(string: response.downloadUrl ?? "") {
    UIApplication.shared.open(url)
}
```

---

## 8. Admin Panel — How to Manage Versions

Go to **Admin → App Updates** (`/admin/updates`).

### Creating a new version

1. Click **New Version**.
2. Fill in:
   - **Version Name** — human-readable, e.g. `1.5.0`. Shown in the update dialog.
   - **Version Code** — must be a positive integer, always higher than the previous release.
   - **Platform** — `Android`, `iOS`, or `All Platforms`.
   - **Channel** — `Stable` (default) or `Beta`.
   - **Download URL** — direct APK link, Play Store URL, or App Store URL.
   - **Rollout %** — `100` for full rollout, lower for gradual.
   - **Min Supported Version Code** — apps below this code will be force-blocked.
   - **Release Notes** — changelog shown inside the app.
   - **Force Update** — toggle ON to make the update mandatory.
   - **Set as Active** — only active versions are returned by the API. New versions default to active.
3. Click **Create Version**.

> When you create a new **active** version, all previously active versions on the same platform + channel are automatically deactivated. Only one live record per platform per channel.

### Making a version live / deactivating

Click the **✓ / ✗** icon on any version row to toggle its active state.

### Editing a version

Click the **pencil** icon to edit any field except `versionCode` (that's immutable).

### Rolling back

If a bad release slips through:

1. **Deactivate** the bad version (click the checkmark icon to toggle off).
2. **Activate** the previous known-good version.
3. Optionally enable **Force Update** on the old version so users on the bad build are pushed back down.

> Note: the API always returns the latest active record sorted by `versionCode DESC`. Activating an older version code while a newer one is also active would cause the newer one to be returned. Always deactivate the bad one first.

### Gradual rollout workflow

1. Create the new version with `rolloutPercentage: 10`.
2. Monitor crash reports.
3. In the admin panel, edit the version and increase `rolloutPercentage` to `50`, then `100`.

---

## 9. Version Code Rules

| Rule | Reason |
|---|---|
| Always increment `versionCode` for every build | The API compares integers — equal codes = no update |
| Never reuse a `versionCode` | MongoDB has a unique index on this field; the POST will be rejected |
| `versionCode` is immutable once created | Editing it would break comparisons for devices already on that code |
| Keep `minSupportedVersionCode` ≤ the oldest build you still support | Setting it too high will force-block users on recent-ish builds |

---

## 10. Testing the API Locally

Using `curl`:

```bash
# Check if version 10 needs an update (Android, stable)
curl -s -X POST https://your-sarrows-domain.com/api/app/version/check \
  -H "Content-Type: application/json" \
  -d '{"versionCode": 10, "platform": "android", "channel": "stable"}' | jq

# Check beta channel
curl -s -X POST https://your-sarrows-domain.com/api/app/version/check \
  -H "Content-Type: application/json" \
  -d '{"versionCode": 10, "platform": "android", "channel": "beta"}' | jq

# Simulate a very old app (below minSupportedVersionCode)
curl -s -X POST https://your-sarrows-domain.com/api/app/version/check \
  -H "Content-Type: application/json" \
  -d '{"versionCode": 1, "platform": "android"}' | jq
```

Expected response when up to date:

```json
{
  "updateAvailable": false,
  "forceUpdate": false,
  "currentVersionSupported": true,
  "latestVersionCode": 12,
  "latestVersionName": "1.2.0",
  "downloadUrl": null,
  "releaseNotes": null,
  ...
}
```

---

## 11. FAQ

**Q: What happens if there are no version records in the database?**  
A: The API returns `{ updateAvailable: false, forceUpdate: false, currentVersionSupported: true, ... }` — the app behaves as if everything is fine.

**Q: Can I have different updates for Android and iOS simultaneously?**  
A: Yes. Create separate version records for `android` and `ios`. The API filters by platform.

**Q: What does `platform: "all"` mean for a version record?**  
A: It matches both Android and iOS requests. Useful when the same APK/IPA serves both (rare) or when you want a universal announcement.

**Q: Can I have both a stable and a beta version active at the same time?**  
A: Yes. Active uniqueness is enforced per `platform + channel` pair. One stable + one beta can both be active.

**Q: What if the app cannot reach the update endpoint?**  
A: Catch the network error and fail silently — never block the user due to a connectivity issue. Only block on an explicit `forceUpdate: true` or `currentVersionSupported: false` from a successful API response.

**Q: Should I check for updates every time the app opens?**  
A: Yes — call the endpoint in `onResume` of your main activity. The endpoint is fast (DB lookup only) and has no rate limiting. You may cache the result for a few minutes if you want to avoid redundant calls.

**Q: How do I handle the case where `downloadUrl` is a Play Store link instead of a direct APK?**  
A: Open it with `Intent(Intent.ACTION_VIEW, Uri.parse(url))` — Android will detect it's a Play Store URL and open the store directly.

# Installing Kitchen Collection on your Samsung Galaxy S21

These steps are written for an S21 on current One UI (Android 16). Menu names can shift slightly between One UI versions; look for the closest match.

The APK file is `kitchen-collection-v1.0.0.apk` (later versions change the number).

## First install

### 1. Get the APK onto the phone

Pick whichever is easiest:

- **USB cable.**
  1. Plug the phone into the PC and unlock it.
  2. On the phone, tap the USB notification and choose **File transfer**.
  3. On the PC, open **This PC > Galaxy S21 > Phone > Download** and copy the APK in.
- **OneDrive or Google Drive.** Upload the APK from the PC. On the phone, open the file in the Drive or OneDrive app and tap **Download**.
- **Email.** Email the APK to yourself and open the attachment on the phone. Some mail apps block APK attachments. If yours does, use one of the other two ways.

### 2. Open it with My Files

1. Open the **My Files** app (Samsung's file manager).
2. Tap **Downloads** (or **Installation files**) and tap the APK.

### 3. Allow installs from My Files (first time only)

Android says it isn't allowed to install unknown apps from this source.

1. Tap **Settings** in that message.
2. Turn on **Allow from this source**.
3. Press back. You return to the install screen.

If nothing happens, or you see a message about **Auto Blocker**:

1. Go to **Settings > Security and privacy > Auto Blocker** and turn it **off**.
2. Install the app.
3. Turn Auto Blocker back on. It doesn't affect the app once it's installed.

### 4. Install

1. Tap **Install**.
2. **Google Play Protect** may say the app is from an unknown developer, or offer to scan it. That's expected for an app that isn't from the Play Store. Tap **More details > Install anyway**. If it offers to scan the app first, either choice is fine.
3. Tap **Open**.

### 5. First run

- The first time you start a timer, the app asks to send notifications. Tap **Allow**. Without it, a timer still chimes inside the app, but you won't get an alert when the app is in the background or the screen is off.
- **Optional, for reliable timers.** Samsung phones close background apps aggressively. To make sure timer alerts always fire:
  1. Go to **Settings > Apps > Kitchen Collection > Battery**.
  2. Choose **Unrestricted**.

## Updating from inside the app (the usual way)

When a new version is released, the app shows **Version X is ready** at the top of the Recipes screen, and under **Settings > App updates**.

1. Tap **Download**. Chrome downloads the APK.
2. When it finishes, tap the download notification, or open **My Files > Downloads**, and tap the file.
3. The first time, Android may ask you to allow installs from **Chrome** (or My Files). Turn on **Allow from this source** and press back.
4. Tap **Update**. Your lists, favourites, cook log and photos stay.

All releases are also listed at https://github.com/tellu2/kitchen-collection/releases.

## Installing an update over the top by hand (keeps your data)

Your favourites, shopping lists, saved lists, cook log, Have ticks, settings and photos live inside the app on the phone. An update keeps all of them, **as long as you install over the top and never uninstall.**

1. Get the new APK onto the phone the same way as before. Its file name has a higher version number, such as `kitchen-collection-v1.0.1.apk`.
2. Tap it in **My Files**.
3. Android asks **Do you want to update this app?** Tap **Update**.
4. Open the app. Everything is where you left it.

### Rules that keep updates working

- **Don't uninstall first.** Uninstalling deletes the app's data on the phone.
- **Every new APK needs a higher version number.** The build takes it from `version` in `package.json`, so bump that (for example 1.0.0 to 1.0.1) before building. Android refuses to install a lower or equal version over the top.
- **Every APK must be signed with the same key:** `C:\Users\trist\KitchenCollection-signing\kitchen-collection-release.jks`. If Android says **App not installed** or **package conflicts with an existing package**, the APK was signed with a different key. Don't uninstall to get around it. Rebuild it with the right key.
- **Back up the signing folder** (`C:\Users\trist\KitchenCollection-signing\`) somewhere safe, such as a USB stick or a password manager. If it's lost, future updates can't go over the top.

## Backing up your data

Your favourites, shopping and saved lists, cook log, Cooking today, Have ticks, settings and your own photos live only on the phone. Back them up now and then, and before you change phones.

**Export**
1. Go to **Settings > Backup** and tap **Export backup**.
2. The share sheet opens. Choose **Drive** (Google Drive) and tap **Save**.

The file is called `kitchen-collection-backup-<date>.json`.

**Restore** (for example on a new phone, after installing the app)
1. Go to **Settings > Backup** and tap **Import backup**.
2. Pick the backup file. Google Drive appears in the file picker's menu.
3. Check the summary (saved recipes, lists, photos) and tap **Replace with this backup**.

Restoring replaces what's currently on the phone. Recipes aren't affected; they come from the app and GitHub.

## Recipe updates without a new APK

New and changed recipes publish to https://tellu2.github.io/kitchen-collection/ and the app fetches them by itself: on launch, or when you pull down on the Recipes screen. No new APK is needed. New recipes show a **New** badge, and changed ones show **Updated**.

## Building a new APK on the PC

From the `repo` folder:

```
npm version patch --no-git-tag-version
npm run android:sync
cd android
.\gradlew.bat assembleRelease
```

The signed APK is written to `android\app\build\outputs\apk\release\app-release.apk`. The build needs:
- **JAVA_HOME** pointing at JDK 21 (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`). Capacitor 8 plugins compile with Java 21.
- **ANDROID_HOME** pointing at `C:\Users\trist\AppData\Local\Android\Sdk`

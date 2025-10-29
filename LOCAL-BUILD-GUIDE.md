# 📱 Build APK Locally and Install via USB

## Method 1: Build APK Using EAS (Recommended)

This method creates a production-ready APK that you can install on any Android device.

### Step 1: Install EAS CLI

```cmd
npm install -g eas-cli
```

### Step 2: Login to Expo Account

```cmd
eas login
```

If you don't have an Expo account, create one at https://expo.dev/signup

### Step 3: Configure Your Project

```cmd
eas build:configure
```

This will update your `eas.json` and `app.json` files.

### Step 4: Build APK for Android

```cmd
eas build --platform android --profile preview --local
```

**Note:** The `--local` flag builds on your computer instead of Expo's cloud servers.

**If `--local` doesn't work, use cloud build:**
```cmd
eas build --platform android --profile preview
```

This will:
- Upload your project to Expo servers
- Build the APK in the cloud
- Give you a download link when complete (~10-15 minutes)

### Step 5: Download the APK

After the build completes, you'll see:
```
✔ Build finished
https://expo.dev/accounts/[your-account]/projects/community/builds/[build-id]
```

Click the link and download the APK file (e.g., `CommUnity-preview.apk`)

### Step 6: Transfer APK to Phone via USB

#### Option A: Using File Explorer (Easiest)

1. **Connect your phone via USB cable**
2. **On your phone:** Swipe down notification panel
3. **Tap on USB notification** → Select **"File Transfer"** or **"Transfer Files"**
4. **On your computer:** Open File Explorer (Windows + E)
5. **Find your phone** in "This PC" (e.g., "Galaxy S21", "Pixel 6")
6. **Navigate to:** `Internal Storage` or `Download` folder
7. **Copy the APK file** from your computer to phone's Download folder
8. **Safely eject** your phone from computer

#### Option B: Using ADB (Advanced)

1. **Enable USB Debugging** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times (Developer mode enabled)
   - Go back to Settings → System → Developer Options
   - Enable "USB Debugging"

2. **Install ADB** (if not installed):
   ```cmd
   npm install -g android-platform-tools
   ```
   OR download from: https://developer.android.com/tools/releases/platform-tools

3. **Connect phone via USB** and run:
   ```cmd
   adb devices
   ```
   You should see your device listed.

4. **Install APK directly:**
   ```cmd
   adb install path\to\CommUnity-preview.apk
   ```

### Step 7: Install APK on Phone

1. **Open File Manager** on your phone
2. **Navigate to Downloads** folder
3. **Tap on the APK file** (e.g., `CommUnity-preview.apk`)
4. **If prompted:** "Install from Unknown Sources"
   - Tap **"Settings"**
   - Enable **"Allow from this source"**
   - Go back and tap APK again
5. **Tap "Install"**
6. **Wait for installation** (~30 seconds)
7. **Tap "Open"** or find CommUnity in your app drawer
8. **Your custom logo** will appear as the app icon! 🎉

---

## Method 2: Build Locally Without EAS (Alternative)

If you want to build completely on your machine without Expo services:

### Step 1: Install Android Studio

Download and install from: https://developer.android.com/studio

### Step 2: Set Up Environment Variables

Add to your system PATH:
- `C:\Users\[YourUsername]\AppData\Local\Android\Sdk\platform-tools`
- `C:\Users\[YourUsername]\AppData\Local\Android\Sdk\tools`

### Step 3: Generate Android Project

```cmd
npx expo prebuild --platform android
```

This creates the `android/` folder.

### Step 4: Build APK

```cmd
cd android
gradlew assembleRelease
```

The APK will be in:
```
android\app\build\outputs\apk\release\app-release.apk
```

### Step 5: Install via USB

Follow the same steps as Method 1, Step 6 and 7.

---

## Method 3: Quick Development Build (For Testing Only)

This creates a development build that's faster but larger in size.

### Step 1: Start Metro Bundler

```cmd
npx expo start
```

### Step 2: Build for Android

Press `a` in the terminal to build and install on connected device.

OR manually run:
```cmd
npx expo run:android
```

**Note:** This requires:
- USB Debugging enabled
- Phone connected via USB
- ADB installed

---

## 🎯 Recommended Approach

**For final production app:** Use **Method 1** (EAS Build)

**Pros:**
- ✅ Production-ready APK
- ✅ Optimized and minified
- ✅ Small file size (~50MB)
- ✅ Custom app icon included
- ✅ Ready for Play Store
- ✅ No Android Studio needed

**Cons:**
- ⏱️ Takes 10-15 minutes to build
- 🌐 Requires internet connection
- 📝 Need Expo account (free)

---

## 📋 Quick Reference Commands

### Build APK (Cloud):
```cmd
eas build --platform android --profile preview
```

### Build APK (Local):
```cmd
eas build --platform android --profile preview --local
```

### Install via ADB:
```cmd
adb install CommUnity-preview.apk
```

### Check connected devices:
```cmd
adb devices
```

---

## 🔧 Troubleshooting

### Issue: "App not installed"

**Solution:**
1. Uninstall any existing version of CommUnity
2. Try installing again
3. Make sure you have enough storage space

### Issue: "Installation blocked"

**Solution:**
1. Go to Settings → Security
2. Enable "Install unknown apps"
3. Allow installation from Files/Downloads app

### Issue: "ADB device not found"

**Solution:**
1. Enable USB Debugging on phone
2. Unlock phone screen
3. Accept "Allow USB Debugging" prompt
4. Run `adb devices` again

### Issue: Build fails with "Out of memory"

**Solution:**
1. Close other applications
2. Use cloud build instead of local:
   ```cmd
   eas build --platform android --profile preview
   ```

### Issue: "Google Play Services required"

**Solution:**
This APK works on any Android device. If you see this message, it's safe to ignore for development builds.

---

## 📱 Final Result

After installation, you will have:

- ✅ **CommUnity app** with your custom logo icon
- ✅ **Standalone app** (no Expo Go needed)
- ✅ **All features working** (camera, videos, profiles, etc.)
- ✅ **Production performance** (optimized and fast)
- ✅ **Shareable APK** (send to friends to test)

---

## 🚀 Next Steps

1. **Build the APK** using Method 1
2. **Download it** from Expo dashboard
3. **Transfer to phone** via USB
4. **Install and enjoy!** 🎉

For Play Store submission, use:
```cmd
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) file for Google Play Store.

---

**Need help?** Check the official docs:
- EAS Build: https://docs.expo.dev/build/setup/
- APK Installation: https://docs.expo.dev/build/internal-distribution/

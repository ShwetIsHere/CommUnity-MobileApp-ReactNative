# 🚀 CommUnity - Installation & Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Android Studio** (for Android development) or **Xcode** (for iOS development)
- **Expo Go App** on your mobile device - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779)

## 📥 Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd CommUnity
```


### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

This will install all required packages including:
- React Native
- Expo SDK 54
- Supabase Client
- NativeWind (Tailwind CSS for React Native)
- Expo AV (for video playback)
- Expo Image Picker
- And more...

### 3. Set Up Supabase Backend

#### A. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign up/login
2. Click **"New Project"**
3. Fill in project details:
   - Project Name: `CommUnity`
   - Database Password: (create a strong password)
   - Region: (choose closest to your location)
4. Wait for project to be created (~2 minutes)

#### B. Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `database-setup.sql` from the project root
4. Copy the entire file contents
5. Paste into the SQL Editor
6. Click **"Run"** to execute
7. You should see: ✅ Success. No rows returned

#### C. Get Your Supabase Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys")

### 4. Configure Environment Variables

1. Create a `.env` file in the project root (if not exists):

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

2. Open `.env` and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Replace with your actual Supabase URL and key from step 3C.

### 5. Update Supabase Configuration

Open `utils/supabase.ts` and verify the configuration:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

## 🏃‍♂️ Running the Project

### Development Mode (Recommended for Testing)

```bash
npm start
# or
yarn start
# or
npx expo start
```

This will start the Expo development server and show a QR code.

### Run on Android Device/Emulator

**Option 1: Physical Device**
1. Install **Expo Go** from Play Store
2. Scan the QR code with Expo Go app
3. App will load on your phone

**Option 2: Android Emulator**
```bash
npm run android
# or
yarn android
```

### Run on iOS Device/Simulator (Mac only)

**Option 1: Physical Device**
1. Install **Expo Go** from App Store
2. Scan the QR code with Camera app
3. Open with Expo Go

**Option 2: iOS Simulator**
```bash
npm run ios
# or
yarn ios
```

### Run on Web Browser

```bash
npm run web
# or
yarn web
```

**Note:** Some features (camera, video playback) may not work properly on web.

## 🔧 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: Supabase connection error

**Solution:**
1. Check your `.env` file has correct credentials
2. Verify Supabase project is active
3. Check internet connection
4. Restart the development server

### Issue: Videos not playing

**Solution:**
1. Ensure you're testing on a real device (not web browser)
2. Check video file size (must be < 10MB)
3. Verify video format is supported (MP4 recommended)

### Issue: Image picker not working

**Solution:**
1. Grant camera and storage permissions on your device
2. Restart the app
3. Check device settings → Apps → CommUnity → Permissions

### Issue: App icon not showing custom logo

**Solution:**
1. Run the rebuild script: `rebuild-app.bat` (Windows) or follow `BUILD_INSTRUCTIONS.md`
2. Uninstall old app from device
3. Reinstall from Expo
4. For production build: `eas build --platform android`

## 📱 Testing User Accounts

To test the app, you'll need to create at least 2 user accounts:

1. **First User:**
   - Sign up with email/password
   - Set up profile (bio, avatar)
   - Create some posts

2. **Second User:**
   - Sign up with different email
   - Follow first user
   - Like and comment on posts
   - Send direct messages

## 🔄 Updating the App

When you make changes to the code:

```bash
# Development mode - changes reload automatically
npx expo start

# Clear cache if changes don't appear
npx expo start -c
```

## 📦 Building for Production

### Create Production Build (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile preview

# Build for Play Store
eas build --platform android --profile production
```

### Create Production Build (iOS)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

## 📂 Project Structure

```
CommUnity/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based screens (feed, reels, profile)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry point
│   ├── welcome.tsx        # Welcome screen
│   ├── create-post.tsx    # Create post screen
│   ├── video-editor.tsx   # Video trimming screen
│   └── ...
├── assets/                # Images, fonts, logo
├── components/            # Reusable components
├── utils/                 # Utility functions
│   └── supabase.ts       # Supabase configuration
├── database-setup.sql     # Database schema
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind CSS config
└── tsconfig.json          # TypeScript config
```

## 🆘 Need Help?

- **Expo Documentation:** https://docs.expo.dev/
- **Supabase Documentation:** https://supabase.com/docs
- **React Native Documentation:** https://reactnative.dev/docs/getting-started

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] App starts without errors
- [ ] Can sign up new user
- [ ] Can login with existing user
- [ ] Profile page loads correctly
- [ ] Can upload image post
- [ ] Can upload video post (< 15 seconds)
- [ ] Can like posts
- [ ] Can follow other users
- [ ] Can send direct messages
- [ ] Feed shows posts from all users
- [ ] Reels show videos vertically
- [ ] Custom logo appears in app

## 🎉 You're All Set!

Your CommUnity app is now ready to use. Start by signing up and creating your first post!

For more information about app features, see `README-FEATURES.md`.
For technical details, see `README-ABOUT.md`.

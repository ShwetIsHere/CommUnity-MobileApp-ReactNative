# 📱 CommUnity - Social Media Mobile Application

## 🌟 Project Overview

**CommUnity** is a modern, feature-rich social media mobile application built with React Native and Expo. Inspired by popular platforms like Instagram and TikTok, CommUnity allows users to share photos and videos, connect with friends, and engage with content through an intuitive and beautiful interface.

## 🎯 Project Purpose

CommUnity aims to create a community-focused social networking experience where users can:
- Share moments through photos and videos
- Discover and engage with content from others
- Build connections through following and messaging
- Express themselves through personalized profiles

## 🛠️ Technologies & Frameworks

### **Frontend Framework**
- **React Native** (v0.76.5) - Cross-platform mobile app development
- **Expo SDK 54** - Development platform for React Native
- **TypeScript** - Type-safe JavaScript for better code quality

### **UI/UX Libraries**
- **NativeWind** (v4) - Tailwind CSS for React Native styling
- **Tailwind CSS** - Utility-first CSS framework
- **Expo Vector Icons** - Icon library (Ionicons, MaterialIcons, etc.)
- **Expo Image** - Optimized image component
- **React Native Gesture Handler** - Touch and gesture handling

### **Backend & Database**
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL Database
  - Authentication (Email/Password)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - RESTful API

### **Media Handling**
- **Expo Image Picker** - Camera and gallery access
- **Expo AV** (Audio/Video) - Video recording and playback
- **Expo Video Thumbnails** - Generate video preview thumbnails
- **FileReader API** - Base64 image/video encoding

### **Navigation**
- **Expo Router** (v4) - File-based routing system
- **React Navigation** - Navigation primitives

### **Development Tools**
- **Babel** - JavaScript compiler
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking

### **Build & Deployment**
- **EAS (Expo Application Services)** - Cloud build service
- **Metro Bundler** - JavaScript bundler for React Native

## 🏗️ Architecture

### **Design Pattern**
- **Component-Based Architecture** - Reusable UI components
- **File-Based Routing** - Automatic route generation from file structure
- **Separation of Concerns** - Utils, components, and screens separated

### **State Management**
- **React Hooks** (useState, useEffect, useCallback, useMemo)
- **Local State** - Component-level state management
- **Async Storage** - Persistent local storage

### **Database Schema**
```
┌─────────────┐
│   Users     │ (Supabase Auth)
│  (auth)     │
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────┐      1:N      ┌─────────────┐
│  Profiles   │◄───────────────┤    Posts    │
│             │                │             │
└──────┬──────┘                └──────┬──────┘
       │                              │
       │ N:M                          │ 1:N
       ▼                              ▼
┌─────────────┐                ┌─────────────┐
│  Followers  │                │    Likes    │
└─────────────┘                └─────────────┘
       
       N:M
┌─────────────────────┐
│   Conversations     │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│      Messages       │
└─────────────────────┘
```

### **Security Features**
- **Row Level Security (RLS)** - Database-level access control
- **Authentication Tokens** - Secure session management
- **Input Validation** - Client and server-side validation
- **Secure Image Storage** - Base64 encoding in database

## 📊 Key Features Implementation

### **1. Authentication System**
- User registration with email/password
- Secure login/logout
- Session persistence
- Automatic profile creation on signup

### **2. Feed System**
- Infinite scroll loading
- Random post ordering for discovery
- Pull-to-refresh functionality
- Image and video posts support
- Like and comment interactions

### **3. Reels/Video System**
- Vertical scrolling video player
- Auto-play on scroll
- Video trimming (for videos > 15 seconds)
- Instagram-style video editor UI
- Original aspect ratio display (no cropping)
- Background audio management

### **4. Profile System**
- Customizable bio (150 character limit)
- Profile picture upload (base64 storage)
- Post count display
- Followers/Following statistics
- Grid and list view for posts
- Edit profile functionality
- Delete posts with confirmation

### **5. Direct Messaging**
- One-on-one conversations
- Real-time message delivery
- Read/unread status
- Conversation list with last message preview

### **6. Social Interactions**
- Follow/Unfollow users
- Like posts
- View other user profiles
- Discover new content

## 🎨 Design System

### **Color Scheme**
- **Primary:** Black (`#000000`)
- **Background:** Dark theme with gradients
- **Accent:** Cyan/Blue for interactive elements
- **Text:** White for dark mode readability

### **Typography**
- System fonts (iOS: SF Pro, Android: Roboto)
- Clear hierarchy with different sizes
- Readable font weights

### **UI Components**
- Custom Button component
- Container component for consistent layouts
- Reusable card components
- Modal dialogs for confirmations

## 📱 Platform Support

- ✅ **Android** (Fully supported, tested)

## 🔐 Security & Privacy

- **Data Encryption:** All data transmitted over HTTPS
- **Authentication:** Secure token-based authentication
- **Row Level Security:** Database-level access control
- **Password Security:** Passwords hashed by Supabase Auth
- **Media Privacy:** Users can only delete their own posts

## 📈 Performance Optimizations

- **Image Compression:** Quality set to 0.8 for images, 0.2 for videos
- **Video Size Limit:** 10MB maximum
- **Video Duration Limit:** 15 seconds (with trimming option)
- **Lazy Loading:** Posts load in batches
- **Memory Management:** Videos stop playing when off-screen
- **Cache Management:** Expo cache for faster loading

## 🚀 Future Enhancements

Potential features for future versions:
- [ ] Hashtag system
- [ ] Search functionality

## 👥 Target Audience

- **Age Group:** 16-35 years
- **Interest:** Social networking, content sharing
- **Platform:** Mobile-first users (iOS and Android)

## 📄 License

This project is developed for educational purposes as part of Mobile Application Development coursework.

## 🤝 Contributing

This is an academic project. For suggestions or improvements, please contact the project maintainer.

## 📞 Support

For technical documentation:
- Setup Guide: `README-SETUP.md`
- Feature Documentation: `README-FEATURES.md`
- Database Schema: `database-setup.sql`

---

**Built with ❤️ using React Native and Expo**

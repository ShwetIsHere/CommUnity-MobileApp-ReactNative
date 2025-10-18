import React from 'react';
import { View, Text, StatusBar, Image } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#1E1B4B', '#0F172A', '#000000']}
        className="absolute top-0 left-0 right-0 bottom-0"
      />

      <View className="flex-1 justify-between px-6 py-16">
        {/* Logo and Title Section */}
        <View className="flex-1 items-center justify-center">
          <View className="mb-8">
            {/* App Logo */}
            <Image
              source={require('@/assets/logo.jpg')}
              style={{ width: 128, height: 128, borderRadius: 40 }}
              resizeMode="cover"
            />
          </View>

          {/* App Name */}
          <Text className="text-white text-5xl font-bold mb-4">CommUnity</Text>
          
          {/* Tagline */}
          <Text className="text-gray-400 text-lg text-center px-8">
            Connect, Share, and Chat{'\n'}All in one place
          </Text>

          {/* Features */}
          <View className="mt-12 space-y-4">
            <View className="flex-row items-center px-6">
              <View className="bg-cyan-500/20 p-3 rounded-full mr-4">
                <Ionicons name="images-outline" size={24} color="#06B6D4" />
              </View>
              <Text className="text-gray-300 text-base">Share posts and reels</Text>
            </View>

            <View className="flex-row items-center px-6 mt-4">
              <View className="bg-blue-500/20 p-3 rounded-full mr-4">
                <Ionicons name="chatbubbles-outline" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-300 text-base">Real-time messaging</Text>
            </View>

            <View className="flex-row items-center px-6 mt-4">
              <View className="bg-purple-500/20 p-3 rounded-full mr-4">
                <Ionicons name="people-outline" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-300 text-base">Build your community</Text>
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View className="space-y-4">
          <GradientButton
            title="Create Account"
            onPress={() => router.push('/(auth)/register')}
          />
          
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-400 text-base">Already have an account? </Text>
            <Text
              onPress={() => router.push('/(auth)/login')}
              className="text-cyan-400 text-base font-semibold">
              Sign In
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const params = useLocalSearchParams();
  const videoUri = params.videoUri as string;
  const caption = params.caption as string;
  const username = params.username as string;

  const [isPlaying, setIsPlaying] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Auto-play video when screen opens
    return () => {
      // Cleanup: stop and unload video when leaving screen
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (videoRef.current && videoLoaded) {
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-4 z-10 bg-black/50 rounded-full p-2"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
        }}
      >
        <Ionicons name="close" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Video Player */}
      <View className="flex-1 items-center justify-center">
        {videoError ? (
          // Error fallback
          <View className="items-center">
            <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-lg font-semibold">Video Error</Text>
            <Text className="text-gray-400 mt-2 text-sm">Unable to load this video</Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            onPress={handlePlayPause}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={isPlaying}
              isMuted={false}
              useNativeControls={false}
              onError={(error) => {
                console.error('Video error:', error);
                setVideoError(true);
              }}
              onLoad={() => {
                console.log('✅ Video loaded');
                setVideoLoaded(true);
              }}
            />

            {/* Loading Indicator */}
            {!videoLoaded && !videoError && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                }}
              >
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text className="text-gray-400 mt-4">Loading video...</Text>
              </View>
            )}

            {/* Play/Pause Overlay */}
            {!isPlaying && videoLoaded && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.9)',
                    borderRadius: 50,
                    padding: 24,
                  }}
                >
                  <Ionicons name="play" size={48} color="#fff" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Info - Gradient Overlay */}
      {caption && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingBottom: 40,
            paddingTop: 80,
          }}
          className="bg-gradient-to-t from-black via-black/70 to-transparent"
        >
          {/* Username */}
          {username && (
            <Text
              className="text-white text-lg font-bold mb-2"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.9)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              @{username}
            </Text>
          )}

          {/* Caption */}
          <Text
            className="text-white text-base leading-5"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.9)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {caption}
          </Text>
        </View>
      )}
    </View>
  );
}

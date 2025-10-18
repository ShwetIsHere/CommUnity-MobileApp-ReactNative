import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TIMELINE_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
const FRAME_WIDTH = 60; // Width of each video frame thumbnail

export default function VideoEditorScreen() {
  const params = useLocalSearchParams();
  const videoUri = params.videoUri as string;
  const videoDuration = parseInt(params.videoDuration as string) || 0; // in milliseconds
  const videoSize = parseInt(params.videoSize as string) || 0; // in bytes

  const [startTime, setStartTime] = useState(0); // in seconds
  const [endTime, setEndTime] = useState(Math.min(15, videoDuration / 1000)); // in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const videoRef = useRef<Video>(null);

  const maxDuration = videoDuration / 1000; // Convert to seconds
  const selectedDuration = endTime - startTime;

  useEffect(() => {
    // Set initial end time to 15 seconds or video duration (whichever is smaller)
    const initialEnd = Math.min(15, maxDuration);
    setEndTime(initialEnd);
  }, [maxDuration]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // Set position to start time and play
        await videoRef.current.setPositionAsync(startTime * 1000);
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handlePlaybackUpdate = (status: any) => {
    if (status.isLoaded) {
      const position = status.positionMillis / 1000; // Convert to seconds
      setCurrentPosition(position);

      // If playback reaches end time, loop back to start
      if (position >= endTime && isPlaying) {
        videoRef.current?.setPositionAsync(startTime * 1000);
      }
    }
  };

  const handleContinue = () => {
    if (selectedDuration > 15) {
      Alert.alert('Too Long', 'Please select maximum 15 seconds');
      return;
    }

    if (selectedDuration < 1) {
      Alert.alert('Too Short', 'Please select at least 1 second');
      return;
    }

    // Navigate to create-post with trim times
    router.replace({
      pathname: '/create-post',
      params: {
        mediaUri: videoUri,
        mediaType: 'video',
        trimStart: startTime.toString(),
        trimEnd: endTime.toString(),
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate positions for trim handles based on timeline
  const startPosition = (startTime / maxDuration) * TIMELINE_WIDTH;
  const endPosition = (endTime / maxDuration) * TIMELINE_WIDTH;
  const selectedWidth = endPosition - startPosition;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-4 px-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Trim Video</Text>
        <TouchableOpacity 
          onPress={handleContinue}
          disabled={selectedDuration > 15}
        >
          <Text className={`text-base font-semibold ${selectedDuration > 15 ? 'text-gray-600' : 'text-cyan-500'}`}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Preview - Full Screen */}
      <View className="flex-1 bg-black items-center justify-center">
        {videoUri ? (
          <TouchableOpacity 
            activeOpacity={1}
            onPress={handlePlayPause}
            className="w-full h-full"
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              isMuted={false}
              onPlaybackStatusUpdate={handlePlaybackUpdate}
            />
            
            {/* Play/Pause Overlay */}
            {!isPlaying && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.9)',
                  borderRadius: 50,
                  padding: 20
                }}>
                  <Ionicons name="play" size={40} color="#fff" />
                </View>
              </View>
            )}

            {/* Duration Display Overlay */}
            <View style={{
              position: 'absolute',
              top: 20,
              left: 20,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6
            }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                {formatTime(selectedDuration)} / 15s
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator size="large" color="#06B6D4" />
        )}
      </View>

      {/* Bottom Timeline Section */}
      <View className="bg-gray-950 pb-8" style={{ paddingBottom: 40 }}>
        {/* Video Info */}
        <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 text-xs">Selected</Text>
            <Text className={`text-base font-bold ${selectedDuration > 15 ? 'text-red-500' : 'text-cyan-500'}`}>
              {formatTime(selectedDuration)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-400 text-xs">Original Duration</Text>
            <Text className="text-white text-sm font-semibold">{formatTime(maxDuration)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-400 text-xs">Size</Text>
            <Text className="text-white text-sm font-semibold">
              {(videoSize / (1024 * 1024)).toFixed(1)}MB
            </Text>
          </View>
        </View>

        {/* Timeline with Trim Handles */}
        <View className="px-6">
          {/* Timeline Container */}
          <View className="relative" style={{ height: 80 }}>
            {/* Video Timeline Background (simulated frames) */}
            <View 
              className="absolute flex-row overflow-hidden rounded-lg"
              style={{
                width: TIMELINE_WIDTH,
                height: 60,
                backgroundColor: '#1F2937',
              }}
            >
              {/* Simulate video frames */}
              {Array.from({ length: Math.ceil(maxDuration) }).map((_, i) => (
                <View 
                  key={i}
                  style={{
                    width: TIMELINE_WIDTH / Math.ceil(maxDuration),
                    height: 60,
                    backgroundColor: i % 2 === 0 ? '#374151' : '#1F2937',
                    borderRightWidth: 1,
                    borderRightColor: '#111827',
                  }}
                />
              ))}
            </View>

            {/* Dimmed overlay for non-selected parts */}
            {/* Left dimmed area */}
            {startPosition > 0 && (
              <View
                className="absolute"
                style={{
                  left: 0,
                  width: startPosition,
                  height: 60,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
              />
            )}
            
            {/* Right dimmed area */}
            {endPosition < TIMELINE_WIDTH && (
              <View
                className="absolute"
                style={{
                  left: endPosition,
                  width: TIMELINE_WIDTH - endPosition,
                  height: 60,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
              />
            )}

            {/* Selected Range Highlight */}
            <View
              className="absolute border-2 border-cyan-500 rounded"
              style={{
                left: startPosition,
                width: selectedWidth,
                height: 60,
              }}
            >
              {/* Top border highlight */}
              <View className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
              {/* Bottom border highlight */}
              <View className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />
            </View>

            {/* Start Time Handle */}
            <View
              className="absolute items-center"
              style={{
                left: startPosition - 15,
                top: -10,
                width: 30,
              }}
            >
              <View className="bg-cyan-500 rounded-full w-8 h-8 items-center justify-center mb-1">
                <Ionicons name="chevron-back" size={16} color="#fff" />
              </View>
              <Text className="text-cyan-500 text-xs font-bold">{formatTime(startTime)}</Text>
            </View>

            {/* End Time Handle */}
            <View
              className="absolute items-center"
              style={{
                left: endPosition - 15,
                top: -10,
                width: 30,
              }}
            >
              <View className="bg-cyan-500 rounded-full w-8 h-8 items-center justify-center mb-1">
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
              <Text className="text-cyan-500 text-xs font-bold">{formatTime(endTime)}</Text>
            </View>
          </View>

          {/* Adjustment Buttons */}
          <View className="mt-6 flex-row justify-center gap-3">
            <TouchableOpacity
              onPress={() => setStartTime(Math.max(0, startTime - 1))}
              className="bg-gray-800 rounded-lg px-4 py-2"
            >
              <Text className="text-white text-sm">-1s Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStartTime(Math.min(endTime - 1, startTime + 1))}
              className="bg-gray-800 rounded-lg px-4 py-2"
            >
              <Text className="text-white text-sm">+1s Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEndTime(Math.max(startTime + 1, endTime - 1))}
              className="bg-gray-800 rounded-lg px-4 py-2"
            >
              <Text className="text-white text-sm">-1s End</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEndTime(Math.min(maxDuration, endTime + 1))}
              className="bg-gray-800 rounded-lg px-4 py-2"
            >
              <Text className="text-white text-sm">+1s End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning */}
        {selectedDuration > 15 && (
          <View className="mx-6 mt-4 bg-red-900/20 border border-red-800 rounded-lg p-3">
            <Text className="text-red-400 text-sm text-center">
              ⚠️ Please select maximum 15 seconds
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

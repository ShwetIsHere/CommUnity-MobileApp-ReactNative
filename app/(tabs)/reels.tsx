import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '@/utils/supabase';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReelsScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchReels();
  }, []);

  // Refresh reels when screen comes into focus and handle cleanup when leaving
  useFocusEffect(
    useCallback(() => {
      console.log('Reels screen focused - refreshing...');
      setIsScreenFocused(true);
      fetchReels();

      // Cleanup when screen loses focus
      return () => {
        console.log('🛑 Reels screen unfocused - stopping all videos');
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchReels = async () => {
    try {
      setLoading(true);

      // Fetch only video posts
      const { data: reelsData, error: reelsError } = await supabase
        .from('posts')
        .select('*')
        .eq('media_type', 'video')
        .not('video_url', 'is', null);

      if (reelsError) {
        console.error('Error fetching reels:', reelsError);
        setReels([]);
        return;
      }

      if (!reelsData || reelsData.length === 0) {
        console.log('No reels found');
        setReels([]);
        return;
      }

      // Shuffle reels for random order every time
      const shuffledReels = [...reelsData].sort(() => Math.random() - 0.5);

      // Fetch profiles for all users
      const userIds = [...new Set(shuffledReels.map(reel => reel.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      // Get current user's likes
      const { data: { user } } = await supabase.auth.getUser();
      let userLikes: string[] = [];

      if (user) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);

        userLikes = likesData?.map(like => like.post_id) || [];
      }

      // Merge data
      const reelsWithData = shuffledReels.map(reel => {
        const profile = profilesData?.find(p => p.id === reel.user_id);
        return {
          ...reel,
          profiles: profile || null,
          isLikedByCurrentUser: userLikes.includes(reel.id),
        };
      });

      console.log(`Fetched ${reelsWithData.length} reels`);
      setReels(reelsWithData);
    } catch (error) {
      console.error('Error in fetchReels:', error);
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-gray-400 mt-4">Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="videocam-outline" size={64} color="#6B7280" />
        <Text className="text-gray-400 mt-4 text-lg">No Reels Yet</Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
          Be the first to share a video!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === currentIndex && isScreenFocused}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

// Reel Item Component
function ReelItem({ reel, isActive }: { reel: any; isActive: boolean }) {
  const [liked, setLiked] = useState(reel.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if video should be loaded
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setLiked(reel.isLikedByCurrentUser || false);
    setLikesCount(reel.likes_count || 0);
  }, [reel.isLikedByCurrentUser, reel.likes_count]);

  // Load video when it becomes active
  useEffect(() => {
    if (isActive) {
      console.log(`📥 Loading reel video: ${reel.id}`);
      setVideoLoaded(true);
      setIsPlaying(true); // Auto-play when becomes active
    } else {
      // When video goes off-screen, unload it
      console.log(`📤 Video off-screen, unloading: ${reel.id}`);
      unloadVideo();
    }
  }, [isActive, reel.id]);

  // Function to unload video from memory
  const unloadVideo = async () => {
    console.log(`�️ Unloading video from memory: ${reel.id}`);
    
    setIsPlaying(false);
    
    // Cleanup video resources
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
        console.log('✅ Video unloaded from memory:', reel.id);
      } catch (err) {
        console.log('Cleanup error (can be ignored):', err);
      }
    }
    
    // Remove Video component from DOM
    setVideoLoaded(false);
  };

  // Handle video playback status updates
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Check if video has finished playing
      if (status.didJustFinish && !status.isLooping) {
        console.log('🎬 Video finished playing:', reel.id);
        // Unload video from memory when it finishes
        unloadVideo();
      }
    }
  };

  // Handle tap to play/pause or reload
  const handleVideoPress = async () => {
    if (!videoLoaded) {
      // If video is unloaded, load it again
      console.log('🔄 Reloading video:', reel.id);
      setVideoLoaded(true);
      setIsPlaying(true);
    } else if (videoRef.current) {
      // If video is loaded, toggle play/pause
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
          console.log('⏸️ Reel paused by user tap');
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
          console.log('▶️ Reel played by user tap');
        }
      } catch (error) {
        console.error('Error toggling reel playback:', error);
      }
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to like reels');
        return;
      }

      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount((prev: number) => newLiked ? prev + 1 : Math.max(0, prev - 1));

      if (newLiked) {
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: reel.id,
          });

        if (error) {
          console.error('Error adding like:', error);
          setLiked(false);
          setLikesCount((prev: number) => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', reel.id);

        if (error) {
          console.error('Error removing like:', error);
          setLiked(true);
          setLikesCount((prev: number) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
    }
  };

  const username = reel.profiles?.username || reel.profiles?.full_name || 'User';

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      {/* Video Background or Loading Placeholder */}
      {videoError ? (
        // Error fallback
        <View style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: '#1F2937',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={{ color: '#ef4444', marginTop: 16, fontSize: 18, fontWeight: '600' }}>
            Video Error
          </Text>
          <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>
            Unable to load this reel
          </Text>
        </View>
      ) : !videoLoaded ? (
        // Video not loaded - show tap to play button
        <TouchableOpacity 
          onPress={handleVideoPress}
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            backgroundColor: '#111827',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View style={{
            backgroundColor: 'rgba(6, 182, 212, 0.9)',
            borderRadius: 60,
            padding: 30,
            marginBottom: 20
          }}>
            <Ionicons name="play" size={60} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
            Tap to Play
          </Text>
          <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>
            Video unloaded to save memory
          </Text>
        </TouchableOpacity>
      ) : (
        // Video is loaded - only render Video component when videoLoaded is true
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleVideoPress}
          style={{ 
            width: SCREEN_WIDTH, 
            height: SCREEN_HEIGHT,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Video
            key={`video-${reel.id}-${videoLoaded}`} // Force remount when videoLoaded changes
            ref={videoRef}
            source={{ uri: reel.video_url }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
            }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false} // Disable looping so video finishes
            shouldPlay={isPlaying}
            isMuted={false}
            useNativeControls={false}
            onError={(error) => {
              console.error('Reel video error:', error);
              setVideoError(true);
            }}
            onLoad={() => {
              console.log('✅ Reel video loaded:', reel.id);
              setVideoError(false);
            }}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
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
              backgroundColor: 'rgba(0,0,0,0.3)'
            }}>
              <View style={{
                backgroundColor: 'rgba(6, 182, 212, 0.9)',
                borderRadius: 50,
                padding: 24
              }}>
                <Ionicons name="play" size={48} color="#fff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Gradient Overlay at Bottom */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 250,
        }}
        className="bg-gradient-to-t from-black via-black/50 to-transparent"
      />

      {/* Right Side Actions */}
      <View className="absolute right-4 bottom-32 items-center gap-6">
        {/* Like Button */}
        <View className="items-center">
          <TouchableOpacity
            onPress={handleLike}
            className="items-center justify-center w-14 h-14"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 3,
            }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={40}
              color={liked ? '#ef4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
          <Text 
            className="text-white text-sm font-bold mt-1"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>
            {likesCount > 0 ? formatCount(likesCount) : '0'}
          </Text>
        </View>
      </View>

      {/* Bottom Info */}
      <View className="absolute bottom-20 left-4 right-20 px-2">
        {/* Username */}
        <View className="flex-row items-center mb-3">
          <Text 
            className="text-white text-lg font-bold"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.9)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
            @{username}
          </Text>
        </View>

        {/* Caption */}
        {reel.caption && (
          <Text 
            className="text-white text-base leading-5"
            numberOfLines={3}
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.9)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
            {reel.caption}
          </Text>
        )}
      </View>
    </View>
  );
}

// Helper function to format counts
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { supabase } from '@/utils/supabase';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 3;
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    fetchPosts(true); // Initial load
  }, []);

  // Refresh posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Feed screen focused - refreshing posts...');
      fetchPosts(true); // Reset and reload
    }, [])
  );

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
        setPosts([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const from = currentPage * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      console.log(`📥 Loading posts ${from}-${to}...`);
      
      // Fetch all posts first to shuffle them
      const { data: allPostsData, error: postsError, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      if (!allPostsData || allPostsData.length === 0) {
        console.log('No posts available');
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      // Shuffle posts for random order
      const shuffledPosts = [...allPostsData].sort(() => Math.random() - 0.5);
      
      // Get paginated slice from shuffled posts
      const postsData = shuffledPosts.slice(from, to + 1);

      if (postsData.length === 0) {
        console.log('No more posts to load');
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      console.log(`✅ Loaded ${postsData.length} posts. Total: ${count}`);

      // Check if there are more posts
      setHasMore((from + postsData.length) < (count || 0));

      // Fetch profiles for all users
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get current user to check which posts they liked
      const { data: { user } } = await supabase.auth.getUser();
      let userLikes: string[] = [];
      
      if (user) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(like => like.post_id) || [];
      }

      // Merge posts with profile data and like status
      const postsWithProfiles = postsData.map(post => {
        const profile = profilesData?.find(p => p.id === post.user_id);
        return {
          ...post,
          profiles: profile || null,
          isLikedByCurrentUser: userLikes.includes(post.id),
        };
      });

      console.log(`✅ Fetched ${postsWithProfiles.length} posts`);

      if (reset) {
        setPosts(postsWithProfiles);
        setPage(1);
      } else {
        // Merge new posts with existing, removing duplicates
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUniquePosts = postsWithProfiles.filter(p => !existingIds.has(p.id));
          return [...prev, ...newUniquePosts];
        });
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      if (reset) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(true); // Reset and reload
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore && !loading) {
      console.log('📥 Loading more posts...');
      fetchPosts(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    setScrollY(contentOffset.y);

    // Check if scrolled to bottom (100px threshold)
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    
    if (isCloseToBottom) {
      loadMorePosts();
    }
  };

  const openCamera = async () => {
    try {
      // Show main options: Camera or Gallery
      Alert.alert(
        'Create Post',
        'Choose source',
        [
          {
            text: 'Camera',
            onPress: () => showCameraOptions(),
          },
          {
            text: 'Gallery',
            onPress: () => showGalleryOptions(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const showCameraOptions = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos and videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show options for photo or video
      Alert.alert(
        'Camera',
        'Choose media type',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                router.push({
                  pathname: '/create-post',
                  params: {
                    mediaUri: result.assets[0].uri,
                    mediaType: 'image',
                  },
                });
              }
            },
          },
          {
            text: 'Record Video',
            onPress: async () => {
              try {
                console.log('Opening camera for video recording...');
                
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['videos'],
                  allowsEditing: false,
                  videoMaxDuration: 15, // 15 seconds max (reduced from 25)
                  quality: 0.2, // Very low quality to ensure small file size
                });

                console.log('Camera result:', result);

                if (!result.canceled && result.assets && result.assets.length > 0) {
                  const video = result.assets[0];
                  const videoDuration = video.duration || 0;
                  const videoSize = video.fileSize || 0;
                  
                  console.log('Video metadata:', {
                    duration: videoDuration,
                    fileSize: videoSize,
                    uri: video.uri
                  });
                  
                  // STRICT file size limit (max 10MB to prevent memory crashes)
                  if (videoSize > 10 * 1024 * 1024) {
                    console.warn('Video size exceeds 10MB:', videoSize);
                    Alert.alert(
                      'Video Too Large ⚠️', 
                      'Maximum video size is 10MB. Your video is ' + 
                      Math.round(videoSize / (1024 * 1024)) + 'MB.\n\n' +
                      'Please record a shorter video (max 15 seconds) or use lower quality.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  // Check duration - if > 15 seconds, open video editor
                  if (videoDuration > 15000) {
                    console.log('Video exceeds 15s, opening editor...');
                    router.push({
                      pathname: '/video-editor',
                      params: {
                        videoUri: video.uri,
                        videoDuration: videoDuration.toString(),
                        videoSize: videoSize.toString(),
                      },
                    });
                    return;
                  }

                  console.log('Navigating to create-post with video...');
                  router.push({
                    pathname: '/create-post',
                    params: {
                      mediaUri: video.uri,
                      mediaType: 'video',
                    },
                  });
                } else {
                  console.log('Video recording canceled');
                }
              } catch (error) {
                console.error('Video recording error:', error);
                Alert.alert(
                  'Recording Failed', 
                  'Failed to record video. Please try again.'
                );
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const showGalleryOptions = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery permission is required to choose photos and videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show options for photo or video
      Alert.alert(
        'Gallery',
        'Choose media type',
        [
          {
            text: 'Choose Photo',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                router.push({
                  pathname: '/create-post',
                  params: {
                    mediaUri: result.assets[0].uri,
                    mediaType: 'image',
                  },
                });
              }
            },
          },
          {
            text: 'Choose Video',
            onPress: async () => {
              try {
                console.log('Opening video picker...');
                
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['videos'],
                  allowsEditing: false,
                  quality: 0.2, // Very low quality to ensure small file size
                  videoMaxDuration: 15, // Limit to 15 seconds (reduced from 25)
                });

                console.log('Video picker result:', result);

                if (result.canceled) {
                  console.log('Video selection cancelled');
                  return;
                }

                if (!result.assets || result.assets.length === 0) {
                  console.log('No video selected');
                  return;
                }

                const video = result.assets[0];
                console.log('Video selected:', {
                  uri: video.uri,
                  duration: video.duration,
                  width: video.width,
                  height: video.height,
                  fileSize: video.fileSize,
                });

                const videoDuration = video.duration || 0;
                const videoSize = video.fileSize || 0;
                
                console.log('Checking video size:', videoSize, 'bytes =', Math.round(videoSize / (1024 * 1024)), 'MB');
                
                // STRICT file size limit (max 10MB to prevent memory crashes)
                const maxSize = 10 * 1024 * 1024; // 10MB max - lowered from 30MB
                if (videoSize > maxSize) {
                  console.warn('Video rejected - too large:', videoSize, 'bytes');
                  Alert.alert(
                    'Video Too Large ⚠️', 
                    'Maximum video size is 10MB. Your video is ' + 
                    Math.round(videoSize / (1024 * 1024)) + 'MB.\n\n' +
                    'Please:\n' +
                    '• Record a shorter video (max 15 seconds)\n' +
                    '• Use lower resolution (720p instead of 1080p)\n' +
                    '• Compress the video using a video compression app',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                
                // Check if video is longer than 15 seconds - open editor
                if (videoDuration > 15000) { // 15000ms = 15 seconds
                  console.log('Video exceeds 15s, opening editor...');
                  router.push({
                    pathname: '/video-editor',
                    params: {
                      videoUri: video.uri,
                      videoDuration: videoDuration.toString(),
                      videoSize: videoSize.toString(),
                    },
                  });
                  return;
                }

                console.log('Navigating to create-post with video');
                router.push({
                  pathname: '/create-post',
                  params: {
                    mediaUri: video.uri,
                    mediaType: 'video',
                  },
                });
              } catch (error) {
                console.error('Error selecting video:', error);
                Alert.alert(
                  'Error', 
                  'Failed to select video. Please try again or choose a smaller video.'
                );
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-2 px-4 border-b border-gray-900">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require('@/assets/logo.jpg')}
              style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8 }}
              resizeMode="cover"
            />
            <Text className="text-white text-3xl font-bold">CommUnity</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={openCamera}>
              <Ionicons name="camera-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#06B6D4"
            colors={['#06B6D4']}
          />
        }>
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text className="text-gray-400 mt-4">Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="images-outline" size={64} color="#6B7280" />
            <Text className="text-gray-400 mt-4 text-center px-8">
              No posts yet. Be the first to share!
            </Text>
          </View>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} scrollY={scrollY} />
            ))}
            
            {/* Loading More Indicator */}
            {loadingMore && (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text className="text-gray-400 mt-2">Loading more posts...</Text>
              </View>
            )}
            
            {/* No More Posts Message */}
            {!hasMore && posts.length > 0 && (
              <View className="py-8 items-center">
                <Text className="text-gray-500">You've reached the end! 🎉</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Post Card Component
function PostCard({ post, scrollY }: { post: any; scrollY: number }) {
  const [liked, setLiked] = useState(post.isLikedByCurrentUser || false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [videoError, setVideoError] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if user wants to load video
  const [isPlaying, setIsPlaying] = useState(false); // Track play/pause state
  const videoRef = useRef<Video>(null);
  const [isVideoInView, setIsVideoInView] = useState(false);
  const [videoLayout, setVideoLayout] = useState({ y: 0, height: 0 });

  useEffect(() => {
    // Initialize likes count from database
    setLikesCount(post.likes_count || 0);
    setLiked(post.isLikedByCurrentUser || false);
  }, [post.likes_count, post.isLikedByCurrentUser]);

  // Get image dimensions for proper aspect ratio
  useEffect(() => {
    if (post.media_type === 'image' && post.image_url) {
      Image.getSize(
        post.image_url,
        (width, height) => {
          setImageAspectRatio(width / height);
        },
        (error) => {
          console.error('Error getting image size:', error);
          setImageAspectRatio(4 / 5); // Default to 4:5 aspect ratio
        }
      );
    }
  }, [post.image_url, post.media_type]);

  // Function to unload video from memory
  const unloadVideo = async () => {
    console.log(`🗑️ Unloading video from memory for post: ${post.id}`);
    
    setIsPlaying(false);
    
    // Cleanup video resources
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
        console.log('✅ Video unloaded from memory:', post.id);
      } catch (err) {
        console.log('Cleanup error (can be ignored):', err);
      }
    }
    
    // Remove Video component from DOM
    setVideoLoaded(false);
  };

  // Check if video is in viewport based on scroll position
  useEffect(() => {
    if (post.media_type === 'video' && videoLayout.y > 0) {
      const screenHeight = 800; // Approximate screen height
      const videoTop = videoLayout.y - scrollY;
      const videoBottom = videoTop + videoLayout.height;

      // Video is visible if it's between -100 and screenHeight + 100 (with buffer)
      const isVisible = videoTop < screenHeight && videoBottom > 0;
      
      if (isVisible !== isVideoInView) {
        setIsVideoInView(isVisible);
        
        // UNLOAD video from memory when it leaves screen
        if (!isVisible && videoLoaded) {
          console.log(`📤 Video scrolled out of view for post ${post.id}`);
          unloadVideo();
        }
      }
    }
  }, [scrollY, videoLayout, post.media_type, post.id, videoLoaded]);

  // Handle video playback status updates
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Check if video has finished playing
      if (status.didJustFinish && !status.isLooping) {
        console.log('🎬 Video finished playing for post:', post.id);
        // Unload video from memory when it finishes
        unloadVideo();
      }
    }
  };

  // Handle tap on video to play/pause or reload
  const handleVideoPress = async () => {
    if (!videoLoaded) {
      // If video is unloaded, load it again
      console.log('🔄 Loading video for post:', post.id);
      setVideoLoaded(true);
      setIsPlaying(true);
    } else if (videoRef.current) {
      // If video is loaded, toggle play/pause
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
          console.log('⏸️ Video paused by user tap');
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
          console.log('▶️ Video played by user tap');
        }
      } catch (error) {
        console.error('Error toggling video playback:', error);
      }
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now.getTime() - postTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }

      const newLiked = !liked;
      
      console.log(`Attempting to ${newLiked ? 'like' : 'unlike'} post ${post.id}`);
      console.log('Current user:', user.id);
      console.log('Current likes_count:', likesCount);
      
      // Optimistic UI update
      setLiked(newLiked);
      setLikesCount((prev: number) => newLiked ? prev + 1 : Math.max(0, prev - 1));

      if (newLiked) {
        // Add like to database
        const { data, error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: post.id,
          })
          .select();

        if (error) {
          console.error('Error adding like:', error);
          // Revert on error
          setLiked(false);
          setLikesCount((prev: number) => Math.max(0, prev - 1));
          Alert.alert('Error', `Failed to like post: ${error.message}`);
        } else {
          console.log('Like added successfully:', data);
          
          // Verify the like was added
          const { data: verifyData, error: verifyError } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id);
          
          console.log('Total likes for this post:', verifyData?.length || 0);
          
          // Also check the posts table
          const { data: postData } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', post.id)
            .single();
          
          console.log('Posts table likes_count:', postData?.likes_count);
        }
      } else {
        // Remove like from database
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) {
          console.error('Error removing like:', error);
          // Revert on error
          setLiked(true);
          setLikesCount((prev: number) => prev + 1);
          Alert.alert('Error', `Failed to unlike post: ${error.message}`);
        } else {
          console.log('Like removed successfully');
        }
      }
    } catch (error: any) {
      console.error('Error in handleLike:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const username = post.profiles?.username || post.profiles?.full_name || 'User';
  const avatar = post.profiles?.avatar_url || 'https://via.placeholder.com/150';
  const mediaUrl = post.image_url || post.video_url;

  // Debug logging
  useEffect(() => {
    console.log(`Post ${post.id}:`, {
      media_type: post.media_type,
      image_url: post.image_url,
      video_url: post.video_url,
      mediaUrl,
    });
  }, []);

  const handleVideoLayout = (event: any) => {
    const { y, height } = event.nativeEvent.layout;
    setVideoLayout({ y, height });
  };

  return (
    <View className="mb-4">
      {/* Post Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="flex-row items-center"
          onPress={() => {
            router.push({
              pathname: '/user-profile',
              params: {
                userId: post.user_id,
                username: username,
              },
            });
          }}
        >
          <Image
            source={{ uri: avatar }}
            className="w-10 h-10 rounded-full"
            resizeMode="cover"
          />
          <Text className="text-white font-semibold ml-3">{username}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Post Media */}
      {post.media_type === 'video' ? (
        <View onLayout={handleVideoLayout} className="bg-gray-900">
          {videoError ? (
            // Show error fallback
            <View className="w-full h-96 bg-gray-800 items-center justify-center">
              <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
              <Text className="text-red-400 mt-2 font-semibold">Video format not supported</Text>
              <Text className="text-gray-500 text-sm mt-1">Unable to play this video</Text>
            </View>
          ) : !videoLoaded ? (
            // Video not loaded - show tap to play button
            <TouchableOpacity 
              onPress={handleVideoPress}
              className="w-full h-96 bg-gray-800 items-center justify-center"
            >
              <View className="bg-cyan-500 rounded-full p-8 mb-4">
                <Ionicons name="play" size={56} color="#fff" />
              </View>
              <Text className="text-white text-xl font-bold">Tap to Play</Text>
              <Text className="text-gray-400 text-sm mt-2">Video unloaded to save memory</Text>
            </TouchableOpacity>
          ) : mediaUrl ? (
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={handleVideoPress}
              style={{ position: 'relative' }}
            >
              <Video
                key={`feed-video-${post.id}-${videoLoaded}`} // Force remount when videoLoaded changes
                ref={videoRef}
                source={{ uri: mediaUrl }}
                style={{ width: '100%', height: 384 }}
                resizeMode={ResizeMode.COVER}
                isLooping={false} // Disable looping so video finishes and unloads
                shouldPlay={isPlaying}
                isMuted={false}
                useNativeControls={false}
                onError={(error) => {
                  console.error('Video decoder error for post', post.id, ':', error);
                  setVideoError(true);
                  setVideoLoaded(false); // Unload on error
                }}
                onLoad={() => {
                  console.log('✅ Video loaded for post', post.id);
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
                    padding: 20
                  }}>
                    <Ionicons name="play" size={40} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-full h-96 bg-gray-800 items-center justify-center">
              <Ionicons name="videocam-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-2">Video unavailable</Text>
            </View>
          )}
        </View>
      ) : mediaUrl ? (
        <Image 
          source={{ uri: mediaUrl }} 
          className="w-full bg-black" 
          style={{ aspectRatio: imageAspectRatio }} 
          resizeMode="contain" 
        />
      ) : (
        <View className="w-full h-96 bg-gray-800 items-center justify-center">
          <Ionicons name="image-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 mt-2">Image unavailable</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="px-4 py-3">
        <TouchableOpacity onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={28}
            color={liked ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      <Text className="text-white font-semibold px-4 mb-1">
        {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
      </Text>

      {/* Caption with hashtags */}
      {post.caption && (
        <View className="px-4 mb-1">
          <Text className="text-white">
            <Text className="font-semibold">{username}</Text>{' '}
            <Text className="text-gray-300">{post.caption}</Text>
          </Text>
        </View>
      )}

      {/* Time */}
      <Text className="text-gray-500 text-xs px-4 mb-3">
        {getTimeAgo(post.created_at)}
      </Text>
    </View>
  );
}

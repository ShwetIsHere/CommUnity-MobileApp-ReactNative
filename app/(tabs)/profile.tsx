import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StatusBar, Alert } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3; // 3 columns with 2px gaps

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'grid' | 'reels' | 'tagged'>('grid');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
  }, []);

  // Refresh posts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused - refreshing posts...');
      fetchUserPosts();
      fetchUserData(); // Also refresh user data (posts_count)
    }, [])
  );

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, avatar_url, followers_count, following_count')
        .eq('id', user.id)
        .single();

      // Count actual posts from posts table
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get username from auth metadata or email
      const username = user.user_metadata?.username || 
                      user.user_metadata?.full_name || 
                      user.email?.split('@')[0] || 
                      'user';
      
      const fullName = user.user_metadata?.full_name || username;

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user metadata if profile not found
        setUserData({
          username: username,
          fullName: fullName,
          bio: 'No bio yet',
          avatar: 'https://via.placeholder.com/150',
          postsCount: postsCount || 0,
          followersCount: 0,
          followingCount: 0,
        });
      } else {
        setUserData({
          username: username,
          fullName: fullName,
          bio: profile.bio || 'No bio yet',
          avatar: profile.avatar_url || 'https://via.placeholder.com/150',
          postsCount: postsCount || 0, // Use real count from posts table
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
        });
      }
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch user's posts ordered by newest first
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          setPosts([]);
        } else {
          console.log('Fetched posts:', postsData?.length || 0);
          setPosts(postsData || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserPosts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  const handleDeletePost = async (postId: string, postType: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the post from database
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

              if (error) {
                console.error('Error deleting post:', error);
                Alert.alert('Error', 'Failed to delete post');
                return;
              }

              // Refresh posts after deletion
              console.log('✅ Post deleted successfully');
              Alert.alert('Success', 'Post deleted successfully');
              fetchUserPosts();
              fetchUserData(); // Update post count
            } catch (error) {
              console.error('Error in handleDeletePost:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  if (!userData) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-12 pb-3 border-b border-gray-900">
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">{userData.username}</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View className="px-4 py-6">
        {/* Avatar and Stats */}
        <View className="flex-row items-center mb-4">
          {/* Avatar */}
          <Image
            source={{ uri: userData.avatar }}
            className="w-24 h-24 rounded-full border-2 border-gray-700"
          />
          
          {/* Stats */}
          <View className="flex-1 flex-row justify-around ml-4">
            <View className="items-center">
              <Text className="text-white text-lg font-bold">{userData.postsCount}</Text>
              <Text className="text-gray-400 text-sm">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-lg font-bold">{userData.followersCount}</Text>
              <Text className="text-gray-400 text-sm">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-lg font-bold">{userData.followingCount}</Text>
              <Text className="text-gray-400 text-sm">Following</Text>
            </View>
          </View>
        </View>

        {/* Name and Bio */}
        <View className="mb-4">
          <Text className="text-white font-semibold text-base">{userData.fullName}</Text>
          <Text className="text-gray-300 text-sm mt-1">{userData.bio}</Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            className="flex-1 bg-gray-800 py-2 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-gray-800 py-2 rounded-lg items-center">
            <Text className="text-white font-semibold">Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-800 py-2 px-3 rounded-lg items-center">
            <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-t border-gray-900">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${selectedTab === 'grid' ? 'border-t-2 border-white' : ''}`}
          onPress={() => setSelectedTab('grid')}>
          <Ionicons
            name="grid-outline"
            size={24}
            color={selectedTab === 'grid' ? '#FFFFFF' : '#6B7280'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${selectedTab === 'reels' ? 'border-t-2 border-white' : ''}`}
          onPress={() => setSelectedTab('reels')}>
          <Ionicons
            name="play-circle-outline"
            size={24}
            color={selectedTab === 'reels' ? '#FFFFFF' : '#6B7280'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${selectedTab === 'tagged' ? 'border-t-2 border-white' : ''}`}
          onPress={() => setSelectedTab('tagged')}>
          <Ionicons
            name="person-outline"
            size={24}
            color={selectedTab === 'tagged' ? '#FFFFFF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {/* Posts Grid */}
      {selectedTab === 'grid' && (
        <>
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400">Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="grid-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Posts Yet</Text>
              <Text className="text-gray-500 text-sm mt-2">Share your first photo or video</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onLongPress={() => {
                    // Show delete option on long press
                    Alert.alert(
                      'Post Options',
                      'What would you like to do with this post?',
                      [
                        {
                          text: 'Delete Post',
                          style: 'destructive',
                          onPress: () => handleDeletePost(post.id, post.media_type),
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                      ]
                    );
                  }}
                  onPress={() => {
                    if (post.media_type === 'video') {
                      // Open video player for videos
                      router.push({
                        pathname: '/video-player',
                        params: {
                          videoUri: post.video_url,
                          caption: post.caption || '',
                          username: userData.username,
                        },
                      });
                    }
                  }}
                >
                  <Image
                    source={{ uri: post.image_url || post.video_url }}
                    style={{ width: imageSize, height: imageSize }}
                    resizeMode="cover"
                  />
                  {post.media_type === 'video' && (
                    <View className="absolute top-2 right-2">
                      <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                  {/* Delete indicator overlay */}
                  <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedTab === 'reels' && (
        <>
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400">Loading videos...</Text>
            </View>
          ) : posts.filter(p => p.media_type === 'video').length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="play-circle-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Videos Yet</Text>
              <Text className="text-gray-500 text-sm mt-2">Share your first video</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.filter(p => p.media_type === 'video').map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onLongPress={() => {
                    // Show delete option on long press
                    Alert.alert(
                      'Post Options',
                      'What would you like to do with this post?',
                      [
                        {
                          text: 'Delete Post',
                          style: 'destructive',
                          onPress: () => handleDeletePost(post.id, post.media_type),
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                      ]
                    );
                  }}
                  onPress={() => {
                    // Open video player
                    router.push({
                      pathname: '/video-player',
                      params: {
                        videoUri: post.video_url,
                        caption: post.caption || '',
                        username: userData.username,
                      },
                    });
                  }}
                >
                  <Image
                    source={{ uri: post.video_url }}
                    style={{ width: imageSize, height: imageSize }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-2 right-2">
                    <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  </View>
                  {/* Delete indicator overlay */}
                  <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedTab === 'tagged' && (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="person-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 mt-4">No Tagged Posts</Text>
        </View>
      )}
    </ScrollView>
  );
}

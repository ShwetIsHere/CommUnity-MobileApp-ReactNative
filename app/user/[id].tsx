import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3; // 3 columns with 2px gaps

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'grid' | 'reels' | 'tagged'>('grid');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUserData();
      fetchUserPosts();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user to check follow status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Fetch user profile from profiles table with real-time counts
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, followers_count, following_count, posts_count')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      if (data) {
        setUserData({
          id: data.id,
          username: data.username || 'username',
          fullName: data.full_name || 'User',
          bio: data.bio || 'No bio yet',
          avatar: data.avatar_url || 'https://via.placeholder.com/150',
          postsCount: data.posts_count || 0,
          followersCount: data.followers_count || 0,
          followingCount: data.following_count || 0,
        });

        // Check if current user is following this user
        if (currentUser) {
          const { data: followData, error: followError } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single();

          if (!followError && followData) {
            setIsFollowing(true);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      
      // Fetch user's posts ordered by newest first
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        console.log(`Fetched ${postsData?.length || 0} posts for user ${id}`);
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error in fetchUserPosts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      // Get or create conversation between current user and this user
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: currentUser.id,
          user2_id: id
        });

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      // Navigate to chat screen
      router.push({
        pathname: '/chat/[id]',
        params: { 
          id: conversationId,
          userId: id,
          username: userData?.username || 'User',
          avatar: userData?.avatar || 'https://via.placeholder.com/150',
        }
      });
    } catch (error) {
      console.error('Message error:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      if (isFollowing) {
        // Unfollow: Delete from followers table
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }

        setIsFollowing(false);
        
        // Update local count immediately (trigger will update in DB)
        setUserData((prev: any) => ({
          ...prev,
          followersCount: Math.max((prev?.followersCount || 0) - 1, 0),
        }));
      } else {
        // Follow: Insert into followers table
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: id,
          });

        if (error) {
          console.error('Error following:', error);
          return;
        }

        setIsFollowing(true);
        
        // Update local count immediately (trigger will update in DB)
        setUserData((prev: any) => ({
          ...prev,
          followersCount: (prev?.followersCount || 0) + 1,
        }));
      }

      // Refresh data to get accurate counts from database
      setTimeout(() => {
        fetchUserData();
      }, 500);
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-white mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="person-circle-outline" size={80} color="#6B7280" />
        <Text className="text-gray-400 mt-4">User not found</Text>
        <TouchableOpacity onPress={handleBack} className="mt-4 bg-cyan-500 px-6 py-2 rounded-lg">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-12 pb-3 border-b border-gray-900">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">{userData.username}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={28} color="#FFFFFF" />
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
            className={`flex-1 py-2 rounded-lg items-center ${
              isFollowing ? 'bg-gray-800' : 'bg-cyan-500'
            }`}
            onPress={handleFollow}>
            <Text className="text-white font-semibold">
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-gray-800 py-2 rounded-lg items-center"
            onPress={handleMessage}>
            <Text className="text-white font-semibold">Message</Text>
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
          {postsLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="small" color="#06B6D4" />
              <Text className="text-gray-400 mt-2">Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="grid-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Posts Yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.map((post) => (
                <TouchableOpacity key={post.id}>
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedTab === 'reels' && (
        <>
          {postsLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="small" color="#06B6D4" />
              <Text className="text-gray-400 mt-2">Loading videos...</Text>
            </View>
          ) : posts.filter(p => p.media_type === 'video').length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="play-circle-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Videos Yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.filter(p => p.media_type === 'video').map((post) => (
                <TouchableOpacity key={post.id}>
                  <Image
                    source={{ uri: post.video_url }}
                    style={{ width: imageSize, height: imageSize }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-2 right-2">
                    <Ionicons name="play-circle" size={24} color="#FFFFFF" />
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

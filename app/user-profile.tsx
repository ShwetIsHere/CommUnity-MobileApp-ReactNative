import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3; // 3 columns with 2px gaps

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const username = params.username as string;

  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'grid' | 'reels' | 'tagged'>('grid');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    checkIfOwnProfile();
    fetchUserData();
    fetchUserPosts();
    checkFollowStatus();
  }, [userId]);

  const checkIfOwnProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      setIsOwnProfile(true);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (data) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.log('Not following or error checking:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to follow users');
        return;
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing:', error);
          Alert.alert('Error', 'Failed to unfollow user');
        } else {
          setIsFollowing(false);
          setUserData((prev: any) => ({
            ...prev,
            followersCount: Math.max(0, (prev.followersCount || 0) - 1),
          }));
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) {
          console.error('Error following:', error);
          Alert.alert('Error', 'Failed to follow user');
        } else {
          setIsFollowing(true);
          setUserData((prev: any) => ({
            ...prev,
            followersCount: (prev.followersCount || 0) + 1,
          }));
        }
      }
    } catch (error) {
      console.error('Error in handleFollowToggle:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      if (!userId) {
        Alert.alert('Error', 'User information is missing');
        return;
      }

      // Check if conversation already exists between these two users
      const { data: myConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      let conversationId = null;

      if (myConversations && myConversations.length > 0) {
        // Check if any of these conversations include the target user
        for (const conv of myConversations) {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id);

          const userIds = participants?.map(p => p.user_id) || [];
          
          if (userIds.includes(userId) && userIds.length === 2) {
            conversationId = conv.conversation_id;
            break;
          }
        }
      }

      if (conversationId) {
        // Navigate to existing conversation
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: conversationId,
            userId: userId,
            username: userData?.username || username || 'User',
            avatar: userData?.avatar || 'https://via.placeholder.com/150',
          },
        });
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          Alert.alert('Error', 'Failed to create conversation. Please try again.');
          return;
        }

        // Add both users as participants
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            { 
              conversation_id: newConv.id, 
              user_id: user.id,
              joined_at: new Date().toISOString(),
            },
            { 
              conversation_id: newConv.id, 
              user_id: userId,
              joined_at: new Date().toISOString(),
            },
          ]);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          Alert.alert('Error', 'Failed to add participants');
          return;
        }

        // Navigate to the new conversation
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: newConv.id,
            userId: userId,
            username: userData?.username || username || 'User',
            avatar: userData?.avatar || 'https://via.placeholder.com/150',
          },
        });
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch profile data (bio and avatar with base64)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, avatar_url, followers_count, following_count')
        .eq('id', userId)
        .single();

      // Count actual posts from posts table
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching profile:', error);
        setUserData({
          username: username || 'user',
          fullName: username || 'User',
          bio: 'No bio yet',
          avatar: 'https://via.placeholder.com/150',
          postsCount: postsCount || 0,
          followersCount: 0,
          followingCount: 0,
        });
      } else {
        setUserData({
          username: username || 'user',
          fullName: username || 'User',
          bio: profile.bio || 'No bio yet',
          avatar: profile.avatar_url || 'https://via.placeholder.com/150',
          postsCount: postsCount || 0,
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
        });
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error in fetchUserPosts:', error);
      setPosts([]);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-gray-400 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="person-outline" size={64} color="#6B7280" />
        <Text className="text-gray-400 mt-4">User not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-cyan-600 px-6 py-2 rounded-lg"
        >
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">{userData.username}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={28} color="#FFFFFF" />
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
        {isOwnProfile ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              className="flex-1 bg-gray-800 py-2 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={handleFollowToggle}
              disabled={followLoading}
              className={`flex-1 ${isFollowing ? 'bg-gray-800' : 'bg-cyan-600'} py-2 rounded-lg items-center`}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleMessage}
              className="flex-1 bg-gray-800 py-2 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleFollowToggle}
              disabled={followLoading}
              className="bg-gray-800 py-2 px-3 rounded-lg items-center"
            >
              <Ionicons 
                name={isFollowing ? "person-remove-outline" : "person-add-outline"} 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        )}
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
      </View>

      {/* Posts Grid */}
      {selectedTab === 'grid' && (
        <>
          {posts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="grid-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Posts Yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => {
                    if (post.media_type === 'video') {
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedTab === 'reels' && (
        <>
          {posts.filter(p => p.media_type === 'video').length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="play-circle-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No Videos Yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-[2px]">
              {posts.filter(p => p.media_type === 'video').map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => {
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

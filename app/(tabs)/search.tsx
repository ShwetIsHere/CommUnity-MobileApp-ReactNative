import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

type UserResult = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID and all users on component mount
  useEffect(() => {
    getCurrentUser();
    fetchAllUsers();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session');
        return;
      }

      // Fetch all users using admin API or list users
      // Note: We'll need to create a profiles table or use a server function
      // For now, let's try to get users from a profiles table if it exists
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url');

      if (error) {
        console.log('Profiles table not found, users need to be fetched differently');
        // Fallback: We can't directly query auth.users from client
        // You'll need to set up the profiles table as described in SUPABASE_SETUP.md
      } else {
        setAllUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Search in profiles table (case-insensitive, starts with)
      // Exclude current user from results
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.${query}%,full_name.ilike.${query}%`)
        .neq('id', currentUserId || '')
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        
        // Fallback: Filter from loaded users if profiles table doesn't exist
        if (allUsers.length > 0) {
          const filtered = allUsers.filter(
            (user) =>
              user.id !== currentUserId &&
              (user.username?.toLowerCase().startsWith(query.toLowerCase()) ||
              user.full_name?.toLowerCase().startsWith(query.toLowerCase()))
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserPress = (user: UserResult) => {
    // Navigate to user profile
    router.push({
      pathname: '/user/[id]',
      params: { id: user.id }
    });
  };

  const renderUserItem = ({ item }: { item: UserResult }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-900"
      onPress={() => handleUserPress(item)}>
      <Image source={{ uri: item.avatar_url }} className="w-12 h-12 rounded-full" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-semibold">{item.username}</Text>
        <Text className="text-gray-400 text-sm">{item.full_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with Search Bar */}
      <View className="pt-12 pb-3 px-4 border-b border-gray-900">
        <Text className="text-white text-xl font-semibold mb-3">Search</Text>
        
        {/* Search Input */}
        <View className="flex-row items-center bg-gray-900 rounded-xl px-4 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-white ml-2 text-base"
            placeholder="Search username..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="search-outline" size={64} color="#374151" />
          <Text className="text-gray-400 mt-4 text-base">Search for users</Text>
          <Text className="text-gray-500 mt-1 text-sm">Enter a username or name</Text>
        </View>
      ) : isSearching ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Searching...</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="person-outline" size={64} color="#374151" />
          <Text className="text-gray-400 mt-4">No users found</Text>
          <Text className="text-gray-500 mt-1 text-sm">Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
        />
      )}
    </View>
  );
}

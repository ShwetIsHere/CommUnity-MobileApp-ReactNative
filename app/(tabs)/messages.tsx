import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

type Conversation = {
  conversation_id: string;
  participant_id: string;
  participant_username: string;
  participant_name: string;
  participant_avatar: string;
  last_message: string;
  last_message_time: string;
  last_message_sender_id: string;
  unread_count: number;
};

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    setLoading(true); // Show initial loading
    fetchConversations();
    
    // Subscribe to real-time updates for new messages
    const channel = supabase
      .channel('conversations_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        // Refresh conversation list when new message arrives
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refresh conversations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Fetch conversations in background without blocking navigation
      fetchConversations();
    }, [])
  );

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchConversations = async () => {
    try {
      // Don't block UI on focus refresh
      if (!loading) {
        setRefreshing(true);
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get all conversation IDs for current user
      const { data: conversationsData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const conversationIds = conversationsData.map(c => c.conversation_id);

      // Optimized: Get all data in parallel with fewer queries
      const [participantsResult, messagesResult, unreadResult, profilesResult] = await Promise.all([
        // Get all participants for these conversations
        supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', conversationIds),
        
        // Get last message for each conversation
        supabase
          .from('messages')
          .select('conversation_id, sender_id, receiver_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false }),
        
        // Get ONLY unread messages where current user is the receiver
        supabase
          .from('messages')
          .select('conversation_id, id')
          .in('conversation_id', conversationIds)
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        
        // Get all profiles at once
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
      ]);

      const allParticipants = participantsResult.data || [];
      const allMessages = messagesResult.data || [];
      const unreadMessages = unreadResult.data || [];
      const allProfiles = profilesResult.data || [];

      // Build conversations list efficiently
      const conversationsList = conversationIds.map(conversationId => {
        // Find other participant
        const otherParticipant = allParticipants.find(
          p => p.conversation_id === conversationId && p.user_id !== user.id
        );
        
        // Find last message
        const lastMessage = allMessages.find(m => m.conversation_id === conversationId);
        
        // Find profile
        const profile = allProfiles.find(p => p.id === otherParticipant?.user_id);
        
        // Count ONLY unread messages where I'm the receiver
        const unreadCount = unreadMessages.filter(
          m => m.conversation_id === conversationId
        ).length;

        const displayName = profile?.full_name || profile?.username || 'User';
        
        return {
          conversation_id: conversationId,
          participant_id: otherParticipant?.user_id || '',
          participant_username: profile?.username || 'Unknown',
          participant_name: displayName,
          participant_avatar: profile?.avatar_url || 'https://via.placeholder.com/150',
          last_message: lastMessage?.content || 'Start a conversation',
          last_message_time: lastMessage?.created_at || new Date().toISOString(),
          last_message_sender_id: lastMessage?.sender_id || '',
          unread_count: unreadCount || 0,
        };
      });

      // Sort by most recent
      conversationsList.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await fetchConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    router.push({
      pathname: '/chat/[id]',
      params: { 
        id: conversation.conversation_id,
        userId: conversation.participant_id,
        username: conversation.participant_name, // Use full_name instead of username
        avatar: conversation.participant_avatar,
      }
    });
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isOwnMessage = item.last_message_sender_id === currentUserId;
    const messagePreview = isOwnMessage ? `You: ${item.last_message}` : item.last_message;

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-4 border-b border-gray-900"
        onPress={() => handleConversationPress(item)}>
        {/* Avatar */}
        <Image
          source={{ uri: item.participant_avatar }}
          className="w-14 h-14 rounded-full"
        />

        {/* Message Info */}
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white font-semibold text-base">
              {item.participant_name}
            </Text>
            <Text className="text-gray-500 text-xs">
              {formatTime(item.last_message_time)}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text 
              className={`flex-1 text-sm ${
                item.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-400'
              }`}
              numberOfLines={1}>
              {messagePreview}
            </Text>
            
            {item.unread_count > 0 && (
              <View className="bg-cyan-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">
                  {item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-4 px-4 border-b border-gray-900">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Messages</Text>
          {refreshing && !loading && (
            <ActivityIndicator size="small" color="#06b6d4" />
          )}
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text className="text-gray-400 mt-4">Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubbles-outline" size={80} color="#374151" />
          <Text className="text-white text-xl font-semibold mt-4">No Messages Yet</Text>
          <Text className="text-gray-400 text-center mt-2">
            Start a conversation by visiting someone's profile and tapping the Message button
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.conversation_id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#06b6d4"
              colors={['#06b6d4']}
            />
          }
        />
      )}
    </View>
  );
}

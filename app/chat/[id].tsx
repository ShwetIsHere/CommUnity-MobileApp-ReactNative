import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id: conversationId, userId, username, avatar } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        
        // Only add if message doesn't already exist (prevent duplicates)
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === newMsg.id);
          if (exists) {
            return prev; // Message already exists, don't add
          }
          return [...prev, newMsg]; // Add new message
        });
        
        // Mark message as read if it's not from current user
        if (newMsg.sender_id !== currentUserId) {
          markMessageAsRead(newMsg.id);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Mark unread messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(
          (msg: Message) => msg.sender_id !== currentUserId
        );
        unreadMessages.forEach((msg: Message) => markMessageAsRead(msg.id));
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    // Create temporary message object for instant UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      sender_id: currentUserId,
      content: messageText,
      created_at: new Date().toISOString(),
    };

    // Add message to UI immediately
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: userId, // Add receiver_id (the other person)
          content: messageText,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Remove temp message and restore input on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        setNewMessage(messageText);
      } else if (data) {
        // Replace temp message with real message from database
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? data : msg))
        );
      }
    } catch (error) {
      console.error('Error:', error);
      // Remove temp message and restore input on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUserId;

    return (
      <View
        className={`flex-row mb-3 px-4 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-gradient-to-r from-pink-500 to-pink-600 rounded-br-none'
              : 'bg-gray-800 rounded-bl-none'
          }`}
          style={{
            backgroundColor: isOwnMessage ? '#06B6D4' : '#1f2937',
          }}>
          <Text className="text-white text-base">{item.content}</Text>
          <Text
            className={`text-xs mt-1 ${
              isOwnMessage ? 'text-cyan-100' : 'text-gray-500'
            }`}>
            {new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>
      </View>
    );
  }, [currentUserId]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-3 px-4 border-b border-gray-900 bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: avatar as string }}
            className="w-10 h-10 rounded-full"
          />

          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-lg">
              {username}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubble-outline" size={64} color="#374151" />
            <Text className="text-gray-400 mt-4">No messages yet</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View className="flex-row items-center px-4 py-3 border-t border-gray-900 bg-black">
          <View className="flex-1 bg-gray-900 rounded-full px-4 py-2 flex-row items-center">
            <TextInput
              className="flex-1 text-white text-base"
              placeholder="Type your message"
              placeholderTextColor="#6B7280"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className={`ml-3 ${
              newMessage.trim() && !loading ? 'opacity-100' : 'opacity-50'
            }`}>
            <Ionicons name="send" size={24} color="#06B6D4" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

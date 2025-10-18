import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarData, setAvatarData] = useState<string | null>(null); // Store existing avatar as base64
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      setUserId(user.id);

      // Fetch profile data (bio and avatar_url which contains base64 data)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
        return;
      }

      if (profile) {
        setBio(profile.bio || '');
        setAvatarData(profile.avatar_url || null);
      }
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string | null> => {
    try {
      console.log('📤 Converting profile image to base64...');

      // Fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          console.log('✅ Profile image converted to base64');
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting profile image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let finalAvatarData = avatarData;

      // Convert new profile image to base64 if selected
      if (newAvatarUri) {
        const base64Data = await convertImageToBase64(newAvatarUri);
        if (base64Data) {
          finalAvatarData = base64Data;
        } else {
          Alert.alert('Warning', 'Failed to process profile image. Continuing with other changes...');
        }
      }

      // Update profile in database (only bio and avatar_url)
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim(),
          avatar_url: finalAvatarData,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile: ' + error.message);
        return;
      }

      console.log('✅ Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text className="text-gray-400 mt-4">Loading profile...</Text>
      </View>
    );
  }

  const displayAvatar = newAvatarUri || avatarData || 'https://via.placeholder.com/150';

  return (
    <ScrollView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4 border-b border-gray-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#06B6D4" />
          ) : (
            <Text className="text-cyan-500 text-base font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Profile Picture Section */}
      <View className="items-center py-8">
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          <Image
            source={{ uri: displayAvatar }}
            className="w-32 h-32 rounded-full border-2 border-gray-700"
          />
          <View className="absolute bottom-0 right-0 bg-cyan-600 rounded-full p-2">
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-gray-400 text-sm mt-3">Tap to change profile photo</Text>
      </View>

      {/* Form Fields */}
      <View className="px-4 space-y-6">
        {/* Bio */}
        <View>
          <Text className="text-gray-400 text-sm mb-2">Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Write a bio..."
            placeholderTextColor="#6B7280"
            className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={150}
          />
          <Text className="text-gray-500 text-xs mt-1 text-right">
            {bio.length}/150
          </Text>
        </View>

        {/* Info Text */}
        <View className="mt-6 bg-gray-900/30 rounded-lg p-4 border border-gray-800">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-2 flex-1">
              Your bio and profile picture will be visible to all users. Profile images are stored as binary data in the database.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View className="h-8" />
    </ScrollView>
  );
}

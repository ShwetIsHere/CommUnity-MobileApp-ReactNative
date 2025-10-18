import React, { useState } from 'react';
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/utils/supabase';

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const mediaUri = params.mediaUri as string;
  const mediaType = params.mediaType as string; // 'image' or 'video'
  const trimStart = params.trimStart ? parseFloat(params.trimStart as string) : undefined;
  const trimEnd = params.trimEnd ? parseFloat(params.trimEnd as string) : undefined;
  
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Show trim info if video was trimmed
  const isTrimmed = trimStart !== undefined && trimEnd !== undefined;
  const trimDuration = isTrimmed ? trimEnd! - trimStart! : 0;

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize to max 1080px width
        { compress: 0.5, format: SaveFormat.JPEG } // 50% compression
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    try {
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post');
        setUploading(false);
        return;
      }

      let fileToUpload = mediaUri;

      // Compress image if needed
      if (mediaType === 'image') {
        console.log('Compressing image...');
        fileToUpload = await compressImage(mediaUri);
        await continueUpload(fileToUpload, user);
      } else {
        // For videos, just proceed directly (already validated in feed.tsx)
        await continueUpload(fileToUpload, user);
      }
    } catch (error: any) {
      console.error('Error uploading:', error);
      setUploading(false);
      Alert.alert('Error', `Something went wrong: ${error.message || 'Please try again.'}`);
    }
  };

  const continueUpload = async (fileToUpload: string, user: any) => {
    try {
      console.log('Preparing file for upload...');
      
      const fileExt = mediaType === 'image' ? 'jpg' : 'mp4';
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      console.log('Uploading to Supabase Storage...');

      // Use FormData for better memory handling in React Native
      const formData = new FormData();
      formData.append('file', {
        uri: fileToUpload,
        type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        name: `${timestamp}.${fileExt}`,
      } as any);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        setUploading(false);
        return;
      }

      // Use multipart upload for better memory handling
      const uploadUrl = `https://xhdneoftamwbqejctnsk.supabase.co/storage/v1/object/posts/${fileName}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        Alert.alert('Upload Error', 'Failed to upload file to storage. File may be too large.');
        setUploading(false);
        return;
      }

      console.log('Upload successful! Getting public URL...');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // Prepare caption with hashtags
      const fullCaption = hashtags.trim() 
        ? `${caption.trim()} ${hashtags.trim()}`
        : caption.trim();

      console.log('Saving post to database...');

      // Insert post into database with URL
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: fullCaption,
          image_url: mediaType === 'image' ? publicUrl : null,
          video_url: mediaType === 'video' ? publicUrl : null,
          media_type: mediaType,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // Try to delete uploaded file if database insert fails
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          await supabase.storage
            .from('posts')
            .remove([fileName]);
        } catch (deleteError) {
          console.error('Failed to clean up file:', deleteError);
        }
        
        Alert.alert('Error', `Failed to save post: ${error.message}`);
        setUploading(false);
        return;
      }

      console.log('Post saved successfully!', data);

      // Update posts_count in profiles
      await supabase.rpc('increment_posts_count', { user_id: user.id });

      setUploading(false);
      Alert.alert('Success! 🎉', 'Your post has been uploaded!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error in continueUpload:', error);
      setUploading(false);
      Alert.alert('Error', `Upload failed: ${error.message || 'Please try again with a smaller file.'}`);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-4 px-4 border-b border-gray-900 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">New Post</Text>
        <TouchableOpacity 
          onPress={handleUpload}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#06B6D4" />
          ) : (
            <Text className="text-cyan-500 text-base font-semibold">Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Media Preview */}
        <View className="w-full h-96 bg-gray-900">
          {mediaType === 'image' ? (
            <Image
              source={{ uri: mediaUri }}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : (
            <View style={{ 
              width: '100%', 
              height: '100%', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 16,
              backgroundColor: '#111827'
            }}>
              <View style={{
                backgroundColor: '#1F2937',
                borderRadius: 9999,
                padding: 32,
                marginBottom: 16
              }}>
                <Ionicons name="videocam" size={80} color="#06B6D4" />
              </View>
              <Text style={{ 
                color: '#fff', 
                fontSize: 20, 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Video Ready to Upload
              </Text>
              <Text style={{ 
                color: '#9CA3AF', 
                textAlign: 'center',
                marginBottom: 16
              }}>
                Your video will be uploaded when you share this post
              </Text>
              <View style={{
                backgroundColor: 'rgba(8, 145, 178, 0.2)',
                borderColor: '#155E75',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8
              }}>
                <Text style={{ color: '#22D3EE', fontSize: 14 }}>
                  ⚡ Preview disabled to save memory
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Caption Input */}
        <View className="p-4 border-b border-gray-900">
          <Text className="text-white text-base font-semibold mb-2">Caption</Text>
          <TextInput
            className="text-white text-base bg-gray-900 rounded-lg p-3 min-h-24"
            placeholder="Write a caption..."
            placeholderTextColor="#6B7280"
            multiline
            value={caption}
            onChangeText={setCaption}
            maxLength={2200}
          />
          <Text className="text-gray-500 text-xs mt-1 text-right">
            {caption.length}/2200
          </Text>
        </View>

        {/* Hashtags Input */}
        <View className="p-4 border-b border-gray-900">
          <Text className="text-white text-base font-semibold mb-2">Hashtags</Text>
          <TextInput
            className="text-white text-base bg-gray-900 rounded-lg p-3"
            placeholder="#nature #photography #sunset"
            placeholderTextColor="#6B7280"
            value={hashtags}
            onChangeText={setHashtags}
          />
          <Text className="text-gray-500 text-xs mt-2">
            Separate hashtags with spaces (e.g., #nature #photography)
          </Text>
        </View>

        {/* Media Info */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-400">Type:</Text>
            <Text className="text-white capitalize">{mediaType}</Text>
          </View>
          {mediaType === 'video' && (
            <>
              <View className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-3 mt-2">
                <Text className="text-cyan-400 text-sm">
                  📹 Video ready to upload (Max: 15 seconds, 10MB)
                </Text>
              </View>
              {isTrimmed && (
                <View className="bg-purple-900/20 border border-purple-800 rounded-lg p-3 mt-2">
                  <Text className="text-purple-400 text-sm font-semibold mb-1">
                    ✂️ Video Trimmed
                  </Text>
                  <Text className="text-purple-300 text-xs">
                    {Math.floor(trimStart!)}s - {Math.floor(trimEnd!)}s ({Math.floor(trimDuration)}s duration)
                  </Text>
                </View>
              )}
            </>
          )}
          {mediaType === 'image' && (
            <View className="bg-green-900/20 border border-green-800 rounded-lg p-3 mt-2">
              <Text className="text-green-400 text-sm">
                📸 Image compressed to 50% and uploaded to cloud storage.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

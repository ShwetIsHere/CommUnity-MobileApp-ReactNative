import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '@/components/Input';
import { GradientButton } from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }

    setLoading(true);

    try {
      // Send password reset email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'community://reset-password', // Deep link for your app
      });

      setLoading(false);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Show success state
      setSuccess(true);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  const handleResend = async () => {
    setSuccess(false);
    await handleResetPassword();
  };

  return (
    <View className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#1E1B4B', '#0F172A', '#000000']}
        className="absolute top-0 left-0 right-0 bottom-0"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          showsVerticalScrollIndicator={false}>
          {!success ? (
            <>
              {/* Icon */}
              <View className="items-center mb-8">
                <View className="bg-gray-800/50 w-24 h-24 rounded-full items-center justify-center mb-6">
                  <Ionicons name="lock-closed" size={48} color="#06B6D4" />
                </View>
                <Text className="text-white text-3xl font-bold mb-3">Forgot Password</Text>
                <Text className="text-gray-400 text-base text-center px-4">
                  Enter the email associated with your account and we'll send an email instructions to reset your password.
                </Text>
              </View>

              {/* Input Field */}
              <View className="mb-8">
                <Input
                  label="Email"
                  icon="mail-outline"
                  placeholder="serena88@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                />

                <GradientButton title="Continue" onPress={handleResetPassword} loading={loading} />
              </View>
            </>
          ) : (
            // Success State
            <View className="items-center">
              <View className="bg-cyan-500/20 w-24 h-24 rounded-full items-center justify-center mb-6">
                <Ionicons name="checkmark-circle" size={64} color="#06B6D4" />
              </View>
              <Text className="text-white text-3xl font-bold mb-3">Check Your Email</Text>
              <Text className="text-gray-400 text-base text-center px-4 mb-8">
                We've sent password reset instructions to{'\n'}
                <Text className="text-white font-medium">{email}</Text>
              </Text>

              <View className="w-full">
                <GradientButton
                  title="Back to Login"
                  onPress={() => router.push('/(auth)/login')}
                />
              </View>

              <TouchableOpacity className="mt-6">
                <Text className="text-gray-400 text-sm">
                  Didn't receive the email?{' '}
                  <Text onPress={handleResend} className="text-cyan-400 font-medium">Resend</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

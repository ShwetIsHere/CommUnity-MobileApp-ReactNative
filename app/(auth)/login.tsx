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
import { Link, Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '@/components/Input';
import { GradientButton } from '@/components/GradientButton';
import { SocialButton } from '@/components/SocialButton';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    // Reset errors
    setErrors({ email: '', password: '' });

    // Basic validation
    let hasError = false;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      hasError = true;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        Alert.alert('Login Failed', error.message);
        return;
      }

      if (data.user) {
        // Success! Navigate to home
        router.replace('/(tabs)/feed');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
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
          {/* Logo/Title Section */}
          <View className="items-center mb-12">
            <View className="bg-gradient-to-br from-cyan-400 to-blue-600 w-20 h-20 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="people" size={40} color="white" />
            </View>
            <Text className="text-white text-4xl font-bold mb-2">Welcome Back</Text>
            <Text className="text-gray-400 text-base">Log in to your account</Text>
          </View>

          {/* Input Fields */}
          <View className="mb-6">
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            {/* Remember Me & Forgot Password */}
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center">
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                    rememberMe ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'
                  }`}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-400 text-sm">Remember me</Text>
              </TouchableOpacity>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text className="text-cyan-400 text-sm font-medium">Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Login Button */}
            <GradientButton title="Log In" onPress={handleLogin} loading={loading} />
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-800" />
            <Text className="text-gray-500 text-sm mx-4">Or Sign in with</Text>
            <View className="flex-1 h-px bg-gray-800" />
          </View>

          {/* Social Login Buttons */}
          <View className="mb-8">
            <SocialButton title="Sign in with Google" icon="logo-google" onPress={() => {}} />
            <SocialButton title="Sign in with Facebook" icon="logo-facebook" onPress={() => {}} />
          </View>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-400 text-base">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-cyan-400 text-base font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

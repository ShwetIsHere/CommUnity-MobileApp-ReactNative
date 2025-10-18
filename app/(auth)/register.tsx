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

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    // Reset errors
    setErrors({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    // Validation
    let hasError = false;
    const newErrors: any = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
      hasError = true;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      hasError = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (!acceptTerms) {
      Alert.alert('Terms & Conditions', 'Please accept the Terms & Conditions to continue');
      return;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase - using full_name as username
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.fullName,
            display_name: formData.fullName,
          },
        },
      });

      setLoading(false);

      if (error) {
        Alert.alert('Registration Failed', error.message);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          Alert.alert(
            'Email Already Registered',
            'This email is already registered. Please login instead.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.push('/(auth)/login'),
              },
            ]
          );
          return;
        }

        // Success!
        Alert.alert(
          'Registration Successful! 🎉',
          'Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          <View className="items-center mb-10">
            <View className="bg-gradient-to-br from-cyan-400 to-blue-600 w-20 h-20 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="people" size={40} color="white" />
            </View>
            <Text className="text-white text-4xl font-bold mb-2">Create Account</Text>
            <Text className="text-gray-400 text-base">Sign up to get started</Text>
          </View>

          {/* Input Fields */}
          <View className="mb-6">
            <Input
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              icon="person-outline"
              error={errors.fullName}
            />

            <Input
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Terms & Conditions */}
            <TouchableOpacity
              onPress={() => setAcceptTerms(!acceptTerms)}
              className="flex-row items-start mb-6">
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 mt-0.5 ${
                  acceptTerms ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'
                }`}>
                {acceptTerms && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="text-gray-400 text-sm flex-1">
                I agree to the{' '}
                <Text className="text-cyan-400 font-medium">Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <GradientButton title="Sign Up" onPress={handleRegister} loading={loading} />
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-800" />
            <Text className="text-gray-500 text-sm mx-4">Or Sign up with</Text>
            <View className="flex-1 h-px bg-gray-800" />
          </View>

          {/* Social Login Buttons */}
          <View className="mb-8">
            <SocialButton title="Sign up with Google" icon="logo-google" onPress={() => {}} />
            <SocialButton title="Sign up with Facebook" icon="logo-facebook" onPress={() => {}} />
          </View>

          {/* Login Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-400 text-base">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-cyan-400 text-base font-semibold">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

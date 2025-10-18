import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/GradientButton';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationScreen() {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 4) {
      alert('Please enter all 4 digits');
      return;
    }

    setLoading(true);
    // TODO: Implement actual verification logic
    setTimeout(() => {
      setLoading(false);
      // Navigate to home or profile setup
      router.replace('/');
    }, 2000);
  };

  const handleResendOTP = () => {
    // TODO: Implement resend OTP logic
    alert('OTP resent successfully!');
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
          {/* Icon */}
          <View className="items-center mb-12">
            <View className="bg-gray-800/50 w-24 h-24 rounded-full items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={48} color="#06B6D4" />
            </View>
            <Text className="text-white text-3xl font-bold mb-3">Verification</Text>
            <Text className="text-gray-400 text-base text-center px-4">
              Enter the 4 digits code that you received on your email.
            </Text>
          </View>

          {/* OTP Input */}
          <View className="mb-8">
            <View className="flex-row justify-center mb-8">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="w-16 h-16 mx-2 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white text-2xl font-bold text-center focus:border-cyan-400"
                  placeholderTextColor="#4B5563"
                />
              ))}
            </View>

            {/* Resend OTP */}
            <View className="items-center mb-8">
              <Text className="text-gray-400 text-sm mb-2">
                Didn't receive the OTP?{' '}
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text className="text-cyan-400 font-medium">Resend OTP</Text>
                </TouchableOpacity>
              </Text>
            </View>

            {/* Verify Button */}
            <GradientButton title="Continue" onPress={handleVerify} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

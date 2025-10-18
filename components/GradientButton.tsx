import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export const GradientButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  variant = 'primary' 
}: GradientButtonProps) => {
  const colors: readonly [string, string, ...string[]] = variant === 'primary' 
    ? ['#06B6D4', '#3B82F6'] as const // cyan to blue
    : ['#6366F1', '#8B5CF6'] as const; // indigo to purple

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      className="rounded-xl overflow-hidden">
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="py-4 px-6">
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-base font-semibold">
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

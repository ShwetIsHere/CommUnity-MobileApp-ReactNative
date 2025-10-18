import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SocialButtonProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
};

export const SocialButton = ({ title, icon, onPress, color = '#1F2937' }: SocialButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-center bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 mb-3">
      <Ionicons name={icon} size={20} color="white" />
      <Text className="text-white text-base font-medium ml-3">{title}</Text>
    </TouchableOpacity>
  );
};

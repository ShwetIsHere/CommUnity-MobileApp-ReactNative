import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InputProps = {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secureTextEntry?: boolean;
} & TextInputProps;

export const Input = ({ label, icon, error, secureTextEntry, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && <Text className="text-gray-400 text-sm mb-2 ml-1">{label}</Text>}
      <View
        className={`flex-row items-center bg-gray-900/50 border rounded-xl px-4 py-3 ${
          isFocused ? 'border-cyan-400' : error ? 'border-red-500' : 'border-gray-800'
        }`}>
        {icon && <Ionicons name={icon} size={20} color="#9CA3AF" className="mr-3" />}
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry && !showPassword}
          className="flex-1 text-white text-base ml-2"
          placeholderTextColor="#6B7280"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};

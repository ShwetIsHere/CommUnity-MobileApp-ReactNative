import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

import { Stack } from 'expo-router';
import { Text } from 'react-native';

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
        }}
        />
      </SafeAreaView>
  );
}

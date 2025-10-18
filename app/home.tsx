import React from 'react';
import { Redirect } from 'expo-router';

export default function HomeScreen() {
  // Redirect to tabs/feed
  return <Redirect href="/(tabs)/feed" />;
}

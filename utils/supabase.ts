import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xhdneoftamwbqejctnsk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG5lb2Z0YW13YnFlamN0bnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjcyNjMsImV4cCI6MjA3NTcwMzI2M30.8trPGLqDmZv5nyDP_U-x4yDny3e57UMIXxpoVHUDOq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

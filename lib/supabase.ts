import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Use environment variables
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Custom storage adapter: SecureStore for native, localStorage for web
const createStorageAdapter = () => {
    // Detect web platform - check both Platform.OS and typeof window
    const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof localStorage !== 'undefined');
    
    console.log('[Supabase] Platform detection:', {
        PlatformOS: Platform.OS,
        isWeb,
        hasWindow: typeof window !== 'undefined',
        hasLocalStorage: typeof localStorage !== 'undefined'
    });

    // Web platform: use localStorage
    if (isWeb) {
        console.log('[Supabase] Using localStorage adapter for web');
        return {
            getItem: async (key: string) => {
                try {
                    const value = localStorage.getItem(key);
                    console.log('[Supabase] localStorage.getItem:', key, value ? 'found' : 'not found');
                    return value;
                } catch (error) {
                    console.error('[Supabase] Error getting item from localStorage:', error);
                    return null;
                }
            },
            setItem: async (key: string, value: string) => {
                try {
                    localStorage.setItem(key, value);
                    console.log('[Supabase] localStorage.setItem:', key, 'success');
                } catch (error) {
                    console.error('[Supabase] Error setting item in localStorage:', error);
                }
            },
            removeItem: async (key: string) => {
                try {
                    localStorage.removeItem(key);
                    console.log('[Supabase] localStorage.removeItem:', key, 'success');
                } catch (error) {
                    console.error('[Supabase] Error removing item from localStorage:', error);
                }
            },
        };
    }

    // Native platforms: use SecureStore
    console.log('[Supabase] Using SecureStore adapter for native');
    return {
        getItem: async (key: string) => {
            try {
                return await SecureStore.getItemAsync(key);
            } catch (error) {
                console.error('[Supabase] Error getting item from SecureStore:', error);
                return null;
            }
        },
        setItem: async (key: string, value: string) => {
            try {
                await SecureStore.setItemAsync(key, value);
            } catch (error) {
                console.error('[Supabase] Error setting item in SecureStore:', error);
            }
        },
        removeItem: async (key: string) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                console.error('[Supabase] Error removing item from SecureStore:', error);
            }
        },
    };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: createStorageAdapter(),
    },
});

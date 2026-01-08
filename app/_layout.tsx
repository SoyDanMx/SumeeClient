import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                        }}
                    >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="search" options={{ headerShown: false }} />
                        <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="professional/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="profile" options={{ headerShown: false }} />
                        <Stack.Screen name="service-category/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="services/index" options={{ headerShown: false }} />
                        <Stack.Screen name="request-service" options={{ headerShown: false }} />
                        <Stack.Screen name="lead/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="location" options={{ headerShown: false }} />
                        <Stack.Screen name="messages/[leadId]" options={{ headerShown: false }} />
                        <Stack.Screen name="professionals" options={{ headerShown: false }} />
                        <Stack.Screen name="admin/generate-embeddings" options={{ headerShown: false }} />
                    </Stack>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

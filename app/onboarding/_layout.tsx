import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="services" />
            <Stack.Screen name="management" />
            <Stack.Screen name="permissions" />
        </Stack>
    );
}


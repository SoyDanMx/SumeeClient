import { Stack } from 'expo-router';

export default function RequestServiceLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="confirm" options={{ title: 'Confirmar Servicio' }} />
        </Stack>
    );
}


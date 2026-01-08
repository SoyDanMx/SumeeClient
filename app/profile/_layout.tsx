import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="edit" options={{ title: 'Editar Perfil' }} />
            <Stack.Screen name="addresses" options={{ title: 'Mis Direcciones' }} />
        </Stack>
    );
}


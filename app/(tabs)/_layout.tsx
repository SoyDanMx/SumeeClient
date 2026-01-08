import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform } from 'react-native';

export default function TabsLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="projects"
                options={{
                    title: 'Solicitudes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="briefcase" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Agenda',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Mensajes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

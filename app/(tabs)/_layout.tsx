import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { GlassTabBarBackground } from '@/components/tabBar/GlassTabBarBackground';
import { LinearGradient } from 'expo-linear-gradient';

type TabButtonProps = BottomTabBarButtonProps & {
    isDark: boolean;
    mode: 'A' | 'B';
};

const TAB_BAR_MODE: 'A' | 'B' = 'B'; // Forzado a B para visualizar Liquid Glass

function TabPillButton({ isDark, mode, accessibilityState, style, children, ...rest }: TabButtonProps) {
    const selected = Boolean(accessibilityState?.selected);

    return (
        <Pressable
            {...(rest as React.ComponentProps<typeof Pressable>)}
            style={[styles.tabButton, style]}
            android_ripple={{ color: 'transparent' }}
        >
                {selected && mode === 'B' && (
                    <LinearGradient
                        colors={
                            isDark
                                ? (['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.02)'] as const)
                                : (['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.40)'] as const)
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                <View
                    style={[
                        styles.tabInner,
                        selected &&
                            (mode === 'A'
                                ? isDark
                                    ? styles.tabInnerActiveDarkA
                                    : styles.tabInnerActiveA
                                : isDark
                                  ? styles.tabInnerActiveDarkB
                                  : styles.tabInnerActiveB),
                    ]}
                >
                    {children}
                </View>
        </Pressable>
    );
}

export default function TabsLayout() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const mode = TAB_BAR_MODE;
    const isIOSLike = Platform.OS === 'ios' || Platform.OS === 'web';
    const activeTint =
        isIOSLike
            ? mode === 'A'
                ? isDark
                    ? '#FFFFFF'
                    : '#111827'
                : isDark
                  ? '#FFFFFF'
                  : '#0F172A'
            : theme.primary;
    const inactiveTint = mode === 'A' ? (isDark ? '#CBD5E1' : '#6B7280') : isDark ? '#9CA3AF' : '#64748B';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeTint,
                tabBarInactiveTintColor: inactiveTint,
                tabBarStyle: isIOSLike
                    ? {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderTopWidth: 0,
                          elevation: 0,
                          backgroundColor: 'transparent',
                          height: (mode === 'A' ? 56 : 60) + insets.bottom,
                          paddingTop: 6,
                          paddingBottom: Math.max(insets.bottom, 8),
                          borderTopLeftRadius: 22,
                          borderTopRightRadius: 22,
                          overflow: 'hidden',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: mode === 'A' ? (isDark ? 0.18 : 0.06) : isDark ? 0.35 : 0.15,
                          shadowRadius: mode === 'A' ? 8 : 16,
                      }
                    : {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark ? '#263244' : '#E5E7EB',
                          backgroundColor: isDark ? '#111827' : '#FFFFFF',
                          height: 66,
                          paddingBottom: 10,
                          paddingTop: 8,
                      },
                tabBarBackground: () => (
                    <GlassTabBarBackground
                        isDark={isDark}
                        mode={mode}
                        variant="edge"
                    />
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: mode === 'A' ? '600' : '700',
                    letterSpacing: 0.2,
                    marginTop: -1,
                },
                tabBarItemStyle: {
                    paddingVertical: Platform.OS === 'ios' ? 1 : 0,
                },
                tabBarButton: (props) => <TabPillButton {...props} isDark={isDark} mode={mode} />,
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

const styles = StyleSheet.create({
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        marginVertical: 3,
        borderRadius: 999,
    },
    tabInner: {
        minWidth: 62,
        height: 46,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    /** Style A: ultra blanco (casi sin tinte) */
    tabInnerActiveA: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.06)',
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    tabInnerActiveDarkA: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.20)',
    },
    /** Style B: liquid glass auténtico */
    tabInnerActiveB: {
        backgroundColor: 'rgba(255,255,255,0.56)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    tabInnerActiveDarkB: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
});

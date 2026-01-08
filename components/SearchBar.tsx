import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onPress?: () => void;
    editable?: boolean;
}

export function SearchBar({ 
    placeholder = "Buscar 'Electricista', 'Fuga'...", 
    value, 
    onChangeText, 
    onPress,
    editable = true 
}: SearchBarProps) {
    const { theme } = useTheme();

    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.container}
        >
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.icon} />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    editable={editable}
                    style={[styles.input, { color: theme.text }]}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
});


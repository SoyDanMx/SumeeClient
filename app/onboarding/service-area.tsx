/**
 * Paso post-registro: zona de servicio + teléfono opcional (WhatsApp).
 * Sin esto, matching y contacto con técnicos son peores.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    getAddressSuggestions,
    formatAddressSuggestion,
    type AddressSuggestion,
} from '@/services/addressAutocomplete';
import { LocationService, type LocationData } from '@/services/location';
import { ProfileService } from '@/services/profile';
import { normalizeMexicoPhone } from '@/lib/profileSetup';

const TULBOX_PURPLE = '#820AD1';

export default function ServiceAreaScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, reloadProfile } = useAuth();

    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selected, setSelected] = useState<AddressSuggestion | null>(null);
    const [phone, setPhone] = useState('');
    const [gpsLoading, setGpsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canContinue = Boolean(selected);

    useEffect(() => {
        if (search.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const list = await getAddressSuggestions(search.trim(), 8, { preferAddresses: true });
                setSuggestions(list);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const onSelectSuggestion = useCallback((s: AddressSuggestion) => {
        setSelected(s);
        setSearch(formatAddressSuggestion(s));
        setSuggestions([]);
        setError(null);
    }, []);

    const handleUseGps = async () => {
        if (gpsLoading) return;
        setError(null);
        setGpsLoading(true);
        try {
            const loc: LocationData | null = await LocationService.getCurrentLocation();
            if (!loc?.latitude || !user?.id) {
                setError('No pudimos obtener tu ubicación. Activa el permiso o busca tu zona abajo.');
                return;
            }
            const ok = await LocationService.saveLocationToProfile(user.id, loc);
            if (!ok) {
                setError('No se pudo guardar la ubicación. Intenta de nuevo.');
                return;
            }
            const trimmedPhone = phone.trim();
            if (trimmedPhone.length > 0) {
                const e164 = normalizeMexicoPhone(trimmedPhone);
                if (!e164) {
                    setError('Teléfono: escribe 10 dígitos o un número con +52.');
                    return;
                }
                await ProfileService.updateProfile(user.id, { phone: e164, whatsapp: e164 });
            }
            await reloadProfile();
            router.replace('/onboarding/welcome');
        } finally {
            setGpsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (!canContinue || !user?.id || saving) return;
        setSaving(true);
        setError(null);
        try {
            const lat = parseFloat(selected!.lat);
            const lon = parseFloat(selected!.lon);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                setError('Ubicación inválida. Elige otra sugerencia.');
                return;
            }

            const loc: LocationData = {
                latitude: lat,
                longitude: lon,
                address: formatAddressSuggestion(selected!),
                city: selected!.address?.city,
                state: selected!.address?.state,
                zipCode: selected!.address?.postcode,
            };

            const okLoc = await LocationService.saveLocationToProfile(user.id, loc);
            if (!okLoc) {
                setError('No se pudo guardar tu zona. Intenta de nuevo.');
                return;
            }

            const trimmedPhone = phone.trim();
            if (trimmedPhone.length > 0) {
                const e164 = normalizeMexicoPhone(trimmedPhone);
                if (!e164) {
                    setError('Teléfono: escribe 10 dígitos o un número con +52.');
                    return;
                }
                await ProfileService.updateProfile(user.id, {
                    phone: e164,
                    whatsapp: e164,
                });
            }

            await reloadProfile();
            router.replace('/onboarding/welcome');
        } catch (e: any) {
            setError(e?.message || 'Algo salió mal.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.hero}>
                        <View style={[styles.iconCircle, { backgroundColor: TULBOX_PURPLE + '18' }]}>
                            <Ionicons name="location" size={32} color={TULBOX_PURPLE} />
                        </View>
                        <Text variant="h1" weight="bold" style={styles.title}>
                            ¿Dónde necesitas servicios?
                        </Text>
                        <Text variant="body" color={theme.textSecondary} style={styles.sub}>
                            Así ubicamos servicios cerca de ti. Puedes usar GPS o escribir tu calle: verás
                            sugerencias mientras escribes.
                        </Text>
                    </View>

                    <Pressable
                        style={[styles.gpsRow, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        onPress={handleUseGps}
                        disabled={gpsLoading}
                    >
                        {gpsLoading ? (
                            <ActivityIndicator color={TULBOX_PURPLE} />
                        ) : (
                            <Ionicons name="navigate-circle" size={24} color={TULBOX_PURPLE} />
                        )}
                        <View style={styles.gpsTextWrap}>
                            <Text variant="body" weight="600">
                                Usar mi ubicación actual
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Rápido y preciso (pide permiso de ubicación)
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </Pressable>

                    <Text variant="label" style={styles.sectionLabel}>
                        O busca por dirección
                    </Text>
                    <Text variant="caption" color={theme.textSecondary} style={styles.hint}>
                        Escribe calle, número y colonia o ciudad; elige una sugerencia de la lista.
                    </Text>
                    <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ej. Av. Insurgentes Sur 1647, Del Valle"
                            placeholderTextColor={theme.textSecondary}
                            value={search}
                            onChangeText={(t) => {
                                setSearch(t);
                                if (selected && t !== formatAddressSuggestion(selected)) {
                                    setSelected(null);
                                }
                            }}
                            autoCorrect={false}
                            autoComplete={Platform.OS === 'android' ? 'street-address' : 'off'}
                            textContentType="fullStreetAddress"
                            importantForAutofill="yes"
                            accessibilityLabel="Buscar dirección con calle y número"
                        />
                        {loadingSuggestions && <ActivityIndicator size="small" color={TULBOX_PURPLE} />}
                    </View>

                    {suggestions.length > 0 && (
                        <View style={[styles.suggestions, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={`${s.lat}-${s.lon}-${i}`}
                                    style={[styles.sugRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
                                    onPress={() => onSelectSuggestion(s)}
                                >
                                    <Ionicons name="location-outline" size={18} color={TULBOX_PURPLE} />
                                    <Text variant="body" style={styles.sugText} numberOfLines={2}>
                                        {formatAddressSuggestion(s)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {selected && (
                        <View style={[styles.selectedPill, { backgroundColor: TULBOX_PURPLE + '14' }]}>
                            <Ionicons name="checkmark-circle" size={20} color={TULBOX_PURPLE} />
                            <Text variant="caption" style={styles.selectedText} numberOfLines={3}>
                                Dirección: {formatAddressSuggestion(selected)}
                            </Text>
                        </View>
                    )}

                    <Text variant="label" style={styles.sectionLabel}>
                        Teléfono (opcional)
                    </Text>
                    <Text variant="caption" color={theme.textSecondary} style={styles.phoneHint}>
                        (Medio de contacto para tus servicios)
                    </Text>
                    <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="55 1234 5678"
                            placeholderTextColor={theme.textSecondary}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                            autoComplete="tel"
                            accessibilityLabel="Teléfono de contacto para tus servicios"
                        />
                    </View>

                    {error && (
                        <View style={[styles.errBox, { backgroundColor: theme.error + '18' }]}>
                            <Text variant="caption" color={theme.error}>
                                {error}
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        loading={saving}
                        disabled={!canContinue || saving}
                        style={styles.btn}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    hero: { marginBottom: 20 },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: { marginBottom: 8 },
    sub: { lineHeight: 22 },
    gpsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
        gap: 12,
    },
    gpsTextWrap: { flex: 1 },
    sectionLabel: { marginBottom: 6, marginTop: 4 },
    hint: { marginBottom: 10, lineHeight: 18 },
    phoneHint: { marginBottom: 8, marginTop: -2, lineHeight: 18 },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 16, paddingVertical: 10 },
    suggestions: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 12,
        overflow: 'hidden',
    },
    sugRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    sugText: { flex: 1 },
    selectedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    selectedText: { flex: 1 },
    errBox: { padding: 12, borderRadius: 10, marginBottom: 12 },
    btn: { marginTop: 12 },
});

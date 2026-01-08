import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { TextInput } from 'react-native';
import { ProfileService, Address } from '@/services/profile';
import { SUMEE_COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function AddressesScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
        is_default: false,
    });

    useEffect(() => {
        loadAddresses();
    }, [user]);

    const loadAddresses = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await ProfileService.getAddresses(user.id);
            setAddresses(data);
        } catch (error) {
            console.error('[Addresses] Error loading:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        setFormData({
            name: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            latitude: 0,
            longitude: 0,
            is_default: false,
        });
        setShowAddForm(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            name: address.name,
            address: address.address,
            city: address.city || '',
            state: address.state || '',
            zip_code: address.zip_code || '',
            latitude: address.latitude,
            longitude: address.longitude,
            is_default: address.is_default,
        });
        setShowAddForm(true);
    };

    const handleDeleteAddress = (addressId: string) => {
        Alert.alert(
            'Eliminar Dirección',
            '¿Estás seguro de que quieres eliminar esta dirección?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ProfileService.deleteAddress(addressId);
                            await loadAddresses();
                            Alert.alert('Éxito', 'Dirección eliminada');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar la dirección');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;

        try {
            await ProfileService.setDefaultAddress(user.id, addressId);
            await loadAddresses();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo establecer como predeterminada');
        }
    };

    const handleSaveAddress = async () => {
        if (!user) return;

        if (!formData.name || !formData.address) {
            Alert.alert('Error', 'Completa al menos el nombre y la dirección');
            return;
        }

        try {
            if (editingAddress) {
                await ProfileService.updateAddress(editingAddress.id!, formData);
                Alert.alert('Éxito', 'Dirección actualizada');
            } else {
                await ProfileService.createAddress({
                    user_id: user.id,
                    ...formData,
                });
                Alert.alert('Éxito', 'Dirección agregada');
            }
            setShowAddForm(false);
            await loadAddresses();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar la dirección');
        }
    };

    const handleSelectLocation = () => {
        // TODO: Implementar selector de ubicación con mapa
        Alert.alert('Próximamente', 'El selector de ubicación con mapa estará disponible pronto');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text variant="h2" weight="bold">
                            Mis Direcciones
                        </Text>
                    </View>

                    {/* Lista de Direcciones */}
                    {!showAddForm && (
                        <>
                            <View style={styles.addressesSection}>
                                {addresses.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="location-outline" size={64} color={theme.textSecondary} />
                                        <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                                            No hay direcciones guardadas
                                        </Text>
                                        <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                                            Agrega direcciones para facilitar tus solicitudes de servicio
                                        </Text>
                                    </View>
                                ) : (
                                    addresses.map((address) => (
                                        <Card key={address.id} variant="elevated" style={styles.addressCard}>
                                            <View style={styles.addressHeader}>
                                                <View style={styles.addressInfo}>
                                                    <View style={styles.addressTitleRow}>
                                                        <Text variant="h3" weight="bold" style={styles.addressName}>
                                                            {address.name}
                                                        </Text>
                                                        {address.is_default && (
                                                            <Badge variant="verified" style={styles.defaultBadge}>
                                                                Predeterminada
                                                            </Badge>
                                                        )}
                                                    </View>
                                                    <Text variant="body" color={theme.textSecondary} style={styles.addressText}>
                                                        {address.address}
                                                    </Text>
                                                    {(address.city || address.state) && (
                                                        <Text variant="caption" color={theme.textSecondary}>
                                                            {[address.city, address.state, address.zip_code]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={styles.addressActions}>
                                                {!address.is_default && (
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => address.id && handleSetDefault(address.id)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="star-outline" size={20} color={theme.primary} />
                                                        <Text variant="caption" color={theme.primary}>
                                                            Predeterminada
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleEditAddress(address)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons name="pencil" size={20} color={theme.text} />
                                                    <Text variant="caption">Editar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => address.id && handleDeleteAddress(address.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                    <Text variant="caption" color="#EF4444">
                                                        Eliminar
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Card>
                                    ))
                                )}
                            </View>

                            {/* Botón Agregar */}
                            <View style={styles.addButtonSection}>
                                <Button
                                    title="Agregar Dirección"
                                    onPress={handleAddAddress}
                                    icon={<Ionicons name="add" size={20} color="#FFFFFF" />}
                                    style={styles.addButton}
                                />
                            </View>
                        </>
                    )}

                    {/* Formulario de Agregar/Editar */}
                    {showAddForm && (
                        <View style={styles.formSection}>
                            <Card variant="elevated" style={styles.formCard}>
                                <Text variant="h3" weight="bold" style={styles.formTitle}>
                                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                                </Text>

                                {/* Nombre */}
                                <View style={styles.inputContainer}>
                                    <Text variant="label" weight="medium" style={styles.label}>
                                        Nombre (ej: Casa, Oficina)
                                    </Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                        <Ionicons name="home-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Casa"
                                            placeholderTextColor={theme.textSecondary}
                                            value={formData.name}
                                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        />
                                    </View>
                                </View>

                                {/* Dirección */}
                                <View style={styles.inputContainer}>
                                    <Text variant="label" weight="medium" style={styles.label}>
                                        Dirección
                                    </Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                        <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Calle, número, colonia"
                                            placeholderTextColor={theme.textSecondary}
                                            value={formData.address}
                                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                                            multiline
                                        />
                                    </View>
                                </View>

                                {/* Ciudad */}
                                <View style={styles.inputContainer}>
                                    <Text variant="label" weight="medium" style={styles.label}>
                                        Ciudad
                                    </Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                        <Ionicons name="business-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Ciudad de México"
                                            placeholderTextColor={theme.textSecondary}
                                            value={formData.city}
                                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                                        />
                                    </View>
                                </View>

                                {/* Estado y Código Postal */}
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                        <Text variant="label" weight="medium" style={styles.label}>
                                            Estado
                                        </Text>
                                        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                placeholder="CDMX"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formData.state}
                                                onChangeText={(text) => setFormData({ ...formData, state: text })}
                                            />
                                        </View>
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                                        <Text variant="label" weight="medium" style={styles.label}>
                                            Código Postal
                                        </Text>
                                        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                placeholder="01234"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formData.zip_code}
                                                onChangeText={(text) => setFormData({ ...formData, zip_code: text })}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Selector de Ubicación */}
                                <Button
                                    title="Seleccionar en Mapa"
                                    variant="outline"
                                    onPress={handleSelectLocation}
                                    icon={<Ionicons name="map-outline" size={20} color={theme.primary} />}
                                    style={styles.mapButton}
                                />

                                {/* Dirección Predeterminada */}
                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={formData.is_default ? 'checkbox' : 'checkbox-outline'}
                                        size={24}
                                        color={formData.is_default ? theme.primary : theme.textSecondary}
                                    />
                                    <Text variant="body" style={styles.checkboxLabel}>
                                        Establecer como dirección predeterminada
                                    </Text>
                                </TouchableOpacity>

                                {/* Botones */}
                                <View style={styles.formActions}>
                                    <Button
                                        title="Guardar"
                                        onPress={handleSaveAddress}
                                        style={styles.saveButton}
                                    />
                                    <Button
                                        title="Cancelar"
                                        variant="outline"
                                        onPress={() => setShowAddForm(false)}
                                        style={styles.cancelButton}
                                    />
                                </View>
                            </Card>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    addressesSection: {
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
    },
    addressCard: {
        marginBottom: 16,
    },
    addressHeader: {
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
    },
    addressTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    addressName: {
        flex: 1,
    },
    defaultBadge: {
        marginLeft: 8,
    },
    addressText: {
        marginBottom: 4,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addButtonSection: {
        padding: 20,
    },
    addButton: {
        marginBottom: 8,
    },
    formSection: {
        padding: 20,
    },
    formCard: {
        padding: 16,
    },
    formTitle: {
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    rowInputs: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    mapButton: {
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    checkboxLabel: {
        flex: 1,
    },
    formActions: {
        gap: 12,
    },
    saveButton: {
        marginBottom: 8,
    },
    cancelButton: {
        marginTop: 0,
    },
});


import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TULBOX_COLORS } from '@/constants/Colors';
import { ReviewsService } from '@/services/reviews';

interface CompleteServiceModalProps {
    visible: boolean;
    lead: {
        id: string;
        servicio_solicitado?: string | null;
        servicio?: string | null;
        professional_id?: string | null;
        cliente_id: string;
    };
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function CompleteServiceModal({ visible, lead, onClose, onConfirm }: CompleteServiceModalProps) {
    const { theme } = useTheme();
    const [isCompleting, setIsCompleting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleConfirm = async () => {
        const profId = lead.professional_id;

        if (!profId) {
            Alert.alert('Error', 'No se pudo identificar al profesional para calificarlo.');
            return;
        }

        try {
            setIsCompleting(true);

            console.log('[CompleteServiceModal] Data for review:', {
                lead_id: lead.id,
                client_id: lead.cliente_id,
                professional_id: profId,
                rating,
                comment: comment.trim() || 'Servicio excelente.',
            });

            // 1. Completar el lead
            await onConfirm();

            // 2. Crear la reseña
            const reviewResult = await ReviewsService.createReview({
                lead_id: lead.id,
                client_id: lead.cliente_id,
                professional_id: profId,
                rating,
                comment: comment.trim() || 'Servicio excelente.',
            });

            if (reviewResult.success) {
                Alert.alert('¡Excelente!', 'El servicio ha sido completado y tu reseña ha sido enviada.');
                onClose();
            } else {
                // reviewResult.error ya es un string con el mensaje detallado gracias al cambio previo en ReviewsService
                throw new Error(`Servicio completado, pero la reseña falló: ${reviewResult.error}`);
            }
        } catch (error: any) {
            console.error('[CompleteServiceModal] Error:', error);
            Alert.alert(
                'Estado parcial',
                error.message || 'Ocurrió un error al finalizar.',
                [{ text: 'OK', onPress: onClose }]
            );
        } finally {
            setIsCompleting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i)}
                    activeOpacity={0.7}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={40}
                        color={i <= rating ? "#FBBF24" : theme.textSecondary}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        {/* Header decorativo */}
                        <View style={[styles.header, { backgroundColor: TULBOX_COLORS.PURPLE + '15' }]}>
                            <View style={[styles.iconContainer, { backgroundColor: TULBOX_COLORS.PURPLE }]}>
                                <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
                            </View>
                            <Text variant="h2" weight="bold" style={{ marginTop: 16 }}>
                                Trabajo Completado
                            </Text>
                            <Text variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                                ¡Felicidades! Finaliza el servicio y califica la experiencia con tu profesional.
                            </Text>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Información del servicio */}
                            <View style={styles.fieldSection}>
                                <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.label}>
                                    SERVICIO REALIZADO
                                </Text>
                                <Text variant="body" weight="medium">
                                    {lead.servicio_solicitado || lead.servicio || 'Servicio General'}
                                </Text>
                            </View>

                            {/* Calificación */}
                            <View style={styles.fieldSection}>
                                <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.label}>
                                    CALIFICA AL PROFESIONAL
                                </Text>
                                {renderStars()}
                                <Text variant="body" weight="bold" style={[styles.ratingLabel, { color: '#FBBF24' }]}>
                                    {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy Bueno' : rating === 3 ? 'Bueno' : rating === 2 ? 'Regular' : 'Malo'}
                                </Text>
                            </View>

                            {/* Comentarios */}
                            <View style={styles.fieldSection}>
                                <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.label}>
                                    TU OPINIÓN (OPCIONAL)
                                </Text>
                                <TextInput
                                    style={[styles.commentInput, {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.surface
                                    }]}
                                    placeholder="Cuéntanos qué te pareció el servicio..."
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                    value={comment}
                                    onChangeText={setComment}
                                    maxLength={300}
                                />
                                <Text variant="caption" color={theme.textSecondary} style={{ textAlign: 'right', marginTop: 4 }}>
                                    {comment.length}/300
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Footer con botones */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <Button
                                title="Cancelar"
                                onPress={onClose}
                                variant="outline"
                                style={styles.footerButton}
                                disabled={isCompleting}
                            />
                            <Button
                                title={isCompleting ? 'Procesando...' : 'Finalizar y Calificar'}
                                onPress={handleConfirm}
                                variant="primary"
                                style={[styles.footerButton, { backgroundColor: TULBOX_COLORS.PURPLE }]}
                                disabled={isCompleting}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        maxHeight: '90%',
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        padding: 24,
    },
    fieldSection: {
        marginBottom: 24,
    },
    label: {
        letterSpacing: 1,
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingLabel: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
    },
    commentInput: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        gap: 12,
    },
    footerButton: {
        flex: 1,
    },
});

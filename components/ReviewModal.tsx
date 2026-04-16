/**
 * ReviewModal - Propuesta de Vanguardia
 * Permite calificar o modificar una calificación existente
 * Diseñado con estética premium, chips de opinión rápida y controles intuitivos
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TULBOX_COLORS } from '@/constants/Colors';
import { ReviewsService, Review } from '@/services/reviews';

const { width } = Dimensions.get('window');

interface ReviewModalProps {
    visible: boolean;
    leadId: string;
    clientId: string;
    professionalId: string;
    existingReview?: Review | null;
    onClose: () => void;
    onSave: (review: Review) => void;
}

const QUICK_TAGS = [
    'Puntualidad', 'Limpieza', 'Profesionalismo', 'Calidad', 'Precio Justo', 'Comunicación'
];

export function ReviewModal({
    visible,
    leadId,
    clientId,
    professionalId,
    existingReview,
    onClose,
    onSave
}: ReviewModalProps) {
    const { theme } = useTheme();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || '');
        } else {
            setRating(5);
            setComment('');
        }
    }, [existingReview, visible]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let result;
            if (existingReview) {
                result = await ReviewsService.updateReview(existingReview.id, {
                    rating,
                    comment: comment.trim()
                });
            } else {
                result = await ReviewsService.createReview({
                    lead_id: leadId,
                    client_id: clientId,
                    professional_id: professionalId,
                    rating,
                    comment: comment.trim() || 'Servicio excelente'
                });
            }

            if (result.success && result.data) {
                onSave(result.data);
                onClose();
            }
        } catch (error) {
            console.error('[ReviewModal] Error saving review:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tag: string) => {
        if (comment.includes(tag)) {
            setComment(comment.replace(`${tag}. `, '').replace(tag, ''));
        } else {
            setComment(comment + (comment ? '. ' : '') + tag);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i)}
                    style={styles.starButton}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={44}
                        color={i <= rating ? '#FBBF24' : '#D1D5DB'}
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
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={[styles.content, { backgroundColor: theme.background }]}>
                        <View style={styles.header}>
                            <View style={styles.handle} />
                            <Text variant="h2" weight="bold" style={styles.title}>
                                {existingReview ? 'Editar Calificación' : 'Calificar Servicio'}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                            <View style={styles.ratingSection}>
                                <Text variant="body" color={theme.textSecondary} style={styles.subtitle}>
                                    ¿Qué te pareció el trabajo realizado?
                                </Text>
                                {renderStars()}
                                <Text variant="h3" weight="bold" style={[styles.ratingText, { color: '#FBBF24' }]}>
                                    {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy bueno' : rating === 3 ? 'Bueno' : rating === 2 ? 'Regular' : 'Malo'}
                                </Text>
                            </View>

                            <View style={styles.tagsSection}>
                                <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.sectionLabel}>
                                    ETIQUETAS RÁPIDAS
                                </Text>
                                <View style={styles.tagsContainer}>
                                    {QUICK_TAGS.map(tag => (
                                        <TouchableOpacity
                                            key={tag}
                                            onPress={() => toggleTag(tag)}
                                            style={[
                                                styles.tag,
                                                { borderColor: theme.border },
                                                comment.includes(tag) && { backgroundColor: TULBOX_COLORS.PURPLE, borderColor: TULBOX_COLORS.PURPLE }
                                            ]}
                                        >
                                            <Text
                                                variant="caption"
                                                weight="medium"
                                                style={{ color: comment.includes(tag) ? '#FFF' : theme.textSecondary }}
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.commentSection}>
                                <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.sectionLabel}>
                                    RESEÑA DETALLADA
                                </Text>
                                <TextInput
                                    style={[styles.input, {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.surface
                                    }]}
                                    placeholder="Cuéntanos más detalles sobre tu experiencia..."
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                    value={comment}
                                    onChangeText={setComment}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <Button
                                title={isSaving ? "Guardando..." : (existingReview ? "Actualizar Reseña" : "Enviar Calificación")}
                                onPress={handleSave}
                                variant="primary"
                                style={[styles.saveButton, { backgroundColor: TULBOX_COLORS.PURPLE }]}
                                disabled={isSaving}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        width: '100%',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: Dimensions.get('window').height * 0.85,
    },
    header: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 20,
    },
    title: {
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 24,
    },
    scroll: {
        paddingHorizontal: 24,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    subtitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 18,
    },
    sectionLabel: {
        marginBottom: 12,
        letterSpacing: 1,
    },
    tagsSection: {
        marginBottom: 28,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    commentSection: {
        marginBottom: 24,
    },
    input: {
        borderRadius: 20,
        padding: 16,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        borderWidth: 1,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    saveButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
    },
});

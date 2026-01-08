import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { getClientScheduledServices, formatTimeSlot, Appointment } from '@/services/scheduling';
import { supabase } from '@/lib/supabase';
import { SUMEE_COLORS } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SUMEE_PURPLE = SUMEE_COLORS.PURPLE;
const SUMEE_GREEN = SUMEE_COLORS.GREEN;
const SUMEE_ORANGE = '#F59E0B';

// Helper functions
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const getDayName = (date: Date): string => {
    return date.toLocaleDateString('es-MX', { weekday: 'short' });
};

const getDayNumber = (date: Date): string => {
    return date.getDate().toString();
};

const getWeekRange = (date: Date): string => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    const endMonth = endOfWeek.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    const year = startOfWeek.getFullYear();

    return `${startMonth} - ${endMonth}, ${year}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'accepted':
        case 'confirmed':
            return SUMEE_PURPLE;
        case 'in_progress':
        case 'en_progreso':
            return SUMEE_ORANGE;
        case 'completed':
            return SUMEE_GREEN;
        case 'cancelled':
            return '#EF4444';
        default:
            return '#6B7280';
    }
};

const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'accepted':
        case 'confirmed':
            return 'Confirmado';
        case 'in_progress':
        case 'en_progreso':
            return 'En Progreso';
        case 'completed':
            return 'Completado';
        case 'cancelled':
            return 'Cancelado';
        case 'pending':
            return 'Pendiente';
        default:
            return status;
    }
};

interface ScheduledService {
    id: string;
    servicio_solicitado: string;
    servicio: string;
    descripcion_proyecto: string;
    ubicacion_direccion: string;
    agreed_price: number;
    price: number;
    appointment_date: string;
    appointment_time: string;
    appointment_status: string;
    status: string;
    professional_id?: string;
    professional?: {
        full_name: string;
    };
}

export default function CalendarScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [scheduledServices, setScheduledServices] = useState<ScheduledService[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // Calculate week start (Monday) and end (Sunday)
    const weekStart = useMemo(() => {
        const date = new Date(currentWeek);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }, [currentWeek]);

    const weekEnd = useMemo(() => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + 6);
        date.setHours(23, 59, 59, 999);
        return date;
    }, [weekStart]);

    // Generate calendar days for the week
    const calendarDays = useMemo(() => {
        const days: Array<{ date: Date; services: number }> = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);

            // Count services for this day
            const dayServices = scheduledServices.filter((service) => {
                if (!service.appointment_date) return false;
                const serviceDate = new Date(service.appointment_date);
                serviceDate.setHours(0, 0, 0, 0);
                return isSameDay(serviceDate, date);
            });

            days.push({
                date,
                services: dayServices.length,
            });
        }

        return days;
    }, [scheduledServices, weekStart]);

    // Calculate week summary
    const weekSummary = useMemo(() => {
        const weekServices = scheduledServices.filter((service) => {
            if (!service.appointment_date) return false;
            const serviceDate = new Date(service.appointment_date);
            return serviceDate >= weekStart && serviceDate <= weekEnd;
        });

        const totalServices = weekServices.length;
        const totalSpent = weekServices.reduce((sum, service) => {
            const price = service.agreed_price ? parseFloat(String(service.agreed_price)) : (service.price || 0);
            return sum + price;
        }, 0);

        return { totalServices, totalSpent };
    }, [scheduledServices, weekStart, weekEnd]);

    // Calculate day summary
    const daySummary = useMemo(() => {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        const dayServices = scheduledServices.filter((service) => {
            if (!service.appointment_date) return false;
            const serviceDate = new Date(service.appointment_date);
            serviceDate.setHours(0, 0, 0, 0);
            return isSameDay(serviceDate, selected);
        });

        const totalServices = dayServices.length;
        const totalSpent = dayServices.reduce((sum, service) => {
            const price = service.agreed_price ? parseFloat(String(service.agreed_price)) : (service.price || 0);
            return sum + price;
        }, 0);

        return { totalServices, totalSpent };
    }, [scheduledServices, selectedDate]);

    // Load scheduled services
    const loadScheduledServices = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const services = await getClientScheduledServices(user.id, weekStart, weekEnd);
            setScheduledServices(services);
        } catch (error) {
            console.error('[Calendar] Load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadScheduledServices();
    }, [user?.id, weekStart]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('client-appointments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `cliente_id=eq.${user.id}`,
                },
                () => {
                    loadScheduledServices();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeek(newWeek);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadScheduledServices();
    };

    const getServicesForDate = (date: Date): ScheduledService[] => {
        return scheduledServices.filter((service) => {
            if (!service.appointment_date) return false;
            const serviceDate = new Date(service.appointment_date);
            serviceDate.setHours(0, 0, 0, 0);
            return isSameDay(serviceDate, date);
        });
    };

    const handleServicePress = (serviceId: string) => {
        router.push(`/lead/${serviceId}`);
    };

    const selectedDayServices = getServicesForDate(selectedDate);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.card }]}>
                    <Text variant="h2" weight="bold" style={styles.headerTitle}>
                        Mi Agenda
                    </Text>
                    <Text variant="caption" color={theme.textSecondary}>
                        Servicios agendados y programados
                    </Text>
                </View>

                {/* Week Range with Navigation */}
                <View style={[styles.weekRangeContainer, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        onPress={() => navigateWeek('prev')}
                        style={styles.weekNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text variant="h3" weight="bold" style={styles.weekRangeText}>
                        {getWeekRange(currentWeek)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigateWeek('next')}
                        style={styles.weekNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-forward" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Week Summary */}
                <View style={styles.summarySection}>
                    <Card variant="elevated" style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                <Text variant="body" weight="bold" style={styles.summaryValue}>
                                    {weekSummary.totalServices}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Servicios
                                </Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.summaryItem}>
                                <Ionicons name="cash-outline" size={20} color={SUMEE_GREEN} />
                                <Text variant="body" weight="bold" style={styles.summaryValue}>
                                    ${weekSummary.totalSpent.toFixed(2)}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Total
                                </Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Calendar Days */}
                <View style={styles.calendarSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.calendarDaysContainer}
                    >
                        {calendarDays.map((day, index) => {
                            const isSelected = isSameDay(day.date, selectedDate);
                            const isToday = isSameDay(day.date, new Date());

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCard,
                                        {
                                            backgroundColor: isSelected ? SUMEE_PURPLE : theme.card,
                                            borderColor: isToday && !isSelected ? SUMEE_GREEN : theme.border,
                                            borderWidth: isToday && !isSelected ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => setSelectedDate(day.date)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        variant="caption"
                                        weight="bold"
                                        style={[
                                            styles.dayName,
                                            {
                                                color: isSelected ? '#FFFFFF' : theme.textSecondary,
                                            },
                                        ]}
                                    >
                                        {getDayName(day.date).toUpperCase()}
                                    </Text>
                                    <Text
                                        variant="h2"
                                        weight="bold"
                                        style={[
                                            styles.dayNumber,
                                            {
                                                color: isSelected ? '#FFFFFF' : theme.text,
                                            },
                                        ]}
                                    >
                                        {getDayNumber(day.date)}
                                    </Text>
                                    {day.services > 0 && (
                                        <View
                                            style={[
                                                styles.servicesBadge,
                                                {
                                                    backgroundColor: isSelected
                                                        ? 'rgba(255,255,255,0.3)'
                                                        : SUMEE_PURPLE + '20',
                                                },
                                            ]}
                                        >
                                            <Text
                                                variant="caption"
                                                weight="bold"
                                                style={{
                                                    color: isSelected ? '#FFFFFF' : SUMEE_PURPLE,
                                                }}
                                            >
                                                {day.services}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Selected Day Info */}
                <View style={styles.dayInfoSection}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        {formatDate(selectedDate)}
                    </Text>
                    <Card variant="elevated" style={styles.daySummaryCard}>
                        <View style={styles.daySummaryRow}>
                            <View style={styles.daySummaryItem}>
                                <Text variant="body" weight="bold">
                                    {daySummary.totalServices}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Servicios
                                </Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.daySummaryItem}>
                                <Text variant="body" weight="bold" color={SUMEE_GREEN}>
                                    ${daySummary.totalSpent.toFixed(2)}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Total
                                </Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Services List for Selected Day */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : selectedDayServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
                        <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                            No hay servicios agendados
                        </Text>
                        <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                            No tienes servicios programados para este día
                        </Text>
                    </View>
                ) : (
                    <View style={styles.servicesSection}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Servicios del Día
                        </Text>
                        {selectedDayServices
                            .sort((a, b) => {
                                const timeA = a.appointment_time || '';
                                const timeB = b.appointment_time || '';
                                return timeA.localeCompare(timeB);
                            })
                            .map((service) => (
                                <Card
                                    key={service.id}
                                    variant="elevated"
                                    style={styles.serviceCard}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleServicePress(service.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.serviceHeader}>
                                            <View style={styles.serviceInfo}>
                                                <Text variant="h3" weight="bold" style={styles.serviceTitle} numberOfLines={1}>
                                                    {service.servicio_solicitado || service.servicio || 'Servicio'}
                                                </Text>
                                                {service.professional?.full_name && (
                                                    <View style={styles.professionalInfo}>
                                                        <Ionicons name="person" size={14} color={theme.textSecondary} />
                                                        <Text variant="caption" color={theme.textSecondary}>
                                                            {service.professional.full_name}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Badge
                                                variant={
                                                    service.status === 'completed'
                                                        ? 'guarantee'
                                                        : service.status === 'accepted' || service.status === 'confirmed'
                                                        ? 'verified'
                                                        : 'fast-response'
                                                }
                                            >
                                                {getStatusLabel(service.status || service.appointment_status)}
                                            </Badge>
                                        </View>

                                        {service.appointment_time && (
                                            <View style={styles.serviceTime}>
                                                <Ionicons name="time-outline" size={16} color={theme.primary} />
                                                <Text variant="body" weight="medium" color={theme.primary}>
                                                    {formatTimeSlot(service.appointment_time)}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.serviceDetails}>
                                            <View style={styles.serviceDetailItem}>
                                                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                                                <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                                                    {service.ubicacion_direccion || 'Ubicación no especificada'}
                                                </Text>
                                            </View>
                                            <View style={styles.serviceDetailItem}>
                                                <Ionicons name="cash-outline" size={16} color={SUMEE_GREEN} />
                                                <Text variant="body" weight="bold" color={SUMEE_GREEN}>
                                                    ${(service.agreed_price || service.price || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Card>
                            ))}
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        marginBottom: 4,
    },
    weekRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    weekNavButton: {
        padding: 8,
    },
    weekRangeText: {
        flex: 1,
        textAlign: 'center',
    },
    summarySection: {
        padding: 20,
    },
    summaryCard: {
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
        gap: 4,
    },
    summaryValue: {
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        height: '100%',
    },
    calendarSection: {
        paddingVertical: 16,
    },
    calendarDaysContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    dayCard: {
        width: 70,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    dayName: {
        marginBottom: 4,
        fontSize: 10,
    },
    dayNumber: {
        marginBottom: 4,
    },
    servicesBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    dayInfoSection: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    daySummaryCard: {
        padding: 16,
    },
    daySummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    daySummaryItem: {
        alignItems: 'center',
        gap: 4,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
    },
    servicesSection: {
        padding: 20,
    },
    serviceCard: {
        marginBottom: 16,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceInfo: {
        flex: 1,
        marginRight: 12,
    },
    serviceTitle: {
        marginBottom: 4,
    },
    professionalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    serviceTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: SUMEE_PURPLE + '10',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    serviceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
});


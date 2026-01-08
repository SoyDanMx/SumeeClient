/**
 * Marketplace Screen
 * Pantalla completa del marketplace con WebView optimizado
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Linking } from 'react-native';
import { trackMarketplaceEvent } from '@/services/marketplace';

// WebView con fallback
let WebView: any = null;
try {
    WebView = require('react-native-webview').WebView;
} catch (e) {
    console.warn('[Marketplace] react-native-webview not installed, using browser fallback');
}

const MARKETPLACE_URL = 'https://sumeeapp.com/marketplace';

export default function MarketplaceScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string; search?: string; productId?: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const webViewRef = useRef<WebView>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoadedRef = useRef(false);

    // Timeout para el loading (30 segundos)
    useEffect(() => {
        if (loading) {
            loadingTimeoutRef.current = setTimeout(() => {
                if (!hasLoadedRef.current) {
                    console.warn('[Marketplace] Loading timeout - forcing load end');
                    setLoading(false);
                    setError('El marketplace está tardando en cargar. Intenta refrescar o abrir en el navegador.');
                }
            }, 30000); // 30 segundos
        }

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [loading]);

    // Construir URL con parámetros
    const buildMarketplaceUrl = () => {
        let url = MARKETPLACE_URL;
        const paramsArray: string[] = [];

        if (params.category) {
            paramsArray.push(`category=${encodeURIComponent(params.category)}`);
        }
        if (params.search) {
            paramsArray.push(`search=${encodeURIComponent(params.search)}`);
        }
        if (params.productId) {
            url = `${MARKETPLACE_URL}/product/${params.productId}`;
        } else if (paramsArray.length > 0) {
            url += `?${paramsArray.join('&')}`;
        }

        return url;
    };

    const marketplaceUrl = buildMarketplaceUrl();

    const handleBack = () => {
        if (WebView && webViewRef.current) {
            webViewRef.current.goBack();
        } else {
            router.back();
        }
    };

    const handleRefresh = () => {
        if (WebView && webViewRef.current) {
            webViewRef.current.reload();
        } else {
            // Si no hay WebView, abrir en navegador
            handleOpenInBrowser();
        }
    };

    const handleOpenInBrowser = () => {
        trackMarketplaceEvent('marketplace_opened_in_browser', {
            url: marketplaceUrl,
        });
        
        Linking.openURL(marketplaceUrl).catch((err) => {
            console.error('[Marketplace] Error opening in browser:', err);
            Alert.alert('Error', 'No se pudo abrir el marketplace en el navegador');
        });
    };

    const handleWebViewError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        console.error('[Marketplace] WebView error:', nativeEvent);
        
        // Limpiar timeout
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }
        
        setError('Error al cargar el marketplace. Intenta de nuevo.');
        setLoading(false);
        hasLoadedRef.current = true;
    };

    const handleLoadEnd = () => {
        console.log('[Marketplace] Load end');
        
        // Limpiar timeout
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }
        
        setLoading(false);
        setError(null);
        hasLoadedRef.current = true;
        
        trackMarketplaceEvent('marketplace_viewed', {
            url: marketplaceUrl,
            hasParams: !!(params.category || params.search || params.productId),
        });
    };

    const handleLoadStart = () => {
        console.log('[Marketplace] Load start');
        setLoading(true);
        setError(null);
        hasLoadedRef.current = false;
    };

    const handleNavigationStateChange = (navState: any) => {
        console.log('[Marketplace] Navigation state changed:', {
            url: navState.url,
            loading: navState.loading,
            canGoBack: navState.canGoBack,
        });
        
        // Si la navegación terminó y no está cargando, ocultar loading
        if (!navState.loading && hasLoadedRef.current === false) {
            console.log('[Marketplace] Navigation completed, hiding loader');
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
            setLoading(false);
            hasLoadedRef.current = true;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <Text variant="h3" weight="bold" style={styles.headerTitle}>
                        Marketplace
                    </Text>
                    <Text variant="caption" color={theme.textSecondary} style={styles.headerSubtitle}>
                        Herramientas y equipos
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="refresh" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleOpenInBrowser}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="open-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* WebView */}
            <View style={styles.webViewContainer}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text variant="body" color={theme.textSecondary} style={styles.loadingText}>
                            Cargando marketplace...
                        </Text>
                        <TouchableOpacity
                            onPress={handleOpenInBrowser}
                            style={[styles.openBrowserButton, { borderColor: theme.primary }]}
                        >
                            <Text variant="caption" color={theme.primary}>
                                Abrir en navegador
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color={theme.error || '#EF4444'} />
                        <Text variant="body" weight="bold" style={styles.errorText}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            style={[styles.retryButton, { backgroundColor: theme.primary }]}
                        >
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {WebView ? (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: marketplaceUrl }}
                        style={styles.webView}
                        onLoadStart={handleLoadStart}
                        onLoadEnd={handleLoadEnd}
                        onError={handleWebViewError}
                        onHttpError={handleWebViewError}
                        onNavigationStateChange={handleNavigationStateChange}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        scalesPageToFit={true}
                        sharedCookiesEnabled={true}
                        cacheEnabled={true}
                        incognito={false}
                        timeout={30000}
                        userAgent={Platform.select({
                            ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                            android: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                        })}
                    />
                ) : (
                    <View style={styles.fallbackContainer}>
                        <Ionicons name="construct" size={64} color={theme.primary} />
                        <Text variant="h3" weight="bold" style={styles.fallbackTitle}>
                            Marketplace Sumee
                        </Text>
                        <Text variant="body" color={theme.textSecondary} style={styles.fallbackText}>
                            Abre el marketplace en tu navegador para explorar herramientas y equipos profesionales.
                        </Text>
                        <TouchableOpacity
                            onPress={handleOpenInBrowser}
                            style={[styles.fallbackButton, { backgroundColor: theme.primary }]}
                        >
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                Abrir Marketplace
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 11,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 12,
        marginBottom: 16,
    },
    openBrowserButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 32,
        zIndex: 2,
    },
    errorText: {
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    fallbackTitle: {
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    fallbackText: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    fallbackButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
});


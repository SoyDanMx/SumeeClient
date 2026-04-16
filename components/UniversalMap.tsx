import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { getJobIconConfig, getIconSVGPath } from '../services/jobIcons';

const { width } = Dimensions.get('window');

// Brand colors
const TULBOX_PURPLE = '#6D28D9';
const TULBOX_GREEN = '#10B981';

// Helper function to generate Leaflet HTML (reusable for web and Android WebView)
function generateLeafletHTML({
    latitude,
    longitude,
    zoom,
    markers,
    showUserLocation,
    userLocation,
    routePolyline,
}: {
    latitude: number;
    longitude: number;
    zoom: number;
    markers: Array<{
        id: string;
        latitude: number;
        longitude: number;
        type?: 'job' | 'user';
        disciplina?: string;
        servicio?: string;
        servicioSolicitado?: string;
        category?: string;
        title?: string;
        description?: string;
    }>;
    showUserLocation?: boolean;
    userLocation?: { latitude: number; longitude: number };
    routePolyline?: Array<[number, number]>;
}): string {
    // Pre-process markers to get icon configs
    const processedMarkers = markers.filter(m => m.type !== 'user').map((m) => {
        const iconConfig = getJobIconConfig(
            m.disciplina,
            m.servicio,
            m.servicioSolicitado,
            m.category
        );

        // Infer icon name from color
        let iconName = 'map-pin';
        if (iconConfig.color === '#FCD34D') iconName = 'zap';
        else if (iconConfig.color === '#3B82F6') iconName = 'droplet';
        else if (iconConfig.color === '#06B6D4') iconName = 'wind';
        else if (iconConfig.color === '#8B5CF6') iconName = 'wifi';
        else if (iconConfig.color === '#EF4444') iconName = 'shield';
        else if (iconConfig.color === '#D97706') iconName = 'hammer';
        else if (iconConfig.color === '#EC4899') iconName = 'paintbrush';
        else if (iconConfig.color === '#6B7280') iconName = 'wrench';
        else if (iconConfig.color === '#10B981') iconName = 'tv';
        else if (iconConfig.color === '#6366F1') iconName = 'car';
        else if (iconConfig.color === '#F59E0B') iconName = 'smartphone';
        else if (iconConfig.color === '#059669') iconName = 'scissors';
        else if (iconConfig.color === '#DC2626') iconName = 'utensils-crossed';

        return {
            ...m,
            iconConfig,
            iconName,
            svgPath: getIconSVGPath(iconName),
        };
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body, #map { width: 100%; height: 100%; overflow: hidden; }
                .job-marker {
                    background: ${TULBOX_PURPLE};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                }
                .user-marker {
                    background: ${TULBOX_GREEN};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.3);
                }
                .leaflet-control-attribution { font-size: 9px !important; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', {
                    zoomControl: true,
                    attributionControl: true,
                    doubleClickZoom: true,
                    scrollWheelZoom: true,
                    touchZoom: true
                }).setView([${latitude}, ${longitude}], ${zoom});
                
                // Use CartoDB Voyager for cleaner look
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
                    attribution: '© <a href="https://carto.com/">CARTO</a> | © <a href="https://osm.org/">OSM</a>',
                    maxZoom: 19
                }).addTo(map);
                
                // User marker icon
                var userIcon = L.divIcon({
                    className: '',
                    html: '<div class="user-marker"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                // Create job markers with custom icons
                ${processedMarkers.map((m, index) => {
        const iconColor = m.iconConfig.color;
        const bgColor = m.iconConfig.backgroundColor;
        const svgPath = m.svgPath;

        return `
                        var jobIcon${index} = L.divIcon({
                            className: '',
                            html: '<div class="job-marker" style="background: ${bgColor}; border-color: ${iconColor};"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${iconColor}" stroke="${iconColor}" stroke-width="2"><path d="${svgPath}"/></svg></div>',
                            iconSize: [36, 36],
                            iconAnchor: [18, 18]
                        });
                        L.marker([${m.latitude}, ${m.longitude}], {icon: jobIcon${index}}).addTo(map);
                    `;
    }).join('')}
                
                // Add route polyline if available
                ${routePolyline && routePolyline.length > 1 ? `
                    var routePolyline = L.polyline(
                        ${JSON.stringify(routePolyline)},
                        {
                            color: '#6D28D9',
                            weight: 4,
                            opacity: 0.7,
                            smoothFactor: 1
                        }
                    ).addTo(map);
                    map.fitBounds(routePolyline.getBounds());
                ` : ''}
                
                // Add user location if available
                ${showUserLocation && userLocation ? `
                    L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon}).addTo(map);
                ` : ''}
                
                // Add a circle around center for visual effect
                L.circle([${latitude}, ${longitude}], {
                    color: '${TULBOX_PURPLE}',
                    fillColor: '${TULBOX_PURPLE}',
                    fillOpacity: 0.1,
                    weight: 1,
                    radius: 500
                }).addTo(map);
            </script>
        </body>
        </html>
    `;
}

export interface UniversalMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        type?: 'job' | 'user';
        disciplina?: string;
        servicio?: string;
        servicioSolicitado?: string;
        category?: string;
    }>;
    showUserLocation?: boolean;
    userLocation?: { latitude: number; longitude: number };
    routePolyline?: Array<[number, number]>;
    style?: any;
    interactive?: boolean;
}

/**
 * UniversalMap - Cross-platform map component using Leaflet
 * Works on Web (via iframe) and Native (via WebView)
 */
export function UniversalMap({
    latitude,
    longitude,
    zoom = 15,
    markers = [],
    showUserLocation = false,
    userLocation,
    routePolyline,
    style,
    interactive = true,
}: UniversalMapProps) {
    const leafletHtml = generateLeafletHTML({
        latitude,
        longitude,
        zoom,
        markers,
        showUserLocation,
        userLocation,
        routePolyline,
    });

    // For web: Use Leaflet embedded via iframe
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, style]}>
                <iframe
                    srcDoc={leafletHtml}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 0,
                    }}
                    title="Mapa de ubicación"
                    sandbox="allow-scripts allow-same-origin"
                />
            </View>
        );
    }

    // For Android and iOS: Use Leaflet in WebView
    return (
        <View style={[styles.container, style]}>
            <WebView
                source={{ html: leafletHtml }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('[UniversalMap] ❌ WebView error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('[UniversalMap] ❌ WebView HTTP error:', nativeEvent);
                }}
                onLoadEnd={() => {
                    console.log('[UniversalMap] ✅ Leaflet WebView cargado correctamente');
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        overflow: 'hidden',
    },
    webview: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
});

export default UniversalMap;

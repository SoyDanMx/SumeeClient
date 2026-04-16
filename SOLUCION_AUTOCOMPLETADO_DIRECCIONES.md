# 🔧 Solución: Autocompletado de Direcciones

## 🔍 Problema Identificado

El autocompletado de direcciones no funciona correctamente. Posibles causas:
1. **CORS en Nominatim**: OpenStreetMap puede bloquear requests desde React Native
2. **Z-index del dropdown**: El dropdown puede estar detrás del modal
3. **ScrollView anidado**: El ScrollView del modal puede estar bloqueando interacciones

## ✅ Soluciones Implementadas

### **1. Servicio de Autocompletado**
- ✅ Creado `services/addressAutocomplete.ts`
- ✅ Usa OpenStreetMap Nominatim (gratuito)
- ✅ Logging detallado para debugging

### **2. Componente EditLeadModal**
- ✅ FlatList en lugar de ScrollView (mejor rendimiento)
- ✅ Z-index alto (1000) para el dropdown
- ✅ Debounce de 400ms
- ✅ Indicador de carga
- ✅ Debug info en desarrollo

## 🚀 Solución Alternativa (Si Nominatim no funciona)

Si Nominatim tiene problemas de CORS, podemos usar:

### **Opción 1: Google Places API (Recomendado)**
```typescript
// Si tienes GOOGLE_MAPS_API_KEY en .env
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (GOOGLE_MAPS_API_KEY) {
    // Usar Google Places Autocomplete
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_MAPS_API_KEY}&components=country:mx&language=es`;
}
```

### **Opción 2: Crear Endpoint en Backend**
Crear un endpoint en `Sumeeapp-B` que haga el proxy a Nominatim:
```typescript
// Sumeeapp-B/app/api/address/autocomplete/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    // Hacer request a Nominatim desde el servidor (sin CORS)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}...`);
    return Response.json(await response.json());
}
```

### **Opción 3: Usar expo-location reverseGeocodeAsync**
Para obtener direcciones desde coordenadas (si el usuario tiene GPS):
```typescript
import * as Location from 'expo-location';

const [location] = await Location.reverseGeocodeAsync({
    latitude: lat,
    longitude: lng,
});
```

## 📋 Para Debugging

Revisa la consola cuando escribas en el campo "Ubicación":

1. **Si ves logs de `[AddressAutocomplete]`**: El servicio está funcionando
2. **Si ves `Sugerencias encontradas: 0`**: Nominatim no encontró resultados
3. **Si ves errores de CORS**: Necesitas usar Opción 1 o 2
4. **Si no ves logs**: El `handleAddressChange` no se está ejecutando

## 🎯 Próximos Pasos

1. Probar el autocompletado actual
2. Revisar logs en la consola
3. Si hay errores de CORS, implementar Opción 2 (endpoint en backend)
4. Si no hay API key de Google, usar Opción 2


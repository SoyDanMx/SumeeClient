# 🚀 Paso 5: Generar Embeddings para Servicios Existentes

## 📋 Objetivo

Generar embeddings vectoriales para todos los servicios en `service_catalog` y guardarlos en `service_embeddings`. Esto permitirá realizar búsqueda semántica de servicios.

---

## 🎯 Opciones de Ejecución

### **Opción 1: Desde la App (Recomendado) 🎨**

Crear una pantalla temporal o función en la app para ejecutar el script.

#### **A. Crear Pantalla Temporal**

**Archivo:** `app/admin/generate-embeddings.tsx` (temporal)

```typescript
import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, ScrollView } from 'react-native';
import { generateAllServiceEmbeddings } from '@/scripts/generate-service-embeddings';

export default function GenerateEmbeddingsScreen() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const handleGenerate = async () => {
        setLoading(true);
        setLogs([]);

        // Interceptar console.log para mostrar en pantalla
        const originalLog = console.log;
        console.log = (...args: any[]) => {
            originalLog(...args);
            setLogs(prev => [...prev, args.join(' ')]);
        };

        try {
            await generateAllServiceEmbeddings();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            console.log = originalLog;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Generar Embeddings de Servicios</Text>
            <Button
                title={loading ? 'Generando...' : 'Generar Embeddings'}
                onPress={handleGenerate}
                disabled={loading}
            />
            <ScrollView style={styles.logs}>
                {logs.map((log, i) => (
                    <Text key={i} style={styles.log}>{log}</Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    logs: { marginTop: 20, flex: 1 },
    log: { fontSize: 12, fontFamily: 'monospace' },
});
```

#### **B. Agregar Ruta Temporal**

En `app/_layout.tsx`, agregar temporalmente:

```typescript
<Stack.Screen 
    name="admin/generate-embeddings" 
    component={GenerateEmbeddingsScreen} 
/>
```

Luego navegar a: `/admin/generate-embeddings`

---

### **Opción 2: Desde Terminal (TypeScript) 💻**

Si tienes `ts-node` instalado:

```bash
# Instalar ts-node si no lo tienes
npm install -g ts-node

# Ejecutar el script
npx ts-node scripts/generate-service-embeddings.ts
```

---

### **Opción 3: Desde la Consola de la App (Más Simple) 🎯**

Agregar un botón temporal en alguna pantalla de desarrollo:

**En cualquier pantalla de desarrollo:**

```typescript
import { generateAllServiceEmbeddings } from '@/scripts/generate-service-embeddings';

// En algún botón o función
const handleGenerateEmbeddings = async () => {
    console.log('🚀 Iniciando generación de embeddings...');
    await generateAllServiceEmbeddings();
};
```

---

## 📊 Proceso

El script:

1. **Obtiene todos los servicios activos** de `service_catalog`
2. **Para cada servicio:**
   - Construye texto: `service_name + discipline + description`
   - Genera embedding usando `EmbeddingService.generateEmbedding()`
   - Guarda en `service_embeddings` con formato pgvector
3. **Muestra progreso** en tiempo real
4. **Genera resumen final** con estadísticas

---

## ⏱️ Tiempo Estimado

- **~500ms por servicio** (incluyendo pausa entre requests)
- **Para 66 servicios:** ~33 segundos
- **Para 100 servicios:** ~50 segundos

---

## ✅ Verificación

Después de ejecutar, verifica que los embeddings se generaron:

```sql
-- Ver cuántos embeddings se generaron
SELECT 
    COUNT(*) as total_embeddings,
    COUNT(DISTINCT discipline) as disciplines_covered
FROM service_embeddings;

-- Ver algunos ejemplos
SELECT 
    se.service_name,
    se.discipline,
    LENGTH(se.embedding::text) as embedding_length,
    se.updated_at
FROM service_embeddings se
ORDER BY se.updated_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### **Error: "Edge Function not found"**
- Verifica que `generate-embedding` esté desplegada
- Verifica que `HUGGINGFACE_API_KEY` esté configurado

### **Error: "Rate limit exceeded"**
- El script incluye pausa de 500ms entre requests
- Si persiste, aumenta la pausa a 1000ms en el script

### **Error: "Invalid embedding format"**
- Verifica que la Edge Function esté funcionando
- Prueba generar un embedding manualmente primero

### **Algunos servicios fallan**
- Revisa los logs para ver qué servicios fallaron
- Puedes ejecutar el script nuevamente (usa `upsert`, no duplicará)

---

## 🎯 Después de Generar Embeddings

Una vez que todos los embeddings estén generados:

1. ✅ **Paso 5 Completado**
2. 🚀 **Paso 6:** Crear función SQL `find_similar_services`
3. 🚀 **Paso 7:** Integrar búsqueda semántica en la app

---

## 📝 Notas

- El script usa `upsert`, así que puedes ejecutarlo múltiples veces sin duplicar
- Los embeddings se actualizan si el servicio cambia
- El proceso es idempotente (seguro ejecutar múltiples veces)

---

**¿Listo para generar embeddings?** 🚀


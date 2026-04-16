# 🚀 Generar Embeddings para Todos los Servicios

## ✅ Estado Actual

- ✅ Edge Function `generate-embedding` desplegada y funcionando
- ✅ Formato de embedding corregido (array de números)
- ✅ Script de generación mejorado con estadísticas
- ✅ Pantalla admin configurada

## 📋 Instrucciones

### **Opción 1: Usar la Pantalla Admin (Recomendado)**

1. **Iniciar Expo:**
   ```bash
   cd SumeeClient
   npx expo start
   ```

2. **Navegar a la pantalla admin:**
   - Abre la app en tu dispositivo/emulador
   - Navega a: `/admin/generate-embeddings`
   - O usa el navegador: `exp://localhost:8081/--/admin/generate-embeddings`

3. **Generar embeddings:**
   - Presiona el botón "Generar Embeddings"
   - Observa el progreso en tiempo real
   - Verás logs y estadísticas finales

### **Opción 2: Ejecutar desde el Código**

Si prefieres ejecutar desde otro lugar en la app:

```typescript
import { generateAllServiceEmbeddings } from '@/scripts/generate-service-embeddings';

// Ejecutar
const stats = await generateAllServiceEmbeddings();
console.log('Estadísticas:', stats);
```

## 📊 Qué Hace el Script

1. **Obtiene todos los servicios activos** de `service_catalog`
2. **Genera embedding para cada servicio** usando:
   - Nombre del servicio
   - Disciplina
   - Descripción (si existe)
3. **Guarda en `service_embeddings`** con:
   - `service_id`
   - `service_name`
   - `discipline`
   - `embedding` (vector de 384 dimensiones)
4. **Muestra progreso y estadísticas**:
   - Total de servicios
   - Exitosos
   - Errores
   - Tasa de éxito

## ⚙️ Configuración Requerida

- ✅ Edge Function `generate-embedding` desplegada
- ✅ `HUGGINGFACE_API_KEY` configurado en Supabase
- ✅ Tabla `service_embeddings` creada
- ✅ Variables de entorno configuradas:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🔍 Verificar Resultados

Después de ejecutar, verifica en Supabase:

```sql
-- Ver cuántos embeddings se generaron
SELECT COUNT(*) as total_embeddings 
FROM service_embeddings;

-- Ver embeddings recientes
SELECT 
    service_name,
    discipline,
    LENGTH(embedding::text) as embedding_size,
    updated_at
FROM service_embeddings
ORDER BY updated_at DESC
LIMIT 10;
```

## ⚠️ Notas Importantes

1. **Tiempo estimado:** ~1-2 minutos para 66 servicios (con pausa de 500ms entre cada uno)
2. **Rate limiting:** El script incluye una pausa de 500ms entre requests para no sobrecargar la API
3. **Errores:** Si algún servicio falla, se registrará en los logs pero el proceso continuará
4. **Re-ejecutar:** Puedes ejecutar el script múltiples veces, usará `upsert` para actualizar embeddings existentes

## 🎯 Próximos Pasos

Después de generar los embeddings:

1. ✅ Crear función SQL `find_similar_services` para búsqueda semántica
2. ✅ Integrar búsqueda semántica en la app
3. ✅ Probar búsquedas con queries naturales

---

**Última actualización:** Enero 2025


# ✅ Función SQL `find_similar_services` - Resumen

## 📋 Estado

✅ **Función SQL creada y lista para usar**

## 📁 Archivos Creados

1. **`FASE1_CREAR_FUNCION_FIND_SIMILAR_SERVICES.sql`**
   - Función SQL completa con documentación
   - Incluye verificación de tabla
   - Incluye creación de índice pgvector si no existe
   - Incluye comentarios y ejemplos

2. **`FASE1_TEST_FUNCION_FIND_SIMILAR.md`**
   - Guía de pruebas
   - Ejemplos de uso
   - Troubleshooting

## 🔧 Características de la Función

### **Parámetros:**
- `query_embedding`: `vector(384)` - Embedding del query del usuario
- `limit_count`: `INTEGER` (default: 10) - Número máximo de resultados
- `discipline_filter`: `TEXT` (opcional) - Filtrar por disciplina

### **Retorna:**
- `service_id`: UUID del servicio
- `service_name`: Nombre del servicio
- `discipline`: Disciplina del servicio
- `similarity`: Similitud coseno (0.0 a 1.0)
- `min_price`: Precio mínimo del servicio

### **Algoritmo:**
- Usa **similitud coseno** (`<=>` operador de pgvector)
- Convierte distancia a similitud: `1 - distancia`
- Ordena por similitud (mayor = más similar)
- Filtra solo servicios activos

## 🚀 Cómo Ejecutar

### **1. Ejecutar SQL en Supabase:**

1. Ve a Supabase Dashboard > SQL Editor
2. Copia y pega el contenido de `FASE1_CREAR_FUNCION_FIND_SIMILAR_SERVICES.sql`
3. Ejecuta el script
4. Verifica que la función fue creada:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'find_similar_services';
   ```

### **2. Verificar Índice pgvector:**

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'service_embeddings' 
AND indexname LIKE '%embedding%';
```

### **3. Probar la Función:**

```sql
-- Ejemplo: Buscar servicios similares a "instalación de lámpara"
SELECT * FROM find_similar_services(
    (SELECT embedding FROM service_embeddings WHERE service_name LIKE '%Lámpara%' LIMIT 1),
    10,
    NULL
);
```

## 💻 Uso desde TypeScript

El servicio `EmbeddingService` ya está configurado:

```typescript
import { EmbeddingService } from '@/services/ml/embeddings';

// Buscar servicios similares
const results = await EmbeddingService.findSimilarServices(
    "necesito instalar una lámpara eléctrica",
    10,                    // límite
    "electricidad"         // filtro opcional
);

console.log(results);
// [
//   {
//     service_id: "...",
//     service_name: "Instalación de Lámpara",
//     discipline: "electricidad",
//     similarity: 0.95,
//     min_price: 350.00
//   },
//   ...
// ]
```

## ✅ Checklist de Implementación

- [x] Función SQL creada
- [x] Documentación completa
- [x] Servicio TypeScript configurado
- [ ] **Ejecutar SQL en Supabase** ⬅️ **PENDIENTE**
- [ ] Verificar función creada
- [ ] Probar con query de ejemplo
- [ ] Integrar en la app cliente

## 📊 Próximos Pasos

1. **Ejecutar el SQL** en Supabase SQL Editor
2. **Probar la función** con un query de ejemplo
3. **Integrar en la app** para búsqueda semántica
4. **Reemplazar o complementar** la búsqueda actual con búsqueda semántica

---

**Última actualización:** Enero 2025


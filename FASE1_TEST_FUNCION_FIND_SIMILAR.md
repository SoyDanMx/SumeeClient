# 🧪 Probar la Función `find_similar_services`

## ✅ Función Creada

La función `find_similar_services` está lista para usar. Permite buscar servicios similares usando embeddings vectoriales.

## 📋 Parámetros

- `query_embedding`: `vector(384)` - Embedding del query del usuario
- `limit_count`: `INTEGER` (default: 10) - Número máximo de resultados
- `discipline_filter`: `TEXT` (opcional) - Filtrar por disciplina

## 🔍 Cómo Probar

### **Opción 1: Desde Supabase SQL Editor**

1. **Generar un embedding de prueba:**
   ```sql
   -- Llamar a la Edge Function para generar embedding
   -- O usar un embedding existente de service_embeddings
   SELECT embedding 
   FROM service_embeddings 
   WHERE service_name = 'Instalación de Lámpara'
   LIMIT 1;
   ```

2. **Buscar servicios similares:**
   ```sql
   SELECT * FROM find_similar_services(
       (SELECT embedding FROM service_embeddings WHERE service_name = 'Instalación de Lámpara' LIMIT 1),
       10,
       NULL
   );
   ```

### **Opción 2: Desde la App (TypeScript)**

```typescript
import { EmbeddingService } from '@/services/ml/embeddings';

// Generar embedding del query
const query = "necesito instalar una lámpara eléctrica";
const similarServices = await EmbeddingService.findSimilarServices(query, 10);

console.log('Servicios similares:', similarServices);
```

### **Opción 3: Probar con Diferentes Queries**

```sql
-- Ejemplo 1: Buscar servicios similares a "instalación de lámpara"
SELECT * FROM find_similar_services(
    (SELECT embedding FROM service_embeddings WHERE service_name LIKE '%Lámpara%' LIMIT 1),
    5,
    NULL
);

-- Ejemplo 2: Buscar solo en electricidad
SELECT * FROM find_similar_services(
    (SELECT embedding FROM service_embeddings WHERE service_name LIKE '%Lámpara%' LIMIT 1),
    5,
    'electricidad'
);

-- Ejemplo 3: Ver todos los servicios ordenados por similitud
SELECT * FROM find_similar_services(
    (SELECT embedding FROM service_embeddings WHERE service_name LIKE '%Plomería%' LIMIT 1),
    20,
    NULL
) ORDER BY similarity DESC;
```

## 📊 Resultados Esperados

La función retorna:
- `service_id`: UUID del servicio
- `service_name`: Nombre del servicio
- `discipline`: Disciplina del servicio
- `similarity`: Similitud (0.0 a 1.0, mayor = más similar)
- `min_price`: Precio mínimo del servicio

## ⚠️ Notas Importantes

1. **Embedding debe ser vector(384)**: El embedding debe tener exactamente 384 dimensiones
2. **Índice pgvector**: Asegúrate de que el índice `service_embeddings_embedding_idx` existe
3. **Similitud**: Valores cercanos a 1.0 = muy similar, valores cercanos a 0.0 = poco similar

## 🔧 Troubleshooting

### Error: "function find_similar_services does not exist"
- Ejecuta `FASE1_CREAR_FUNCION_FIND_SIMILAR_SERVICES.sql` en Supabase SQL Editor

### Error: "operator does not exist: vector <=> vector"
- Verifica que la extensión `pgvector` está habilitada:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### Resultados vacíos
- Verifica que hay embeddings en `service_embeddings`:
  ```sql
  SELECT COUNT(*) FROM service_embeddings;
  ```

---

**Última actualización:** Enero 2025


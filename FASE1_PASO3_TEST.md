# 🧪 Test: Edge Function `generate-embedding`

## ✅ Verificación Rápida

### **Opción 1: Desde Supabase Dashboard**

1. Ve a **Edge Functions** > **generate-embedding** > **Test**
2. Usa este JSON de prueba:

```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

3. Deberías recibir una respuesta con:
   - `embedding`: Array de 384 números
   - `dimensions`: 384
   - `text`: "Instalación de lámpara eléctrica"
   - `model`: "all-MiniLM-L6-v2"

---

### **Opción 2: Desde Terminal (cURL)**

```bash
curl -X POST 'https://TU_PROJECT_ID.supabase.co/functions/v1/generate-embedding' \
  -H 'Authorization: Bearer TU_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Instalación de lámpara eléctrica",
    "type": "service"
  }'
```

**Reemplaza:**
- `TU_PROJECT_ID`: Tu project ID de Supabase
- `TU_SUPABASE_ANON_KEY`: Tu anon key de Supabase

---

### **Opción 3: Desde la App (TypeScript)**

Crea un archivo temporal de prueba:

```typescript
// test-embedding.ts (temporal)
import { EmbeddingService } from './services/ml/embeddings';

async function testEmbedding() {
  try {
    console.log('🧪 Testing embedding generation...');
    
    const embedding = await EmbeddingService.generateEmbedding(
      'Instalación de lámpara eléctrica'
    );
    
    console.log('✅ Embedding generated:', {
      dimensions: embedding.length,
      firstValues: embedding.slice(0, 5),
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

testEmbedding();
```

---

## 🔍 Verificación de Respuesta

**Respuesta esperada:**

```json
{
  "embedding": [0.123, -0.456, 0.789, ...], // 384 números
  "dimensions": 384,
  "text": "Instalación de lámpara eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

**Errores comunes:**

1. **503 Service Unavailable**: El modelo de Hugging Face está cargando. La función debería reintentar automáticamente.
2. **401 Unauthorized**: Verifica que el `SUPABASE_ANON_KEY` sea correcto.
3. **400 Bad Request**: Verifica que el JSON tenga el campo `text`.

---

## ✅ Si la prueba es exitosa

Continúa con el **Paso 4: Data Collection Pipeline**.


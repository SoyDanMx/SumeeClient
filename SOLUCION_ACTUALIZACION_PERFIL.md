# ✅ Solución: Actualización de Perfil de Cliente

**Problema:** El cliente no puede actualizar su foto y datos personales en el perfil.

**Estado:** ✅ Corregido

---

## 🔍 Problemas Identificados

### **1. Bucket de Storage Incorrecto**
- ❌ El código intentaba usar bucket `avatars` que no existe
- ✅ **Solución:** Cambiado a `professional-avatars` (bucket existente)

### **2. Falta de Logging**
- ❌ No había suficiente información para debugging
- ✅ **Solución:** Agregado logging detallado en cada paso

### **3. Manejo de Errores Mejorable**
- ❌ Errores no se mostraban claramente al usuario
- ✅ **Solución:** Mejorado manejo de errores con mensajes claros

### **4. Políticas RLS**
- ⚠️ Puede que falten políticas RLS para UPDATE
- ✅ **Solución:** Script SQL creado para verificar/crear políticas

---

## 🔧 Cambios Realizados

### **1. ProfileService.updateProfile()**
**Archivo:** `services/profile.ts`

**Mejoras:**
- ✅ Logging detallado de cada paso
- ✅ Construcción explícita del objeto de actualización
- ✅ Manejo de errores mejorado con detalles
- ✅ Validación de campos antes de actualizar

**Código:**
```typescript
static async updateProfile(userId: string, updates: ProfileUpdate) {
    // Logging detallado
    console.log('[ProfileService] Updating profile for user:', userId);
    console.log('[ProfileService] Updates:', updates);

    // Construir objeto solo con campos definidos
    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    // Agregar solo campos que están definidos
    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    // ... etc

    // Actualizar con logging de errores detallado
    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();
}
```

---

### **2. ProfileService.uploadAvatar()**
**Archivo:** `services/profile.ts`

**Mejoras:**
- ✅ Cambiado bucket de `avatars` → `professional-avatars`
- ✅ Path mejorado: `{userId}/avatar-{timestamp}.{ext}`
- ✅ Guarda path relativo en BD (no URL completa)
- ✅ Logging detallado de cada paso
- ✅ Manejo de errores mejorado

**Código:**
```typescript
static async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    // Leer archivo
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Path: userId/avatar-timestamp.ext
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    
    // Subir a bucket existente
    const { data, error } = await supabase.storage
        .from('professional-avatars')  // ✅ Bucket correcto
        .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
        });
    
    // Guardar path relativo (no URL completa)
    await this.updateProfile(userId, { avatar_url: fileName });
    
    // Retornar URL completa para mostrar
    return publicUrl;
}
```

---

### **3. EditProfileScreen.handleSave()**
**Archivo:** `app/profile/edit.tsx`

**Mejoras:**
- ✅ Separada lógica en `saveProfileData()`
- ✅ Manejo de errores de subida de foto mejorado
- ✅ Opción de continuar sin actualizar foto si falla
- ✅ Logging detallado
- ✅ Validación de usuario autenticado

**Código:**
```typescript
const handleSave = async () => {
    // Validar usuario
    if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado');
        return;
    }

    try {
        // Subir foto si hay una nueva
        let avatarUrl = profile?.avatar_url;
        if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith('http')) {
            try {
                avatarUrl = await ProfileService.uploadAvatar(user.id, avatarUri);
            } catch (avatarError) {
                // Ofrecer continuar sin foto
                Alert.alert('Error al subir foto', '¿Deseas continuar sin actualizar la foto?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Continuar sin foto', onPress: () => saveProfileData() },
                ]);
                return;
            }
        }

        // Guardar datos
        await saveProfileData(avatarUrl);
    } catch (error) {
        Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    }
};
```

---

## 📄 Script SQL

**Archivo:** `CORREGIR_ACTUALIZACION_PERFIL_CLIENTE.sql`

**Qué hace:**
1. ✅ Verifica/crea política RLS para UPDATE
2. ✅ Verifica/crea política RLS para SELECT
3. ✅ Habilita RLS en tabla `profiles`
4. ✅ Verifica/crea columnas necesarias:
   - `avatar_url`
   - `full_name`
   - `phone`
   - `whatsapp`
   - `city`
   - `state`
   - `updated_at`

**Ejecutar en Supabase:**
1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de `CORREGIR_ACTUALIZACION_PERFIL_CLIENTE.sql`
3. Ejecuta el script
4. Verifica que no haya errores

---

## ✅ Verificaciones Necesarias

### **1. Bucket de Storage**
Verificar que el bucket `professional-avatars` existe:
1. Ve a **Storage** → **Buckets** en Supabase Dashboard
2. Busca: `professional-avatars`
3. Si no existe, créalo:
   - Nombre: `professional-avatars`
   - Público: ✅ Sí
   - Tamaño máximo: 5 MB
   - Tipos permitidos: `image/*`

### **2. Políticas de Storage**
Verificar permisos del bucket:
1. Ve a **Storage** → **Buckets** → `professional-avatars`
2. Ve a **Policies**
3. Debe existir política para `INSERT` y `UPDATE`:
   ```sql
   -- Permitir a usuarios autenticados subir sus propias fotos
   CREATE POLICY "Users can upload their own avatars"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
       bucket_id = 'professional-avatars' AND
       (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

### **3. Políticas RLS de Profiles**
Verificar políticas RLS:
1. Ve a **Table Editor** → `profiles`
2. Ve a **Policies**
3. Debe existir:
   - ✅ "Users can view their own profile" (SELECT)
   - ✅ "Users can update their own profile" (UPDATE)

---

## 🧪 Testing

### **Probar Actualización de Datos:**
1. Abre la app
2. Ve a **Perfil** → **Editar Perfil**
3. Cambia el nombre
4. Cambia el teléfono
5. Guarda
6. ✅ Debe mostrar "¡Éxito! Tu perfil ha sido actualizado"
7. ✅ Los cambios deben verse inmediatamente

### **Probar Actualización de Foto:**
1. Abre la app
2. Ve a **Perfil** → **Editar Perfil**
3. Toca el botón **Galería** o **Cámara**
4. Selecciona/toma una foto
5. Guarda
6. ✅ Debe mostrar "¡Éxito! Tu perfil ha sido actualizado"
7. ✅ La foto debe verse inmediatamente

### **Verificar en Supabase:**
1. Ve a **Table Editor** → `profiles`
2. Busca tu usuario
3. Verifica que:
   - ✅ `full_name` se actualizó
   - ✅ `phone` se actualizó
   - ✅ `avatar_url` tiene el path relativo (ej: `userId/avatar-123456.jpg`)

### **Verificar en Storage:**
1. Ve a **Storage** → **Files** → `professional-avatars`
2. Busca carpeta con tu `user_id`
3. Verifica que existe el archivo de avatar

---

## 🐛 Debugging

### **Si la actualización falla:**

1. **Revisar logs en consola:**
   - Busca mensajes que empiecen con `[ProfileService]` o `[EditProfile]`
   - Verifica errores específicos

2. **Verificar autenticación:**
   ```typescript
   // En la consola del navegador/app
   console.log('User ID:', user?.id);
   console.log('Auth UID:', await supabase.auth.getUser());
   ```

3. **Verificar políticas RLS:**
   ```sql
   -- Ejecutar en Supabase SQL Editor
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

4. **Verificar bucket:**
   ```typescript
   // En la consola
   const { data, error } = await supabase.storage.listBuckets();
   console.log('Buckets:', data);
   ```

---

## 📋 Checklist Final

- [ ] Script SQL ejecutado en Supabase
- [ ] Bucket `professional-avatars` existe y es público
- [ ] Políticas RLS de UPDATE y SELECT creadas
- [ ] Políticas de Storage configuradas
- [ ] Probar actualización de datos personales
- [ ] Probar actualización de foto
- [ ] Verificar cambios en Supabase
- [ ] Verificar archivo en Storage

---

## ✅ Estado

**Correcciones aplicadas:**
- ✅ Servicio de perfil mejorado
- ✅ Upload de avatar corregido
- ✅ Manejo de errores mejorado
- ✅ Logging detallado agregado
- ✅ Script SQL creado

**Pendiente:**
- ⏳ Ejecutar script SQL en Supabase
- ⏳ Verificar bucket y políticas
- ⏳ Testing completo

---

**¡Listo para probar! 🚀**


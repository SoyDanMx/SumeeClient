# 🔧 Solución: Avatar de Dan Nuno No Visible

## Problema Identificado

En SumeePros, cuando se sube una foto desde el **expediente profesional** (`professional-docs.tsx`), la foto se guarda en:
- `professional_stats.avatar_url` (NO en `profiles.avatar_url`)
- Bucket: `sumee-expedientes` (NO `professional-avatars`)
- Path: `user-id/profile_photo_1.jpg`

Pero en SumeeClient, estamos buscando solo en `profiles.avatar_url`.

## Solución: Sincronizar Avatar desde professional_stats

### Opción 1: Sincronizar Automáticamente (Recomendado)

Crear un trigger o función que sincronice `professional_stats.avatar_url` → `profiles.avatar_url`:

```sql
-- Función para sincronizar avatar desde professional_stats a profiles
CREATE OR REPLACE FUNCTION sync_avatar_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza avatar_url en professional_stats, actualizar profiles
    IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
CREATE TRIGGER sync_avatar_trigger
AFTER INSERT OR UPDATE ON professional_stats
FOR EACH ROW
WHEN (NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '')
EXECUTE FUNCTION sync_avatar_to_profiles();
```

### Opción 2: Actualizar Manualmente (Inmediato)

Si necesitas una solución inmediata, ejecuta este SQL:

```sql
-- Sincronizar avatar de professional_stats a profiles para Dan Nuno
UPDATE profiles p
SET 
    avatar_url = ps.avatar_url,
    updated_at = NOW()
FROM professional_stats ps
WHERE p.user_id = ps.user_id
  AND ps.avatar_url IS NOT NULL
  AND ps.avatar_url != ''
  AND (p.avatar_url IS NULL OR p.avatar_url = '' OR p.avatar_url != ps.avatar_url)
  AND (
      p.email ILIKE '%dan%nuno%' 
      OR p.full_name ILIKE '%dan%nuno%'
      OR p.email ILIKE '%daniel.nunojeda%'
  );
```

### Opción 3: Modificar Query en SumeeClient (Alternativa)

Modificar `services/professionals.ts` para buscar también en `professional_stats`:

```typescript
// En getFeaturedProfessionals, hacer JOIN con professional_stats
const { data, error } = await supabase
    .from('profiles')
    .select(`
        user_id,
        full_name,
        avatar_url,
        profession,
        ...
        professional_stats!inner(avatar_url as stats_avatar_url)
    `)
    .eq('role', 'profesional')
    ...

// Luego usar stats_avatar_url si profiles.avatar_url está vacío
const finalAvatarUrl = prof.avatar_url || prof.stats_avatar_url;
```

## Verificación

Después de aplicar la solución, verifica:

```sql
-- Verificar que avatar_url está sincronizado
SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        WHEN p.avatar_url IS NULL AND ps.avatar_url IS NOT NULL THEN '⚠️ Falta sincronizar'
        ELSE '❌ Diferentes'
    END as estado
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE 
    p.email ILIKE '%dan%nuno%' 
    OR p.full_name ILIKE '%dan%nuno%';
```

## Prevención Futura

Para evitar este problema en el futuro:

1. **Usar siempre `profiles.avatar_url`** como fuente única de verdad
2. **Sincronizar automáticamente** con trigger cuando se actualice `professional_stats`
3. **Actualizar ambas tablas** cuando se suba un avatar desde SumeePros


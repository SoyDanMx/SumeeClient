# 🔍 Análisis de Categorías/Disciplinas en Supabase

## 📊 Estructura de Datos

### **1. Tabla `service_catalog`** (Catálogo de Precios)

**Estructura:**
```sql
CREATE TABLE public.service_catalog (
    id UUID PRIMARY KEY,
    discipline TEXT NOT NULL,              -- ID de la disciplina
    service_name TEXT NOT NULL,            -- Nombre del servicio específico
    price_type price_type_enum NOT NULL,  -- 'fixed', 'range', 'starting_at'
    min_price NUMERIC(10, 2) NOT NULL,     -- Precio mínimo
    max_price NUMERIC(10, 2),             -- Precio máximo (solo para range)
    unit TEXT NOT NULL DEFAULT 'servicio', -- Unidad: servicio, pieza, m2, hora
    includes_materials BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Disciplinas Identificadas:**
1. `electricidad` - Electricidad
2. `plomeria` - Plomería
3. `aire-acondicionado` - Aire Acondicionado
4. (Más disciplinas en el código frontend)

---

### **2. Tabla `services`** (Servicios Generales)

**Estructura:**
```sql
CREATE TABLE public.services (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,                    -- Nombre del servicio
    slug TEXT UNIQUE NOT NULL,             -- Slug para URLs
    description TEXT,
    icon_name TEXT NOT NULL,               -- Nombre del icono FontAwesome
    is_popular BOOLEAN DEFAULT FALSE,
    category TEXT NOT NULL,                 -- Categoría general
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Categorías Identificadas:**
1. `Urgencias` - Servicios urgentes
2. `Mantenimiento` - Mantenimiento preventivo
3. `Tecnología` - Servicios tecnológicos
4. `Especializado` - Servicios especializados
5. `Construcción` - Servicios de construcción

---

## 🎯 Disciplinas Completas (Del Código Frontend)

Basado en el análisis del código, estas son las disciplinas configuradas:

### **Disciplinas Principales:**

1. **`electricidad`** - Electricidad
   - Icono: `faLightbulb`
   - Color: Amarillo (`text-yellow-600`, `bg-yellow-50`)
   - Servicios: Instalación de contactos, reparación de cortos, etc.

2. **`plomeria`** - Plomería
   - Icono: `faWrench`
   - Color: Azul (`text-blue-600`, `bg-blue-50`)
   - Servicios: Reparación de fugas, destape de drenajes, etc.

3. **`aire-acondicionado`** - Aire Acondicionado
   - Icono: `faThermometerHalf`
   - Color: Cyan (`text-cyan-600`, `bg-cyan-50`)
   - Servicios: Instalación, mantenimiento, reparación

4. **`cerrajeria`** - Cerrajería
   - Icono: `faKey`
   - Color: Gris (`text-gray-600`, `bg-gray-50`)

5. **`pintura`** - Pintura
   - Icono: `faPaintBrush`
   - Color: Morado (`text-purple-600`, `bg-purple-50`)

6. **`limpieza`** - Limpieza
   - Icono: `faBroom`
   - Color: Verde (`text-green-600`, `bg-green-50`)

7. **`jardineria`** - Jardinería
   - Icono: `faSeedling`
   - Color: Esmeralda (`text-emerald-600`, `bg-emerald-50`)

8. **`carpinteria`** - Carpintería
   - Icono: `faHammer`
   - Color: Ámbar (`text-amber-600`, `bg-amber-50`)

9. **`construccion`** - Construcción
   - Icono: `faHardHat`
   - Color: Naranja/Índigo (`text-orange-600`, `bg-orange-50`)

10. **`tablaroca`** - Tablaroca
    - Icono: `faCubes`
    - Color: Naranja (`text-orange-600`, `bg-orange-50`)

11. **`cctv`** - CCTV y Alarmas
    - Icono: `faVideo`
    - Color: Rojo/Índigo (`text-red-600`, `bg-red-50`)

12. **`wifi`** - Redes y WiFi
    - Icono: `faWifi`
    - Color: Azul/Rosa (`text-blue-600`, `bg-blue-50`)

13. **`fumigacion`** - Fumigación
    - Icono: `faBug`
    - Color: Verde (`text-green-600`, `bg-green-50`)

14. **`montaje-armado`** - Montaje y Armado (Misceláneos)
    - Icono: `faTools`
    - Color: Índigo (`text-indigo-600`, `bg-indigo-50`)

---

## 📋 Servicios por Disciplina (Ejemplos de `service_catalog`)

### **Electricidad:**
- Instalación de Mufa - Desde $2,900.00
- Instalación de Contacto - Desde $150.00
- Instalación de Apagador - Desde $200.00
- Instalación de Lámpara - Desde $350.00
- Reparación de Corto Circuito - $800-$2,500
- Instalación de Ventilador de Techo - Desde $1,200.00
- Cambio de Breaker - Desde $450.00
- Instalación de Luminaria LED - Desde $500.00
- Cableado Nuevo (Habitación) - $3,500-$8,000
- Actualización de Tablero Eléctrico - $5,000-$15,000

### **Plomería:**
- Reparación de Fuga de Agua - $500-$2,000
- Instalación de Llave de Agua - Desde $350.00
- Destape de Drenaje - $800-$2,500
- Instalación de Regadera - Desde $1,200.00
- Cambio de Válvula de Escusado - Desde $450.00
- Instalación de Calentador de Agua - $3,000-$8,000
- Reparación de Tubería Rota - $1,000-$4,000
- Instalación de Lavabo - Desde $1,500.00
- Instalación de WC - Desde $2,500.00
- Sistema de Agua Caliente - $5,000-$15,000

---

## 🔗 Relación entre Tablas

### **Jerarquía:**
```
Category (services.category)
  └─> Discipline (service_catalog.discipline)
      └─> Service (service_catalog.service_name)
```

**Ejemplo:**
- **Category:** `Urgencias`
  - **Discipline:** `electricidad`
    - **Service:** `Reparación de Corto Circuito`
    - **Service:** `Instalación de Contacto`
  - **Discipline:** `plomeria`
    - **Service:** `Reparación de Fuga de Agua`
    - **Service:** `Destape de Drenaje`

---

## 💡 Cómo Usar en SumeeClient

### **1. Obtener Disciplinas Activas**

```typescript
// Obtener todas las disciplinas únicas con servicios activos
const { data: disciplines } = await supabase
  .from('service_catalog')
  .select('discipline')
  .eq('is_active', true)
  .order('discipline');
```

### **2. Obtener Servicios por Disciplina**

```typescript
// Obtener servicios de una disciplina específica
const { data: services } = await supabase
  .from('service_catalog')
  .select('*')
  .eq('discipline', 'electricidad')
  .eq('is_active', true)
  .order('service_name');
```

### **3. Obtener Precio Mínimo por Disciplina**

```typescript
// Obtener el precio mínimo de una disciplina (para mostrar "Desde $X")
const { data } = await supabase
  .from('service_catalog')
  .select('min_price')
  .eq('discipline', 'electricidad')
  .eq('is_active', true)
  .order('min_price', { ascending: true })
  .limit(1);
```

### **4. Mapeo de Disciplinas a Configuración UI**

```typescript
const DISCIPLINE_CONFIG: Record<string, DisciplineConfig> = {
  'electricidad': {
    name: 'Electricidad',
    icon: 'flash', // Ionicons
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  'plomeria': {
    name: 'Plomería',
    icon: 'water',
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  // ... más disciplinas
};
```

---

## 🎨 Integración con HomeScreen

### **Actualizar CATEGORIES en `app/(tabs)/index.tsx`:**

```typescript
// En lugar de datos mock, obtener de Supabase
const [categories, setCategories] = useState([]);

useEffect(() => {
  async function loadCategories() {
    const { data: disciplines } = await supabase
      .from('service_catalog')
      .select('discipline, min_price')
      .eq('is_active', true)
      .order('discipline');
    
    // Agrupar y obtener precio mínimo por disciplina
    const grouped = disciplines.reduce((acc, item) => {
      if (!acc[item.discipline]) {
        acc[item.discipline] = {
          discipline: item.discipline,
          minPrice: item.min_price,
        };
      } else if (item.min_price < acc[item.discipline].minPrice) {
        acc[item.discipline].minPrice = item.min_price;
      }
      return acc;
    }, {});
    
    // Mapear a formato de categorías con configuración UI
    const categoriesList = Object.values(grouped).map((item: any) => {
      const config = DISCIPLINE_CONFIG[item.discipline];
      return {
        id: item.discipline,
        name: config?.name || item.discipline,
        icon: config?.icon,
        color: config?.bgColor,
        iconColor: config?.color,
        minPrice: item.minPrice,
      };
    });
    
    setCategories(categoriesList);
  }
  
  loadCategories();
}, []);
```

---

## 📝 Servicio para Obtener Categorías

**Crear:** `services/categories.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  iconColor: string;
  minPrice?: number;
  serviceCount?: number;
}

export class CategoryService {
  /**
   * Obtener todas las disciplinas activas con información agregada
   */
  static async getCategories(): Promise<Category[]> {
    try {
      // Obtener disciplinas con precio mínimo y conteo de servicios
      const { data, error } = await supabase
        .from('service_catalog')
        .select('discipline, min_price')
        .eq('is_active', true)
        .order('discipline');

      if (error) throw error;

      // Agrupar por disciplina
      const grouped = data.reduce((acc: any, item) => {
        if (!acc[item.discipline]) {
          acc[item.discipline] = {
            discipline: item.discipline,
            minPrice: item.min_price,
            serviceCount: 1,
          };
        } else {
          acc[item.discipline].serviceCount++;
          if (item.min_price < acc[item.discipline].minPrice) {
            acc[item.discipline].minPrice = item.min_price;
          }
        }
        return acc;
      }, {});

      // Mapear a formato de categorías
      return Object.values(grouped).map((item: any) => {
        const config = DISCIPLINE_CONFIG[item.discipline];
        return {
          id: item.discipline,
          name: config?.name || item.discipline,
          icon: config?.icon || 'construct',
          color: config?.bgColor || '#F3F4F6',
          iconColor: config?.color || '#6B7280',
          minPrice: item.minPrice,
          serviceCount: item.serviceCount,
        };
      });
    } catch (error) {
      console.error('[CategoryService] Error getting categories:', error);
      return [];
    }
  }

  /**
   * Obtener servicios de una disciplina
   */
  static async getServicesByDiscipline(discipline: string) {
    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('discipline', discipline)
        .eq('is_active', true)
        .order('service_name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[CategoryService] Error getting services:', error);
      return [];
    }
  }
}
```

---

## 🔄 Actualizar HomeScreen para Usar Datos Reales

### **Cambios en `app/(tabs)/index.tsx`:**

```typescript
import { CategoryService } from '@/services/categories';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      const cats = await CategoryService.getCategories();
      setCategories(cats);
      setLoading(false);
    }
    loadCategories();
  }, []);

  // ... resto del código
}
```

---

## 📊 Resumen de Estructura

### **Tablas:**
1. **`service_catalog`** - Catálogo detallado con precios
   - Campo clave: `discipline` (TEXT)
   - Contiene servicios específicos con precios

2. **`services`** - Servicios generales
   - Campo clave: `category` (TEXT)
   - Categorización general

### **Disciplinas Identificadas:**
- electricidad
- plomeria
- aire-acondicionado
- cerrajeria
- pintura
- limpieza
- jardineria
- carpinteria
- construccion
- tablaroca
- cctv
- wifi
- fumigacion
- montaje-armado

### **Categorías Generales:**
- Urgencias
- Mantenimiento
- Tecnología
- Especializado
- Construcción

---

## 🚀 Próximos Pasos

1. ✅ Crear `services/categories.ts` con `CategoryService`
2. ✅ Actualizar HomeScreen para usar datos reales
3. ✅ Crear mapeo de disciplinas a configuración UI
4. ✅ Implementar carga de servicios por disciplina
5. ✅ Mostrar precios "Desde $X" en categorías

---

**Fecha:** Enero 2025  
**Estado:** 📋 Análisis completo, listo para implementación


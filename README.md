# 📱 SumeeClient - App Móvil para Clientes

> **Versión 1.0.0** - App móvil para clientes de Sumee, inspirada en Angi (confianza) y Uber/Rappi (velocidad on-demand).

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.31-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89.0-green.svg)](https://supabase.com/)

## 📋 Descripción

**SumeeClient** es la aplicación móvil para clientes de Sumee, una plataforma que conecta clientes con profesionales de servicios técnicos. La app está diseñada con un enfoque en la confianza (inspirado en Angi) y la velocidad on-demand (inspirado en Uber/Rappi).

### 🎯 Características Principales

- ✅ **Búsqueda Inteligente con IA** - Búsqueda semántica usando Machine Learning y Google Gemini
- ✅ **Onboarding Completo** - Flujo de bienvenida con logo y animaciones
- ✅ **Home Screen Moderno** - Diseño search-first con categorías visuales
- ✅ **Gestión de Solicitudes** - Visualización y gestión completa de servicios solicitados
- ✅ **Perfil de Cliente** - Gestión de perfil, direcciones guardadas y configuraciones
- ✅ **Agenda Integrada** - Visualización de servicios programados
- ✅ **Mensajería** - Comunicación directa con profesionales
- ✅ **Mapas Interactivos** - Integración con Mapbox para ubicación y navegación
- ✅ **Notificaciones Push** - Sistema completo de notificaciones personalizables
- ✅ **Soporte al Cliente** - Integración con WhatsApp para ayuda y soporte

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20.x o superior
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Expo (opcional, para Expo Go)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/SoyDanMx/SumeeClient.git
cd SumeeClient

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase y APIs
```

### Ejecutar la App

```bash
# Desarrollo
npx expo start --port 8082

# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

## 🛠️ Tecnologías

### Core
- **React Native** 0.81.5 - Framework móvil
- **Expo** ~54.0.31 - Plataforma de desarrollo
- **TypeScript** ~5.9.2 - Tipado estático
- **Expo Router** ^6.0.21 - Navegación basada en archivos

### Backend & APIs
- **Supabase** ^2.89.0 - Backend as a Service (BaaS)
  - Autenticación
  - Base de datos PostgreSQL
  - Storage para imágenes
  - Real-time subscriptions
- **Google Gemini** - IA para búsqueda inteligente
- **Mapbox** - Mapas y geolocalización
- **Hugging Face** - Embeddings para búsqueda semántica

### UI/UX
- **@expo/vector-icons** - Iconografía
- **expo-linear-gradient** - Gradientes
- **react-native-safe-area-context** - Safe areas
- **react-native-screens** - Optimización de pantallas

### Funcionalidades Adicionales
- **expo-location** - Geolocalización
- **expo-image-picker** - Selección de imágenes
- **expo-secure-store** - Almacenamiento seguro
- **expo-file-system** - Manejo de archivos
- **expo-linking** - Deep linking

## 📁 Estructura del Proyecto

```
SumeeClient/
├── app/                          # Pantallas (Expo Router)
│   ├── _layout.tsx              # Layout principal
│   ├── (tabs)/                   # Tabs principales
│   │   ├── _layout.tsx          # Layout de tabs
│   │   ├── index.tsx            # Home Screen
│   │   ├── projects.tsx         # Mis Solicitudes
│   │   └── profile.tsx          # Perfil
│   ├── auth/                     # Autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── onboarding/               # Onboarding
│   │   └── welcome.tsx
│   ├── service/                  # Servicios
│   │   └── [id].tsx
│   ├── lead/                     # Solicitudes
│   │   └── [id].tsx
│   └── search.tsx                # Búsqueda
├── components/                    # Componentes reutilizables
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Screen.tsx
│   ├── SearchBar.tsx
│   ├── ServiceCard.tsx
│   ├── ProfessionalCard.tsx
│   ├── NotificationsModal.tsx
│   ├── SupportModal.tsx
│   └── ...
├── contexts/                      # Contextos de React
│   ├── AuthContext.tsx           # Autenticación
│   └── ThemeContext.tsx          # Temas
├── services/                     # Servicios y lógica de negocio
│   ├── supabase.ts               # Cliente Supabase
│   ├── leads.ts                  # Gestión de solicitudes
│   ├── professionals.ts          # Profesionales
│   ├── services.ts               # Servicios
│   ├── aiSearch.ts               # Búsqueda con IA
│   └── ...
├── constants/                     # Constantes
│   └── Colors.ts                 # Colores de marca
├── lib/                          # Utilidades
│   └── supabase.ts               # Configuración Supabase
├── assets/                       # Recursos estáticos
│   ├── images/
│   └── ...
└── .env                          # Variables de entorno
```

## ✨ Funcionalidades Implementadas

### 🔐 Autenticación
- Login con email/contraseña
- Registro de nuevos usuarios
- Login con teléfono (OTP)
- Verificación de OTP
- Persistencia de sesión
- Protección de rutas

### 🏠 Home Screen
- Header con ubicación actual
- Barra de búsqueda inteligente con IA
- Grid de categorías de servicios
- Banner promocional de garantía
- Profesionales destacados (carousel)
- Proyectos populares con imágenes

### 🔍 Búsqueda
- Búsqueda semántica con Machine Learning
- Búsqueda por texto con Google Gemini
- Búsqueda por categorías
- Resultados categorizados
- Búsquedas populares

### 📋 Gestión de Solicitudes
- Lista de solicitudes (leads)
- Detalles de solicitud
- Estado de servicio en tiempo real
- Edición de solicitud
- Cancelación de servicio
- Visualización de profesional asignado

### 👤 Perfil de Cliente
- Información personal
- Foto de perfil (upload a Supabase Storage)
- Direcciones guardadas
- Configuraciones
- Notificaciones personalizables
- Ayuda y soporte (WhatsApp)
- Seguridad y garantías

### 📅 Agenda
- Visualización de servicios programados
- Calendario mensual
- Detalles de citas
- Sincronización con backend

### 💬 Mensajería
- Inbox de mensajes
- Comunicación con profesionales
- Integración con WhatsApp

### 🗺️ Mapas
- Integración con Mapbox
- Ubicación actual
- Navegación a servicios
- Marcadores de ubicación

### 🔔 Notificaciones
- Sistema de notificaciones push
- Configuración por categorías:
  - Comunicación con profesionales
  - Avisos de plataforma
  - Actualizaciones de servicios
- Horarios de silencio

## 🎨 Diseño

### Inspiración
- **Angi** - Confianza, transparencia, información detallada
- **Uber/Rappi** - Velocidad, on-demand, diseño limpio

### Principios de Diseño
- **Search-First** - Búsqueda prominente al inicio
- **Categorías Visuales** - Grid con iconos grandes y claros
- **On-Demand** - Enfoque en servicios inmediatos
- **Consistencia de Marca** - Mismos colores que SumeePros y Sumeeapp-B

### Colores
- **Púrpura Principal:** `#820AD1`
- **Gradientes:** Púrpura a rosa
- **Temas:** Light y Dark mode

## 📚 Documentación

- `ANALISIS_ANGI_ONBOARDING.md` - Análisis del flujo de onboarding de Angi
- `ANALISIS_TASKRABBIT.md` - Análisis de TaskRabbit para mejoras
- `ANALISIS_AORA.md` - Análisis de AORA para alineación
- `PROPUESTA_ML_VANGUARDIA_TECNOLOGICA.md` - Propuesta de Machine Learning
- `RESUMEN_IMPLEMENTACION_COMPLETA.md` - Resumen de implementación

## 🔗 Enlaces

- **Repositorio:** [https://github.com/SoyDanMx/SumeeClient](https://github.com/SoyDanMx/SumeeClient)
- **Web App:** [https://sumeeapp.com](https://sumeeapp.com)
- **Documentación Expo:** [https://docs.expo.dev](https://docs.expo.dev)
- **Documentación Supabase:** [https://supabase.com/docs](https://supabase.com/docs)

## 🤝 Contribuir

Este es un proyecto privado. Para contribuir, contacta al equipo de desarrollo.

## 📄 Licencia

Propietario - Sumee © 2026

## 👥 Equipo

Desarrollado por el equipo de Sumee.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026

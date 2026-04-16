/**
 * =========================================================================
 * TEST: Resolución de Avatar de Dan Nuno
 * =========================================================================
 * 
 * Script de prueba para verificar que el sistema de resolución de avatares
 * funciona correctamente con el path de Dan Nuno.
 * 
 * Path real: 1581075c-94c5-4ef8-95f9-968a3541b101/profile_photo_0_1767646367295.jpg
 * Bucket esperado: sumee-expedientes
 */

import { resolveAvatarUrl } from './utils/avatar';

// Datos reales de Dan Nuno
const danNunoAvatar = '1581075c-94c5-4ef8-95f9-968a3541b101/profile_photo_0_1767646367295.jpg';
const updatedAt = new Date().toISOString(); // Simular updated_at

console.log('🧪 Test: Resolución de Avatar de Dan Nuno\n');
console.log('📋 Input:');
console.log('   avatar_url:', danNunoAvatar);
console.log('   updated_at:', updatedAt);
console.log('');

// Probar resolución
const resolvedUrl = resolveAvatarUrl(danNunoAvatar, updatedAt);

console.log('✅ Output:');
console.log('   URL Resuelta:', resolvedUrl);
console.log('');

// Verificar que contiene el bucket correcto
const isCorrectBucket = resolvedUrl.includes('sumee-expedientes');
const hasCacheBusting = resolvedUrl.includes('?t=');

console.log('🔍 Verificación:');
console.log('   ✅ Bucket correcto (sumee-expedientes):', isCorrectBucket);
console.log('   ✅ Cache busting agregado:', hasCacheBusting);
console.log('   ✅ URL completa:', resolvedUrl.startsWith('https://'));
console.log('');

if (isCorrectBucket && hasCacheBusting && resolvedUrl.startsWith('https://')) {
    console.log('✅ TEST PASADO: El sistema resuelve correctamente el avatar de Dan Nuno');
} else {
    console.log('❌ TEST FALLIDO: Revisar la lógica de resolución');
}


/**
 * Script para actualizar los campos discipline faltantes en service_embeddings
 * Ejecutar con: npx --yes tsx scripts/update-embeddings-discipline.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno desde .env manualmente
function loadEnv() {
    try {
        const envPath = join(__dirname, '../.env');
        const envContent = readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            }
        }
    } catch (error) {
        console.warn('⚠️  No se pudo cargar .env, usando variables de entorno del sistema');
    }
}

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY deben estar configurados en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateEmbeddingsDiscipline() {
    console.log('🚀 Iniciando actualización de discipline en service_embeddings...\n');

    try {
        // 1. Obtener todos los embeddings que tienen discipline null
        console.log('📦 Obteniendo embeddings con discipline null...');
        const { data: embeddings, error: fetchError } = await supabase
            .from('service_embeddings')
            .select('service_id, service_name, discipline')
            .is('discipline', null);

        if (fetchError) {
            console.error('❌ Error obteniendo embeddings:', fetchError);
            throw fetchError;
        }

        if (!embeddings || embeddings.length === 0) {
            console.log('✅ No hay embeddings con discipline null');
            return;
        }

        console.log(`✅ Encontrados ${embeddings.length} embeddings sin discipline\n`);

        // 2. Para cada embedding, obtener el discipline de service_catalog
        let successCount = 0;
        let errorCount = 0;
        const errors: Array<{ service: string; error: string }> = [];

        for (let i = 0; i < embeddings.length; i++) {
            const embedding = embeddings[i];
            const progress = `[${i + 1}/${embeddings.length}]`;

            try {
                console.log(`${progress} Actualizando discipline para: ${embedding.service_name}...`);

                // Obtener discipline de service_catalog
                const { data: service, error: serviceError } = await supabase
                    .from('service_catalog')
                    .select('discipline')
                    .eq('id', embedding.service_id)
                    .single();

                if (serviceError || !service) {
                    throw new Error(`No se encontró servicio en service_catalog: ${serviceError?.message || 'Unknown'}`);
                }

                if (!service.discipline) {
                    console.warn(`${progress} ⚠️  ${embedding.service_name}: discipline también es null en service_catalog`);
                    errorCount++;
                    continue;
                }

                // Actualizar el embedding con el discipline correcto
                const { error: updateError } = await supabase
                    .from('service_embeddings')
                    .update({ discipline: service.discipline })
                    .eq('service_id', embedding.service_id);

                if (updateError) {
                    throw updateError;
                }

                successCount++;
                console.log(`${progress} ✅ ${embedding.service_name} → ${service.discipline}\n`);

                // Pequeña pausa
                if (i < embeddings.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error: any) {
                errorCount++;
                const errorMessage = error.message || 'Error desconocido';
                errors.push({
                    service: embedding.service_name,
                    error: errorMessage,
                });
                console.error(`${progress} ❌ ${embedding.service_name}: ${errorMessage}\n`);
            }
        }

        // 3. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`✅ Actualizados: ${successCount}/${embeddings.length}`);
        console.log(`❌ Errores: ${errorCount}/${embeddings.length}`);
        console.log(`📈 Tasa de éxito: ${((successCount / embeddings.length) * 100).toFixed(2)}%`);

        if (errors.length > 0) {
            console.log('\n⚠️  Servicios con errores:');
            errors.forEach(({ service, error }) => {
                console.log(`   • ${service}: ${error}`);
            });
        }

        console.log('\n✅ Proceso completado!\n');
    } catch (error) {
        console.error('❌ Error fatal:', error);
        throw error;
    }
}

// Ejecutar
updateEmbeddingsDiscipline()
    .then(() => {
        console.log('🎉 Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });


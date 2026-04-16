/**
 * Script para generar embeddings de todos los servicios en service_catalog
 * 
 * USO:
 * 1. Ejecutar desde la app o como script temporal
 * 2. Este script generará embeddings para todos los servicios activos
 * 3. Los embeddings se guardarán en la tabla service_embeddings
 */

import { supabase } from '../lib/supabase';
import { EmbeddingService } from '../services/ml/embeddings';

interface Service {
    id: string;
    service_name: string;
    discipline: string;
    description?: string;
}

interface GenerationStats {
    total: number;
    success: number;
    errors: number;
    successRate: number;
    errorList: Array<{ service: string; error: string }>;
}

async function generateAllServiceEmbeddings(): Promise<GenerationStats> {
    console.log('🚀 Iniciando generación de embeddings para todos los servicios...\n');

    try {
        // 1. Obtener todos los servicios activos
        console.log('📦 Obteniendo servicios de service_catalog...');
        const { data: services, error: fetchError } = await supabase
            .from('service_catalog')
            .select('id, service_name, discipline, description')
            .eq('is_active', true);

        if (fetchError) {
            console.error('❌ Error obteniendo servicios:', fetchError);
            throw fetchError;
        }

        if (!services || services.length === 0) {
            console.log('⚠️  No se encontraron servicios activos');
            return {
                total: 0,
                success: 0,
                errors: 0,
                successRate: 0,
                errorList: [],
            };
        }

        console.log(`✅ Encontrados ${services.length} servicios activos\n`);

        // 2. Generar embeddings para cada servicio
        let successCount = 0;
        let errorCount = 0;
        const errors: Array<{ service: string; error: string }> = [];

        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const progress = `[${i + 1}/${services.length}]`;

            try {
                console.log(`${progress} Generando embedding para: ${service.service_name}...`);

                // Generar y guardar embedding
                await EmbeddingService.generateAndSaveServiceEmbedding(
                    service.id,
                    service.service_name,
                    service.discipline,
                    service.description
                );

                successCount++;
                console.log(`${progress} ✅ ${service.service_name}\n`);

                // Pequeña pausa para no sobrecargar la API
                if (i < services.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms entre requests
                }
            } catch (error: any) {
                errorCount++;
                const errorMessage = error.message || 'Error desconocido';
                errors.push({
                    service: service.service_name,
                    error: errorMessage,
                });
                console.error(`${progress} ❌ ${service.service_name}: ${errorMessage}\n`);
            }
        }

        // 3. Resumen final
        const successRate = services.length > 0 ? (successCount / services.length) * 100 : 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`✅ Exitosos: ${successCount}/${services.length}`);
        console.log(`❌ Errores: ${errorCount}/${services.length}`);
        console.log(`📈 Tasa de éxito: ${successRate.toFixed(2)}%`);

        if (errors.length > 0) {
            console.log('\n⚠️  Servicios con errores:');
            errors.forEach(({ service, error }) => {
                console.log(`   • ${service}: ${error}`);
            });
        }

        console.log('\n✅ Proceso completado!\n');

        return {
            total: services.length,
            success: successCount,
            errors: errorCount,
            successRate,
            errorList: errors,
        };
    } catch (error) {
        console.error('❌ Error fatal:', error);
        throw error;
    }
}

// Exportar función para uso en la app
export { generateAllServiceEmbeddings };


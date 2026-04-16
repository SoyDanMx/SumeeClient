/**
 * Script CLI para generar embeddings de todos los servicios
 * Ejecutar con: npx tsx scripts/generate-embeddings-cli.ts
 * O con: node --loader ts-node/esm scripts/generate-embeddings-cli.ts
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

const EMBEDDING_API_URL = `${supabaseUrl}/functions/v1/generate-embedding`;

interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
    text: string;
    model: string;
}

interface GenerationStats {
    total: number;
    success: number;
    errors: number;
    successRate: number;
    errorList: Array<{ service: string; error: string }>;
}

async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required to generate embedding');
    }

    try {
        const response = await fetch(EMBEDDING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ 
                text: text.trim(),
                type: 'service',
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Embedding API error: ${response.status} - ${error.error || 'Unknown error'}`);
        }

        const result: EmbeddingResult = await response.json();
        
        if (!result.embedding || !Array.isArray(result.embedding)) {
            throw new Error('Invalid embedding format received');
        }

        if (result.embedding.length !== 384) {
            console.warn(`⚠️  Warning: Expected 384 dimensions, got ${result.embedding.length}`);
        }

        return result.embedding;
    } catch (error) {
        console.error('[EmbeddingService] Error generating embedding:', error);
        throw error;
    }
}

async function generateAndSaveServiceEmbedding(
    serviceId: string,
    serviceName: string,
    discipline: string,
    description?: string
): Promise<void> {
    try {
        // Generar embedding del nombre, disciplina y descripción del servicio
        const text = [serviceName, discipline, description || '']
            .filter(Boolean)
            .join(' ');
        const embedding = await generateEmbedding(text);

        // Guardar en Supabase (array de números directamente)
        // Verificar si ya existe el embedding
        const { data: existing } = await supabase
            .from('service_embeddings')
            .select('service_id')
            .eq('service_id', serviceId)
            .single();
        
        // Estructura de la tabla service_embeddings:
        // - id (uuid, auto)
        // - service_id (uuid)
        // - service_name (text)
        // - discipline (text)
        // - embedding (vector(384))
        // - created_at (timestamp, auto)
        const dataToSave: any = {
            service_id: serviceId,
            service_name: serviceName,
            discipline: discipline, // ✅ Incluir discipline (existe en la tabla)
            embedding: embedding, // Array de números directamente
        };
        
        let error = null;
        
        if (existing) {
            // Actualizar existente
            const { error: updateError } = await supabase
                .from('service_embeddings')
                .update(dataToSave)
                .eq('service_id', serviceId);
            error = updateError;
        } else {
            // Insertar nuevo
            const { error: insertError } = await supabase
                .from('service_embeddings')
                .insert(dataToSave);
            error = insertError;
        }

        if (error) {
            throw error;
        }

        console.log(`✅ Embedding saved for service: ${serviceName}`);
    } catch (error) {
        console.error(`❌ Error saving service embedding for ${serviceName}:`, error);
        throw error;
    }
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
                await generateAndSaveServiceEmbedding(
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

// Ejecutar
generateAllServiceEmbeddings()
    .then((stats) => {
        console.log('🎉 Script finalizado');
        console.log(`📊 Estadísticas: ${stats.success}/${stats.total} exitosos`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });


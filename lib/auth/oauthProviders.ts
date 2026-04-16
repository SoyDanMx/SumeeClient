/**
 * Apple / Google + Supabase (compartido entre login y onboarding con tarjeta).
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function mapAuthMessage(message: string | undefined): string {
    if (!message) return 'No pudimos iniciar sesión. Intenta de nuevo.';
    const m = message.toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid credentials')) {
        return 'Correo o contraseña incorrectos.';
    }
    if (m.includes('email not confirmed')) {
        return 'Confirma tu correo antes de entrar.';
    }
    return message;
}

/** Mensajes de Supabase Auth al registrarse (suelen venir en inglés) */
export function mapSignUpError(message: string | undefined): string {
    if (!message) return 'No se pudo crear la cuenta.';
    const m = message.toLowerCase();
    if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) {
        return 'Ya existe una cuenta con este correo. Inicia sesión.';
    }
    if (m.includes('password')) {
        return 'Revisa la contraseña (longitud o requisitos).';
    }
    return message;
}

export async function finalizeOAuthFromCallbackUrl(callbackUrl: string): Promise<{ error: Error | null }> {
    try {
        let code: string | null = null;
        try {
            const u = new URL(callbackUrl);
            code = u.searchParams.get('code');
        } catch {
            const match = callbackUrl.match(/[?&]code=([^&]+)/);
            code = match ? decodeURIComponent(match[1]) : null;
        }

        if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) return { error: new Error(mapAuthMessage(error.message)) };
            return { error: null };
        }

        const hashIdx = callbackUrl.indexOf('#');
        if (hashIdx !== -1) {
            const params = new URLSearchParams(callbackUrl.slice(hashIdx + 1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
                const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                if (error) return { error: new Error(mapAuthMessage(error.message)) };
                return { error: null };
            }
        }

        return { error: new Error('No se pudo completar el inicio de sesión.') };
    } catch (e: any) {
        return { error: e instanceof Error ? e : new Error('Error al procesar la respuesta.') };
    }
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
    try {
        if (Platform.OS === 'web') {
            const origin =
                typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: origin ? `${origin}/` : undefined },
            });
            if (error) return { error: new Error(mapAuthMessage(error.message)) };
            return { error: null };
        }

        const redirectTo = makeRedirectUri({ scheme: 'tulbox-client', path: 'auth/callback' });
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo, skipBrowserRedirect: true },
        });

        if (oauthError) return { error: new Error(mapAuthMessage(oauthError.message)) };
        if (!data?.url) return { error: new Error('No se pudo abrir Google.') };

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: false });
        if (result.type === 'cancel' || result.type === 'dismiss') return { error: null };
        if (result.type !== 'success' || !result.url) {
            return { error: new Error('Inicio de sesión cancelado.') };
        }
        return finalizeOAuthFromCallbackUrl(result.url);
    } catch (e: any) {
        return { error: e instanceof Error ? e : new Error('Error con Google.') };
    }
}

export async function signInWithApple(): Promise<{ error: Error | null }> {
    try {
        if (Platform.OS !== 'ios') {
            return { error: new Error('Apple solo está disponible en iOS.') };
        }
        const available = await AppleAuthentication.isAvailableAsync();
        if (!available) {
            return { error: new Error('Inicio con Apple no disponible en este dispositivo.') };
        }
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });
        if (!credential.identityToken) {
            return { error: new Error('No se recibió el token de Apple.') };
        }
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
        });
        if (error) return { error: new Error(mapAuthMessage(error.message)) };
        return { error: null };
    } catch (e: any) {
        if (e?.code === 'ERR_REQUEST_CANCELED') return { error: null };
        return { error: e instanceof Error ? e : new Error('Error con Apple.') };
    }
}

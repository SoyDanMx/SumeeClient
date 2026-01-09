import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
    signInWithPhone: (phone: string) => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    profile: any | null;
    reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any | null>(null);
    const router = useRouter();
    const segments = useSegments();

    // Calcular isAuthenticated usando useMemo para evitar problemas de inicialización
    const isAuthenticated = useMemo(() => {
        return !!user && !!session;
    }, [user, session]);

    useEffect(() => {
        checkUser();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] Auth state changed:', event);
            
            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                setSession(null);
                setProfile(null);
                setIsLoading(false); // IMPORTANTE: Establecer isLoading en false al cerrar sesión
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    await loadUserProfile(session.user, session);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Navigate based on auth state
    useEffect(() => {
        if (isLoading) return;

        // Calcular isAuthenticated directamente aquí para evitar problemas de inicialización
        const isAuth = !!user && !!session;

        const inAuthGroup = segments[0] === 'auth';
        const inTabsGroup = segments[0] === '(tabs)';
        const inOnboardingGroup = segments[0] === 'onboarding';

        if (!isAuth && !inAuthGroup) {
            // Redirect to auth if not authenticated
            router.replace('/auth/login');
        } else if (isAuth) {
            // Verificar si ha completado el onboarding
            // IMPORTANTE: Si profile es null o onboarding_completed es null/false, mostrar welcome
            const hasCompletedOnboarding = profile?.onboarding_completed === true;
            
            console.log('[Auth] Navigation check:', {
                hasProfile: !!profile,
                onboardingCompleted: profile?.onboarding_completed,
                hasCompletedOnboarding,
                inOnboardingGroup,
                inTabsGroup,
                inAuthGroup,
                currentSegment: segments[0],
            });
            
            if (!hasCompletedOnboarding && !inOnboardingGroup) {
                // Primera vez → mostrar onboarding
                console.log('[Auth] ✅ User has not completed onboarding, redirecting to welcome');
                router.replace('/onboarding/welcome');
            } else if (hasCompletedOnboarding && inAuthGroup) {
                // Ya completó onboarding → ir a home
                console.log('[Auth] ✅ User completed onboarding, redirecting to home');
                router.replace('/(tabs)');
            } else if (hasCompletedOnboarding && inOnboardingGroup) {
                // Ya completó pero está en onboarding → ir a home
                console.log('[Auth] ✅ User completed onboarding but in onboarding group, redirecting to home');
                router.replace('/(tabs)');
            } else if (!hasCompletedOnboarding && inTabsGroup) {
                // No completó pero está en tabs → ir a welcome
                console.log('[Auth] ✅ User has not completed onboarding but in tabs, redirecting to welcome');
                router.replace('/onboarding/welcome');
            }
        }
    }, [user, session, isLoading, segments, profile, router]);

    async function checkUser() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session || !session.user) {
                setUser(null);
                setSession(null);
                setProfile(null);
                setIsLoading(false);
                return;
            }

            await loadUserProfile(session.user, session);
        } catch (error) {
            console.error('[Auth] Error checking user:', error);
            setUser(null);
            setSession(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadUserProfile(user: User, session: Session | null = null) {
        try {
            console.log('[Auth] Loading profile for user:', user.id);
            
            // Fetch client profile - usar maybeSingle() para manejar cuando no existe
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle(); // Cambiado de .single() a .maybeSingle() para manejar 0 filas

            if (profileError) {
                console.error('[Auth] Error fetching profile:', profileError);
                console.error('[Auth] Profile error details:', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                });
                
                // Si hay un error real (no solo que no existe), manejar
                if (profileError.code !== 'PGRST116') {
                    // Error diferente a "no rows", podría ser RLS u otro problema
                    setProfile(null);
                    return;
                }
                // Si es PGRST116 (no existe), profileData será null, lo manejamos abajo
            }

            // Si no hay perfil, crear uno básico automáticamente
            if (!profileData) {
                console.log('[Auth] Profile does not exist, creating basic profile...');
                
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        email: user.email || '',
                        full_name: user.email?.split('@')[0] || 'Usuario',
                        role: 'client',
                        user_type: 'client',
                        onboarding_completed: false, // IMPORTANTE: Por defecto false para mostrar welcome
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('[Auth] Error creating profile:', createError);
                    console.error('[Auth] Create error details:', {
                        code: createError.code,
                        message: createError.message,
                        details: createError.details,
                        hint: createError.hint,
                    });
                    setUser(null);
                    setSession(null);
                    setProfile(null);
                    setIsLoading(false);
                    return;
                }

                console.log('[Auth] ✅ Profile created successfully');
                
                // IMPORTANTE: Establecer user, session y profile para que isAuthenticated sea true
                setUser(user);
                setSession(session);
                setProfile(newProfile);
                setIsLoading(false);
                return;
            }

            console.log('[Auth] Profile data:', {
                user_id: profileData?.user_id,
                user_type: profileData?.user_type,
                role: profileData?.role,
                email: profileData?.email,
            });

            // Only allow client users
            const isClient = 
                profileData?.user_type === 'client' ||
                profileData?.user_type === 'cliente' ||
                profileData?.role === 'client' ||
                profileData?.role === 'cliente';

            if (!isClient) {
                console.warn('[Auth] User is not a client:', {
                    user_type: profileData?.user_type,
                    role: profileData?.role,
                });
                console.log('[Auth] Signing out non-client user');
                await supabase.auth.signOut();
                setUser(null);
                setSession(null);
                setProfile(null);
                setIsLoading(false); // IMPORTANTE: Establecer isLoading en false
                return;
            }

            console.log('[Auth] Client authenticated successfully');
            setUser(user);
            setSession(session);
            setProfile(profileData);
        } catch (error) {
            console.error('[Auth] Error loading profile:', error);
            setUser(null);
            setSession(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function signInWithEmail(email: string, password: string) {
        try {
            console.log('[Auth] Attempting to sign in with email:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Auth] Sign in error:', error);
                return { error };
            }

            console.log('[Auth] Sign in successful, loading profile...');
            
            if (data.user && data.session) {
                await loadUserProfile(data.user, data.session);
            }

            return { error: null };
        } catch (error: any) {
            console.error('[Auth] Sign in exception:', error);
            return { error };
        }
    }

    async function signUpWithEmail(email: string, password: string, fullName: string) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                return { error };
            }

            if (data.user && data.session) {
                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: data.user.id,
                        email: email,
                        full_name: fullName,
                        user_type: 'client',
                        role: 'client',
                    });

                if (profileError) {
                    console.error('[Auth] Error creating profile:', profileError);
                    return { error: profileError };
                }

                await loadUserProfile(data.user, data.session);
            }

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    }

    async function signInWithPhone(phone: string) {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone,
            });

            return { error };
        } catch (error: any) {
            return { error };
        }
    }

    async function verifyOtp(phone: string, token: string) {
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone,
                token,
                type: 'sms',
            });

            if (error) {
                return { error };
            }

            if (data.user && data.session) {
                await loadUserProfile(data.user, data.session);
            }

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    }

    async function signOut() {
        try {
            console.log('[Auth] Signing out...');
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false); // IMPORTANTE: Establecer isLoading en false al cerrar sesión
            router.replace('/auth/login');
        } catch (error) {
            console.error('[Auth] Error signing out:', error);
            // Asegurar que isLoading se establece incluso si hay error
            setIsLoading(false);
        }
    }

    const reloadProfile = async () => {
        if (user && session) {
            console.log('[Auth] Reloading profile...');
            await loadUserProfile(user, session);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isAuthenticated,
                isLoading,
                signInWithEmail,
                signUpWithEmail,
                signInWithPhone,
                verifyOtp,
                signOut,
                profile,
                reloadProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};


/**
 * Ruta raíz - Resuelve "Unmatched Route" cuando la app abre con sumee-client:///
 * Redirige al welcome; AuthContext maneja las redirecciones según auth y onboarding.
 */
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/onboarding/welcome" />;
}

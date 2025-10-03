import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthContextType, User } from '../types';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔄 Verificando sesión al cargar...');
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ Sesión válida encontrada');
        setUser(currentUser);
      } else {
        console.log('⚠️ No hay sesión válida');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('✅ Verificación de sesión completada');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await authService.signIn(email, password);
      setUser(user);
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { user } = await authService.signUp(email, password, fullName);
      setUser(user);
    } catch (error) {
      console.error('Error en signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
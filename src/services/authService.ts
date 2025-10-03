import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import type { User, LoginResponse } from '../types';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_DAYS = 7;

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<LoginResponse> {
  try {
    console.log('1. Iniciando registro...', { email, fullName });
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('2. Hash creado');

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
      })
      .select()
      .single();

    console.log('3. Respuesta de insert:', { user, userError });

    if (userError) {
      console.error('ERROR COMPLETO:', userError);
      if (userError.code === '23505') {
        throw new Error('Este email ya está registrado');
      }
      throw new Error(`Error al crear usuario: ${userError.message}`);
    }

    if (!user) {
      throw new Error('No se pudo crear el usuario');
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    console.log('4. Creando sesión...', { token: token.substring(0, 10) + '...' });

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    console.log('5. Sesión creada:', { sessionError });

    if (sessionError) {
      console.error('ERROR SESIÓN:', sessionError);
      throw new Error(`Error al crear sesión: ${sessionError.message}`);
    }

    localStorage.setItem('auth_token', token);
    console.log('6. Token guardado en localStorage');

    return { user, token };
    
  } catch (error: any) {
    console.error('ERROR GENERAL:', error);
    throw error;
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    console.log('🔐 Login attempt for:', email);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    console.log('👤 User query result:', { user, userError });

    if (userError || !user) {
      throw new Error('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      throw new Error(`Error al crear sesión: ${sessionError.message}`);
    }

    localStorage.setItem('auth_token', token);

    const { password_hash, ...userWithoutPassword } = user;

    console.log('✅ Login exitoso, token guardado');

    return { user: userWithoutPassword as User, token };
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    await supabase.from('sessions').delete().eq('token', token);
    localStorage.removeItem('auth_token');
    console.log('🚪 Sesión cerrada');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('auth_token');
    
    console.log('🔍 Verificando sesión...', { hasToken: !!token });
    
    if (!token) {
      console.log('⚠️ No hay token en localStorage');
      return null;
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url,
          role,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    console.log('📊 Session query result:', { session, error });

    if (error) {
      console.error('❌ Error en sesión:', error);
      localStorage.removeItem('auth_token');
      return null;
    }

    if (!session || !session.users) {
      console.log('⚠️ Sesión inválida o expirada');
      localStorage.removeItem('auth_token');
      return null;
    }

    console.log('✅ Usuario autenticado:', session.users);
    
    return session.users as User;
    
  } catch (error) {
    console.error('💥 Error crítico en getCurrentUser:', error);
    localStorage.removeItem('auth_token');
    return null;
  }
}
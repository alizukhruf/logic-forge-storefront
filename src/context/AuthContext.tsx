import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Customer } from '../types';
import { supabase, supabaseConfigError } from '../db/supabase';

interface AuthContextValue {
  user: Customer | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<boolean>;
  updateProfile: (name: string, phone: string, email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  login: async () => {},
  register: async () => false,
  updateProfile: async () => false,
  changePassword: async () => {},
  logout: async () => {},
  isAdmin: false,
});

async function getProfile(userId: string): Promise<Customer> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let authEvent = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentEvent = ++authEvent;
      if (!active) return;
      if (supabaseConfigError) {
        setReady(true);
        return;
      }
      if (!session) {
        setUser(null);
        setReady(true);
        return;
      }
      setTimeout(() => getProfile(session.user.id)
        .then((profile) => {
          if (active && currentEvent === authEvent) setUser(profile);
        })
        .catch((err) => {
          console.error('Could not load the signed-in user profile.', err);
          if (active && currentEvent === authEvent) setUser(null);
        })
        .finally(() => {
          if (active && currentEvent === authEvent) setReady(true);
        }), 0);
    });

    const initialEvent = authEvent;
    (supabaseConfigError ? Promise.resolve({ data: { session: null }, error: null }) : supabase.auth.getSession())
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (!data.session) return;
        const profile = await getProfile(data.session.user.id);
        if (active && initialEvent === authEvent) setUser(profile);
      })
      .catch((err) => console.error('Could not restore the Supabase session.', err))
      .finally(() => {
        if (active && initialEvent === authEvent) setReady(true);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return a signed-in user.');
    setUser(await getProfile(data.user.id));
  };

  const register = async (firstName: string, lastName: string, email: string, phone: string, password: string) => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() } },
    });
    if (error) throw error;
    if (data.session && data.user) {
      setUser(await getProfile(data.user.id));
      return true;
    }
    return false;
  };

  const updateProfile = async (name: string, phone: string, email: string): Promise<boolean> => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    if (!user) throw new Error('Sign in before updating your profile.');

    const normalizedName = name.trim().replace(/\s+/g, ' ');
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLocaleLowerCase();
    if (!normalizedName) throw new Error('Enter your name.');
    if (!normalizedPhone) throw new Error('Enter your mobile number.');
    if (!normalizedEmail) throw new Error('Enter your email address.');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: normalizedName, phone: normalizedPhone })
      .eq('id', user.id);
    if (profileError) throw profileError;

    setUser({ ...user, name: normalizedName, phone: normalizedPhone });

    if (normalizedEmail === user.email.toLocaleLowerCase()) return false;

    const { error: emailError } = await supabase.auth.updateUser({ email: normalizedEmail });
    if (emailError) throw emailError;
    return true;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    if (!user) throw new Error('Sign in before changing your password.');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      if (signInError.code === 'invalid_credentials') throw new Error('The current password is incorrect.');
      throw signInError;
    }
    if (!data.session) throw new Error('Could not verify the current password.');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    if (supabaseConfigError) throw new Error(supabaseConfigError);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, updateProfile, changePassword, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

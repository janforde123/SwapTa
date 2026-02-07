import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email);
            } else {
                setLoading(false);
            }
        };

        getSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchProfile(session.user.id, session.user.email);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId, email) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object not found (no profile yet)
                console.error("Error fetching profile:", error);
            }

            // Merge auth user with profile data
            setUser({
                id: userId,
                email: email,
                ...(data || {}) // Spread profile fields (name, avatar, etc.)
            });
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName } // Meta data for trigger if we had one
            }
        });
        if (error) throw error;

        // Manually create profile row if specific trigger isn't set up
        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert([
                {
                    id: data.user.id,
                    full_name: fullName,
                    username: email.split('@')[0],
                    avatar_url: `https://ui-avatars.com/api/?name=${fullName}&background=random`
                }
            ]);
            if (profileError) console.error("Error creating profile:", profileError);
        }

        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, login, signUp, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, Sparkles, User, AlertTriangle, Camera, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthProps {
    onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [view, setView] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (view === 'signup') {
                const { data: signUpData, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (error) throw error;

                // --- AUTO-CLIENT CREATION FLOW ---
                const params = new URLSearchParams(window.location.search);
                const eventSlug = params.get('event');

                if (eventSlug && email) {
                    try {
                        // 1. Get partner_id from event
                        const { data: eventData } = await supabase
                            .from('events')
                            .select('partner_id')
                            .eq('event_slug', eventSlug)
                            .maybeSingle();

                        if (eventData?.partner_id) {
                            // 2. Insert into clients table for that partner
                            await supabase.from('clients').upsert([
                                {
                                    partner_id: eventData.partner_id,
                                    email: email,
                                    name: fullName || email.split('@')[0],
                                    credits_total: 0,
                                    contracted_styles: []
                                }
                            ], { onConflict: 'partner_id,email' });
                        }
                    } catch (err) {
                        console.warn('Could not auto-create client record:', err);
                    }
                }

                setMessage({ type: 'success', text: '¡Registro exitoso! Revisa tu email para verificar tu cuenta.' });
            } else if (view === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (view === 'forgot-password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/',
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Te enviamos un email con las instrucciones para recuperar tu contraseña.' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestAccess = async () => {
        // Logic remains but button is removed from UI
        setLoading(true);
        setMessage(null);
        const testEmail = 'test@creativa.com';
        const testPass = '12345678';

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPass,
            });

            let userId = signInData.user?.id;

            if (signInError && signInError.message.includes('Invalid login credentials')) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: testEmail,
                    password: testPass,
                });
                if (signUpError) throw signUpError;
                userId = signUpData.user?.id;
                setMessage({ type: 'success', text: 'Usuario de prueba creado. ¡Ya puedes entrar!' });
            } else if (signInError) {
                throw signInError;
            }

            // Ensure profile exists with partner role for testing
            if (userId) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).single();
                if (!profile) {
                    await supabase.from('profiles').insert([
                        { id: userId, email: testEmail, full_name: 'Test Partner', role: 'partner', is_master: false }
                    ]);

                    // Also ensure partner record
                    const { data: partnerRec } = await supabase.from('partners').select('id').eq('user_id', userId).single();
                    if (!partnerRec) {
                        await supabase.from('partners').insert([
                            { name: 'Test Partner Agency', user_id: userId, credits_total: 5000, credits_used: 0 }
                        ]);
                    }
                }
            }

            if (onAuthSuccess) onAuthSuccess();
            else window.location.reload();

        } catch (error: any) {
            console.error('Test access error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,85,0,0.05),transparent_70%)] pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-12 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-[1px] w-8 bg-accent opacity-30" />
                        <Camera className="w-6 h-6 text-accent" />
                        <div className="h-[1px] w-8 bg-accent opacity-30" />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2 text-white">
                        Creativa <span className="text-white/20">Labs</span>
                    </h1>
                    <p className="text-[10px] tracking-[0.5rem] text-white/40 uppercase">Photo Booth Access</p>
                </div>

                <div className="bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[40px] shadow-2xl relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[40px] pointer-events-none" />

                    <form onSubmit={handleAuth} className="space-y-6 relative">
                        {view === 'forgot-password' && (
                            <button
                                type="button"
                                onClick={() => { setView('signin'); setMessage(null); }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px] text-white/40 hover:text-white transition-all mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Volver al login
                            </button>
                        )}

                        {view === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Nombre Completo</label>
                                <div className="relative group/input">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm text-white focus:outline-none focus:border-accent transition-all duration-300"
                                        placeholder="Nombre y Apellido"
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-accent transition-colors" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Email</label>
                            <div className="relative group/input">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm text-white focus:outline-none focus:border-accent transition-all duration-300"
                                    placeholder="usuario@creativa.lab"
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-accent transition-colors" />
                            </div>
                        </div>

                        {view !== 'forgot-password' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Contraseña</label>
                                    {view === 'signin' && (
                                        <button
                                            type="button"
                                            onClick={() => { setView('forgot-password'); setMessage(null); }}
                                            className="text-[9px] font-black uppercase tracking-[1px] text-accent/60 hover:text-accent transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group/input">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm text-white focus:outline-none focus:border-accent transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-accent transition-colors" />
                                </div>
                            </div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-6 rounded-[24px] border backdrop-blur-md flex flex-col items-center text-center gap-3 transition-all ${message.type === 'error'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                    }`}
                            >
                                <div className={`size-12 rounded-full flex items-center justify-center ${message.type === 'error' ? 'bg-rose-500/20' : 'bg-emerald-500/20 animate-pulse'
                                    }`}>
                                    {message.type === 'error' ? <AlertTriangle className="size-6" /> : <Sparkles className="size-6" />}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[3px] mb-1">
                                        {message.type === 'error' ? 'Atención' : '¡Magia en Camino!'}
                                    </h4>
                                    <p className="text-xs font-bold leading-relaxed max-w-[200px]">{message.text}</p>
                                </div>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-white text-black font-black uppercase tracking-[4px] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,85,0,0.2)]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>
                                        {view === 'signin' ? 'Entrar' : view === 'signup' ? 'Crear Cuenta' : 'Recuperar Acceso'}
                                    </span>
                                    <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {view !== 'forgot-password' && (
                            <button
                                type="button"
                                onClick={() => { setView(view === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                                className="w-full text-[10px] font-black uppercase tracking-[2px] text-white/40 hover:text-white transition-colors py-4 border-t border-white/5 mt-4"
                            >
                                {view === 'signin' ? '¿No tienes cuenta? Registrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
                            </button>
                        )}
                    </form>
                </div>

                <p className="text-center mt-8 text-[8px] text-white/20 uppercase tracking-[4px] font-bold">
                    © 2024 Creativa Labs — Digital Alchemy Studio
                </p>
            </div>
        </div>
    );
};

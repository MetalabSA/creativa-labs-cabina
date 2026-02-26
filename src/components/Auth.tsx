import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, Sparkles, User, AlertTriangle, Camera, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
    onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [view, setView] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
    const [regType, setRegType] = useState<'client' | 'partner'>('client');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        }
    };

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
                            full_name: fullName,
                            is_partner_signup: regType === 'partner'
                        }
                    }
                });
                if (error) throw error;

                // POST-SIGNUP LOGIC: Auto-match if role is client
                if (regType === 'client' && signUpData.user) {
                    const { data: matchedClient } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('email', email)
                        .maybeSingle();

                    if (matchedClient) {
                        // Upgrade profile to client role and link
                        await supabase
                            .from('profiles')
                            .update({
                                role: 'client',
                                partner_id: matchedClient.partner_id
                            })
                            .eq('id', signUpData.user.id);

                        // Link client table entry to this user_id
                        await supabase
                            .from('clients')
                            .update({ id: signUpData.user.id }) // Should we update ID or have a user_id ref? The schema says ID is UUID.
                            .eq('email', email);
                    }
                }

                setMessage({
                    type: 'success',
                    text: regType === 'partner'
                        ? '¡Registro enviado! Tu cuenta de agencia está pendiente de aprobación por el administrador.'
                        : '¡Registro exitoso! Ya puedes entrar a gestionar tu evento.'
                });
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

                    <div className="space-y-6 relative">
                        {/* Google Auth Button */}
                        {view !== 'forgot-password' && (
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[2px] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group/google"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Continuar con Google</span>
                            </button>
                        )}

                        {view !== 'forgot-password' && (
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-white/5" />
                                <span className="text-[8px] font-black uppercase tracking-[2px] text-white/20">o entra con email</span>
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.form
                                key={view}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleAuth}
                                className="space-y-6"
                            >
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
                                    <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                                        <button
                                            type="button"
                                            onClick={() => setRegType('client')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[2px] rounded-xl transition-all ${regType === 'client' ? 'bg-accent text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            Soy Cliente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRegType('partner')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[2px] rounded-xl transition-all ${regType === 'partner' ? 'bg-accent text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        >
                                            Soy Agencia
                                        </button>
                                    </div>
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
                                            placeholder="usuario@metalabia.com"
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
                            </motion.form>
                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center mt-8 text-[8px] text-white/20 uppercase tracking-[4px] font-bold">
                    © 2025 Metalab — Digital Alchemy Studio
                </p>
            </div>
        </div>
    );
};

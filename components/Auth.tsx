import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, Sparkles, User, AlertTriangle, Camera, ChevronLeft } from 'lucide-react';

interface AuthProps {
    onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: '¡Registro exitoso! Revisa tu email para verificar tu cuenta.' });
            } else if (view === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (view === 'forgot-password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/cabina/',
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
        setLoading(true);
        setMessage(null);
        const testEmail = 'test@creativa.com';
        const testPass = '12345678';

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPass,
            });

            if (signInError && signInError.message.includes('Invalid login credentials')) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: testEmail,
                    password: testPass,
                });
                if (signUpError) throw signUpError;
                setMessage({ type: 'success', text: 'Usuario de prueba creado. ¡Ya puedes entrar!' });
            } else if (signInError) {
                throw signInError;
            }
        } catch (error: any) {
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
                            <div className={`p-4 rounded-2xl flex items-start gap-3 animate-[fadeIn_0.3s_ease-out] ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                }`}>
                                {message.type === 'error' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />}
                                <p className="text-xs font-bold leading-relaxed">{message.text}</p>
                            </div>
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
                            <>
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/5"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#0a0a0c] px-4 text-[8px] font-black uppercase tracking-[2px] text-white/20">Acceso Rápido</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleTestAccess}
                                    disabled={loading}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[2px] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5 text-[10px]"
                                >
                                    <Sparkles className="w-3 h-3 text-accent" />
                                    Ingresar como Test
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setView(view === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                                    className="w-full text-[10px] font-black uppercase tracking-[2px] text-white/40 hover:text-white transition-colors py-2"
                                >
                                    {view === 'signin' ? '¿No tienes cuenta? Registrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
                                </button>
                            </>
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

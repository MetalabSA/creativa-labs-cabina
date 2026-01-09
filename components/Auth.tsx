import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, Sparkles, User, AlertTriangle, Camera } from 'lucide-react';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: '¡Registro exitoso! Revisa tu email para verificar tu cuenta.' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-primary relative overflow-hidden">
            {/* Background patterns */}
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

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Contraseña</label>
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
                                    <span>{isSignUp ? 'Crear Cuenta' : 'Entrar'}</span>
                                    <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="w-full text-[10px] font-black uppercase tracking-[2px] text-white/40 hover:text-white transition-colors py-2"
                        >
                            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate gratis'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-[8px] text-white/20 uppercase tracking-[4px] font-bold">
                    © 2024 Creativa Labs — Digital Alchemy Studio
                </p>
            </div>
        </div>
    );
};

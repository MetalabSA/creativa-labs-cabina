import React from 'react';
import { User, Mail, CreditCard, ChevronLeft } from 'lucide-react';

interface SettingsViewProps {
    profile: any;
    session: any;
    onBack: () => void;
    onAddCredits: () => void;
    onUpdateProfile: (data: any) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, session, onBack, onAddCredits, onUpdateProfile }) => {
    const [name, setName] = React.useState(profile?.full_name || '');
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateProfile({ full_name: name });
        setIsSaving(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto pt-32 px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                <span>Volver</span>
            </button>

            <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">Ajustes de Perfil</h2>

            <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Información Personal
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-white/40 mb-1">Email</label>
                            <div className="flex items-center gap-3 text-lg font-medium text-white/80">
                                <Mail className="w-5 h-5 text-white/40" />
                                {session?.user?.email}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-xs uppercase tracking-wider text-white/40 mb-3">Nombre Completo</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre aquí..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || name === (profile?.full_name || '')}
                                    className="px-6 py-3 bg-accent text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-accent disabled:hover:text-white"
                                >
                                    {isSaving ? '...' : 'Guardar'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-xs uppercase tracking-wider text-white/40 mb-1">ID de Usuario</label>
                            <code className="text-xs text-white/30 font-mono">{session?.user?.id}</code>
                        </div>
                    </div>
                </div>

                {/* Credits Card */}
                <div className="bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                        <CreditCard className="w-5 h-5 text-accent" />
                        Créditos y Consumo
                    </h3>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-black/20 rounded-xl p-4">
                            <span className="block text-xs uppercase tracking-wider text-white/60 mb-1">Créditos Disponibles</span>
                            <span className="text-3xl font-black text-accent">
                                {profile?.is_master ? '∞' : profile?.credits || 0}
                            </span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                            <span className="block text-xs uppercase tracking-wider text-white/60 mb-1">Total Generaciones</span>
                            <span className="text-3xl font-black text-white">
                                {profile?.total_generations || 0}
                            </span>
                        </div>
                    </div>

                    {!profile?.is_master && (
                        <button
                            onClick={onAddCredits}
                            className="mt-6 w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-accent hover:text-white transition-all duration-300"
                        >
                            Cargar Más Créditos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

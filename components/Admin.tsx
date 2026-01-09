import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Users,
    Search,
    Plus,
    Minus,
    Shield,
    Loader2,
    LogOut,
    ChevronLeft,
    UserCheck,
    Zap,
    History
} from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    credits: number;
    total_generations: number;
    is_master: boolean;
    created_at: string;
}

interface AdminProps {
    onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCredits = async (id: string, currentCredits: number, delta: number) => {
        try {
            setUpdatingId(id);
            const newCredits = Math.max(0, currentCredits + delta);
            const { error } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', id);

            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, credits: newCredits } : p));
        } catch (error) {
            console.error('Error updating credits:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleMaster = async (id: string, currentStatus: boolean) => {
        try {
            setUpdatingId(id);
            const { error } = await supabase
                .from('profiles')
                .update({ is_master: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_master: !currentStatus } : p));
        } catch (error) {
            console.error('Error toggling master status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-primary p-6 lg:p-12 animate-[fadeIn_0.5s_ease-out]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Shield className="w-5 h-5 text-accent" />
                                <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">Panel de Control</h1>
                            </div>
                            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Gestión de Usuarios y Créditos</p>
                        </div>
                    </div>

                    <div className="relative group/search max-w-sm w-full">
                        <input
                            type="text"
                            placeholder="Buscar usuario por email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-accent transition-all duration-300"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-accent transition-colors" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-16 h-16 text-accent" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Total Usuarios</span>
                        <span className="text-4xl font-black italic text-white">{profiles.length}</span>
                    </div>

                    <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-16 h-16 text-accent" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Generaciones Totales</span>
                        <span className="text-4xl font-black italic text-white">
                            {profiles.reduce((acc, p) => acc + (p.total_generations || 0), 0)}
                        </span>
                    </div>

                    <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield className="w-16 h-16 text-accent" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Admins</span>
                        <span className="text-4xl font-black italic text-white">
                            {profiles.filter(p => p.is_master).length}
                        </span>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40">Usuario</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Créditos</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Fotos</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Rango</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[2px] text-white/20">Cargando base de datos...</p>
                                        </td>
                                    </tr>
                                ) : filteredProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-white/20 italic uppercase tracking-[2px] text-xs">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProfiles.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group/row">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white mb-1">{p.email}</span>
                                                    <span className="text-[9px] text-white/20 font-mono">{p.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        disabled={updatingId === p.id || p.is_master}
                                                        onClick={() => updateCredits(p.id, p.credits, -100)}
                                                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all"
                                                    >
                                                        <Minus className="w-3 h-3 text-white" />
                                                    </button>
                                                    <span className={`text-lg font-black italic min-w-[3ch] ${p.is_master ? 'text-accent' : 'text-white'}`}>
                                                        {p.is_master ? '∞' : p.credits}
                                                    </span>
                                                    <button
                                                        disabled={updatingId === p.id || p.is_master}
                                                        onClick={() => updateCredits(p.id, p.credits, 100)}
                                                        className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent/20 disabled:opacity-20 transition-all group/plus"
                                                    >
                                                        <Plus className="w-3 h-3 text-accent group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-black italic text-white/60">{p.total_generations || 0}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[2px] border ${p.is_master
                                                    ? 'bg-accent/10 border-accent/20 text-accent'
                                                    : 'bg-white/5 border-white/10 text-white/40'
                                                    }`}>
                                                    {p.is_master ? 'Master' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => toggleMaster(p.id, p.is_master)}
                                                        disabled={updatingId === p.id}
                                                        className={`p-2 rounded-xl border transition-all ${p.is_master
                                                            ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                                            : 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20'
                                                            }`}
                                                        title={p.is_master ? "Quitar Maestro" : "Hacer Maestro"}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

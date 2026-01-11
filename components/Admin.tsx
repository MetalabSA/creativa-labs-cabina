import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Users,
    Search,
    Plus,
    Minus,
    Shield,
    Loader2,
    ChevronLeft,
    Zap,
    TrendingUp,
    DollarSign,
    Package,
    MousePointer2,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    LogOut,
    History,
    Trash2,
    UserPlus,
    X,
    AlertTriangle
} from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    credits: number;
    total_generations: number;
    is_master: boolean;
    created_at: string;
    unlocked_packs?: string[];
}

interface Payment {
    amount: number;
    status: string;
    created_at: string;
    user_id: string;
}

interface SearchLog {
    query: string;
    created_at: string;
}

interface AdminProps {
    onBack: () => void;
    IDENTITIES: any[];
}

export const Admin: React.FC<AdminProps> = ({ onBack, IDENTITIES }) => {
    const [view, setView] = useState<'users' | 'dashboard' | 'styles'>('users');
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [generations, setGenerations] = useState<any[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
    const [stylesMetadata, setStylesMetadata] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [styleUpdatingId, setStyleUpdatingId] = useState<string | null>(null);

    // Add User State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);

    const validStyleIds = useMemo(() => IDENTITIES.map(i => i.id), [IDENTITIES]);
    const validPacks = useMemo(() => Array.from(new Set(IDENTITIES.map(i => i.subCategory))), [IDENTITIES]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [
                { data: pData, error: pError },
                { data: gData, error: gError },
                { data: payData, error: payError },
                { data: sData, error: sError },
                { data: stData, error: stError }
            ] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('generations').select('style_id, user_id, created_at, image_url'),
                supabase.from('payment_notifications').select('amount, status, created_at, user_id'),
                supabase.from('search_logs').select('query, created_at'),
                supabase.from('styles_metadata').select('*')
            ]);

            if (pError) throw pError;
            setProfiles(pData || []);
            setGenerations(gData || []);
            setPayments(payData || []);
            setSearchLogs(sData || []);
            setStylesMetadata(stData || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHistory = async (userId: string) => {
        try {
            setLoadingHistory(true);
            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Filter only Cabina styles
            const filtered = (data || []).filter(g => validStyleIds.includes(g.style_id));
            setUserHistory(filtered);
        } catch (error) {
            console.error('Error fetching user history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAdding(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: newEmail,
                password: newPassword,
            });
            if (error) throw error;

            setShowAddModal(false);
            setNewEmail('');
            setNewPassword('');
            fetchAllData();
        } catch (err: any) {
            setAddError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const deleteGeneration = async (genId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta foto?')) return;
        try {
            const { error } = await supabase.from('generations').delete().eq('id', genId);
            if (error) throw error;
            setUserHistory(prev => prev.filter(g => g.id !== genId));
            setGenerations(prev => prev.filter(g => g.id !== genId));
        } catch (error) {
            console.error('Error deleting generation:', error);
        }
    };

    const updateStylePremium = async (styleId: string, isPremium: boolean) => {
        try {
            setStyleUpdatingId(styleId);
            const { error } = await supabase
                .from('styles_metadata')
                .upsert({
                    id: styleId,
                    is_premium: isPremium,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setStylesMetadata(prev => {
                const existing = prev.find(s => s.id === styleId);
                if (existing) {
                    return prev.map(s => s.id === styleId ? { ...s, is_premium: isPremium } : s);
                }
                return [...prev, { id: styleId, is_premium: isPremium }];
            });
        } catch (error: any) {
            console.error('Error updating style premium:', error);
            alert(`Error al actualizar estilo: ${error.message || 'Error desconocido'}`);
        } finally {
            setStyleUpdatingId(null);
        }
    };

    const updateStyleOrder = async (styleId: string, order: number) => {
        try {
            setStyleUpdatingId(styleId + '_order');
            const { error } = await supabase
                .from('styles_metadata')
                .upsert({
                    id: styleId,
                    sort_order: order,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setStylesMetadata(prev => {
                const existing = prev.find(s => s.id === styleId);
                if (existing) {
                    return prev.map(s => s.id === styleId ? { ...s, sort_order: order } : s);
                }
                return [...prev, { id: styleId, sort_order: order }];
            });
        } catch (error: any) {
            console.error('Error updating style order:', error);
        } finally {
            setStyleUpdatingId(null);
        }
    };

    const deleteUser = async (id: string, email: string) => {
        if (!confirm(`¿Estás seguro de eliminar el perfil de ${email}? Sus fotos y datos se mantendrán en la base pero no podrá acceder.`)) return;

        try {
            setUpdatingId(id);
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            setProfiles(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting user profile:', err);
        } finally {
            setUpdatingId(null);
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

    const togglePack = async (profileId: string, packName: string) => {
        try {
            setUpdatingId(profileId);
            const currentProfile = profiles.find(p => p.id === profileId);
            if (!currentProfile) return;

            const unlocked = currentProfile.unlocked_packs || [];
            const newUnlocked = unlocked.includes(packName)
                ? unlocked.filter((p: string) => p !== packName)
                : [...unlocked, packName];

            const { error } = await supabase
                .from('profiles')
                .update({ unlocked_packs: newUnlocked })
                .eq('id', profileId);

            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, unlocked_packs: newUnlocked } : p));
            if (selectedUser?.id === profileId) {
                setSelectedUser({ ...selectedUser, unlocked_packs: newUnlocked });
            }
        } catch (error) {
            console.error('Error toggling pack:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    // DASHBOARD METRICS CALCULATION (FILTERED BY CURRENT PROJECT STYLES)
    const dashboardStats = useMemo(() => {
        const projectGenerations = generations.filter(g => validStyleIds.includes(g.style_id));
        const approvedPayments = payments.filter(p => p.status === 'approved' || p.status === 'completed');
        const totalRevenue = approvedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

        const styleCounts: Record<string, number> = {};
        projectGenerations.forEach(g => {
            styleCounts[g.style_id] = (styleCounts[g.style_id] || 0) + 1;
        });
        const topStyles = Object.entries(styleCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // Top 5 Users by Generations
        const userGenerations: Record<string, { email: string, count: number }> = {};
        projectGenerations.forEach(g => {
            const profile = profiles.find(p => p.id === g.user_id);
            const email = profile?.email || 'Desconocido';
            if (!userGenerations[g.user_id]) {
                userGenerations[g.user_id] = { email, count: 0 };
            }
            userGenerations[g.user_id].count++;
        });
        const topUsers = Object.entries(userGenerations)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const dailyGenerations = last7Days.map(day => ({
            day,
            count: projectGenerations.filter(g => g.created_at.startsWith(day)).length
        }));

        const queryCounts: Record<string, number> = {};
        searchLogs.forEach(s => {
            queryCounts[s.query] = (queryCounts[s.query] || 0) + 1;
        });
        const topSearches = Object.entries(queryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            totalRevenue,
            totalGenerations: projectGenerations.length,
            topStyles,
            dailyGenerations,
            topSearches,
            topUsers
        };
    }, [generations, payments, searchLogs, validStyleIds, profiles]);

    const filteredProfiles = profiles.filter(p =>
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-primary p-4 lg:p-12 animate-[fadeIn_0.5s_ease-out] relative">
            <div className="max-w-7xl mx-auto">
                {/* Add User Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                        <div className="bg-[#0a0a0c] border border-white/10 p-10 rounded-[40px] max-w-md w-full animate-[fadeIn_0.3s_ease-out] relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3 mb-8">
                                <UserPlus className="w-6 h-6 text-accent" />
                                <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Agregar Usuario</h2>
                            </div>
                            <form onSubmit={handleAddUser} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                        placeholder="usuario@creativa.lab"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {addError && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {addError}
                                    </div>
                                )}
                                <button
                                    disabled={adding}
                                    className="w-full bg-accent text-black font-black uppercase tracking-[3px] py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Crear Usuario</span><Plus className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                            <button
                                onClick={onBack}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.reload();
                                }}
                                className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all text-red-400"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Shield className="w-6 h-6 text-accent" />
                                <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">Console Admin</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Business Intelligence & Control</p>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <div className="flex bg-white/5 p-1 rounded-lg">
                                    <button
                                        onClick={() => { setView('users'); setSelectedUser(null); }}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${view === 'users' ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Usuarios
                                    </button>
                                    <button
                                        onClick={() => { setView('dashboard'); setSelectedUser(null); }}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => { setView('styles'); setSelectedUser(null); }}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${view === 'styles' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Estilos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {view === 'users' && !selectedUser && (
                            <>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 px-6 py-4 rounded-2xl flex items-center gap-3 transition-all group"
                                >
                                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-[2px]">Agregar Usuario</span>
                                </button>
                                <div className="relative group/search max-w-sm w-full animate-[fadeIn_0.3s_ease-out]">
                                    <input
                                        type="text"
                                        placeholder="Buscar por email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-accent transition-all duration-300"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-accent transition-colors" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-white/20 animate-pulse">Sincronizando Base de Datos...</p>
                    </div>
                ) : view === 'dashboard' ? (
                    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <DollarSign className="w-24 h-24 text-green-500" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Ingresos Totales</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black italic text-white">${dashboardStats.totalRevenue.toLocaleString()}</span>
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Zap className="w-24 h-24 text-accent" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Fotos Cabina</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black italic text-white">{dashboardStats.totalGenerations}</span>
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Users className="w-24 h-24 text-blue-500" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Total Usuarios</span>
                                <span className="text-4xl font-black italic text-white">{profiles.length}</span>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <History className="w-24 h-24 text-amber-500" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Búsquedas Totales</span>
                                <span className="text-4xl font-black italic text-white">{searchLogs.length}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[40px] lg:col-span-2 space-y-8">
                                {/* Top Styles */}
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                                <BarChart3 className="w-5 h-5 text-accent" />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-[3px] text-white">Top Estilos Cabina</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        {dashboardStats.topStyles.length > 0 ? dashboardStats.topStyles.map(([id, count]) => (
                                            <div key={id} className="group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-[11px] font-black uppercase tracking-[2px] text-white/60 group-hover:text-white transition-colors">
                                                        {id.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-xs font-black italic text-accent">{count} fotos</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-1000"
                                                        style={{ width: `${(count / dashboardStats.topStyles[0][1]) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center py-4 text-white/20 text-xs italic">Sin datos</div>
                                        )}
                                    </div>
                                </div>

                                {/* Top 5 Users */}
                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-[3px] text-white">Top 5 Usuarios (Uso)</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {dashboardStats.topUsers.map(([id, data], i) => (
                                            <div key={id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-white/20 italic">#0{i + 1}</span>
                                                    <span className="text-xs font-bold text-white/80">{data.email}</span>
                                                </div>
                                                <span className="text-xs font-black italic text-accent">{data.count} fotos</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[40px] space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <Search className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-[3px] text-white">Intereses de Búsqueda</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {dashboardStats.topSearches.map(([query, count], i) => (
                                            <div key={query} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-white/20 italic">#0{i + 1}</span>
                                                    <span className="text-xs font-bold text-white/80 capitalize">{query}</span>
                                                </div>
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-[10px] font-black text-amber-500">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : selectedUser ? (
                    <div className="animate-[fadeIn_0.5s_ease-out] space-y-8">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex items-center gap-3 text-white/40 hover:text-white transition-all group"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-[2px]">Volver a Usuarios</span>
                            </button>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] ${selectedUser.is_master ? 'bg-accent/20 text-accent border border-accent/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                {selectedUser.is_master ? 'MAESTRO' : 'USUARIO'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-[#0a0a0c] border border-white/5 p-10 rounded-[48px] lg:col-span-1 h-fit">
                                <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                                    <Users className="w-10 h-10 text-accent" />
                                </div>
                                <h2 className="text-xl font-black text-white text-center mb-2">{selectedUser.email}</h2>
                                <p className="text-[9px] font-mono text-white/20 text-center mb-10">{selectedUser.id}</p>

                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-white/5 p-4 rounded-3xl text-center">
                                        <span className="text-[9px] font-black text-white/40 block mb-1 uppercase tracking-tighter">Créditos</span>
                                        <span className="text-2xl font-black italic text-white">{selectedUser.is_master ? '∞' : selectedUser.credits}</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl text-center">
                                        <span className="text-[9px] font-black text-white/40 block mb-1 uppercase tracking-tighter">Fotos</span>
                                        <span className="text-2xl font-black italic text-white">{selectedUser.total_generations}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-4 text-center">Packs Desbloqueados</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {validPacks.map(pack => {
                                            const isUnlocked = (selectedUser.unlocked_packs || []).includes(pack);
                                            return (
                                                <button
                                                    key={pack}
                                                    onClick={() => togglePack(selectedUser.id, pack)}
                                                    disabled={updatingId === selectedUser.id}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[1px] transition-all border ${isUnlocked
                                                        ? 'bg-accent text-white border-accent'
                                                        : 'bg-white/5 text-white/20 border-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    {pack}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 p-10 rounded-[48px] lg:col-span-2">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[3px] text-white">Consumos de Usuario (Cabina)</h3>
                                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">Filtrado solo para este proyecto</p>
                                    </div>
                                </div>

                                {loadingHistory ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white/10 animate-spin mb-4" />
                                    </div>
                                ) : userHistory.length === 0 ? (
                                    <div className="py-20 text-center text-white/10 uppercase font-black text-[10px] tracking-[4px]">Sin fotos de cabina</div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {userHistory.map((g, i) => (
                                            <div key={i} className="group relative aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/5 hover:border-accent/30 transition-all">
                                                {g.image_url ? (
                                                    <img src={g.image_url} alt={g.style_id} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 uppercase font-black tracking-widest">{g.style_id}</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase text-accent mb-1 block">{g.style_id}</span>
                                                            <span className="text-[7px] text-white/40">{new Date(g.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteGeneration(g.id); }}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : view === 'styles' ? (
                    <div className="animate-[fadeIn_0.5s_ease-out]">
                        <div className="bg-[#0a0a0c] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40">Pack / Categoría</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Ejemplos</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Orden</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-center">Status Premium</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-white/40 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {validPacks.map((packName) => {
                                        const stylesInPack = IDENTITIES.filter(i => i.subCategory === packName);
                                        const meta = stylesMetadata.find(m => m.id === packName);
                                        // A category is premium if metadata says so, or if all its default styles are premium (fallback)
                                        const isPremium = meta ? meta.is_premium : stylesInPack.some(s => s.isPremium);

                                        return (
                                            <tr key={packName} className="hover:bg-white/[0.01] transition-colors group/row">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white mb-1 uppercase tracking-tight italic">{packName}</span>
                                                        <span className="text-[9px] text-white/20 font-mono uppercase">{stylesInPack.length} ESTILOS INCLUIDOS</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center -space-x-3">
                                                        {stylesInPack.slice(0, 3).map((s, idx) => (
                                                            <div key={idx} className="w-10 h-10 rounded-full border-2 border-[#0a0a0c] overflow-hidden bg-white/5">
                                                                <img src={s.url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        {stylesInPack.length > 3 && (
                                                            <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0c] bg-white/5 flex items-center justify-center text-[8px] font-black text-white/40">
                                                                +{stylesInPack.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={meta?.sort_order || 0}
                                                            onChange={(e) => updateStyleOrder(packName, parseInt(e.target.value) || 0)}
                                                            className="w-16 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-center text-xs text-white focus:outline-none focus:border-accent transition-all"
                                                        />
                                                        {styleUpdatingId === packName + '_order' && <Loader2 className="w-3 h-3 text-accent animate-spin" />}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[2px] border ${isPremium ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                        {isPremium ? 'Premium' : 'Gratis'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        disabled={styleUpdatingId === packName}
                                                        onClick={() => updateStylePremium(packName, !isPremium)}
                                                        className={`px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 ml-auto ${isPremium
                                                            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                            : 'bg-accent border-accent text-white hover:bg-white hover:text-black hover:border-white shadow-lg shadow-accent/20'
                                                            } ${styleUpdatingId === packName ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {styleUpdatingId === packName ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : isPremium ? (
                                                            'Quitar Premium'
                                                        ) : (
                                                            'Hacer Premium'
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl animate-[fadeIn_0.5s_ease-out]">
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
                                    {filteredProfiles.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group/row">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white mb-1">{p.email}</span>
                                                    <span className="text-[9px] text-white/20 font-mono">{p.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button onClick={() => updateCredits(p.id, p.credits, -100)} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-white font-bold">-</button>
                                                    <span className={`text-lg font-black italic ${p.is_master ? 'text-accent' : 'text-white'}`}>{p.is_master ? '∞' : p.credits}</span>
                                                    <button onClick={() => updateCredits(p.id, p.credits, 100)} className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center hover:bg-accent/20 text-accent font-bold">+</button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-sm font-black italic text-white/60">{p.total_generations || 0}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[2px] border ${p.is_master ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                    {p.is_master ? 'Master' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setSelectedUser(p); fetchUserHistory(p.id); }}
                                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-white font-black uppercase tracking-[2px] hover:bg-white/10 transition-all flex items-center gap-2"
                                                    >
                                                        <History className="w-3 h-3" />
                                                        Consumo
                                                    </button>
                                                    <button onClick={() => toggleMaster(p.id, p.is_master)} className={`p-2.5 rounded-xl border transition-all ${p.is_master ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-accent/10 border-accent/20 text-accent'}`}><Shield className="w-4 h-4" /></button>
                                                    {!p.is_master && (
                                                        <button onClick={() => deleteUser(p.id, p.email)} className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

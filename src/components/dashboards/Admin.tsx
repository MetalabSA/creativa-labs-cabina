import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Background3D from '../Background3D';

// Interfaces
interface Partner {
    id: string;
    name: string;
    contact_email: string;
    credits_total: number;
    credits_used: number;
    config?: any;
    user_id?: string;
}

interface UserProfile {
    id: string;
    email: string;
    credits: number;
    total_generations: number;
    role: string;
}

interface AdminProps {
    onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
    const [view, setView] = useState<'overview' | 'partners' | 'b2c' | 'styles' | 'logs'>('overview');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [b2cUsers, setB2CUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePartner, setShowCreatePartner] = useState(false);
    const [showTopUp, setShowTopUp] = useState<{ id: string, name: string } | null>(null);
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalPartners: 0,
        totalCreditsSold: 0,
        activeEvents: 0
    });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    // New Partner Form
    const [newPartner, setNewPartner] = useState({
        name: '',
        email: '',
        initialCredits: 1000
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [partnersRes, eventsRes, profilesRes] = await Promise.all([
                supabase.from('partners').select('*'),
                supabase.from('events').select('*'),
                supabase.from('profiles').select('*')
            ]);

            if (partnersRes.error) throw partnersRes.error;

            const partnersData = partnersRes.data || [];
            const profilesData = profilesRes.data || [];
            const eventsData = eventsRes.data || [];

            setPartners(partnersData);
            setB2CUsers(profilesData.filter(p => p.role === 'user' || !p.role));

            // Calculate stats
            const totalCredits = partnersData.reduce((acc, curr) => acc + (curr.credits_total || 0), 0);
            const totalUsed = partnersData.reduce((acc, curr) => acc + (curr.credits_used || 0), 0);
            const activeEventsCount = eventsData.filter(e => e.is_active).length || 0;

            setStats({
                totalGenerations: totalUsed,
                totalPartners: partnersData.length,
                totalCreditsSold: totalCredits,
                activeEvents: activeEventsCount
            });

            // Fetch Recent Generations as logs
            const { data: recentGens } = await supabase
                .from('generations')
                .select('id, created_at, event_id, events(event_name)')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentGens) {
                setRecentLogs(recentGens.map((g: any) => ({
                    id: g.id,
                    type: 'success',
                    title: 'Generación Exitosa',
                    text: `Evento: ${g.events?.event_name || 'Desconocido'}`,
                    time: new Date(g.created_at).toLocaleTimeString()
                })));
            }

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePartner = async () => {
        try {
            setLoading(true);
            // 1. Create or Find Profile
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', newPartner.email.toLowerCase())
                .maybeSingle();

            let targetUserId = profile?.id;

            if (!profile) {
                // If not exists, insert into profiles and let them login later
                const { data: newP, error: insError } = await supabase
                    .from('profiles')
                    .insert({
                        email: newPartner.email.toLowerCase(),
                        role: 'partner',
                        credits: 0
                    })
                    .select()
                    .single();
                if (insError) throw insError;
                targetUserId = newP.id;
            } else {
                // Update role
                await supabase.from('profiles').update({ role: 'partner' }).eq('id', profile.id);
            }

            // 2. Create Partner Entry
            const { error: partError } = await supabase
                .from('partners')
                .insert({
                    name: newPartner.name,
                    contact_email: newPartner.email.toLowerCase(),
                    user_id: targetUserId,
                    credits_total: newPartner.initialCredits,
                    credits_used: 0
                });

            if (partError) throw partError;

            alert('Partner creado exitosamente');
            setShowCreatePartner(false);
            setNewPartner({ name: '', email: '', initialCredits: 1000 });
            fetchData();
        } catch (error: any) {
            alert('Error creating partner: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (amount: number) => {
        if (!showTopUp) return;
        try {
            setLoading(true);
            const partner = partners.find(p => p.id === showTopUp.id);
            if (!partner) return;

            const { error } = await supabase
                .from('partners')
                .update({ credits_total: (partner.credits_total || 0) + amount })
                .eq('id', partner.id);

            if (error) throw error;
            alert('Créditos recargados');
            setShowTopUp(null);
            fetchData();
        } catch (error: any) {
            alert('Error top-up: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c0b] text-slate-100 font-display relative">
            <Background3D />

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[#1f2b24] bg-[#0a0c0b]/80 backdrop-blur-xl hidden md:flex flex-col z-20">
                <div className="p-6 border-b border-[#1f2b24] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#13ec80] rounded flex items-center justify-center text-[#0a0c0b] shadow-[0_0_15px_rgba(19,236,128,0.4)]">
                        <span className="material-symbols-outlined !text-[20px] font-bold">visibility</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">Eagle-Eye</h1>
                        <p className="text-[10px] text-[#13ec80]/70 uppercase font-medium tracking-[0.2em]">Master Admin</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">General</p>
                    <button
                        onClick={() => setView('overview')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'overview' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Vista General</span>
                    </button>
                    <button
                        onClick={() => setView('partners')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'partners' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">corporate_fare</span>
                        <span className="text-sm font-medium">Revendedores (SaaS)</span>
                    </button>
                    <button
                        onClick={() => setView('b2c')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'b2c' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-sm font-medium">Usuarios App B2C</span>
                    </button>
                    <button
                        onClick={() => setView('styles')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'styles' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        <span className="text-sm font-medium">Motor de Estilos IA</span>
                    </button>

                    <p className="px-3 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistema</p>
                    <button
                        onClick={() => setView('logs')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'logs' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">terminal</span>
                        <span className="text-sm font-medium">Visor de Registros</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#1f2b24] bg-[#121413]/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#13ec80]/20 flex items-center justify-center border border-[#13ec80]/40">
                            <span className="material-symbols-outlined text-[#13ec80] !text-[18px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Admin_Root</p>
                            <p className="text-[10px] text-slate-500 truncate">Platform Owner</p>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <span className="material-symbols-outlined !text-sm">logout</span> Salir del Panel
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0a0c0b]/50 backdrop-blur-sm z-10 transition-all duration-500 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="h-16 border-b border-[#1f2b24] flex items-center justify-between px-8 bg-[#121413]/30 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex-1 max-w-2xl relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 !text-[18px]">search</span>
                        <input className="w-full bg-[#121413] border border-[#1f2b24] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-[#13ec80] focus:border-[#13ec80] placeholder-slate-600 transition-all outline-none" placeholder="Buscar en el motor..." type="text" />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Hora del Sistema</p>
                            <p className="text-xs font-mono text-[#13ec80] leading-tight">{new Date().toLocaleTimeString('es-AR', { hour12: false })} UTC</p>
                        </div>
                        <div className="h-8 w-px bg-[#1f2b24]"></div>
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#13ec80] rounded-full border-2 border-[#0a0c0b]"></span>
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    {view === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Dashboard Overview</h2>
                                <p className="text-slate-500 text-sm">Real-time platform metrics and status</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatCard label="Generaciones Totales" value={stats.totalGenerations} trend="+12.4%" color="#13ec80" icon="auto_awesome" />
                                <StatCard label="Partners Activos" value={stats.totalPartners} color="#3b82f6" icon="groups" />
                                <StatCard label="Créditos Asignados" value={(stats.totalCreditsSold / 1000).toFixed(1) + 'k'} trend="-2.1%" color="#f59e0b" icon="payments" />
                                <StatCard label="Estado del Motor" value="99.9%" status="OPERATIVO" color="#13ec80" icon="monitoring" />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                <div className="xl:col-span-2">
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-white font-bold">Resellers Activity</h3>
                                            <button onClick={() => setView('partners')} className="text-[#13ec80] text-xs font-bold hover:underline">View All Partners</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-[#1f2b24] text-slate-500 uppercase text-[10px] font-bold">
                                                        <th className="pb-4">Partner</th>
                                                        <th className="pb-4">Balance</th>
                                                        <th className="pb-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#1f2b24]/50">
                                                    {partners.slice(0, 5).map(p => (
                                                        <tr key={p.id} className="group">
                                                            <td className="py-4 font-bold text-white group-hover:text-[#13ec80] transition-colors">{p.name}</td>
                                                            <td className="py-4 font-mono">{(p.credits_total || 0) - (p.credits_used || 0)}</td>
                                                            <td className="py-4 text-right">
                                                                <button
                                                                    onClick={() => setShowTopUp({ id: p.id, name: p.name })}
                                                                    className="text-xs bg-[#13ec80]/10 text-[#13ec80] px-3 py-1 rounded border border-[#13ec80]/20 hover:bg-[#13ec80]/20"
                                                                >
                                                                    Recargar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="xl:col-span-1">
                                    <SystemPulse logs={recentLogs} />
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'partners' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Resellers Management</h2>
                                    <p className="text-slate-500 text-sm">Create and manage your SAAS network</p>
                                </div>
                                <button
                                    onClick={() => setShowCreatePartner(true)}
                                    className="bg-[#13ec80] text-[#0a0c0b] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                                >
                                    <span className="material-symbols-outlined">add</span> New Reseller
                                </button>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-[#1f2b24]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Razón Social</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Billetera</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1f2b24]/50">
                                        {partners.map(p => (
                                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80] font-bold border border-[#13ec80]/20">
                                                            {(p.name || 'P')[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">{p.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono">ID: {p.id.substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-300">{p.contact_email}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-mono text-white">{(p.credits_total || 0).toLocaleString()}</p>
                                                        <span className="text-[10px] text-slate-500">{(p.credits_used || 0).toLocaleString()} used</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20">ACTIVE</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setShowTopUp({ id: p.id, name: p.name })}
                                                            className="text-[10px] font-bold text-[#13ec80] border border-[#13ec80]/30 px-3 py-1.5 rounded hover:bg-[#13ec80]/10 transition-all"
                                                        >
                                                            CREDITS
                                                        </button>
                                                        <button className="text-slate-500 hover:text-white material-symbols-outlined !text-lg">more_vert</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'b2c' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Base de Datos Usuarios B2C</h2>
                                <p className="text-slate-500 text-sm">Usuarios de la aplicación móvil/web pública</p>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-[#1f2b24]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email de Usuario</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Balance</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Generaciones</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1f2b24]/50">
                                        {b2cUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-bold text-white group-hover:text-[#13ec80] transition-colors">{u.email}</td>
                                                <td className="px-6 py-4 font-mono text-[#13ec80]">{u.credits?.toLocaleString() || 0}</td>
                                                <td className="px-6 py-4 text-slate-400">{u.total_generations || 0}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-[10px] font-bold text-white/50 hover:text-[#13ec80] transition-colors uppercase">Editar Créditos</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'styles' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
                            <span className="material-symbols-outlined !text-6xl text-[#13ec80]/20 mb-4 ">auto_fix_high</span>
                            <h2 className="text-xl font-bold text-white">Consola del Motor de Estilos IA</h2>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">Administra plantillas globales, versiones de modelos y costos por generación. Actualmente en migración a la nueva arquitectura.</p>
                        </div>
                    )}

                    {view === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Visor de Logs del Sistema</h2>
                                <p className="text-slate-500 text-sm">Operaciones del motor en tiempo real y auditoría</p>
                            </div>
                            <div className="xl:col-span-1">
                                <SystemPulse logs={recentLogs} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Partner Modal */}
            {showCreatePartner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#121413] border border-[#1f2b24] p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,1)]">
                        <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#13ec80]">add_business</span> Nuevo Revendedor
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Razón Social</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                    placeholder="Nombre de la Agencia..."
                                    value={newPartner.name}
                                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email de Usuario (Login)</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                    placeholder="admin@agencia.com"
                                    type="email"
                                    value={newPartner.email}
                                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos Iniciales</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                    type="number"
                                    value={newPartner.initialCredits}
                                    onChange={(e) => setNewPartner({ ...newPartner, initialCredits: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowCreatePartner(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors">CANCELAR</button>
                            <button
                                onClick={handleCreatePartner}
                                className="flex-1 py-3 bg-[#13ec80] text-[#0a0c0b] font-black text-xs rounded-lg shadow-[0_0_20px_rgba(19,236,128,0.2)]"
                            >
                                CREAR PARTNER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#121413] border border-[#1f2b24] p-8 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-black text-white uppercase mb-4">Recarga de Créditos</h3>
                        <p className="text-slate-400 text-sm mb-6">Asignando nuevos créditos a <span className="text-[#13ec80] font-bold">{showTopUp.name}</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            {[1000, 5000, 10000, 50000].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => handleTopUp(amt)}
                                    className="py-4 border border-[#1f2b24] bg-[#0a0c0b] rounded-xl text-white font-black hover:border-[#13ec80] hover:text-[#13ec80] transition-all uppercase"
                                >
                                    +{amt.toLocaleString()}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTopUp(null)} className="w-full mt-6 py-3 text-xs font-bold text-slate-500 hover:text-white tracking-widest uppercase">Cerrar</button>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1f2b24;
                    border-radius: 10px;
                }
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(19, 236, 128, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(19, 236, 128, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(19, 236, 128, 0); }
                }
            `}</style>
        </div>
    );
};

const StatCard = ({ label, value, trend, status, color, icon }: any) => (
    <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl hover:border-[#13ec80]/30 transition-all group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <span className="material-symbols-outlined !text-8xl">{icon}</span>
        </div>
        <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            {trend && <span className="text-[10px] font-bold text-[#13ec80] px-1.5 py-0.5 bg-[#13ec80]/10 rounded tracking-tight">{trend}</span>}
            {status && <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#13ec80] tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse"></span> {status}</span>}
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-3xl font-black text-white leading-none">{value}</h3>
        </div>
        <div className="mt-4 border-t border-[#1f2b24] pt-3 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <span className="material-symbols-outlined !text-[14px]">arrow_outward</span> Sincronización en tiempo real
            </div>
        </div>
    </div>
);

const SystemPulse = ({ logs }: { logs: any[] }) => (
    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Pulse</p>
            <span className="material-symbols-outlined !text-[16px] text-[#13ec80] animate-pulse">sensors</span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? logs.map(log => (
                <LogItem
                    key={log.id}
                    type={log.type}
                    title={log.title}
                    text={log.text}
                    time={log.time}
                />
            )) : (
                <div className="text-center py-10">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">No hay actividad<br />reciente detectable</p>
                </div>
            )}
        </div>
        <div className="p-3 border-t border-[#1f2b24] bg-[#0a0c0b]">
            <button className="w-full text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors tracking-[0.2em]">Abrir Centro de Comando</button>
        </div>
    </div>
);

const LogItem = ({ type, title, text, time }: any) => {
    const colors = {
        success: 'bg-[#13ec80]',
        info: 'bg-blue-400',
        warning: 'bg-amber-400',
        error: 'bg-red-400'
    };
    return (
        <div className="flex gap-3 relative pb-2 group">
            <div className={`w-2 h-2 mt-1 rounded-full ${colors[type as keyof typeof colors]} shrink-0 shadow-[0_0_5px_currentColor] opacity-60 group-hover:opacity-100 transition-opacity`}></div>
            <div>
                <p className="text-[11px] font-bold text-white leading-tight">{title}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{text}</p>
                <p className="text-[8px] font-mono text-slate-600 mt-1 uppercase">{time}</p>
            </div>
        </div>
    );
};

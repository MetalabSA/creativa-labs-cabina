import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search } from 'lucide-react';
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
    unlocked_packs?: string[];
    full_name?: string;
    created_at?: string;
}

interface AdminProps {
    onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
    const [view, setView] = useState<'overview' | 'partners' | 'b2c' | 'styles' | 'logs' | 'settings'>('overview');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [b2cUsers, setB2CUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePartner, setShowCreatePartner] = useState(false);
    const [showTopUp, setShowTopUp] = useState<{ id: string, name: string } | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(1000);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [b2cSearchQuery, setB2CSearchQuery] = useState('');
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        credits: 1000,
        packs: ''
    });
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalPartners: 0,
        totalCreditsSold: 0,
        activeEvents: 0
    });
    const [b2cStats, setB2CStats] = useState({
        totalUsers: 0,
        totalB2CCredits: 0,
        totalB2CGenerations: 0,
        topStyles: [] as { id: string, count: number, label: string }[],
        recentTransactions: [] as any[]
    });
    const [partnerStats, setPartnerStats] = useState({
        totalPartners: 0,
        totalEvents: 0,
        creditsInCirculation: 0,
        avgConsumptionRate: 0,
        topPartners: [] as any[]
    });
    const [editingStyle, setEditingStyle] = useState<any | null>(null);
    const [styleForm, setStyleForm] = useState({
        id: '',
        label: '',
        category: '',
        is_premium: false,
        usage_count: 0
    });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stylesMetadata, setStylesMetadata] = useState<any[]>([]);
    const [styleSearchQuery, setStyleSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // New Partner Form
    const [newPartner, setNewPartner] = useState({
        name: '',
        email: '',
        password: '',
        initialCredits: 1000
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [partnersRes, eventsRes, profilesRes, generationsRes, stylesRes] = await Promise.all([
                supabase.from('partners').select('*'),
                supabase.from('events').select('*'),
                supabase.from('profiles').select('*'),
                supabase.from('generations').select('id, created_at, model_id, event_id, events(event_name)').order('created_at', { ascending: false }),
                supabase.from('styles_metadata').select('*')
            ]);

            if (partnersRes.error) throw partnersRes.error;
            if (profilesRes.error) throw profilesRes.error;

            const partnersData = partnersRes.data || [];
            const profilesData = profilesRes.data || [];
            const eventsData = eventsRes.data || [];
            const generationsData = generationsRes.data || [];
            const stylesMetadataData = stylesRes?.data || [];

            setPartners(partnersData);
            const b2cUsersData = profilesData.filter(p => p.role === 'user' || !p.role);
            setB2CUsers(b2cUsersData);
            setStylesMetadata(stylesMetadataData);

            // Calculate global stats
            const totalCredits = partnersData.reduce((acc, curr) => acc + (curr.credits_total || 0), 0);
            const totalUsed = partnersData.reduce((acc, curr) => acc + (curr.credits_used || 0), 0);
            const activeEventsCount = eventsData.filter(e => e.is_active).length || 0;

            setStats({
                totalGenerations: totalUsed,
                totalPartners: partnersData.length,
                totalCreditsSold: totalCredits,
                activeEvents: activeEventsCount
            });

            // Calculate B2C specific stats
            const totalB2CCredits = b2cUsersData.reduce((acc, curr) => acc + (curr.credits || 0), 0);
            const totalB2CGenerations = b2cUsersData.reduce((acc, curr) => acc + (curr.total_generations || 0), 0);

            // Calculate Top Styles
            const styleCounts: Record<string, number> = {};
            generationsData.forEach((g: any) => {
                if (g.model_id) {
                    styleCounts[g.model_id] = (styleCounts[g.model_id] || 0) + 1;
                }
            });

            const topStyles = Object.entries(styleCounts)
                .map(([id, count]) => ({ id, count, label: id }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setB2CStats({
                totalUsers: b2cUsersData.length,
                totalB2CCredits,
                totalB2CGenerations,
                topStyles,
                recentTransactions: generationsData.slice(0, 5)
            });

            // Calculate Partner Stats
            const partnerCreditTotal = partnersData.reduce((acc, curr) => acc + (curr.credits_total || 0), 0);
            const partnerUsageTotal = partnersData.reduce((acc, curr) => acc + (curr.credits_used || 0), 0);
            const consumptionRate = partnerCreditTotal > 0 ? (partnerUsageTotal / partnerCreditTotal) * 100 : 0;

            // Group events by partner to see activity
            const partnerActivity = partnersData.map(p => {
                const partnerEvents = eventsData.filter(e => e.partner_id === p.id);
                return {
                    ...p,
                    eventCount: partnerEvents.length,
                    activeEvents: partnerEvents.filter(e => e.is_active).length
                };
            }).sort((a, b) => b.eventCount - a.eventCount);

            setPartnerStats({
                totalPartners: partnersData.length,
                totalEvents: eventsData.length,
                creditsInCirculation: partnerCreditTotal - partnerUsageTotal,
                avgConsumptionRate: consumptionRate,
                topPartners: partnerActivity.slice(0, 5)
            });

            setRecentLogs(generationsData.slice(0, 10).map((g: any) => ({
                id: g.id,
                type: 'success',
                title: g.model_id ? `Generación: ${g.model_id}` : 'Generación Exitosa',
                text: g.event_id ? `Evento: ${g.events?.event_name}` : 'Usuario B2C',
                time: new Date(g.created_at).toLocaleTimeString()
            })));

        } catch (error: any) {
            console.error('Error fetching admin data:', error);
            if (error.message?.includes('column')) {
                console.warn('⚠️ Detectadas columnas faltantes en el esquema. Revisa la base de datos.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            setIsSavingUser(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    credits: Number(editingUser.credits),
                    unlocked_packs: editingUser.unlocked_packs,
                    role: editingUser.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            alert('Usuario actualizado correctamente');
            setEditingUser(null);
            fetchData();
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario: ' + error.message);
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSavingUser(true);

            const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', newUserForm.email).maybeSingle();

            if (existingUser) {
                alert('Este usuario ya existe en la base de datos.');
                setIsSavingUser(false);
                return;
            }

            const { error: profError } = await supabase.from('profiles').insert({
                email: newUserForm.email.toLowerCase(),
                credits: Number(newUserForm.credits),
                unlocked_packs: newUserForm.packs.split(',').map(p => p.trim()).filter(p => p),
                role: 'user'
            });

            if (profError) throw profError;

            alert('Usuario B2C creado correctamente.');
            setShowNewUserModal(false);
            setNewUserForm({ email: '', credits: 1000, packs: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error al crear usuario. Revisa la consola.');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // 1. Create Auth User for Partner
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newPartner.email.toLowerCase(),
                password: newPartner.password || 'Partner123!', // Temporal
            });

            if (authError) throw authError;
            const targetUserId = authData.user?.id;

            if (!targetUserId) throw new Error("No se pudo obtener el ID del usuario");

            // 2. Update Profile Role
            await supabase.from('profiles').update({
                role: 'partner',
                full_name: newPartner.name
            }).eq('id', targetUserId);

            // 3. Create Partner Entry
            const partnerObj: any = {
                name: newPartner.name,
                contact_email: newPartner.email.toLowerCase(),
                user_id: targetUserId,
                credits_total: Number(newPartner.initialCredits),
                credits_used: 0
            };

            // Only add config if it exists in the schema (resilience)
            // Based on user report, config might be missing in some projects
            // partnerObj.config = { primary_color: '#135bec', style_presets: ['Formula 1', 'John Wick'] };

            const { error: partError } = await supabase
                .from('partners')
                .insert(partnerObj);

            if (partError) throw partError;

            alert('Partner creado con éxito.');
            setShowCreatePartner(false);
            setNewPartner({ name: '', email: '', password: '', initialCredits: 1000 });
            fetchData();
        } catch (error: any) {
            console.error('Error creating partner:', error);
            alert('Error al crear partner: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStyle = async () => {
        if (!editingStyle) return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('styles_metadata')
                .upsert({
                    id: styleForm.id,
                    label: styleForm.label,
                    category: styleForm.category,
                    is_premium: styleForm.is_premium,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            alert('Estilo actualizado correctamente');
            setEditingStyle(null);
            fetchData();
        } catch (error: any) {
            alert('Error al actualizar estilo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (amount: number) => {
        if (!showTopUp) return;
        try {
            setLoading(true);
            // Check if it's a partner or a B2C user
            const partner = partners.find(p => p.id === showTopUp.id);
            if (partner) {
                const { error } = await supabase
                    .from('partners')
                    .update({ credits_total: (partner.credits_total || 0) + amount })
                    .eq('id', partner.id);

                if (error) {
                    if (error.message.includes('credits_total')) {
                        throw new Error('La columna "credits_total" no existe en la tabla "partners". Por favor, ejecuta la migración SQL necesaria.');
                    }
                    throw error;
                }
            } else {
                // Assume it's a B2C user profile
                const user = b2cUsers.find(u => u.id === showTopUp.id);
                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ credits: (user.credits || 0) + amount })
                        .eq('id', user.id);
                    if (error) throw error;
                }
            }

            alert('Créditos actualizados exitosamente');
            setShowTopUp(null);
            fetchData();
        } catch (error: any) {
            console.error('Error al recargar créditos:', error);
            alert('Error al recargar créditos: ' + error.message);
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
                        onClick={() => setView('settings')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'settings' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Ajustes</span>
                    </button>
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
                            <span className="material-symbols-outlined !text-[18px]">person</span>
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
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Centro de Mando Ejecutivo</h2>
                                    <p className="text-slate-500 text-sm">Resumen táctico del ecosistema Metalab Creative Labs</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData()} className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors">
                                        <span className="material-symbols-outlined !text-xl">sync</span>
                                    </button>
                                </div>
                            </div>

                            {/* Macro Financial & Performance Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatCard
                                    label="Ingresos Estimados"
                                    value={`$${((stats.totalCreditsSold * 0.1)).toLocaleString()}`}
                                    trend="+15.2%"
                                    color="#13ec80"
                                    icon="payments"
                                />
                                <StatCard
                                    label="Generaciones Totales"
                                    value={stats.totalGenerations.toLocaleString()}
                                    trend="+8.4%"
                                    color="#3b82f6"
                                    icon="auto_awesome"
                                />
                                <StatCard
                                    label="Cuentas Activas"
                                    value={(b2cStats.totalUsers + partnerStats.totalPartners).toLocaleString()}
                                    color="#f59e0b"
                                    icon="hub"
                                />
                                <StatCard
                                    label="Eficiencia Motor"
                                    value="99.8%"
                                    status="OPERATIVO"
                                    color="#13ec80"
                                    icon="monitoring"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                {/* Left Side: Performance Boxes */}
                                <div className="xl:col-span-8 space-y-8">

                                    {/* Sector Performance Split */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* B2C Segment Summary */}
                                        <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50"></div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm tracking-tight mb-1">Segmento B2C</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consumo en App Pública</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <span className="material-symbols-outlined">person</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Usuarios</p>
                                                    <p className="text-xl font-black text-white">{b2cStats.totalUsers}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Gens</p>
                                                    <p className="text-xl font-black text-white">{b2cStats.totalB2CGenerations}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setView('b2c')} className="w-full mt-6 py-2 border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase rounded-lg hover:bg-blue-500/10 transition-colors">
                                                Gestionar B2C
                                            </button>
                                        </div>

                                        {/* SaaS Partner Summary */}
                                        <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#13ec80] opacity-50"></div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm tracking-tight mb-1">Red de Partners</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SaaS & B2B Events</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                                                    <span className="material-symbols-outlined">corporate_fare</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Agencias</p>
                                                    <p className="text-xl font-black text-white">{partnerStats.totalPartners}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Eventos</p>
                                                    <p className="text-xl font-black text-white">{partnerStats.totalEvents}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setView('partners')} className="w-full mt-6 py-2 border border-[#13ec80]/20 bg-[#13ec80]/5 text-[#13ec80] text-[10px] font-black uppercase rounded-lg hover:bg-[#13ec80]/10 transition-colors">
                                                Ecosistema SaaS
                                            </button>
                                        </div>
                                    </div>

                                    {/* Style Leaderboard across Platform */}
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-white font-black uppercase text-sm tracking-tight">👑 Ranking Global de Estilos</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rendimiento por IA Identity</span>
                                        </div>
                                        <div className="space-y-4">
                                            {b2cStats.topStyles.slice(0, 4).map((style, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-500">
                                                        #{idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span className="text-white">{style.id}</span>
                                                            <span className="text-[#13ec80]">{style.count.toLocaleString()} gens</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#0a0c0b] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-[#13ec80]"
                                                                style={{ width: `${(style.count / (b2cStats.topStyles[0]?.count || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: System Pulse & Quick Actions */}
                                <div className="xl:col-span-4 space-y-8">
                                    <div className="h-[400px]">
                                        <SystemPulse logs={recentLogs} />
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6">
                                        <h3 className="text-white font-black uppercase text-sm tracking-tight mb-4">Acciones Rápidas</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                onClick={() => {
                                                    setStyleForm({ id: '', label: '', category: '', is_premium: false, usage_count: 0 });
                                                    setEditingStyle('new');
                                                    setView('styles');
                                                }}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                                            >
                                                <span className="material-symbols-outlined text-purple-400">auto_fix_high</span>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Inyectar Estilo</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Nueva identidad IA</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreatePartner(true);
                                                    setView('partners');
                                                }}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                                            >
                                                <span className="material-symbols-outlined text-amber-400">add_business</span>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Onboarding Partner</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Nuevo contrato SaaS</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'partners' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Resellers Management (SaaS)</h2>
                                    <p className="text-slate-500 text-sm">Control total sobre tu red de agencias y eventos</p>
                                </div>
                                <button
                                    onClick={() => setShowCreatePartner(true)}
                                    className="bg-[#13ec80] text-[#0a0c0b] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                                >
                                    <span className="material-symbols-outlined">add</span> New Reseller
                                </button>
                            </div>

                            {/* Partner Analytics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Partners Activos</p>
                                    <h3 className="text-2xl font-black text-white">{partnerStats.totalPartners}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#13ec80]/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-[#13ec80] !text-sm">handshake</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Eventos Red</p>
                                    <h3 className="text-2xl font-black text-[#13ec80]">{partnerStats.totalEvents}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-blue-500 !text-sm">event</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Créditos en Canales</p>
                                    <h3 className="text-2xl font-black text-blue-400">{(partnerStats.creditsInCirculation || 0).toLocaleString()}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-purple-500 !text-sm">account_balance_wallet</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ratio de Consumo</p>
                                    <h3 className="text-2xl font-black text-amber-400">{partnerStats.avgConsumptionRate.toFixed(1)}%</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-amber-500 !text-sm">trending_up</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0a0c0b] border-b border-[#1f2b24]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner / Agencia</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Eventos</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Billetera</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Configuración</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1f2b24]/50">
                                        {partners.map(p => {
                                            const hasBranding = p.config?.primary_color || p.config?.logo_url;
                                            return (
                                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[#13ec80] font-black border border-[#13ec80]/20 shadow-inner">
                                                                {(p.name || 'P')[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">{p.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-[#13ec80]"></span>
                                                                    {p.contact_email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-bold text-white">{(partnerStats.topPartners.find(tp => tp.id === p.id)?.eventCount || 0)}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Eventos creados</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-white text-sm font-bold">{((p.credits_total || 0) - (p.credits_used || 0)).toLocaleString()}</span>
                                                                <span className="text-[10px] text-slate-600">/ {(p.credits_total || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="w-24 h-1 bg-[#1f2b24] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[#13ec80]"
                                                                    style={{ width: `${Math.min(100, (p.credits_used / (p.credits_total || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span title="Branding Configurado" className={`material-symbols-outlined !text-sm ${hasBranding ? 'text-blue-400' : 'text-white/10'}`}>palette</span>
                                                            <span title="Subdominio Activo" className="material-symbols-outlined !text-sm text-[#13ec80]">language</span>
                                                            <span title="Soporte VIP" className="material-symbols-outlined !text-sm text-amber-400">verified</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setShowTopUp({ id: p.id, name: p.name })}
                                                                className="text-[10px] font-black text-[#13ec80] border border-[#13ec80]/30 px-4 py-2 rounded-lg hover:bg-[#13ec80]/10 transition-all flex items-center gap-2"
                                                            >
                                                                RECARGAR
                                                            </button>
                                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                                                <span className="material-symbols-outlined !text-lg">settings</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'b2c' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Base de Datos Usuarios B2C</h2>
                                    <p className="text-slate-500 text-sm">Métricas detalladas y gestión de la aplicación pública</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por email..."
                                            value={b2cSearchQuery}
                                            onChange={(e) => setB2CSearchQuery(e.target.value)}
                                            className="bg-[#121413] border border-[#1f2b24] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-64 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowNewUserModal(true)}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                    >
                                        <span className="material-symbols-outlined">person_add</span> Nuevo Usuario
                                    </button>
                                </div>
                            </div>

                            {/* B2C Analytics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Usuarios</p>
                                    <h3 className="text-2xl font-black text-white">{b2cStats.totalUsers}</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Créditos en Circulación</p>
                                    <h3 className="text-2xl font-black text-[#13ec80]">{(b2cStats.totalB2CCredits || 0).toLocaleString()}</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Generaciones</p>
                                    <h3 className="text-2xl font-black text-blue-400">{(b2cStats.totalB2CGenerations || 0).toLocaleString()}</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ingreso Est. (Credits)</p>
                                    <h3 className="text-2xl font-black text-amber-400">{((b2cStats.totalB2CGenerations || 0) * 100).toLocaleString()} <span className="text-[10px] text-slate-500">pts</span></h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                                <div className="xl:col-span-2">
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                        <div className="p-4 border-b border-[#1f2b24] flex justify-between items-center bg-white/5">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Directorio de Usuarios</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-[#0a0c0b] border-b border-[#1f2b24]">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email de Usuario</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Packs Activos</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Balance</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Generaciones</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#1f2b24]/50">
                                                    {b2cUsers
                                                        .filter(u => u.email.toLowerCase().includes(b2cSearchQuery.toLowerCase()))
                                                        .sort((a, b) => (b.total_generations || 0) - (a.total_generations || 0))
                                                        .map(u => (
                                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">{u.full_name || u.email}</p>
                                                                    <p className="text-[10px] text-slate-600 font-mono italic">{u.email}</p>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex flex-wrap justify-center gap-1">
                                                                        {(u.unlocked_packs || []).length > 0 ? (
                                                                            u.unlocked_packs?.map(pack => (
                                                                                <span key={pack} className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-bold uppercase">{pack}</span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-[9px] text-slate-700 font-bold uppercase tracking-tighter">Sin Packs</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 font-mono text-[#13ec80] text-center font-bold">{u.credits?.toLocaleString() || 0}</td>
                                                                <td className="px-6 py-4 text-slate-400 text-center">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="font-bold text-white">{u.total_generations || 0}</span>
                                                                        <div className="w-12 h-1 bg-[#1f2b24] rounded-full mt-1 overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-blue-500"
                                                                                style={{ width: `${Math.min(100, (u.total_generations || 0) * 5)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setEditingUser(u)}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                                                        >
                                                                            <span className="material-symbols-outlined !text-lg">edit</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setShowTopUp({ id: u.id, name: u.email })}
                                                                            className="text-[10px] font-bold text-[#13ec80] border border-[#13ec80]/30 px-3 py-1.5 rounded-lg hover:bg-[#13ec80]/10 transition-all uppercase"
                                                                        >
                                                                            Saldo
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Top Styles Section */}
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl p-6">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#13ec80] !text-sm">trending_up</span>
                                            Top Estilos IA
                                        </h3>
                                        <div className="space-y-4">
                                            {b2cStats.topStyles.map((style, idx) => (
                                                <div key={style.id} className="group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{style.id}</span>
                                                        <span className="text-xs font-mono text-[#13ec80]">{style.count} gens</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#1f2b24] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-[#13ec80]' : 'bg-[#13ec80]/60'}`}
                                                            style={{ width: `${(style.count / (b2cStats.topStyles[0]?.count || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {b2cStats.topStyles.length === 0 && (
                                                <p className="text-[10px] text-slate-600 italic text-center py-4">No hay datos de estilos disponibles aún.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* High Value Users Info */}
                                    <div className="bg-gradient-to-br from-[#13ec80]/10 to-transparent border border-[#13ec80]/20 rounded-xl p-6">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Performance B2C</h3>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                                            El segmento B2C representa el {((b2cStats.totalB2CGenerations / (stats.totalGenerations || 1)) * 100).toFixed(1)}% del tráfico total de la plataforma en este periodo.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-[#1f2b24] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#13ec80]" style={{ width: `${(b2cStats.totalB2CGenerations / (stats.totalGenerations || 1)) * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-[#13ec80]">Sincronizado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'styles' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Identity Repository <span className="text-[#13ec80]">({stylesMetadata.length})</span></h2>
                                    <p className="text-slate-500 text-sm">Protocolo de gestión de identidades y mallas IA Maestro</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar identidad..."
                                            value={styleSearchQuery}
                                            onChange={(e) => setStyleSearchQuery(e.target.value)}
                                            className="bg-[#121413] border border-[#1f2b24] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#13ec80] outline-none w-full md:w-64 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setStyleForm({ id: '', label: '', category: '', is_premium: false, usage_count: 0, prompt: '', tags: '', subcategory: '', image_url: '' } as any);
                                            setEditingStyle('new');
                                        }}
                                        className="bg-[#13ec80] text-[#0a0c0b] px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                                    >
                                        <span className="material-symbols-outlined">add_box</span> Nueva Identidad
                                    </button>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                                {['all', ...Array.from(new Set(stylesMetadata.map(s => s.category).filter(Boolean)))].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategoryFilter(cat)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategoryFilter === cat
                                            ? 'bg-[#13ec80] text-black shadow-[0_0_15px_rgba(19,236,128,0.3)]'
                                            : 'bg-white/5 text-slate-500 border border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {cat === 'all' ? 'Todas / All' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Identity Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stylesMetadata
                                    .filter(s => {
                                        const matchesSearch = (s.label || '').toLowerCase().includes(styleSearchQuery.toLowerCase()) ||
                                            (s.id || '').toLowerCase().includes(styleSearchQuery.toLowerCase());
                                        const matchesCat = selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter;
                                        return matchesSearch && matchesCat;
                                    })
                                    .map(style => (
                                        <div
                                            key={style.id}
                                            onClick={() => {
                                                setEditingStyle(style);
                                                setStyleForm({
                                                    id: style.id,
                                                    label: style.label,
                                                    category: style.category || '',
                                                    is_premium: style.is_premium || false,
                                                    usage_count: style.usage_count || 0,
                                                    prompt: style.prompt || '',
                                                    tags: Array.isArray(style.tags) ? style.tags.join(', ') : (style.tags || ''),
                                                    subcategory: style.subcategory || '',
                                                    image_url: style.image_url || ''
                                                } as any);
                                            }}
                                            className="bg-[#121413] border border-[#1f2b24] rounded-[32px] overflow-hidden group hover:border-[#13ec80]/50 transition-all cursor-pointer relative"
                                        >
                                            {/* Preview Image */}
                                            <div className="aspect-[4/5] relative overflow-hidden">
                                                <img
                                                    src={style.image_url || '/placeholder-style.jpg'}
                                                    alt={style.label}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0b] via-transparent to-transparent opacity-90 group-hover:opacity-40 transition-opacity"></div>

                                                {/* Badges */}
                                                <div className="absolute top-4 left-4 flex gap-2">
                                                    {style.is_premium && (
                                                        <span className="bg-[#ff5500] text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">Premium</span>
                                                    )}
                                                    <span className="bg-[#1f2b24]/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border border-white/10">
                                                        {style.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 absolute bottom-0 left-0 right-0">
                                                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1 group-hover:text-[#13ec80] transition-colors">{style.label}</h4>
                                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic opacity-60 group-hover:opacity-100 transition-opacity">
                                                    "{style.prompt || 'Sin prompt definido...'}"
                                                </p>

                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        SUB: {style.subcategory || 'General'}
                                                    </span>
                                                    <span className="material-symbols-outlined !text-sm text-slate-600">chevron_right</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {view === 'settings' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Ajustes del Sistema</h2>
                                <p className="text-slate-500 text-sm">Configuración global de APIs, pasarelas de pago y parámetros del motor</p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* MercadoPago Integration */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">MercadoPago Cloud</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pasarela de Pagos B2C</p>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Public Key (Producción)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                                placeholder="APP_USR-..."
                                                defaultValue="APP_USR-78239012-4212-4211-9012-78239012"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Access Token (Secret)</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                                    placeholder="APP_USR-..."
                                                    defaultValue="APP_USR-78239012-4212-4211-9012-HIDDEN"
                                                />
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer hover:text-white transition-colors">visibility</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#13ec80]"></div>
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Estado: Conectado</span>
                                            </div>
                                            <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">Probar Conexión</button>
                                        </div>
                                    </div>
                                </div>

                                {/* KIE Master Engine */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <span className="material-symbols-outlined">bolt</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">KIE Engine API</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Motor de Generación IA</p>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">KIE API Endpoint</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                                placeholder="https://api.kie.com/v1"
                                                defaultValue="https://automatizaciones.metalab30.com/webhook/kie-pro"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Webhook Secret Key</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                                    defaultValue="KIE_PRO_MET_LAB_30"
                                                />
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">lock</span>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <p className="text-[10px] text-slate-600 leading-relaxed italic">
                                                * El endpoint de KIE procesa todas las solicitudes de generación de imagen para Usuarios B2C y Partners.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Platform Settings */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl xl:col-span-2">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                            <span className="material-symbols-outlined">settings_applications</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">Parámetros Globales</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control General de Plataforma</p>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">Modo Mantenimiento</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">Registro de Usuarios B2C</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13ec80]"></div>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Precio Crédito (Base)</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 font-bold">$</span>
                                                    <input type="number" className="bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-3 py-2 text-white outline-none focus:border-[#13ec80] w-full text-sm font-bold" defaultValue="100.00" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos por Invitación</label>
                                                <input type="number" className="bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-3 py-2 text-white outline-none focus:border-[#13ec80] w-full text-sm font-bold" defaultValue="10" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <button className="w-full py-4 bg-[#13ec80] text-[#0a0c0b] font-black rounded-xl shadow-[0_0_30px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all uppercase text-xs tracking-widest">
                                                Guardar Configuración Global
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Visor de Registros Maestro</h2>
                                    <p className="text-slate-500 text-sm">Monitor de actividad y salud del motor en tiempo real</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData()} className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors">
                                        <span className="material-symbols-outlined !text-xl">refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* System Health Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tasa de Éxito</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-2xl font-black text-white">99.8%</h3>
                                        <span className="text-[10px] text-[#13ec80] font-bold mb-1">UP</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Gens (Hoy)</p>
                                    <h3 className="text-2xl font-black text-blue-400">{recentLogs.length * 12}+</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Uso API</p>
                                    <h3 className="text-2xl font-black text-purple-400">Normal</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Estado Motor</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#13ec80] animate-pulse"></div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Online</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Actividad Reciente del Sistema</h3>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-[#13ec80]"></span> Éxito
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Proceso
                                        </span>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#1f2b24]/50">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.type === 'success' ? 'bg-[#13ec80]/10 text-[#13ec80]' : 'bg-amber-400/10 text-amber-400'
                                                    }`}>
                                                    <span className="material-symbols-outlined !text-lg">
                                                        {log.type === 'success' ? 'check_circle' : 'warning'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">{log.title}</p>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${log.text.includes('B2C')
                                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                            : 'bg-[#13ec80]/10 border-[#13ec80]/20 text-[#13ec80]'
                                                            }`}>
                                                            {log.text.includes('B2C') ? 'B2C Account' : 'Partner Event'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">{log.text}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-mono text-white/50">{log.time}</p>
                                                <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest group-hover:text-slate-500 transition-colors">Transaction ID: {log.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentLogs.length === 0 && (
                                        <div className="py-20 text-center">
                                            <span className="material-symbols-outlined !text-4xl text-white/5 mb-2">history</span>
                                            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No se encontraron registros recientes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {/* Create Partner Modal */}
            {
                showCreatePartner && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#121413] border border-[#1f2b24] p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#13ec80]">add_business</span> Nuevo Revendedor
                            </h3>
                            <form onSubmit={handleCreatePartner} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Razón Social</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        placeholder="Nombre de la Agencia..."
                                        value={newPartner.name}
                                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                        required
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
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contraseña Temporal</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        placeholder="Contraseña temporal para el partner"
                                        type="password"
                                        value={newPartner.password}
                                        onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos Iniciales</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        type="number"
                                        value={newPartner.initialCredits}
                                        onChange={(e) => setNewPartner({ ...newPartner, initialCredits: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setShowCreatePartner(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors">CANCELAR</button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-[#13ec80] text-[#0a0c0b] font-black text-xs rounded-lg shadow-[0_0_20px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'CREANDO...' : 'CREAR PARTNER'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Top Up Modal */}
            {
                showTopUp && (
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
                )
            }

            {/* Style Edit Modal - ADVANCED VERSION */}
            {editingStyle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar">
                    <div className="bg-[#0a0c0b] border border-[#1f2b24] rounded-[48px] w-full max-w-5xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                        {/* Left Side: Preview */}
                        <div className="w-full md:w-[35%] bg-white/5 p-12 flex flex-col items-center justify-center border-r border-[#1f2b24] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#13ec80] blur-[150px] rounded-full"></div>
                                <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-blue-500 blur-[150px] rounded-full"></div>
                            </div>

                            <div className="relative z-10 w-full">
                                <div className="aspect-[4/5] rounded-[40px] overflow-hidden border-2 border-[#13ec80]/30 shadow-2xl relative group">
                                    <img
                                        src={styleForm.image_url || '/placeholder-style.jpg'}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase">Cambiar Imagen</label>
                                    </div>
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px]">Identity Preview Module V1.5</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form */}
                        <div className="flex-1 p-12 overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                        {editingStyle === 'new' ? 'Initialize Protocol' : 'Sync Identity Data'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[4px] mt-1">Sintonización de Red Neuronal</p>
                                </div>
                                <button onClick={() => setEditingStyle(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#13ec80] uppercase tracking-widest ml-1">Identity Handle (ID)</label>
                                        <input
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80] font-mono text-sm"
                                            value={styleForm.id}
                                            disabled={editingStyle !== 'new'}
                                            onChange={(e) => setStyleForm({ ...styleForm, id: e.target.value.toLowerCase() } as any)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Visual Title</label>
                                        <input
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80]"
                                            value={styleForm.label}
                                            onChange={(e) => setStyleForm({ ...styleForm, label: e.target.value } as any)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System URL / Storage Path</label>
                                    <input
                                        className="w-full bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                        value={(styleForm as any).image_url}
                                        onChange={(e) => setStyleForm({ ...styleForm, image_url: e.target.value } as any)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Category (Pack)</label>
                                        <select
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80] appearance-none"
                                            value={styleForm.category}
                                            onChange={(e) => setStyleForm({ ...styleForm, category: e.target.value } as any)}
                                        >
                                            <option value="">Seleccionar Pack</option>
                                            <option value="cinema">Cinema (John Wick, Películas)</option>
                                            <option value="sports">Sports (F1, Fútbol)</option>
                                            <option value="series">Series (Breaking Bad, Suits)</option>
                                            <option value="urban">Urban (Calle, Graffiti)</option>
                                            <option value="fantasy">Fantasy (Magia, RPG)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legacy Subcategory</label>
                                        <input
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                            value={(styleForm as any).subcategory}
                                            onChange={(e) => setStyleForm({ ...styleForm, subcategory: e.target.value } as any)}
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#121413] border border-[#1f2b24] rounded-[24px] p-6 flex items-center justify-between group hover:border-[#ff5500]/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#ff5500]/10 flex items-center justify-center text-[#ff5500]">
                                            <span className="material-symbols-outlined">workspace_premium</span>
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Elevate to Premium Status (VIP Access Only)</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={styleForm.is_premium}
                                            onChange={(e) => setStyleForm({ ...styleForm, is_premium: e.target.checked } as any)}
                                        />
                                        <div className="w-14 h-7 bg-white/5 border border-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ff5500] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Generation Prompt (Cerebro Core)</label>
                                        <span className="text-[8px] font-bold text-[#13ec80] uppercase">Neural Network Ready</span>
                                    </div>
                                    <textarea
                                        className="w-full bg-[#121413] border border-[#1f2b24] rounded-[32px] px-8 py-6 text-white outline-none focus:border-[#13ec80] text-sm leading-relaxed min-h-[120px] resize-none"
                                        value={(styleForm as any).prompt}
                                        onChange={(e) => setStyleForm({ ...styleForm, prompt: e.target.value } as any)}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tactical Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {String((styleForm as any).tags || '').split(',').filter(Boolean).map((tag, idx) => (
                                            <span key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                                {tag.trim()}
                                                <button onClick={() => {
                                                    const currentTags = String((styleForm as any).tags).split(',').filter(t => t.trim() !== tag.trim());
                                                    setStyleForm({ ...styleForm, tags: currentTags.join(', ') } as any);
                                                }} className="text-slate-600 hover:text-white transition-colors">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80]"
                                            id="new-tag-input"
                                            placeholder="Add tactical label..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const input = e.target as HTMLInputElement;
                                                    const newTag = input.value.trim();
                                                    if (newTag) {
                                                        const currentTags = String((styleForm as any).tags || '');
                                                        setStyleForm({ ...styleForm, tags: currentTags ? `${currentTags}, ${newTag}` : newTag } as any);
                                                        input.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.getElementById('new-tag-input') as HTMLInputElement;
                                                const newTag = input.value.trim();
                                                if (newTag) {
                                                    const currentTags = String((styleForm as any).tags || '');
                                                    setStyleForm({ ...styleForm, tags: currentTags ? `${currentTags}, ${newTag}` : newTag } as any);
                                                    input.value = '';
                                                }
                                            }}
                                            className="bg-white/5 border border-white/10 text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                const payload = {
                                                    id: styleForm.id,
                                                    label: styleForm.label,
                                                    category: styleForm.category,
                                                    is_premium: styleForm.is_premium,
                                                    prompt: (styleForm as any).prompt,
                                                    tags: String((styleForm as any).tags).split(',').map(t => t.trim()).filter(Boolean),
                                                    subcategory: (styleForm as any).subcategory,
                                                    image_url: (styleForm as any).image_url,
                                                    updated_at: new Date().toISOString()
                                                };

                                                const { error } = await supabase
                                                    .from('styles_metadata')
                                                    .upsert(payload);

                                                if (error) throw error;
                                                alert('Protocol synced successfully.');
                                                setEditingStyle(null);
                                                fetchData();
                                            } catch (err: any) {
                                                alert('Error: ' + err.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="flex-1 py-6 bg-gradient-to-r from-orange-600 to-[#ff5500] text-white font-black rounded-[32px] text-xs tracking-[4px] shadow-[0_20px_40px_rgba(255,85,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase italic"
                                    >
                                        Finalize Protocol Sync
                                    </button>
                                    <button className="aspect-square w-16 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                        <span className="material-symbols-outlined">query_stats</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#121413] border border-[#1f2b24] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-[#1f2b24]">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">manage_accounts</span>
                                Editar Usuario B2C
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{editingUser.email}</p>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={editingUser.full_name || ''}
                                        onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Nombre del usuario..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos</label>
                                    <input
                                        type="number"
                                        value={editingUser.credits}
                                        onChange={e => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Packs Desbloqueados</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-[#0a0c0b] rounded-xl border border-[#1f2b24] custom-scrollbar">
                                    {Array.from(new Set(stylesMetadata.map(s => s.category))).filter(c => c).map(category => {
                                        const isChecked = editingUser.unlocked_packs?.includes(category);
                                        return (
                                            <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => {
                                                        const packs = editingUser.unlocked_packs || [];
                                                        if (e.target.checked) {
                                                            setEditingUser({ ...editingUser, unlocked_packs: [...packs, category] });
                                                        } else {
                                                            setEditingUser({ ...editingUser, unlocked_packs: packs.filter(p => p !== category) });
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded border ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-[#1f2b24] group-hover:border-slate-600'} flex items-center justify-center transition-all`}>
                                                    {isChecked && <span className="material-symbols-outlined !text-[12px] text-white">check</span>}
                                                </div>
                                                <span className={`text-[11px] uppercase font-bold tracking-tight ${isChecked ? 'text-white' : 'text-slate-500'}`}>{category}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingUser}
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    {isSavingUser ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showNewUserModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#121413] border border-[#1f2b24] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-[#1f2b24]">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">person_add</span>
                                Nuevo Usuario B2C
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Alta de cuenta pública y créditos</p>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email del Usuario</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserForm.email}
                                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="ejemplo@usuario.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos Iniciales</label>
                                    <input
                                        type="number"
                                        required
                                        value={newUserForm.credits}
                                        onChange={e => setNewUserForm({ ...newUserForm, credits: parseInt(e.target.value) })}
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Rol Asignado</label>
                                    <div className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        USUARIO B2C
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Packs Desbloqueados (Separar por coma)</label>
                                <input
                                    type="text"
                                    value={newUserForm.packs}
                                    onChange={e => setNewUserForm({ ...newUserForm, packs: e.target.value })}
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                    placeholder="Formula 1, John Wick, Magia..."
                                />
                                <p className="text-[9px] text-slate-600 mt-2 italic">* Los nombres deben coincidir con la subcategoría en el Motor de Estilos.</p>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewUserModal(false)}
                                    className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingUser}
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                >
                                    {isSavingUser ? 'CREANDO...' : 'CREAR USUARIO'}
                                </button>
                            </div>
                        </form>
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
        </div >
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

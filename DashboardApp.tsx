import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { IDENTITIES } from './lib/constants';
import {
    Users,
    LayoutDashboard,
    Settings,
    LogOut,
    Shield,
    Smartphone,
    PieChart,
    Calendar,
    Image as ImageIcon,
    ChevronRight,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { PartnerDashboard } from './components/PartnerDashboard';
import { Admin as MasterDashboard } from './components/Admin';
import { Auth } from './components/Auth';

const DashboardApp: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*, partner:partners(*)')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/cabina/';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-t-2 border-accent rounded-full animate-spin" />
                    <p className="text-white/40 text-sm font-mono tracking-widest uppercase">Cargando Panel...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Auth onAuthSuccess={() => window.location.reload()} />;
    }

    // Dashboard del Cliente Final (Host)
    const ClientDashboard = () => (
        <div className="space-y-8 animate-fade-in">
            {/* Header del Cliente */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Mi Evento</h1>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Panel de Control del Anfitrión</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-accent hover:text-white transition-colors">
                        Descargar QR
                    </button>
                    <button className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors">
                        Ver Galería
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats del Evento */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group hover:border-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-accent" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-4xl font-black mb-1">452</p>
                            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Fotos Generadas</p>
                        </div>
                    </div>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group hover:border-accent/40 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <PieChart className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-mono text-white/40">90% CONSUMIDO</span>
                        </div>
                        <div>
                            <p className="text-4xl font-black mb-1">48 / 500</p>
                            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Créditos Restantes</p>
                        </div>
                    </div>
                </div>

                {/* Configuración Rápida */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-white/40">Configuración</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-mono text-white/40 uppercase mb-2 block">Nombre del Evento</label>
                            <input
                                type="text"
                                defaultValue="Mis 15 Martina"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-white/40 uppercase mb-2 block">Fecha</label>
                            <input
                                type="date"
                                defaultValue="2026-03-15"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                            />
                        </div>
                        <button className="w-full py-4 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20">
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-primary text-white flex">
            {/* Sidebar de Navegación */}
            <aside className="w-72 border-r border-white/5 flex flex-col bg-secondary p-8 space-y-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black tracking-tighter text-xl">METADASH</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-accent text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Escritorio</span>
                    </button>

                    {profile?.is_master && (
                        <button
                            onClick={() => setActiveTab('master')}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'master' ? 'bg-accent text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest">Ojo de Águila</span>
                        </button>
                    )}

                    {profile?.role === 'partner' && (
                        <button
                            onClick={() => setActiveTab('partner')}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === 'partner' ? 'bg-accent text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest">Mis Eventos</span>
                        </button>
                    )}

                    <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Ajustes</span>
                    </button>
                </nav>

                <div className="pt-8 border-t border-white/5 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`} alt="Avatar" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate">{profile?.full_name || 'Admin User'}</p>
                            <p className="text-[10px] font-mono text-white/40 truncate uppercase">{profile?.role || 'Guest'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors group"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
                    </button>

                    <a
                        href="/cabina/"
                        className="flex items-center gap-3 text-accent group"
                    >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Ir a la App</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </aside>

            {/* Área de Contenido Principal */}
            <main className="flex-1 p-12 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto">
                    {activeTab === 'overview' && (
                        <>
                            {profile?.is_master ? <MasterDashboard IDENTITIES={IDENTITIES} onBack={() => { }} /> :
                                profile?.role === 'partner' ? <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} /> :
                                    profile?.role === 'client' ? <ClientDashboard /> :
                                        <div className="text-center py-20">
                                            <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-6" />
                                            <h2 className="text-2xl font-black mb-2">Acceso Restringido</h2>
                                            <p className="text-white/40">Tu cuenta no tiene privilegios administrativos asignados.</p>
                                        </div>
                            }
                        </>
                    )}

                    {activeTab === 'master' && <MasterDashboard IDENTITIES={IDENTITIES} onBack={() => { }} />}
                    {activeTab === 'partner' && <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} />}
                    {activeTab === 'client' && <ClientDashboard />}
                </div>
            </main>
        </div>
    );
};

export default DashboardApp;

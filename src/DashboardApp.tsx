import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from './lib/supabaseClient';
import {
    LayoutDashboard,
    Calendar,
    CreditCard,
    Palette,
    Settings,
    LogOut,
    Sparkles,
    Shield,
    Users,
} from 'lucide-react';

const PartnerDashboard = React.lazy(() => import('./components/dashboards/PartnerDashboard').then(m => ({ default: m.PartnerDashboard })));
const MasterDashboard = React.lazy(() => import('./components/dashboards/Admin').then(m => ({ default: m.Admin })));
const ClientDashboard = React.lazy(() => import('./components/dashboards/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
import { Auth } from './components/Auth';

const LoadingUI = ({ subtitle = 'Iniciando dashboard...' }) => (
    <div className="min-h-screen bg-[#0a0c0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-t-2 border-[#135bec] rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium animate-pulse">{subtitle}</p>
        </div>
    </div>
);

const DashboardApp: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [proxyProfile, setProxyProfile] = useState<any>(null);

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
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Try to fetch partner separately to avoid query failure
            let partnerData = null;
            try {
                const { data: part } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                partnerData = part;
            } catch (pErr) {
                console.warn('User has no partner entry or RLS restricted');
            }

            setProfile({ ...data, partner: partnerData });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (loading) {
        return <LoadingUI />;
    }

    if (!session) {
        return <Auth onAuthSuccess={() => window.location.reload()} />;
    }

    // Sidebar Navigation Logic
    const renderSidebarItem = (id: string, label: string, Icon: any) => {
        const isActive = activeTab === id;
        return (
            <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-all group text-left ${isActive
                    ? 'bg-[#135bec]/15 text-[#135bec] border-r-[3px] border-[#135bec]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border-r-[3px] border-transparent'
                    }`}
            >
                <Icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${isActive ? 'text-[#135bec]' : ''}`} />
                <span className="text-sm font-medium">{label}</span>
            </button>
        );
    };

    // Full Screen Dashboards Override
    const userRole = (profile?.role || '').toLowerCase();
    const isMaster = profile?.is_master || userRole === 'master' || userRole === 'admin';

    if (isMaster && activeTab !== 'client_view') {
        return (
            <Suspense fallback={<LoadingUI />}>
                <MasterDashboard onBack={handleLogout} />
            </Suspense>
        );
    }

    if (profile?.role === 'client' || activeTab === 'client_view' || proxyProfile) {
        return (
            <Suspense fallback={<LoadingUI />}>
                <ClientDashboard
                    user={session.user}
                    profile={proxyProfile || profile}
                    onBack={proxyProfile ? () => setProxyProfile(null) : undefined}
                />
            </Suspense>
        );
    }

    return (
        <div className="flex h-screen w-full bg-[#0f172a] text-slate-100 font-sans overflow-hidden dark">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col justify-between py-6">
                <div className="flex flex-col gap-8">
                    {/* Logo Section */}
                    <div className="px-6 flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#135bec] flex items-center justify-center shadow-lg shadow-[#135bec]/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight text-white uppercase truncate">{profile?.partner?.name || 'PHOTO BOOTH'}</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold truncate">{profile?.role === 'partner' ? 'Reseller Pro' : 'Client Access'}</span>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1">
                        {renderSidebarItem('overview', 'Vista General', LayoutDashboard)}

                        {/* Role-based Menu Items */}
                        {isMaster && (
                            <>
                                {renderSidebarItem('overview', 'Panel Master', Shield)}
                                {renderSidebarItem('client_view', 'Vista Cliente', LayoutDashboard)}
                            </>
                        )}
                        {profile?.role === 'partner' && (
                            <>
                                {renderSidebarItem('events', 'Eventos', Calendar)}
                                {renderSidebarItem('wallet', 'Billetera', CreditCard)}
                                {renderSidebarItem('branding', 'Identidad', Palette)}
                            </>
                        )}

                        {/* Settings - common for all */}
                        <button className="w-full flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-900 transition-all group text-left border-r-[3px] border-transparent">
                            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Configuración</span>
                        </button>
                    </nav>
                </div>

                {/* User Profile Footer */}
                <div className="px-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`}
                                alt="Profile"
                                className="size-10 rounded-full border-2 border-slate-700 bg-slate-800 object-cover"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">{profile?.full_name || 'Usuario Admin'}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                    {profile?.role === 'partner' ? 'Gestor Partner' :
                                        isMaster ? 'Admin Maestro' :
                                            'Invitado'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-white transition-colors uppercase tracking-wider"
                        >
                            CERRAR SESIÓN
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0f172a]">
                <div className="max-w-7xl mx-auto">
                    <Suspense fallback={<LoadingUI subtitle="Cargando panel..." />}>
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                {profile?.role === 'partner' ? (
                                    <PartnerDashboard
                                        user={session.user}
                                        profile={profile}
                                        onBack={() => { }}
                                        initialView="overview"
                                        onProxyClient={(email: string) => setProxyProfile({ ...profile, email, role: 'client' })}
                                    />
                                ) : isMaster ? (
                                    <div className="text-center py-20">
                                        <h2 className="text-2xl font-bold text-white italic">Panel de Control General</h2>
                                        <p className="text-slate-400">Selecciona una opción del menú para comenzar.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                                        <p className="text-slate-400">Contenido restringido.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <PartnerDashboard
                                user={session.user}
                                profile={profile}
                                onBack={() => { }}
                                initialView="events"
                                onProxyClient={(email: string) => setProxyProfile({ ...profile, email, role: 'client' })}
                            />
                        )}
                        {activeTab === 'wallet' && <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} initialView="wallet" />}
                        {activeTab === 'branding' && <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} initialView="branding" />}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default DashboardApp;

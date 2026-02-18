import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { IDENTITIES } from './lib/constants';
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
    // Lucide icons mapping to Material Symbols if needed
} from 'lucide-react';
import { PartnerDashboard } from './components/PartnerDashboard';
import { Admin as MasterDashboard } from './components/Admin';
import { ClientDashboard } from './components/ClientDashboard';
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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-t-2 border-[#135bec] rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing dashboard...</p>
                </div>
            </div>
        );
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
                            <span className="text-sm font-bold tracking-tight text-white uppercase">PHOTO BOOTH</span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Reseller Pro</span>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1">
                        {renderSidebarItem('overview', 'Dashboard', LayoutDashboard)}

                        {/* Role-based Menu Items */}
                        {profile?.role === 'partner' && (
                            <>
                                {renderSidebarItem('events', 'Events', Calendar)}
                                {/* 'credits' tab redirects to overview or a specific credits view, for now reuse overview or placeholder */}
                                {renderSidebarItem('branding', 'White Label', Palette)}
                            </>
                        )}

                        {profile?.role === 'client' && (
                            <>
                                {renderSidebarItem('overview', 'Mi Evento', Calendar)}
                                {renderSidebarItem('gallery', 'Ver Galería', Sparkles)}
                            </>
                        )}

                        {profile?.is_master && (
                            <>
                                {renderSidebarItem('master', 'Partners', Shield)}
                                {renderSidebarItem('users', 'Users List', Users)}
                            </>
                        )}

                        {/* Settings - common for all */}
                        <button className="w-full flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-900 transition-all group text-left border-r-[3px] border-transparent">
                            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Settings</span>
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
                                <span className="text-xs font-bold text-white truncate">{profile?.full_name || 'Admin User'}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{profile?.role === 'partner' ? 'Partner Admin' : profile?.is_master ? 'Master Admin' : 'Guest'}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-white transition-colors uppercase tracking-wider"
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0f172a]">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            {profile?.is_master ? (
                                <MasterDashboard IDENTITIES={IDENTITIES} onBack={() => { }} />
                            ) : profile?.role === 'partner' ? (
                                <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} initialView="overview" />
                            ) : profile?.role === 'client' ? (
                                <ClientDashboard user={session.user} profile={profile} />
                            ) : (
                                <div className="text-center py-20">
                                    <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                                    <p className="text-slate-400">Panel de generación pública (Modelo A) próximamente...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'events' && <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} initialView="events" />}
                    {activeTab === 'branding' && <PartnerDashboard user={session.user} profile={profile} onBack={() => { }} initialView="branding" />}

                    {/* Master Admin Views */}
                    {activeTab === 'master' && <MasterDashboard IDENTITIES={IDENTITIES} onBack={() => { }} initialView="partners" />}
                    {activeTab === 'users' && <MasterDashboard IDENTITIES={IDENTITIES} onBack={() => { }} initialView="users" />}
                </div>
            </main>
        </div>
    );
};

export default DashboardApp;

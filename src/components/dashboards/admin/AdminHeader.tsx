import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, UserCircle, Palette, Activity, Settings, ArrowLeft } from 'lucide-react';

interface AdminHeaderProps {
    view: 'overview' | 'partners' | 'b2c' | 'styles' | 'logs' | 'settings';
    setView: (view: 'overview' | 'partners' | 'b2c' | 'styles' | 'logs' | 'settings') => void;
    onBack: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ view, setView, onBack }) => {
    const tabs = [
        { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { id: 'partners', label: 'Partners B2B', icon: Users },
        { id: 'b2c', label: 'Usuarios B2C', icon: UserCircle },
        { id: 'styles', label: 'Protocolos IA', icon: Palette },
        { id: 'logs', label: 'Logs Sistema', icon: Activity },
        { id: 'settings', label: 'Ajustes', icon: Settings },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <div className="size-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5">
                            <ArrowLeft className="size-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Panel Central</span>
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id as any)}
                                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all relative group ${view === tab.id
                                        ? 'text-[#135bec]'
                                        : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                <tab.icon className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {tab.label}
                                </span>
                                {view === tab.id && (
                                    <motion.div
                                        layoutId="admin-nav-pill"
                                        className="absolute inset-0 bg-[#135bec]/10 border border-[#135bec]/20 rounded-full -z-10"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Super Administrador</p>
                        <p className="text-[8px] font-bold text-[#135bec] uppercase tracking-[2px]">Alquimia Engine v3.0</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

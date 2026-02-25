import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, Wallet, Palette } from 'lucide-react';

interface DashboardHeaderProps {
    partnerName: string | undefined;
    view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients';
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ partnerName, view, setView }) => {
    const renderTabButton = (id: typeof view, label: string, Icon: any) => {
        const isActive = view === id;
        return (
            <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold border ${isActive
                    ? 'bg-[#135bec]/10 text-[#135bec] border-[#135bec]/30 shadow-[0_0_15px_rgba(19,91,236,0.1)]'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
            >
                <Icon className="size-4" />
                {label}
            </button>
        );
    };

    return (
        <header className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-[#135bec] to-[#0a1f4d] flex items-center justify-center shadow-lg shadow-[#135bec]/20">
                        <LayoutDashboard className="text-white size-6" />
                    </div>
                    Panel de Partner <span className="text-[#135bec] opacity-50 text-xl font-medium">/ {partnerName}</span>
                </h1>
                <p className="text-slate-400 text-sm">Sistema de gestión de eventos y marca blanca corporativa.</p>
            </motion.div>

            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {renderTabButton('overview', 'Vista General', LayoutDashboard)}
                {renderTabButton('clients', 'Clientes', Users)}
                {renderTabButton('events', 'Mis Eventos', Calendar)}
                {renderTabButton('wallet', 'Billetera', Wallet)}
                {renderTabButton('branding', 'Marca Blanca', Palette)}
            </div>
        </header>
    );
};

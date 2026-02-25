import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Partner, Event } from '../../../types/index';

interface OverviewSectionProps {
    partner: Partner | null;
    events: Event[];
    generationsData: any[];
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
    partner,
    events,
    generationsData,
    setView
}) => {
    const availableCredits = (partner?.credits_total || 0) - (partner?.credits_used || 0);
    const isLowCredits = availableCredits > 0 && availableCredits < (partner?.credits_total || 0) * 0.2;
    const isCriticalCredits = availableCredits > 0 && availableCredits < (partner?.credits_total || 0) * 0.1;

    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Wholesale Credits Balance Card */}
                <div className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="size-20 text-[#135bec]" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4">Balance Mayorista</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                {availableCredits.toLocaleString()}
                            </h3>
                            <span className="text-xs font-bold text-slate-500 uppercase">Créditos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${isCriticalCredits ? 'bg-rose-500 animate-pulse' : isLowCredits ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {isCriticalCredits ? 'Balance Crítico' : isLowCredits ? 'Balance Bajo' : 'Estado Óptimo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* total events card */}
                <div className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/40 relative overflow-hidden group hover:border-[#135bec]/30 transition-all cursor-pointer" onClick={() => setView('events')}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="size-20 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4">Total Proyectos</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{events.length}</h3>
                            <span className="text-xs font-bold text-slate-500 uppercase">Instancias</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-[#135bec]" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activos en {new Set(events.map(e => e.client_email)).size} Cuentas</span>
                        </div>
                    </div>
                </div>

                {/* total photos card */}
                <div className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="size-20 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4">Producción IA</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{partner?.credits_used || 0}</h3>
                            <span className="text-xs font-bold text-slate-500 uppercase">Imágenes</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500">
                            <TrendingUp className="size-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Crecimiento Orgánico</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics Chart */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 glass-card">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Actividad de Generación</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Fotos creadas por día (Últimos 7 días)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#135bec] animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tiempo Real</span>
                    </div>
                </div>

                <div className="h-48 flex items-end gap-2 px-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const count = generationsData.filter(g => g.created_at.startsWith(dateStr)).length;
                        const maxCount = Math.max(...Array.from({ length: 7 }).map((_, j) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - j));
                            return generationsData.filter(g2 => g2.created_at.startsWith(d.toISOString().split('T')[0])).length;
                        }), 1);
                        const height = (count / maxCount) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full relative h-[140px] flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(height, 5)}%` }}
                                        className={`w-full rounded-t-xl transition-all duration-500 hover:brightness-125 ${count > 0 ? 'bg-gradient-to-t from-[#135bec] to-[#7f13ec]' : 'bg-white/5'}`}
                                    />
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase">
                                    {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

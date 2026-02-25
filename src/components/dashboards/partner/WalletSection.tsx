import React from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    TrendingUp,
    Zap,
    History,
    Info
} from 'lucide-react';
import { Partner, Event } from '../../../types/index';

interface WalletSectionProps {
    availableCredits: number;
    partner: Partner | null;
    events: Event[];
    transactions: any[];
    setShowTopUpModal: (show: boolean) => void;
}

export const WalletSection: React.FC<WalletSectionProps> = ({
    availableCredits,
    partner,
    events,
    transactions,
    setShowTopUpModal
}) => {
    return (
        <motion.div
            key="wallet"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-8"
        >
            {/* Huge Balance Sheet */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card rounded-3xl p-10 bg-gradient-to-br from-[#135bec] to-[#0a1f4d] border-none shadow-2xl shadow-[#135bec]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <ShoppingBag className="size-64" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-white/60 text-[11px] font-black uppercase tracking-[3px] mb-2">Créditos Totales Disponibles</p>
                            <h2 className="text-7xl font-black text-white tracking-tighter">
                                {availableCredits.toLocaleString()}
                                <span className="text-2xl text-white/40 ml-4 font-medium uppercase tracking-widest">unidades</span>
                            </h2>
                        </div>
                        <div className="mt-12 flex flex-wrap gap-8 items-end">
                            <div className="space-y-1">
                                <p className="text-white/40 text-[10px] font-bold uppercase">Consumo Total</p>
                                <div className="flex items-center gap-2 text-white">
                                    <TrendingUp className="size-5 text-emerald-400" />
                                    <span className="text-2xl font-black">{partner?.credits_used?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-white/40 text-[10px] font-bold uppercase">Eventos Activos</p>
                                <div className="flex items-center gap-2 text-white/80">
                                    <Zap className="size-5 text-yellow-400" />
                                    <span className="text-2xl font-black">{events.filter(e => e.is_active).length}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTopUpModal(true)}
                                className="ml-auto px-8 py-4 bg-white text-[#135bec] font-black rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-[2px] shadow-xl"
                            >
                                Recargar Créditos
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <History className="size-5 text-[#135bec]" />
                            Últimas Recargas
                        </h3>
                        <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {transactions.length > 0 ? transactions.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5 group hover:border-[#135bec]/30 transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-white">+{item.amount.toLocaleString()} Créditos</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${item.type === 'top-up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                                        {item.type === 'top-up' ? 'Carga' : 'Ajuste'}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin movimientos</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 text-center mt-6">
                        <Info className="size-3 inline mr-1" />
                        Los créditos no poseen fecha de vencimiento.
                    </p>
                </div>
            </section>

            {/* Usage by Event Analytics */}
            <section className="glass-card rounded-[40px] p-10 border border-white/5 bg-slate-900/40 backdrop-blur-3xl">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Analíticas de Consumo</h3>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[3px] mt-1">Monitoreo de energía AI por evento activo</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase">Live Metrics</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {events.map((event, idx) => {
                        const percent = Math.min(100, ((event.credits_used || 0) / (event.credits_allocated || 1)) * 100);
                        // Simulated sparkline points
                        const sparkPoints = [20, 45, 30, 60, 40, 75, percent].map((val, i) => `${i * 20},${80 - (val * 0.6)}`).join(' ');

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative h-full"
                            >
                                <div className="p-8 rounded-[32px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 group-hover:border-[#135bec]/40 transition-all overflow-hidden h-full flex flex-col">
                                    {/* Sparkline Background */}
                                    <div className="absolute inset-x-0 bottom-0 h-24 opacity-20 pointer-events-none">
                                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 120 80">
                                            <defs>
                                                <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#135bec" stopOpacity="0.5" />
                                                    <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d={`M0,80 L${sparkPoints} L120,80 Z`}
                                                fill={`url(#grad-${idx})`}
                                                className="group-hover:opacity-100 transition-opacity"
                                            />
                                            <motion.path
                                                d={`M0,${80 - (20 * 0.6)} L${sparkPoints}`}
                                                fill="none"
                                                stroke="#135bec"
                                                strokeWidth="2"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, delay: 0.5 }}
                                            />
                                        </svg>
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-2.5 bg-white/5 rounded-xl">
                                                <TrendingUp className={`size-4 ${percent > 80 ? 'text-amber-500' : 'text-emerald-500'}`} />
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">{event.event_slug}</p>
                                        </div>

                                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1 truncate group-hover:text-[#135bec] transition-colors">{event.event_name}</h4>

                                        <div className="mt-8">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-white">{event.credits_used?.toLocaleString() || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usados</span>
                                            </div>

                                            {/* Progress Bar Mini */}
                                            <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-[#135bec]'}`}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-3">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{Math.round(percent)}% Cap</span>
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Limite: {event.credits_allocated}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {events.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                            <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Info className="size-8 text-slate-600" />
                            </div>
                            <p className="text-xs font-black text-slate-600 uppercase tracking-[3px]">Sin actividad de consumo para reportar</p>
                        </div>
                    )}
                </div>
            </section>
        </motion.div>
    );
};

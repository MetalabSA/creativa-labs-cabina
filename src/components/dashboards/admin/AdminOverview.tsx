import React from 'react';
import { motion } from 'framer-motion';
import { StatCard } from './shared/StatCard';
import { SystemPulse } from './shared/SystemPulse';

interface AdminOverviewProps {
    stats: any;
    b2cStats: any;
    partnerStats: any;
    recentLogs: any[];
    fetchData: () => void;
    setView: (view: any) => void;
    partners: any[];
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    stats,
    b2cStats,
    partnerStats,
    recentLogs,
    fetchData,
    setView,
    partners
}) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Centro de Mando Ejecutivo</h2>
                    <p className="text-slate-500 text-sm">Resumen táctico del ecosistema Metalab Creative Labs</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors"
                    >
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

            {/* Global Network Activity Chart */}
            <div className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-8 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#13ec80]/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Actividad de Red Global</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-tighter">Fotos creadas por día (Últimos 7 días)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-[#13ec80] animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Pulse</span>
                        </div>
                    </div>
                </div>

                <div className="h-40 flex items-end gap-3 px-2 relative z-10">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const count = stats.allGenerations.filter((g: any) => g.created_at.startsWith(dateStr)).length;

                        const counts = Array.from({ length: 7 }).map((_, j) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - j));
                            const ds = d.toISOString().split('T')[0];
                            return stats.allGenerations.filter((g2: any) => g2.created_at.startsWith(ds)).length;
                        });
                        const maxCount = Math.max(...counts, 1);
                        const height = (count / maxCount) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                <div className="w-full relative h-[120px] flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(height, 5)}%` }}
                                        transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                                        className={`w-full rounded-t-xl transition-all duration-300 group-hover/bar:brightness-125 relative ${count > 0 ? 'bg-gradient-to-t from-[#0e5233] to-[#13ec80]' : 'bg-white/5'}`}
                                    >
                                        {count > 0 && (
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-xl" />
                                        )}
                                    </motion.div>
                                    {count > 0 && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#13ec80] text-[#0a0c0b] text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap z-20 shadow-[0_5px_15px_rgba(19,236,128,0.4)]">
                                            {count} GENS
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover/bar:text-slate-300 transition-colors">
                                    {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
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
                            {b2cStats.topStyles.slice(0, 4).map((style: any, idx: number) => (
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

                    {/* Partner Performance Ranking */}
                    <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6 text-[#13ec80]">
                            <h3 className="text-white font-black uppercase text-sm tracking-tight">🏢 Ranking Facturación (SaaS)</h3>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top Partners por Créditos</span>
                        </div>
                        <div className="space-y-3">
                            {partners
                                .sort((a, b) => (b.credits_total || 0) - (a.credits_total || 0))
                                .slice(0, 5)
                                .map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-[#13ec80]/30 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[10px] font-black text-[#13ec80] border border-[#13ec80]/20 shrink-0">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-[11px] font-black text-white uppercase truncate tracking-tight">{p.company_name || p.name}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">{(p.credits_total || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#13ec80] to-[#13ec80]/50"
                                                    style={{ width: `${Math.min(100, ((p.credits_used || 0) / (Math.max(1, p.credits_total || 1))) * 100)}%` }}
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
                                onClick={() => setView('styles')}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                            >
                                <span className="material-symbols-outlined text-purple-400">auto_fix_high</span>
                                <div>
                                    <p className="text-xs font-bold text-white">Inyectar Estilo</p>
                                    <p className="text-[9px] text-slate-500 uppercase">Nueva identidad IA</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setView('partners')}
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
    );
};

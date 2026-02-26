import React from 'react';
import { Search } from 'lucide-react';

interface B2CUser {
    id: string;
    email: string;
    full_name?: string;
    credits?: number;
    total_generations?: number;
    unlocked_packs?: string[];
}

interface B2CSectionProps {
    b2cUsers: B2CUser[];
    setShowNewUserModal: (val: boolean) => void;
    setEditingUser: (u: B2CUser | null) => void;
    setShowTopUp: (val: { id: string, name: string } | null) => void;
    b2cStats: any;
    stats: any;
}

export const B2CSection: React.FC<B2CSectionProps> = ({
    b2cUsers,
    setShowNewUserModal,
    setEditingUser,
    setShowTopUp,
    b2cStats,
    stats
}) => {
    const [b2cSearchQuery, setB2CSearchQuery] = React.useState('');
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Active Operatives <span className="text-[#13ec80]">({b2cUsers.length})</span></h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Gestión de identidades y créditos de la red pública</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por email..."
                            value={b2cSearchQuery}
                            onChange={(e) => setB2CSearchQuery(e.target.value)}
                            className="bg-[#121413] border border-[#1f2b24] rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-[#13ec80] outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowNewUserModal(true)}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.05] transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
                    >
                        <span className="material-symbols-outlined !text-lg">person_add</span> Enrolar Usuario
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Users Grid */}
                <div className="xl:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {b2cUsers
                            .filter(u => u.email.toLowerCase().includes(b2cSearchQuery.toLowerCase()))
                            .sort((a, b) => (b.total_generations || 0) - (a.total_generations || 0))
                            .map(u => (
                                <div key={u.id} className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-6 hover:border-[#13ec80]/30 transition-all group relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13ec80]/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                                                <span className="text-xl font-black text-white uppercase">{u.full_name?.[0] || u.email[0]}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white group-hover:text-[#13ec80] transition-colors line-clamp-1">{u.full_name || u.email.split('@')[0]}</h4>
                                                <p className="text-[10px] text-slate-500 font-mono italic">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#13ec80]/20 transition-all"
                                            >
                                                <span className="material-symbols-outlined !text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setShowTopUp({ id: u.id, name: u.email })}
                                                className="px-3 h-8 rounded-full bg-[#13ec80]/10 border border-[#13ec80]/20 text-[#13ec80] text-[9px] font-black uppercase tracking-tighter hover:bg-[#13ec80] hover:text-black transition-all"
                                            >
                                                Saldo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Balance Disponible</p>
                                            <p className="text-lg font-black text-[#13ec80]">{u.credits?.toLocaleString() || 0} pts</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Generaciones</p>
                                            <p className="text-lg font-black text-white">{u.total_generations || 0}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(u.unlocked_packs || []).length > 0 ? (
                                                u.unlocked_packs?.map(pack => (
                                                    <span key={pack} className="text-[8px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md font-black uppercase tracking-tighter">{pack}</span>
                                                ))
                                            ) : (
                                                <span className="text-[8px] text-slate-700 font-black uppercase italic tracking-widest">No active packs</span>
                                            )}
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-[#13ec80]"
                                                style={{ width: `${Math.min(100, (u.total_generations || 0) * 2)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Background Glow */}
                                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#13ec80]/5 blur-[60px] rounded-full group-hover:bg-[#13ec80]/10 transition-colors pointer-events-none"></div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-8">
                        <h3 className="text-xs font-black text-white uppercase tracking-[4px] mb-8 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse"></span>
                            Market Analysis
                        </h3>

                        <div className="space-y-6">
                            {b2cStats.topStyles.slice(0, 5).map((style: any) => (
                                <div key={style.id} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{style.id}</span>
                                        <span className="text-[10px] font-mono font-bold text-[#13ec80]">{style.count} GENS</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#13ec80] to-[#13ec80]/40 transition-all duration-1000"
                                            style={{ width: `${(style.count / (b2cStats.topStyles[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#13ec80]/20 to-blue-600/10 border border-[#13ec80]/30 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(19,236,128,0.1)] relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-white uppercase tracking-[4px] mb-2 font-black italic">Network Load</h3>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-bold mb-6 italic opacity-80">
                                B2C SEGMENT REPRESENTS <span className="text-[#13ec80]">
                                    {Math.min(100, (b2cStats.totalB2CGenerations / (Math.max(1, stats.totalGenerations)) * 100)).toFixed(1)}%</span> OF TOTAL OPS.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div className="h-full bg-[#13ec80] rounded-full shadow-[0_0_15px_#13ec80]" style={{ width: `${(b2cStats.totalB2CGenerations / (Math.max(1, stats.totalGenerations)) * 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-mono font-black text-[#13ec80] tracking-tighter">SECURED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

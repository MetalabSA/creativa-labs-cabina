import React from 'react';
import { LogItem } from './shared/LogItem';

interface AdminLogsSectionProps {
    partners: any[];
    recentLogs: any[];
    logFilterPartner: string;
    setLogFilterPartner: (val: string) => void;
    fetchData: () => void;
}

export const AdminLogsSection: React.FC<AdminLogsSectionProps> = ({
    partners,
    recentLogs,
    logFilterPartner,
    setLogFilterPartner,
    fetchData
}) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Visor de Registros Maestro</h2>
                    <p className="text-slate-500 text-sm">Monitor de actividad y salud del motor en tiempo real</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <select
                            value={logFilterPartner}
                            onChange={(e) => setLogFilterPartner(e.target.value)}
                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-lg px-4 py-2.5 text-xs text-white appearance-none outline-none focus:ring-1 focus:ring-[#13ec80]"
                        >
                            <option value="all">Todos los Partners</option>
                            {partners.map(p => (
                                <option key={p.id} value={p.id}>{p.name || p.company_name || p.contact_email}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => fetchData()} className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors flex items-center gap-2">
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
                    <h3 className="text-2xl font-black text-blue-400">
                        {recentLogs.length}
                    </h3>
                </div>
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Uso API</p>
                    <h3 className="text-2xl font-black text-purple-400">Escalable</h3>
                </div>
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Estado Motor</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#13ec80] animate-pulse"></div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Latencia 2.4s</h3>
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
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Info
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span> Crítico
                        </span>
                    </div>
                </div>
                <div className="p-6 divide-y divide-[#1f2b24]/30 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {recentLogs.length > 0 ? recentLogs.map((log) => (
                        <div key={log.id} className="py-4 first:pt-0 last:pb-0">
                            <LogItem
                                type={log.type}
                                title={log.title}
                                text={log.text}
                                time={log.time}
                            />
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <span className="material-symbols-outlined !text-4xl text-slate-700 mb-4">database_off</span>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">No se detecta actividad<br />en los registros filtrados</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

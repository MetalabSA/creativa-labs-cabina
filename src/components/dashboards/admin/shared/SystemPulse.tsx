import React from 'react';

import { LogItem } from './LogItem';

interface SystemPulseProps {
    logs: any[];
}

export const SystemPulse: React.FC<SystemPulseProps> = ({ logs }) => (
    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Pulse</p>
            <span className="material-symbols-outlined !text-[16px] text-[#13ec80] animate-pulse">sensors</span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? logs.map(log => (
                <LogItem
                    key={log.id}
                    type={log.type}
                    title={log.title}
                    text={log.text}
                    time={log.time}
                />
            )) : (
                <div className="text-center py-10">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">No hay actividad<br />reciente detectable</p>
                </div>
            )}
        </div>
        <div className="p-3 border-t border-[#1f2b24] bg-[#0a0c0b]">
            <button className="w-full text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors tracking-[0.2em]">Abrir Centro de Comando</button>
        </div>
    </div>
);

import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: string;
    status?: string;
    color: string;
    icon: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, status, color, icon }) => (
    <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl hover:border-[#13ec80]/30 transition-all group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <span className="material-symbols-outlined !text-8xl">{icon}</span>
        </div>
        <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            {trend && (
                <span className="text-[10px] font-bold text-[#13ec80] px-1.5 py-0.5 bg-[#13ec80]/10 rounded tracking-tight">
                    {trend}
                </span>
            )}
            {status && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#13ec80] tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse" />
                    {status}
                </span>
            )}
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-3xl font-black text-white leading-none">{value}</h3>
        </div>
        <div className="mt-4 border-t border-[#1f2b24] pt-3 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <span className="material-symbols-outlined !text-[14px]">arrow_outward</span> Sincronización en tiempo real
            </div>
        </div>
    </div>
);

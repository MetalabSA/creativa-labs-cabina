import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Partner {
    id: string;
    name?: string;
    company_name?: string;
    contact_email: string;
    contact_phone?: string;
    is_active?: boolean;
    eventCount?: number;
    activeEvents?: number;
    credits_total: number;
    credits_used: number;
    config?: any;
    user_id?: string;
    is_from_profile?: boolean;
}

interface PartnersSectionProps {
    partners: Partner[];
    partnerStats: any;
    showInactivePartners: boolean;
    setShowInactivePartners: (val: boolean) => void;
    setShowCreatePartner: (val: boolean) => void;
    setShowTopUp: (val: { id: string, name: string } | null) => void;
    setEditingPartner: (p: Partner | null) => void;
    setPartnerForm: (form: any) => void;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({
    partners,
    partnerStats,
    showInactivePartners,
    setShowInactivePartners,
    setShowCreatePartner,
    setShowTopUp,
    setEditingPartner,
    setPartnerForm
}) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Resellers Management (SaaS)</h2>
                    <p className="text-slate-500 text-sm">Control total sobre tu red de agencias y eventos</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowInactivePartners(!showInactivePartners)}
                        className={`px-4 py-3 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border ${showInactivePartners ? 'border-[#13ec80] text-[#13ec80] bg-[#13ec80]/10' : 'border-[#1f2b24] text-slate-500'}`}
                    >
                        <span className="material-symbols-outlined !text-sm">{showInactivePartners ? 'visibility' : 'visibility_off'}</span>
                        {showInactivePartners ? 'OCULTAR INACTIVOS' : 'VER INACTIVOS'}
                    </button>
                    <button
                        onClick={() => setShowCreatePartner(true)}
                        className="bg-[#13ec80] text-[#0a0c0b] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                    >
                        <span className="material-symbols-outlined">add</span> New Reseller
                    </button>
                </div>
            </div>

            {/* Partner Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Partners Activos</p>
                    <h3 className="text-2xl font-black text-white">{partners.filter(p => p.is_active !== false).length}</h3>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#13ec80]/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                        <span className="material-symbols-outlined text-[#13ec80] !text-sm">handshake</span>
                    </div>
                </div>
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Eventos Red</p>
                    <h3 className="text-2xl font-black text-[#13ec80]">{partnerStats.totalEvents}</h3>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                        <span className="material-symbols-outlined text-blue-500 !text-sm">event</span>
                    </div>
                </div>
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Créditos en Canales</p>
                    <h3 className="text-2xl font-black text-blue-400">{(partnerStats.creditsInCirculation || 0).toLocaleString()}</h3>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                        <span className="material-symbols-outlined text-purple-500 !text-sm">account_balance_wallet</span>
                    </div>
                </div>
                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ratio de Consumo</p>
                    <h3 className="text-2xl font-black text-amber-400">{partnerStats.avgConsumptionRate.toFixed(1)}%</h3>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                        <span className="material-symbols-outlined text-amber-500 !text-sm">trending_up</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-[#0a0c0b] border-b border-[#1f2b24]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner / Agencia</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Eventos</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Billetera</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Configuración</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2b24]/50">
                        {partners.filter(p => showInactivePartners ? true : (p.is_active !== false)).map(p => {
                            const isInactive = p.is_active === false;
                            const hasBranding = p.config?.primary_color || p.config?.logo_url;
                            return (
                                <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors group ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[#13ec80] font-black border border-[#13ec80]/20 shadow-inner">
                                                {(p.company_name || p.name || p.contact_email || 'P')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">
                                                    {p.company_name || p.name || p.contact_email?.split('@')[0] || 'Partner Sin Nombre'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-[#13ec80]"></span>
                                                    {p.contact_email}
                                                </p>
                                                {isInactive && (
                                                    <span className="mt-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/20 inline-block tracking-tighter">Inactivo / De Baja</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-white">{p.eventCount || 0}</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Eventos creados</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-white text-sm font-bold">{((p.credits_total || 0) - (p.credits_used || 0)).toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-600">/ {(p.credits_total || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-[#1f2b24] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#13ec80]"
                                                    style={{ width: `${Math.min(100, (p.credits_used / (p.credits_total || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span title="Branding Configurado" className={`material-symbols-outlined !text-sm ${hasBranding ? 'text-blue-400' : 'text-white/10'}`}>palette</span>
                                            <span title="Subdominio Activo" className="material-symbols-outlined !text-sm text-[#13ec80]">language</span>
                                            <span title="Soporte VIP" className="material-symbols-outlined !text-sm text-amber-400">verified</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setShowTopUp({ id: p.id, name: p.company_name || p.name })}
                                                className="text-[10px] font-black text-[#13ec80] border border-[#13ec80]/30 px-4 py-2 rounded-lg hover:bg-[#13ec80]/10 transition-all flex items-center gap-2"
                                            >
                                                RECARGAR
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingPartner(p);
                                                    setPartnerForm({
                                                        name: p.name || '',
                                                        company_name: p.company_name || p.name || '',
                                                        contact_email: p.contact_email || '',
                                                        contact_phone: (p as any).contact_phone || '',
                                                        is_active: p.is_active !== false
                                                    });
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                <span className="material-symbols-outlined !text-lg">settings</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

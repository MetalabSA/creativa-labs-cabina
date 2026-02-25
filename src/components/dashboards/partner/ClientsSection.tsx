import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit2, Mail, Sparkles, Download } from 'lucide-react';
import { Client, Event } from '../../../types/index';

interface ClientsSectionProps {
    clients: Client[];
    events: Event[];
    setShowCreateClientModal: (show: boolean) => void;
    setEditingClient: (client: Client) => void;
    setShowClientTopUpModal: (client: Client) => void;
    setSelectedClientId: (id: string | null) => void;
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
    exportClientReport: (client: Client) => void;
}

export const ClientsSection: React.FC<ClientsSectionProps> = ({
    clients,
    events,
    setShowCreateClientModal,
    setEditingClient,
    setShowClientTopUpModal,
    setSelectedClientId,
    setView,
    exportClientReport
}) => {
    return (
        <motion.div
            key="clients"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Cartera de Clientes</h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[2px] mt-1 font-bold">Administra tus cuentas corporativas y saldos asignados</p>
                </div>
                <button
                    onClick={() => setShowCreateClientModal(true)}
                    className="px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[10px] font-black rounded-xl shadow-lg shadow-[#135bec]/20 transition-all uppercase tracking-[2px] flex items-center gap-2"
                >
                    <Plus className="size-4" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => {
                    const clientEvents = events.filter(e => e.client_id === client.id || e.client_email === client.email);
                    const totalUsed = clientEvents.reduce((acc, curr) => acc + curr.credits_used, 0);

                    return (
                        <motion.div
                            key={client.id}
                            whileHover={{ y: -5 }}
                            className={`glass-card rounded-[32px] p-8 border bg-slate-900/40 relative overflow-hidden group transition-all duration-300 ${client.credits_total === 0
                                ? 'border-l-4 border-l-amber-500 border-white/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                                : 'border-l-4 border-l-[#135bec] border-white/5'
                                }`}
                        >
                            {client.credits_total === 0 && (
                                <div className="absolute top-0 right-0 pt-8 pr-8">
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
                                        <Sparkles className="size-3 text-amber-500" />
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-[2px]">Nuevo Lead</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-4 bg-[#135bec]/10 rounded-2xl border border-[#135bec]/20">
                                    <Users className="size-6 text-[#135bec]" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingClient(client)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"
                                        title="Editar Cliente"
                                    >
                                        <Edit2 className="size-3" />
                                    </button>
                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {clientEvents.length} Proyectos
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">{client.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1 lowercase">
                                    <Mail className="size-3" />
                                    {client.email || 'Sin email'}
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                                    <span className="text-slate-500 tracking-widest">Saldo Asignado</span>
                                    <span className="text-white tracking-widest">{client.credits_total.toLocaleString()} Cds</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-600">
                                    <span>Consumido</span>
                                    <span>{totalUsed.toLocaleString()} ({client.credits_total > 0 ? Math.round((totalUsed / client.credits_total) * 100) : 0}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#135bec] to-[#00d2ff] rounded-full"
                                        style={{ width: `${Math.min(100, (totalUsed / client.credits_total) * 100 || 0)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedClientId(client.email || client.id);
                                        setView('events');
                                    }}
                                    className="py-3 bg-[#135bec]/10 hover:bg-[#135bec]/20 text-[#135bec] border border-[#135bec]/30 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2"
                                >
                                    Proyectos
                                </button>
                                <button
                                    onClick={() => setShowClientTopUpModal(client)}
                                    className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2"
                                >
                                    Asignar $
                                </button>
                                <button
                                    onClick={() => exportClientReport(client)}
                                    className="col-span-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="size-3" />
                                    Exportar Reporte
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
                {clients.length === 0 && (
                    <div className="col-span-full py-20 text-center glass-card rounded-[40px] border-dashed border-white/10">
                        <Users className="size-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-black uppercase tracking-widest">No hay clientes registrados</p>
                        <button
                            onClick={() => setShowCreateClientModal(true)}
                            className="text-[#135bec] text-xs font-bold mt-4 hover:underline"
                        >
                            Crear primer cliente corporativo
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

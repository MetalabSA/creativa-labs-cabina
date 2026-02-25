import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Globe,
    ShoppingCart,
    Layout as LayoutIcon,
    Edit2,
    ExternalLink,
    Monitor as MonitorIcon,
    Trash2,
    ArrowLeft,
    Calendar
} from 'lucide-react';
import { Event } from '../../../types/index';

interface EventsSectionProps {
    events: Event[];
    filteredEvents: Event[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedClientId: string | null;
    setSelectedClientId: (id: string | null) => void;
    setShowCreateEventModal: (show: boolean) => void;
    setEventToTopUp: (event: Event) => void;
    setEventToModerate: (event: Event) => void;
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
    setEditingEvent: (event: Event) => void;
    setEventToDelete: (data: { id: string, name: string }) => void;
    onProxyClient?: (email: string) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
    events,
    filteredEvents,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    setShowCreateEventModal,
    setEventToTopUp,
    setEventToModerate,
    setView,
    setEditingEvent,
    setEventToDelete,
    onProxyClient
}) => {
    return (
        <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {selectedClientId ? `Proyectos: ${selectedClientId.split('@')[0]}` : 'Mis Eventos'}
                    </h2>
                    {selectedClientId ? (
                        <button
                            onClick={() => setSelectedClientId(null)}
                            className="flex items-center gap-2 text-[#135bec] text-[10px] font-black uppercase tracking-[2px] mt-1 hover:text-[#135bec]/80 transition-colors group"
                        >
                            <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
                            Volver a todos los proyectos
                        </button>
                    ) : (
                        <p className="text-slate-500 text-xs mt-1">Gestiona las instancias activas y el consumo de créditos.</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#135bec] transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-[#135bec] focus:border-[#135bec] w-64 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateEventModal(true)}
                        className="px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[10px] font-black rounded-xl shadow-lg shadow-[#135bec]/20 transition-all uppercase tracking-[2px] flex items-center gap-2"
                    >
                        <Plus className="size-4" />
                        Nuevo Evento
                    </button>
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.03] border-b border-white/5">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificación</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Consumo de Créditos</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Panel de Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredEvents.map(event => {
                            const percent = event.credits_allocated ? Math.min(100, Math.round((event.credits_used / event.credits_allocated) * 100)) : 0;
                            return (
                                <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-gradient-to-br from-[#135bec]/20 to-[#0a1f4d]/20 border border-[#135bec]/20 flex items-center justify-center text-[#135bec] font-black text-sm group-hover:scale-110 transition-transform">
                                                {(event?.event_name || 'E').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-[#135bec] transition-colors">{event.event_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Globe className="size-3 text-slate-600" />
                                                    <p className="text-[10px] text-slate-500 font-mono">/{event.event_slug}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="w-48">
                                            <div className="flex justify-between text-[10px] mb-1.5 font-bold">
                                                <span className="text-slate-400">{event.credits_used.toLocaleString()} / {event.credits_allocated.toLocaleString()}</span>
                                                <span className={`${percent > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{percent}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-[1px]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className={`h-full ${percent > 90 ? 'bg-rose-500' : 'bg-[#135bec]'} rounded-full shadow-[0_0_8px_rgba(19,91,236,0.5)]`}
                                                ></motion.div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${event.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                            <span className={`size-2 rounded-full ${event.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                            {event.is_active ? 'En Línea' : 'Pausado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => setEventToTopUp(event)}
                                                className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl text-emerald-500 hover:text-white transition-all group/action"
                                                title="Cargar Créditos"
                                            >
                                                <ShoppingCart className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEventToModerate(event);
                                                    setView('moderation');
                                                }}
                                                className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 rounded-xl text-indigo-500 hover:text-white transition-all group/action"
                                                title="Moderación de Galería"
                                            >
                                                <LayoutIcon className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => setEditingEvent(event)}
                                                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all group/action"
                                                title="Editar Evento"
                                            >
                                                <Edit2 className="w-4 h-4 group-hover/action:rotate-12 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://photobooth.creativa-labs.com/?event=${event.event_slug}`, '_blank')}
                                                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all group/action"
                                                title="Ver Kiosco (Público)"
                                            >
                                                <ExternalLink className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                            </button>
                                            {onProxyClient && event.client_email && (
                                                <button
                                                    onClick={() => onProxyClient(event.client_email!)}
                                                    className="p-2.5 bg-[#135bec]/10 hover:bg-[#135bec] border border-[#135bec]/20 rounded-xl text-[#135bec] hover:text-white transition-all group/action"
                                                    title="Gestionar Branding como Cliente"
                                                >
                                                    <MonitorIcon className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEventToDelete({ id: event.id, name: event.event_name })}
                                                className="p-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-xl text-rose-500 hover:text-white transition-all group/action"
                                                title="Eliminar Instancia"
                                            >
                                                <Trash2 className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredEvents.length === 0 && (
                            <tr><td colSpan={4} className="p-20 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="size-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                                        <Calendar className="size-8 text-slate-600 opacity-20" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No hay eventos para mostrar</p>
                                    <p className="text-slate-600 text-[10px] mt-1">Crea tu primera instancia para comenzar.</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

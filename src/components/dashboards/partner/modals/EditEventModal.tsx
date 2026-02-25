import React from 'react';
import { Zap } from 'lucide-react';
import { AlquimiaModal } from '../../shared';
import { Event, Client } from '../../../types/index';
import { PREFERRED_PACK_ORDER } from '../../../lib/constants';

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingEvent: Event | null;
    setEditingEvent: (event: any) => void;
    clients: Client[];
    brandingConfig: any;
    onEventUpdate: (e: React.FormEvent) => void;
    loading: boolean;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
    isOpen,
    onClose,
    editingEvent,
    setEditingEvent,
    clients,
    brandingConfig,
    onEventUpdate,
    loading
}) => {
    if (!editingEvent) return null;

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Evento"
            description="Modificar parámetros"
        >
            <form onSubmit={onEventUpdate} className="p-7 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre del Evento</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800"
                            value={editingEvent.event_name}
                            onChange={e => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Inicio</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={editingEvent.start_date ? new Date(editingEvent.start_date).toISOString().split('T')[0] : ''}
                                onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Fin</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={editingEvent.end_date ? new Date(editingEvent.end_date).toISOString().split('T')[0] : ''}
                                onChange={e => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 block">Estilos para este Evento</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(editingEvent.client_id && clients.find(c => c.id === editingEvent.client_id)?.contracted_styles || (brandingConfig.style_presets?.length > 0 ? brandingConfig.style_presets : PREFERRED_PACK_ORDER)).map(style => {
                                const isSelected = editingEvent.selected_styles?.includes(style);
                                return (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => {
                                            const next = isSelected
                                                ? editingEvent.selected_styles.filter((s: string) => s !== style)
                                                : [...(editingEvent.selected_styles || []), style];
                                            setEditingEvent({ ...editingEvent, selected_styles: next });
                                        }}
                                        className={`py-2 px-1 rounded-lg border text-[8px] font-bold uppercase transition-all ${isSelected
                                            ? 'bg-[#135bec]/20 border-[#135bec] text-white'
                                            : 'bg-white/5 border-white/5 text-slate-500'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${editingEvent.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            <Zap className="size-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Estado</p>
                            <p className="text-[9px] text-slate-500 uppercase mt-1 leading-none">{editingEvent.is_active ? 'En Línea' : 'Inactivo'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditingEvent({ ...editingEvent, is_active: !editingEvent.is_active })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editingEvent.is_active ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                        >
                            {editingEvent.is_active ? 'Pausar' : 'Activar'}
                        </button>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[11px] font-black rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase tracking-[3px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Sincronizando...' : 'Guardar Cambios'}
                </button>
            </form>
        </AlquimiaModal>
    );
};

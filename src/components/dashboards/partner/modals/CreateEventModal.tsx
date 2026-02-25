import React from 'react';
import {
    Users,
    ChevronRight,
    ShoppingCart,
    CreditCard,
    Zap
} from 'lucide-react';
import { AlquimiaModal } from '../../../shared';
import { Client, Partner } from '../../../../types/index';
import { PREFERRED_PACK_ORDER } from '../../../../lib/constants';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    newEvent: any;
    setNewEvent: (event: any) => void;
    clients: Client[];
    partner: Partner | null;
    brandingConfig: any;
    getClientBalance: (email: string) => number;
    onEventCreate: (e: React.FormEvent) => void;
    loading: boolean;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    newEvent,
    setNewEvent,
    clients,
    partner,
    brandingConfig,
    getClientBalance,
    onEventCreate,
    loading
}) => {
    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Evento"
            description="Nueva instancia"
        >
            <form onSubmit={onEventCreate} className="p-7 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre del Evento</label>
                        <input
                            required
                            type="text"
                            placeholder="Nombre comercial"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800"
                            value={newEvent.name}
                            onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Asignar a Cliente</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 size-4" />
                            <select
                                required
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-[#135bec] outline-none transition-all text-xs appearance-none"
                                value={newEvent.client_email}
                                onChange={e => {
                                    const selected = clients.find(c => c.email === e.target.value);
                                    setNewEvent({
                                        ...newEvent,
                                        client_email: e.target.value,
                                        selected_styles: selected?.contracted_styles || (brandingConfig.style_presets?.length > 0 ? brandingConfig.style_presets : PREFERRED_PACK_ORDER)
                                    });
                                }}
                            >
                                <option value="">Consumo Directo (Mayorista)</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 size-4 rotate-90" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Personalizado</label>
                            <input
                                type="text"
                                placeholder="slug"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs font-mono"
                                value={newEvent.slug}
                                onChange={e => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Créditos</label>
                            <div className="relative">
                                <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-[#135bec] size-4" />
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs font-bold"
                                    value={newEvent.credits}
                                    onChange={e => setNewEvent({ ...newEvent, credits: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Inicio</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={newEvent.start_date}
                                onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Fin</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={newEvent.end_date}
                                onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 block">Estilos para este Evento</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(newEvent.client_email && clients.find(c => c.email === newEvent.client_email)?.contracted_styles || PREFERRED_PACK_ORDER).map(style => {
                                const isSelected = newEvent.selected_styles.includes(style);
                                return (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => {
                                            const next = isSelected
                                                ? newEvent.selected_styles.filter((s: string) => s !== style)
                                                : [...newEvent.selected_styles, style];
                                            setNewEvent({ ...newEvent, selected_styles: next });
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

                    <div className="p-4 bg-[#135bec]/5 border border-[#135bec]/10 rounded-xl flex items-center gap-4">
                        <div className="size-8 rounded-lg bg-[#135bec]/10 flex items-center justify-center text-[#135bec]">
                            <CreditCard className="size-4" />
                        </div>
                        <div>
                            {newEvent.client_email && clients.find(c => c.email === newEvent.client_email) ? (
                                <>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Saldo Cliente</p>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                                        Se utilizarán {newEvent.credits} del saldo de {clients.find(c => c.email === newEvent.client_email)?.name} ({getClientBalance(newEvent.client_email)} disponibles).
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Verificación de Balance</p>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                                        Se deducirán {newEvent.credits} créditos de tu balance mayorista ({partner ? partner.credits_total - partner.credits_used : 0} disponibles).
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[11px] font-black rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                    {loading ? 'Creando...' : (
                        <span className="flex items-center justify-center gap-2">
                            Activar Instancia de Evento
                            <Zap className="size-4 group-hover:scale-110 transition-transform" />
                        </span>
                    )}
                </button>
            </form>
        </AlquimiaModal>
    );
};

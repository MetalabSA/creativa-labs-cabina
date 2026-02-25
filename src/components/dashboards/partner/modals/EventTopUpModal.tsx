import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { AlquimiaModal } from '../../shared';
import { Event } from '../../../types/index';

interface EventTopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    amount: number;
    setAmount: (amount: number) => void;
    availableCredits: number;
    onTopUp: () => void;
    loading: boolean;
}

export const EventTopUpModal: React.FC<EventTopUpModalProps> = ({
    isOpen,
    onClose,
    event,
    amount,
    setAmount,
    availableCredits,
    onTopUp,
    loading
}) => {
    if (!event) return null;

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Recargar Evento"
            description={event.event_name || ''}
            maxWidth="max-w-sm"
        >
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Cantidad de Créditos</label>
                    <div className="relative">
                        <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 size-4" />
                        <input
                            type="number"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold text-center text-xl"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                        />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-3 text-center uppercase tracking-widest">
                        Disponibles: <span className="text-white">{availableCredits.toLocaleString()}</span>
                    </p>
                </div>

                <button
                    disabled={loading || amount <= 0 || amount > availableCredits}
                    onClick={onTopUp}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#071121] text-[11px] font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[3px] disabled:opacity-30 disabled:grayscale"
                >
                    {loading ? 'Procesando...' : 'Confirmar Transferencia'}
                </button>
            </div>
        </AlquimiaModal>
    );
};

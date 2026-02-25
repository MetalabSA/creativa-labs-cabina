import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { AlquimiaModal } from '../../shared';
import { Client, Partner } from '../../../types/index';

interface ClientTopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    amount: number;
    setAmount: (amount: number) => void;
    partner: Partner | null;
    onTopUp: () => void;
    loading: boolean;
}

export const ClientTopUpModal: React.FC<ClientTopUpModalProps> = ({
    isOpen,
    onClose,
    client,
    amount,
    setAmount,
    partner,
    onTopUp,
    loading
}) => {
    if (!client) return null;

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Asignar Saldo"
            description={client.name || ''}
            maxWidth="max-w-sm"
        >
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Cantidad a Transferir</label>
                    <div className="relative">
                        <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 size-4" />
                        <input
                            type="number"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold text-center text-xl"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest flex justify-between">
                            Tu Disponible: <span className="text-white">{((partner?.credits_total || 0) - (partner?.credits_used || 0)).toLocaleString()}</span>
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest flex justify-between">
                            Nuevo Saldo Cliente: <span className="text-emerald-500">{((client.credits_total || 0) + amount).toLocaleString()}</span>
                        </p>
                    </div>
                </div>

                <button
                    disabled={loading || amount <= 0}
                    onClick={onTopUp}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#071121] text-[11px] font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[3px] disabled:opacity-30 disabled:grayscale"
                >
                    {loading ? 'Transfiriendo...' : 'Confirmar Asignación'}
                </button>
            </div>
        </AlquimiaModal>
    );
};

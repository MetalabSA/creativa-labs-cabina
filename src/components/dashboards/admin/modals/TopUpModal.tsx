import React from 'react';
import { AlquimiaModal } from '../../../shared/AlquimiaModal';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: string, name: string, amount: number) => void;
    target: { id: string, name: string } | null;
    loading?: boolean;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    target,
    loading
}) => {
    if (!target) return null;

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Recarga de Créditos Oficial"
            maxWidth="max-w-md"
        >
            <p className="text-slate-400 text-sm mb-6 uppercase font-black tracking-widest text-center opacity-70">
                Asignando nuevos créditos a <br />
                <span className="text-[#13ec80] font-black text-lg block mt-2 tracking-normal">{target.name}</span>
            </p>

            <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                {[100, 500, 1000, 5000].map(amt => (
                    <button
                        key={amt}
                        onClick={() => onConfirm(target.id, target.name, amt)}
                        disabled={loading}
                        className="py-4 border border-[#1f2b24] bg-[#0a0c0b] rounded-2xl text-white font-black hover:border-[#13ec80] hover:text-[#13ec80] hover:shadow-[0_0_20px_rgba(19,236,128,0.2)] transition-all uppercase disabled:opacity-50 flex flex-col items-center justify-center gap-1 group"
                    >
                        <span className="text-lg">+{amt.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 group-hover:text-[#13ec80]/70">CRÉDITOS</span>
                    </button>
                ))}
            </div>

            <button
                onClick={onClose}
                className="w-full mt-6 py-3 text-xs font-bold text-slate-500 hover:text-white tracking-widest uppercase transition-colors"
            >
                Cerrar
            </button>
        </AlquimiaModal>
    );
};

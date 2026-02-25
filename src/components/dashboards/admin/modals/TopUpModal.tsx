import React from 'react';
import { AlquimiaModal } from '../../../shared/AlquimiaModal';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTopUp: (amount: number) => void;
    targetName: string;
    loading?: boolean;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
    isOpen,
    onClose,
    onTopUp,
    targetName,
    loading
}) => {
    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Recarga de Créditos"
            maxWidth="max-w-md"
        >
            <p className="text-slate-400 text-sm mb-6">
                Asignando nuevos créditos a <span className="text-[#13ec80] font-bold">{targetName}</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
                {[1000, 5000, 10000, 50000].map(amt => (
                    <button
                        key={amt}
                        onClick={() => onTopUp(amt)}
                        disabled={loading}
                        className="py-4 border border-[#1f2b24] bg-[#0a0c0b] rounded-xl text-white font-black hover:border-[#13ec80] hover:text-[#13ec80] transition-all uppercase disabled:opacity-50"
                    >
                        +{amt.toLocaleString()}
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

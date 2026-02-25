import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AlquimiaModal } from '../../../shared';
import { Event } from '../../../../types/index';

interface DeleteEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventToDelete: Event | null;
    onConfirm: () => void;
}

export const DeleteEventModal: React.FC<DeleteEventModalProps> = ({
    isOpen,
    onClose,
    eventToDelete,
    onConfirm
}) => {
    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="¿Eliminar Evento?"
            description="Esta acción es permanente"
        >
            <div className="text-center">
                <div className="size-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <AlertTriangle className="size-10 text-rose-500" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Se eliminará el evento <span className="text-white font-bold">"{eventToDelete?.event_name}"</span> y todos sus datos asociados.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-xl transition-all uppercase tracking-[2px]"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 uppercase tracking-[2px]"
                    >
                        Confirmar Baja
                    </button>
                </div>
            </div>
        </AlquimiaModal>
    );
};

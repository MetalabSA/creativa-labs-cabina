import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeletePartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    partnerName: string;
}

export const DeletePartnerModal: React.FC<DeletePartnerModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    partnerName
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#121413] border border-red-500/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden"
                    >
                        {/* Warning Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] pointer-events-none"></div>

                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                            <span className="material-symbols-outlined !text-4xl">warning</span>
                        </div>

                        <h3 className="text-2xl font-black text-white uppercase text-center mb-2 italic tracking-tighter">Confirmar <span className="text-red-500">Baja</span></h3>
                        <p className="text-slate-400 text-sm text-center mb-8 px-4">
                            ¿Estás seguro de que deseas dar de baja a <span className="text-white font-bold">{partnerName}</span>?<br />
                            <span className="text-[10px] uppercase font-black text-red-500/60 tracking-[2px] mt-4 block p-2 bg-red-500/5 rounded-lg border border-red-500/10">Esta acción desactivará su acceso de inmediato</span>
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.2)] hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest"
                            >
                                Confirmar Baja
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

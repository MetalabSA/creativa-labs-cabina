import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AlquimiaModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const AlquimiaModal: React.FC<AlquimiaModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = 'max-w-md'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`w-full ${maxWidth} bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden`}
                    >
                        <div className="flex items-center justify-between p-7 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
                                {description && (
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="size-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-7">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

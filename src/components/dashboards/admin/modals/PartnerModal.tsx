import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlquimiaModal } from '../../../shared/AlquimiaModal';
import { Partner } from './types';

interface PartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (partnerData: any) => Promise<void>;
    onDelete?: (partner: Partner) => void;
    partner: Partner | null;
    isSaving: boolean;
    loading?: boolean;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    partner,
    isSaving,
    loading
}) => {
    const isEditing = !!partner;

    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        contact_email: '',
        contact_phone: '',
        password: '',
        initialCredits: 1000,
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (partner) {
                setFormData({
                    name: partner.name || '',
                    company_name: partner.company_name || '',
                    contact_email: partner.contact_email,
                    contact_phone: partner.contact_phone || '',
                    password: '', // Not needed for editing
                    initialCredits: partner.credits_total || 0,
                    is_active: partner.is_active !== false
                });
            } else {
                setFormData({
                    name: '',
                    company_name: '',
                    contact_email: '',
                    contact_phone: '',
                    password: '',
                    initialCredits: 1000,
                    is_active: true
                });
            }
        }
    }, [isOpen, partner]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-[#121413] border border-[#1f2b24] p-8 rounded-[32px] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
                >
                    {/* Status Light */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 pointer-events-none ${formData.is_active ? 'bg-[#13ec80]' : 'bg-red-500'}`}></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Partner <span className="text-[#13ec80]">Settings</span></h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[3px] mt-1">Configuración Maestro de Canal</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Razón Social / Empresa</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Nombre de Contacto</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Teléfono de Contacto</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    placeholder="+54 9 11..."
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email del Partner</label>
                                <input
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white/50 outline-none cursor-not-allowed"
                                    value={formData.contact_email}
                                    readOnly
                                />
                                <p className="text-[9px] text-slate-600 mt-1 italic">* El email es el identificador único y no puede cambiarse.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-xs font-bold text-white uppercase italic">Estado de Cuenta</p>
                                <p className="text-[10px] text-slate-500 font-medium">Permitir acceso y operaciones</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.is_active ? 'bg-[#13ec80]' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex gap-4 pt-4">
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(partner)}
                                    className="px-6 py-4 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all font-mono"
                                >
                                    Dar de Baja
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 py-4 bg-[#13ec80] text-[#0a0c0b] font-black text-[10px] rounded-xl shadow-[0_10px_30px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest"
                            >
                                {isSaving ? 'Sincronizando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title="Nuevo Revendedor"
            maxWidth="max-w-md"
        >
            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#13ec80]">add_business</span> Nuevo Revendedor
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Razón Social</label>
                    <input
                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                        placeholder="Nombre de la Agencia..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email de Usuario (Login)</label>
                    <input
                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                        placeholder="admin@agencia.com"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contraseña Temporal</label>
                    <input
                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                        placeholder="Contraseña temporal para el partner"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos Iniciales</label>
                    <input
                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                        type="number"
                        value={formData.initialCredits}
                        onChange={(e) => setFormData({ ...formData, initialCredits: parseInt(e.target.value) || 0 })}
                        required
                    />
                </div>
                <div className="flex gap-4 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase">CANCELAR</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-[#13ec80] text-[#0a0c0b] font-black text-xs rounded-lg shadow-[0_0_20px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 uppercase"
                    >
                        {loading ? 'CREANDO...' : 'CREAR PARTNER'}
                    </button>
                </div>
            </form>
        </AlquimiaModal>
    );
};

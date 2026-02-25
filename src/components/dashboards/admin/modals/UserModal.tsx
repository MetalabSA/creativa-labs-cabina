import React, { useState, useEffect } from 'react';
import { AlquimiaModal } from '../../../shared/AlquimiaModal';
import { UserProfile, StyleMetadata } from './types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: any) => Promise<void>;
    user: UserProfile | null;
    stylesMetadata: StyleMetadata[];
    isSaving: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
    isOpen,
    onClose,
    onSave,
    user,
    stylesMetadata,
    isSaving
}) => {
    const isEditing = !!user;

    // Create form state
    const [formData, setFormData] = useState({
        email: '',
        credits: 1000,
        full_name: '',
        unlocked_packs: [] as string[]
    });

    // Initialize/reset form when user opens or changes
    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    email: user.email,
                    credits: user.credits,
                    full_name: user.full_name || '',
                    unlocked_packs: user.unlocked_packs || []
                });
            } else {
                setFormData({
                    email: '',
                    credits: 1000,
                    full_name: '',
                    unlocked_packs: []
                });
            }
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    const togglePack = (category: string) => {
        const packs = [...formData.unlocked_packs];
        const index = packs.indexOf(category);
        if (index > -1) {
            packs.splice(index, 1);
        } else {
            packs.push(category);
        }
        setFormData({ ...formData, unlocked_packs: packs });
    };

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Usuario B2C' : 'Nuevo Usuario B2C'}
            maxWidth="max-w-lg"
        >
            <div className="mb-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {isEditing ? formData.email : 'Alta de cuenta pública y créditos'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={isEditing ? "col-span-1" : "col-span-2"}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                            {isEditing ? 'Nombre Completo' : 'Email del Usuario'}
                        </label>
                        <input
                            type={isEditing ? "text" : "email"}
                            required
                            value={isEditing ? formData.full_name : formData.email}
                            onChange={e => setFormData({ ...formData, [isEditing ? 'full_name' : 'email']: e.target.value })}
                            className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder={isEditing ? "Nombre del usuario..." : "ejemplo@usuario.com"}
                        />
                    </div>
                    {isEditing && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos</label>
                            <input
                                type="number"
                                required
                                value={formData.credits}
                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos Iniciales</label>
                            <input
                                type="number"
                                required
                                value={formData.credits}
                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Rol Asignado</label>
                            <div className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                USUARIO B2C
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                        Packs Desbloqueados
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-[#0a0c0b] rounded-xl border border-[#1f2b24] custom-scrollbar">
                        {Array.from(new Set(stylesMetadata.map(s => s.category))).filter(c => c).map(category => {
                            const isChecked = formData.unlocked_packs.includes(category);
                            return (
                                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePack(category)}
                                        className="hidden"
                                    />
                                    <div className={`w-4 h-4 rounded border ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-[#1f2b24] group-hover:border-slate-600'} flex items-center justify-center transition-all`}>
                                        {isChecked && <span className="material-symbols-outlined !text-[12px] text-white">check</span>}
                                    </div>
                                    <span className={`text-[11px] uppercase font-bold tracking-tight ${isChecked ? 'text-white' : 'text-slate-500'}`}>{category}</span>
                                </label>
                            );
                        })}
                    </div>
                    {!isEditing && (
                        <p className="text-[9px] text-slate-600 mt-2 italic">* Los nombres deben coincidir con la categoría en el Motor de Estilos.</p>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {isSaving ? (isEditing ? 'GUARDANDO...' : 'CREANDO...') : (isEditing ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO')}
                    </button>
                </div>
            </form>
        </AlquimiaModal>
    );
};

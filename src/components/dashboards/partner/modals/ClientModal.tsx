import React from 'react';
import { AlquimiaModal } from '../../../shared';
import { Client } from '../../../../types/index';
import { PREFERRED_PACK_ORDER } from '../../../../lib/constants';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingClient: Client | null;
    newClient: any;
    setNewClient: (client: any) => void;
    setEditingClient: (client: Client | null) => void;
    onClientCreate: (client: any) => void;
    onClientUpdate: (client: Client) => void;
    loading: boolean;
}

export const ClientModal: React.FC<ClientModalProps> = ({
    isOpen,
    onClose,
    editingClient,
    newClient,
    setNewClient,
    setEditingClient,
    onClientCreate,
    onClientUpdate,
    loading
}) => {
    const isEditing = !!editingClient;

    return (
        <AlquimiaModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            description="Cuenta corporativa"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (isEditing) {
                        onClientUpdate(editingClient);
                    } else {
                        onClientCreate(newClient);
                    }
                }}
                className="space-y-6"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre de la Empresa</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all"
                            value={isEditing ? editingClient.name : newClient.name}
                            onChange={e => isEditing ? setEditingClient({ ...editingClient, name: e.target.value }) : setNewClient({ ...newClient, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Email de la Cuenta</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                            value={isEditing ? editingClient.email : newClient.email}
                            onChange={e => isEditing ? setEditingClient({ ...editingClient, email: e.target.value }) : setNewClient({ ...newClient, email: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Persona de Contacto</label>
                            <input
                                type="text"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={isEditing ? editingClient.contact_person : newClient.contact_person}
                                onChange={e => isEditing ? setEditingClient({ ...editingClient, contact_person: e.target.value }) : setNewClient({ ...newClient, contact_person: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Teléfono</label>
                            <input
                                type="text"
                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                value={isEditing ? editingClient.phone : newClient.phone}
                                onChange={e => isEditing ? setEditingClient({ ...editingClient, phone: e.target.value }) : setNewClient({ ...newClient, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-3 block">Estilos Contratados</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PREFERRED_PACK_ORDER.map(style => {
                                const currentStyles = isEditing ? editingClient.contracted_styles : newClient.contracted_styles;
                                const isSelected = currentStyles?.includes(style);
                                return (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => {
                                            const next = isSelected
                                                ? currentStyles.filter((s: string) => s !== style)
                                                : [...(currentStyles || []), style];
                                            isEditing
                                                ? setEditingClient({ ...editingClient, contracted_styles: next })
                                                : setNewClient({ ...newClient, contracted_styles: next });
                                        }}
                                        className={`py-2 px-1 rounded-lg border text-[8px] font-bold uppercase tracking-wider transition-all ${isSelected
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
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[11px] font-black rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase tracking-widest disabled:opacity-50"
                >
                    {loading ? 'Sincronizando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Cliente')}
                </button>
            </form>
        </AlquimiaModal>
    );
};

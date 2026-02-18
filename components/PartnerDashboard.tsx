import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Calendar,
    Plus,
    Settings,
    BarChart3,
    ChevronLeft,
    Loader2,
    Layout,
    CreditCard,
    History,
    Edit3,
    Trash2,
    Check,
    X,
    QrCode,
    ExternalLink,
    Palette
} from 'lucide-react';

interface Partner {
    id: string;
    name: string;
    credits_total: number;
    credits_used: number;
    config: {
        primary_color: string;
        logo_url: string | null;
    };
}

interface Event {
    id: string;
    event_name: string;
    event_slug: string;
    start_date: string;
    end_date: string;
    credits_allocated: number;
    credits_used: number;
    is_active: boolean;
}

interface PartnerDashboardProps {
    user: any;
    profile: any;
    onBack: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ user, profile, onBack }) => {
    const [view, setView] = useState<'overview' | 'events' | 'branding'>('overview');
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [events, setEvents] = useState<Event[]>([]);

    // Create Event Form
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        slug: '',
        credits: 100,
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchPartnerData();
    }, [profile.partner_id]);

    const fetchPartnerData = async () => {
        if (!profile.partner_id) return;
        try {
            setLoading(true);
            const [pRes, eRes] = await Promise.all([
                supabase.from('partners').select('*').eq('id', profile.partner_id).single(),
                supabase.from('events').select('*').eq('partner_id', profile.partner_id).order('created_at', { ascending: false })
            ]);

            if (pRes.error) throw pRes.error;
            setPartner(pRes.data);
            setEvents(eRes.data || []);
        } catch (error) {
            console.error('Error fetching partner data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner) return;

        try {
            setCreating(true);

            // Check if slug is unique (simplified)
            const { data: existing } = await supabase.from('events').select('id').eq('event_slug', newEvent.slug).maybeSingle();
            if (existing) {
                alert('El slug ya existe, elegí otro.');
                return;
            }

            const { data, error } = await supabase.from('events').insert({
                event_name: newEvent.name,
                event_slug: newEvent.slug,
                partner_id: partner.id,
                credits_allocated: newEvent.credits,
                start_date: newEvent.start_date || null,
                end_date: newEvent.end_date || null,
                is_active: true
            }).select().single();

            if (error) throw error;

            setEvents([data, ...events]);
            setShowCreateModal(false);
            setNewEvent({ name: '', slug: '', credits: 100, start_date: '', end_date: '' });
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error al crear evento');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[4px] text-white/20">Cargando Panel de Revendedor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary p-4 lg:p-12 animate-[fadeIn_0.5s_ease-out]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Layout className="w-6 h-6 text-accent" />
                                <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">Panel Partner</h1>
                            </div>
                            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">{partner?.name} — Marca Blanca</p>
                        </div>
                    </div>

                    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                        <button
                            onClick={() => setView('overview')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'overview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white'}`}
                        >
                            Resumen
                        </button>
                        <button
                            onClick={() => setView('events')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'events' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white'}`}
                        >
                            Eventos
                        </button>
                        <button
                            onClick={() => setView('branding')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'branding' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white'}`}
                        >
                            Branding
                        </button>
                    </div>
                </div>

                {view === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Stats Cards */}
                        <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CreditCard className="w-24 h-24 text-accent" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Bolsa de Créditos</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-white">{(partner?.credits_total || 0) - (partner?.credits_used || 0)}</span>
                                <span className="text-[10px] text-white/20 uppercase">Disponibles</span>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="w-24 h-24 text-blue-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Eventos Activos</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-white">{events.filter(e => e.is_active).length}</span>
                                <span className="text-[10px] text-white/20 uppercase">Total {events.length}</span>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BarChart3 className="w-24 h-24 text-green-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-white/40 block mb-2">Fotos Generadas</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-white">{events.reduce((acc, e) => acc + (e.credits_used || 0), 0)}</span>
                                <span className="text-[10px] text-white/20 uppercase">En todos tus eventos</span>
                            </div>
                        </div>

                        {/* Recent Events Peek */}
                        <div className="md:col-span-3 bg-[#0a0a0c] border border-white/5 p-8 rounded-[40px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[3px] text-white italic">Últimos Eventos</h3>
                                <button onClick={() => setView('events')} className="text-[9px] font-black uppercase tracking-[2px] text-accent hover:text-white transition-colors">Ver todos</button>
                            </div>
                            <div className="space-y-4">
                                {events.slice(0, 3).map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">{event.event_name}</h4>
                                                <p className="text-[9px] text-white/20 font-mono">slug: {event.event_slug}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12">
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Uso de Créditos</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent"
                                                            style={{ width: `${(event.credits_used / event.credits_allocated) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-white">{event.credits_used}/{event.credits_allocated}</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[1px] border ${event.is_active ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                {event.is_active ? 'Activo' : 'Pausado'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="py-12 text-center text-white/10 uppercase font-black text-[10px] tracking-[4px]">Todavía no creaste eventos</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'events' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black italic uppercase tracking-tight text-white">Gestión de Eventos</h3>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-accent text-black px-6 py-3 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-[2px] hover:bg-white transition-all shadow-lg shadow-accent/20"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Evento
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <div key={event.id} className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[40px] hover:border-accent/20 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <Calendar className="w-5 h-5 text-white/40 group-hover:text-accent transition-colors" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => window.open(`?event=${event.event_slug}`, '_blank')}
                                                className="p-3 rounded-xl bg-white/5 hover:bg-accent hover:text-black transition-all text-white/40"
                                                title="Ver App del Evento"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 rounded-xl bg-white/5 hover:bg-white hover:text-black transition-all text-white/40">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-black text-white mb-2 uppercase italic">{event.event_name}</h4>
                                    <p className="text-[10px] text-white/40 font-mono mb-8 uppercase tracking-widest">URL: /{event.event_slug}</p>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-[2px] text-white/40">Consumo de Créditos</span>
                                                <span className="text-[10px] font-black text-accent">{event.credits_used} / {event.credits_allocated}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent"
                                                    style={{ width: `${(event.credits_used / event.credits_allocated) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/20 uppercase mb-1">Estado</span>
                                                <span className={`text-[9px] font-black uppercase ${event.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                                    {event.is_active ? 'Habilitado' : 'Pausado'}
                                                </span>
                                            </div>
                                            <button className="text-[9px] font-black uppercase tracking-[2px] text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3" />
                                                Métricas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'branding' && (
                    <div className="max-w-2xl mx-auto bg-[#0a0a0c] border border-white/5 p-12 rounded-[48px] text-center space-y-12">
                        <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto">
                            <Palette className="w-10 h-10 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-4">Configuración de Marca Blanca</h3>
                            <p className="text-sm text-white/40">Personalizá cómo ven tus clientes y sus invitados la aplicación.</p>
                        </div>

                        <div className="space-y-8 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Color Principal (Accent)</label>
                                <div className="flex gap-4">
                                    <input
                                        type="color"
                                        value={partner?.config?.primary_color || '#ff5500'}
                                        onChange={() => { }} // TODO: Update handler
                                        className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl cursor-pointer p-2"
                                    />
                                    <input
                                        type="text"
                                        value={partner?.config?.primary_color || '#ff5500'}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono text-sm text-white"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Logo URL (PNG/SVG)</label>
                                <input
                                    type="text"
                                    placeholder="https://tu-marca.com/logo.png"
                                    defaultValue={partner?.config?.logo_url || ''}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                />
                            </div>

                            <button className="w-full bg-white text-black font-black uppercase tracking-[3px] py-5 rounded-2xl hover:bg-accent transition-all">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
                    <div className="bg-[#0a0a0c] border border-white/10 p-12 rounded-[56px] max-w-xl w-full animate-[fadeInUp_0.4s_ease-out] relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                            <X className="w-8 h-8" />
                        </button>

                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-accent" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-white italic">Nuevo Evento</h2>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Nombre del Evento</label>
                                    <input
                                        type="text"
                                        required
                                        value={newEvent.name}
                                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                        placeholder="Cumple de 15 — Martina"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Slug URL (Ej: martina15)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newEvent.slug}
                                        onChange={e => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white font-mono focus:outline-none focus:border-accent transition-all"
                                        placeholder="martina15"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Asignar Créditos</label>
                                    <input
                                        type="number"
                                        required
                                        value={newEvent.credits}
                                        onChange={e => setNewEvent({ ...newEvent, credits: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-white/40 ml-1">Fecha Inicio (Opcional)</label>
                                    <input
                                        type="datetime-local"
                                        value={newEvent.start_date}
                                        onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-accent transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    disabled={creating}
                                    className="w-full bg-accent text-black font-black uppercase tracking-[3px] py-6 rounded-3xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
                                >
                                    {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Crear Evento</span><Plus className="w-5 h-5" /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Calendar,
    Plus,
    CreditCard,
    Settings,
    LayoutDashboard,
    Download,
    Link as LinkIcon,
    Search,
    Upload,
    CheckCircle2,
    Palette,
    Zap,
    ShoppingCart,
    Wallet,
    Bolt,
    X,
    Globe,
    QrCode,
    Trash2,
    Edit2,
    Users,
    Mail,
    ExternalLink
} from 'lucide-react';
import { IDENTITIES, PREFERRED_PACK_ORDER } from '../lib/constants';

interface Partner {
    id: string;
    name: string;
    credits_total: number;
    credits_used: number;
    config: {
        primary_color: string;
        logo_url: string | null;
        radius?: string;
        style_presets?: string[];
    };
}

interface Event {
    id: string;
    event_name: string;
    event_slug: string;
    client_email?: string;
    start_date: string;
    end_date: string;
    credits_allocated: number;
    credits_used: number;
    is_active: boolean;
    created_at?: string;
    selected_styles?: string[];
}

interface PartnerDashboardProps {
    user: any;
    profile: any;
    onBack: () => void;
    initialView?: 'overview' | 'events' | 'branding';
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ user, profile, onBack, initialView = 'overview' }) => {
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);

    // Branding State
    const [brandingConfig, setBrandingConfig] = useState({
        primary_color: '#135bec',
        logo_url: '',
        radius: '12px',
        style_presets: ['Superhéroes', 'John Wick', 'Urbano']
    });

    // New Event Form
    const [newEvent, setNewEvent] = useState({
        name: '',
        slug: '',
        client_email: '',
        credits: 500,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchPartnerData();
    }, [profile.partner_id]);

    const fetchPartnerData = async () => {
        try {
            setLoading(true);
            if (!profile.partner_id) {
                setLoading(false);
                return;
            }
            const [pRes, eRes] = await Promise.all([
                supabase.from('partners').select('*').eq('id', profile.partner_id).single(),
                supabase.from('events').select('*').eq('partner_id', profile.partner_id).order('created_at', { ascending: false })
            ]);

            if (pRes.error) throw pRes.error;
            setPartner(pRes.data);
            if (pRes.data.config) {
                setBrandingConfig({
                    primary_color: pRes.data.config.primary_color || '#135bec',
                    logo_url: pRes.data.config.logo_url || '',
                    radius: pRes.data.config.radius || '12px',
                    style_presets: pRes.data.config.style_presets || ['Superhéroes', 'John Wick', 'Urbano']
                });
            }
            setEvents(eRes.data || []);
        } catch (error) {
            console.error('Error fetching partner data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranding = async () => {
        if (!partner) return;
        try {
            const { error } = await supabase
                .from('partners')
                .update({ config: brandingConfig })
                .eq('id', partner.id);

            if (error) throw error;
            setPartner({ ...partner, config: brandingConfig });
            alert('Configuración de marca guardada');
        } catch (error) {
            console.error('Error updating branding:', error);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner) return;

        const creditsNeeded = Number(newEvent.credits);
        if (creditsNeeded > (partner.credits_total - partner.credits_used)) {
            alert('Créditos insuficientes en tu balance mayorista.');
            return;
        }

        try {
            setLoading(true);
            // 1. Create Event
            const { data: eventData, error } = await supabase.from('events').insert([
                {
                    partner_id: partner.id,
                    event_name: newEvent.name,
                    client_email: newEvent.client_email,
                    event_slug: newEvent.slug || newEvent.name.toLowerCase().replace(/\s+/g, '-'),
                    credits_allocated: creditsNeeded,
                    credits_used: 0,
                    start_date: new Date(newEvent.start_date).toISOString(),
                    end_date: new Date(newEvent.end_date).toISOString(),
                    is_active: true,
                    selected_styles: brandingConfig.style_presets
                }
            ]).select();

            if (error) throw error;

            // 2. Deduct credits from partner (Update used amount)
            const { error: pError } = await supabase.from('partners')
                .update({ credits_used: partner.credits_used + creditsNeeded })
                .eq('id', partner.id);

            if (pError) throw pError;

            setShowCreateEventModal(false);
            setNewEvent({ name: '', slug: '', client_email: '', credits: 500, start_date: '', end_date: '' });
            fetchPartnerData();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error al crear el evento. El slug podría estar duplicado.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;
            fetchPartnerData();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const toggleStylePreset = (style: string) => {
        const newPresets = brandingConfig.style_presets.includes(style)
            ? brandingConfig.style_presets.filter(s => s !== style)
            : [...brandingConfig.style_presets, style];
        setBrandingConfig({ ...brandingConfig, style_presets: newPresets });
    };

    const filteredEvents = useMemo(() => {
        return events.filter(e =>
            e.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.event_slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [events, searchTerm]);

    if (loading && !partner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white space-y-4">
                <div className="size-12 border-4 border-[#135bec] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold tracking-widest text-[10px] uppercase opacity-50">Sincronizando con la red...</p>
            </div>
        );
    }

    const availableCredits = (partner?.credits_total || 0) - (partner?.credits_used || 0);
    const consumptionPercentage = partner?.credits_total ? Math.round((partner.credits_used / partner.credits_total) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Header Section */}
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Partner Dashboard</h1>
                    <p className="text-slate-400 text-sm">Gestiona tus eventos, créditos y personalización de marca.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold text-white transition-all">
                        <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
                        Reportes
                    </button>
                    <button
                        onClick={() => setShowCreateEventModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 rounded-lg text-sm font-bold text-white shadow-lg shadow-[#135bec]/25 transition-all group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Activar Instancia
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Wholesale Credits Balance Card */}
                <div className="glass-card rounded-xl p-6 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Wallet className="size-32" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Créditos Disponibles</p>
                            <h3 className="text-3xl font-black text-white">{availableCredits.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-[#135bec]/20 rounded-lg text-[#135bec]">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-2 relative z-10">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500 uppercase tracking-widest">CONSUMO</span>
                            <span className="text-[#135bec]">{consumptionPercentage}% USADO</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[#135bec] h-full rounded-full shadow-[0_0_8px_rgba(19,91,236,0.5)] transition-all duration-1000"
                                style={{ width: `${consumptionPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic text-right">{partner?.credits_used} usados de {partner?.credits_total}</p>
                    </div>
                </div>

                {/* Active Events Card */}
                <div className="glass-card rounded-xl p-6 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Calendar className="size-32" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Eventos Activos</p>
                            <h3 className="text-3xl font-black text-white">{events.filter(e => e.is_active).length}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                            <Bolt className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                        <div className="flex -space-x-2">
                            {events.slice(0, 3).map((e, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-[#135bec] flex items-center justify-center text-[8px] font-black">
                                    {e.event_name.substring(0, 1).toUpperCase()}
                                </div>
                            ))}
                            {events.length > 3 && (
                                <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-black">+{events.length - 3}</div>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Eventos en curso</span>
                    </div>
                </div>

                {/* Buy More Credits Card */}
                <div className="glass-card rounded-xl p-6 flex flex-col justify-between border-[#135bec]/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-24 h-24 text-[#135bec]" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cargar Créditos</p>
                        <h3 className="text-xl font-bold text-white mb-4 leading-tight">¿Te quedas sin créditos?<br />Recarga al instante.</h3>
                        <button
                            onClick={() => alert('Para recargar créditos, por favor contacta a tu ejecutivo de cuenta o solicita una recarga desde el canal de soporte.')}
                            className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-black uppercase tracking-wide hover:bg-[#135bec] hover:text-white transition-all shadow-xl shadow-white/5"
                        >
                            Recargar Pack
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Events List Table */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Listado de Eventos</h2>
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#135bec] transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar evento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:ring-[#135bec] focus:border-[#135bec] w-56 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="glass-card rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Nombre del Evento</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Consumo</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredEvents.map(event => {
                                    const percent = event.credits_allocated ? Math.min(100, Math.round((event.credits_used / event.credits_allocated) * 100)) : 0;
                                    return (
                                        <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-[#135bec]/10 border border-[#135bec]/20 flex items-center justify-center text-[#135bec] font-black text-xs">
                                                        {event.event_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-[#135bec] transition-colors">{event.event_name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Globe className="size-3 text-slate-600" />
                                                            <p className="text-[10px] text-slate-500 font-mono">/{event.event_slug}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="w-32">
                                                    <div className="flex justify-between text-[10px] mb-1 font-bold">
                                                        <span className="text-slate-400">{event.credits_used} / {event.credits_allocated}</span>
                                                        <span className={`${percent > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{percent}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${percent > 90 ? 'bg-rose-500' : 'bg-[#135bec]'} rounded-full transition-all duration-700`}
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${event.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    <span className={`size-1.5 rounded-full ${event.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                    {event.is_active ? 'Activo' : 'Pausado'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => window.open(`https://photobooth.creativa-labs.com/?event=${event.event_slug}`, '_blank')}
                                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all outline-none"
                                                        title="Ver Evento"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-all outline-none"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-black rounded-lg text-white transition-all uppercase tracking-widest border border-white/5">Gestionar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredEvents.length === 0 && (
                                    <tr><td colSpan={4} className="p-12 text-center">
                                        <Calendar className="size-12 text-slate-800 mx-auto mb-3 opacity-20" />
                                        <p className="text-slate-500 text-sm font-medium">No se encontraron eventos.</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Branding & Logic */}
                <div className="space-y-8">
                    {/* Partner Branding Card */}
                    <div className="glass-card rounded-xl p-6 border border-white/5">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="size-5 text-[#135bec]" />
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Clientes & Marca</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Logo del Revendedor</label>
                                <div className="w-full border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-900/40 hover:bg-slate-900 transition-all cursor-pointer group hover:border-[#135bec]/50">
                                    {brandingConfig.logo_url ? (
                                        <img src={brandingConfig.logo_url} className="h-12 object-contain mb-2" alt="Logo" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-slate-600 group-hover:text-[#135bec] mb-2 transition-colors" />
                                    )}
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Subir Identidad</p>
                                    <p className="text-[9px] text-slate-600 mt-1 font-mono">PNG / SVG recomendado</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Color de Acento</label>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="size-10 rounded-lg bg-[#135bec] border-2 border-white/10 shadow-xl cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: brandingConfig.primary_color }}
                                            onClick={() => document.getElementById('colorPickerInput')?.click()}
                                        ></div>
                                        <input
                                            id="colorPickerInput"
                                            type="color"
                                            className="sr-only"
                                            value={brandingConfig.primary_color}
                                            onChange={(e) => setBrandingConfig({ ...brandingConfig, primary_color: e.target.value })}
                                        />
                                        <input
                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 text-xs text-white font-mono focus:ring-[#135bec] focus:border-[#135bec] outline-none transition-all"
                                            type="text"
                                            value={brandingConfig.primary_color}
                                            onChange={(e) => setBrandingConfig({ ...brandingConfig, primary_color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="w-20">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Radius</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-2 text-xs text-white focus:ring-[#135bec] outline-none"
                                        value={brandingConfig.radius}
                                        onChange={(e) => setBrandingConfig({ ...brandingConfig, radius: e.target.value })}
                                    >
                                        <option value="4px">4px</option>
                                        <option value="8px">8px</option>
                                        <option value="12px">12px</option>
                                        <option value="20px">20px</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateBranding}
                                className="w-full py-3.5 bg-slate-100 hover:bg-white text-slate-900 text-[10px] font-black rounded-xl transition-all shadow-xl shadow-white/5 uppercase tracking-[2px]"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>

                    {/* AI Style Management */}
                    <div className="glass-card rounded-xl p-6 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Zap className="size-5 text-[#135bec]" />
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">Pack de Diseños</h2>
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 bg-[#135bec]/10 text-[#135bec] rounded-md border border-[#135bec]/20">{brandingConfig.style_presets.length} ACTIVOS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {PREFERRED_PACK_ORDER.map(style => (
                                <label key={style} className="relative block cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={brandingConfig.style_presets.includes(style)}
                                        onChange={() => toggleStylePreset(style)}
                                        className="peer sr-only"
                                    />
                                    <div className={`h-24 rounded-xl overflow-hidden relative border-2 transition-all duration-300 ${brandingConfig.style_presets.includes(style) ? 'border-[#135bec] scale-[1.02] shadow-lg shadow-[#135bec]/20' : 'border-white/5 opacity-40 hover:opacity-100'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                                        <img
                                            alt={style}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            src={`https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=280&auto=format&fit=crop`}
                                        /* Placeholder for packs */
                                        />
                                        <span className="absolute bottom-2.5 left-2.5 z-20 text-[9px] font-black uppercase text-white tracking-[1px] leading-tight">{style}</span>
                                        <div className="absolute top-2 right-2 z-20 opacity-0 peer-checked:opacity-100 transition-all transform scale-50 peer-checked:scale-100">
                                            <div className="bg-[#135bec] rounded-full p-1 shadow-lg">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="mt-6 text-[10px] text-slate-500 font-medium text-center leading-relaxed">
                            <Bolt className="size-3 inline mr-1 text-[#135bec]" />
                            Estos estilos estarán disponibles para tus clientes finales en sus eventos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                    <div className="glass-card w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between p-7 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Crear Nuevo Evento</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Configuración de instancia</p>
                            </div>
                            <button onClick={() => setShowCreateEventModal(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="p-7 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre del Evento</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej: Boda de Lucía y Marcos"
                                        className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800"
                                        value={newEvent.name}
                                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                    />
                                </div>
                                {/* Client Email Input */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Email del Cliente (Asignación)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 size-4" />
                                        <input
                                            required
                                            type="email"
                                            placeholder="cliente@ejemplo.com"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800 text-xs"
                                            value={newEvent.client_email}
                                            onChange={e => setNewEvent({ ...newEvent, client_email: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-1.5 ml-1">Este email se usará para que el cliente acceda a su panel.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Slug Personalizado</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 text-xs font-mono">/</span>
                                            <input
                                                type="text"
                                                placeholder="boda-lucia"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-8 pr-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800 font-mono text-xs"
                                                value={newEvent.slug}
                                                onChange={e => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Carga de Créditos</label>
                                        <div className="relative">
                                            <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-[#135bec] size-4" />
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-[#135bec] outline-none transition-all font-bold"
                                                value={newEvent.credits}
                                                onChange={e => setNewEvent({ ...newEvent, credits: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Inicio</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                            value={newEvent.start_date}
                                            onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Finalización</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                            value={newEvent.end_date}
                                            onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#135bec]/5 border border-[#135bec]/20 rounded-xl p-4 flex items-start gap-4">
                                <div className="p-2 bg-[#135bec] rounded-lg text-white">
                                    <CheckCircle2 className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Verificación de Balance</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Se deducirán {newEvent.credits} créditos de tu balance mayorista ({availableCredits} disponibles).</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-black rounded-2xl shadow-2xl shadow-[#135bec]/30 transition-all uppercase tracking-[3px] text-xs"
                            >
                                {loading ? 'Sincronizando...' : 'Activar Instancia de Evento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

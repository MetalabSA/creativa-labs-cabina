import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Calendar,
    Plus,
    CreditCard,
    Settings,
    Shield,
    TrendingUp,
    History,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Smartphone,
    Monitor as MonitorIcon,
    Layers,
    LayoutDashboard,
    Layout as LayoutIcon,
    ShoppingBag,
    Wallet,
    Download,
    Search,
    Upload,
    CheckCircle2,
    Palette,
    Zap,
    ShoppingCart,
    Bolt,
    X,
    Globe,
    Trash2,
    Edit2,
    Users,
    Mail,
    ExternalLink,
    Link as LinkIcon,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IDENTITIES, PREFERRED_PACK_ORDER } from '../../lib/constants';
import JSZip from 'jszip';

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
    initialView?: 'overview' | 'events' | 'wallet' | 'branding';
    onProxyClient?: (email: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ user, profile, onBack, initialView = 'overview', onProxyClient }) => {
    const [view, setView] = useState<'overview' | 'events' | 'branding' | 'wallet' | 'moderation'>(initialView);
    const [loading, setLoading] = useState(false);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [eventToTopUp, setEventToTopUp] = useState<any | null>(null);
    const [topUpAmount, setTopUpAmount] = useState(100);
    const [generationsData, setGenerationsData] = useState<any[]>([]);
    const [eventToDelete, setEventToDelete] = useState<{ id: string, name: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
        message: '',
        type: null
    });
    const [eventToModerate, setEventToModerate] = useState<any | null>(null);
    const [eventPhotos, setEventPhotos] = useState<any[]>([]);
    const [moderationLoading, setModerationLoading] = useState(false);
    const [moderationSearchTerm, setModerationSearchTerm] = useState('');
    const [moderationDateFilter, setModerationDateFilter] = useState('');

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 4000);
    };

    // Sync view if initialView changes
    useEffect(() => {
        setView(initialView);
    }, [initialView]);

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

            // Si no hay partner_id en el profile, intentamos buscarlo por user_id o crear un "Partner Virtual" 
            // basado en los créditos del perfil (caso de partners migrados o legacy).
            let targetPartnerId = profile.partner_id;
            let isVirtual = false;

            if (!targetPartnerId) {
                // Buscamos si existe un registro en la tabla partners que coincida con el user_id o email
                const { data: existingPartner } = await supabase
                    .from('partners')
                    .select('id')
                    .or(`user_id.eq.${profile.id},contact_email.eq.${profile.email}`)
                    .single();

                if (existingPartner) {
                    targetPartnerId = existingPartner.id;
                } else {
                    isVirtual = true;
                }
            }

            if (isVirtual) {
                // MODO VIRTUAL: Usamos la data del profile como si fuera un partner
                setPartner({
                    id: profile.id,
                    name: profile.full_name || profile.email.split('@')[0],
                    credits_total: profile.credits || 0,
                    credits_used: profile.total_generations || 0,
                    is_virtual: true,
                    config: {
                        primary_color: '#135bec',
                        logo_url: null
                    }
                } as any);

                // Buscamos eventos y transacciones usando el profile.id
                const [eRes, tRes] = await Promise.all([
                    supabase.from('events').select('*').eq('partner_id', profile.id).order('created_at', { ascending: false }),
                    supabase.from('wallet_transactions').select('*').eq('partner_id', profile.id).order('created_at', { ascending: false })
                ]);

                setEvents(eRes.data || []);
                setTransactions(tRes.data || []);

                if (eRes.data && eRes.data.length > 0) {
                    const eventIds = eRes.data.map(ev => ev.id);
                    const { data: gens } = await supabase
                        .from('generations')
                        .select('created_at, event_id')
                        .in('event_id', eventIds);
                    setGenerationsData(gens || []);
                }
            } else {
                // NORMAL MODE: Tenemos un ID de partner válido
                const [pRes, eRes, tRes] = await Promise.all([
                    supabase.from('partners').select('*').eq('id', targetPartnerId).single(),
                    supabase.from('events').select('*').eq('partner_id', targetPartnerId).order('created_at', { ascending: false }),
                    supabase.from('wallet_transactions').select('*').eq('partner_id', targetPartnerId).order('created_at', { ascending: false })
                ]);

                if (pRes.error) throw pRes.error;
                setPartner(pRes.data);
                setTransactions(tRes.data || []);

                if (pRes.data.config) {
                    setBrandingConfig({
                        primary_color: pRes.data.config.primary_color || '#135bec',
                        logo_url: pRes.data.config.logo_url || '',
                        radius: pRes.data.config.radius || '12px',
                        style_presets: pRes.data.config.style_presets || ['Superhéroes', 'John Wick', 'Urbano']
                    });
                }
                if (eRes.data && eRes.data.length > 0) {
                    const eventIds = eRes.data.map(ev => ev.id);
                    const { data: gens } = await supabase
                        .from('generations')
                        .select('created_at, event_id')
                        .in('event_id', eventIds);
                    setGenerationsData(gens || []);
                }
                setEvents(eRes.data || []);
            }
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
            showToast('Configuración de marca guardada');
        } catch (error) {
            console.error('Error updating branding:', error);
        }
    };

    const fetchEventPhotos = async (eventId: string) => {
        try {
            setModerationLoading(true);
            const { data, error } = await supabase
                .from('generations')
                .select('*, profiles(email)')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEventPhotos(data || []);
        } catch (err) {
            console.error('Error fetching photos:', err);
            showToast('No se pudieron cargar las fotos', 'error');
        } finally {
            setModerationLoading(false);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta foto de la galería?')) return;
        try {
            const { error } = await supabase
                .from('generations')
                .delete()
                .eq('id', photoId);

            if (error) throw error;
            setEventPhotos(prev => prev.filter(p => p.id !== photoId));
            showToast('Foto eliminada correctamente');
        } catch (err) {
            console.error('Error deleting photo:', err);
            showToast('Error al eliminar la foto', 'error');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${partner?.id}-${Date.now()}.${fileExt}`;

        try {
            setLoading(true);
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(fileName, file);

            if (uploadError) {
                // Try 'public' bucket if 'logos' fails or doesn't exist (fallback)
                const { error: publicError } = await supabase.storage
                    .from('public')
                    .upload(`logos/${fileName}`, file);

                if (publicError) throw uploadError; // Throw original error if both fail

                const { data } = supabase.storage.from('public').getPublicUrl(`logos/${fileName}`);
                setBrandingConfig({ ...brandingConfig, logo_url: data.publicUrl });
            } else {
                const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
                setBrandingConfig({ ...brandingConfig, logo_url: data.publicUrl });
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            showToast('Error al subir logo: ' + (error as any).message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner) return;

        const creditsNeeded = Number(newEvent.credits);
        if (creditsNeeded > (partner.credits_total - partner.credits_used)) {
            showToast('Créditos insuficientes en tu balance mayorista.', 'error');
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

            // 2. Deduct credits
            if ((partner as any).is_virtual) {
                // Si es virtual (legacy), descontamos directamente del profile
                const { error: profError } = await supabase
                    .from('profiles')
                    .update({ credits: Math.max(0, partner.credits_total - creditsNeeded) })
                    .eq('id', profile.id);
                if (profError) throw profError;
            } else {
                // Si es un partner formal, actualizamos su consumo en la tabla partners
                const { error: pError } = await supabase.from('partners')
                    .update({ credits_used: (partner.credits_used || 0) + creditsNeeded })
                    .eq('id', partner.id);
                if (pError) throw pError;
            }

            setShowCreateEventModal(false);
            setNewEvent({ name: '', slug: '', client_email: '', credits: 500, start_date: '', end_date: '' });
            showToast('Evento creado con éxito');
            fetchPartnerData();
        } catch (error: any) {
            console.error('Error creating event:', error);
            showToast('Error al crear el evento. ' + (error.message || 'El slug podría estar duplicado.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTopUpEvent = async () => {
        if (!eventToTopUp || !partner) return;

        const amount = Number(topUpAmount);
        const available = (partner.credits_total || 0) - (partner.credits_used || 0);

        if (amount > available) {
            showToast('No tienes créditos suficientes.', 'error');
            return;
        }

        try {
            setLoading(true);

            // 1. Update event
            const { error: eErr } = await supabase
                .from('events')
                .update({ credits_allocated: (eventToTopUp.credits_allocated || 0) + amount })
                .eq('id', eventToTopUp.id);
            if (eErr) throw eErr;

            // 2. Update partner balance
            if ((partner as any).is_virtual) {
                const { error: pErr } = await supabase
                    .from('profiles')
                    .update({ credits: Math.max(0, partner.credits_total - amount) })
                    .eq('id', profile.id);
                if (pErr) throw pErr;
            } else {
                const { error: pErr } = await supabase
                    .from('partners')
                    .update({ credits_used: (partner.credits_used || 0) + amount })
                    .eq('id', partner.id);
                if (pErr) throw pErr;
            }

            // 3. Log transaction
            await supabase.from('wallet_transactions').insert({
                partner_id: partner.id,
                amount: amount,
                type: 'usage',
                description: `Transferencia a evento: ${eventToTopUp.event_name}`
            });

            showToast(`Se han transferido ${amount} créditos.`);
            setEventToTopUp(null);
            fetchPartnerData();
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        try {
            setLoading(true);
            const { error } = await supabase.from('events').delete().eq('id', eventToDelete.id);
            if (error) throw error;
            showToast('Evento eliminado permanentemente');
            setEventToDelete(null);
            fetchPartnerData();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            showToast('Error al eliminar evento: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStylePreset = (style: string) => {
        setBrandingConfig(prev => ({
            ...prev,
            style_presets: prev.style_presets.includes(style)
                ? prev.style_presets.filter(s => s !== style)
                : [...prev.style_presets, style]
        }));
    };

    const filteredPhotos = useMemo(() => {
        return eventPhotos.filter(photo => {
            const email = photo.profiles?.email || 'Anónimo';
            const matchesSearch = !moderationSearchTerm ||
                photo.id.toLowerCase().includes(moderationSearchTerm.toLowerCase()) ||
                email.toLowerCase().includes(moderationSearchTerm.toLowerCase());

            const matchesDate = !moderationDateFilter ||
                (photo.created_at && photo.created_at.startsWith(moderationDateFilter));

            return matchesSearch && matchesDate;
        });
    }, [eventPhotos, moderationSearchTerm, moderationDateFilter]);

    const filteredEvents = useMemo(() => {
        return events.filter(e =>
            (e.event_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.event_slug || '').toLowerCase().includes(searchTerm.toLowerCase())
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

    const renderTabButton = (id: typeof view, label: string, Icon: any) => {
        const isActive = view === id;
        return (
            <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold border ${isActive
                    ? 'bg-[#135bec]/10 text-[#135bec] border-[#135bec]/30 shadow-[0_0_15px_rgba(19,91,236,0.1)]'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
            >
                <Icon className="size-4" />
                {label}
            </button>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Header Section */}
            <header className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-[#135bec] to-[#0a1f4d] flex items-center justify-center shadow-lg shadow-[#135bec]/20">
                            <LayoutDashboard className="text-white size-6" />
                        </div>
                        Panel de Partner <span className="text-[#135bec] opacity-50 text-xl font-medium">/ {partner?.name}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Sistema de gestión de eventos y marca blanca corporativa.</p>
                </motion.div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {renderTabButton('overview', 'Vista General', LayoutDashboard)}
                    {renderTabButton('events', 'Mis Eventos', Calendar)}
                    {renderTabButton('wallet', 'Billetera', Wallet)}
                    {renderTabButton('branding', 'Marca Blanca', Palette)}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {view === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Wholesale Credits Balance Card */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 shadow-2xl">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
                                    <Wallet className="size-40" />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="size-2 rounded-full bg-[#135bec] animate-pulse"></div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">Wallet Mayorista</p>
                                        </div>
                                        <h3 className="text-4xl font-black text-white">{availableCredits.toLocaleString()}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Créditos Disponibles</p>
                                    </div>
                                    <div className="p-3 bg-[#135bec]/10 border border-[#135bec]/20 rounded-xl text-[#135bec] shadow-inner">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-slate-500 uppercase tracking-[1px]">Consumo Global</span>
                                        <span className="text-[#135bec]">{consumptionPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${consumptionPercentage}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="bg-gradient-to-r from-[#135bec] to-[#3b82f6] h-full rounded-full shadow-[0_0_15px_rgba(19,91,236,0.3)]"
                                        ></motion.div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500">Total: {partner?.credits_total?.toLocaleString()}</span>
                                        <span className="text-slate-400 font-bold">Usados: {partner?.credits_used?.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => setView('wallet')}
                                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black rounded-lg border border-white/5 transition-all uppercase tracking-[2px] mt-2 block text-center"
                                    >
                                        Ver Detalles de Billetera
                                    </button>
                                </div>
                            </div>

                            {/* Active Events Summary */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-950/80">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
                                    <Layers className="size-40" />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Instancias Activas</p>
                                        <h3 className="text-4xl font-black text-white">{events.filter(e => e.is_active).length}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Eventos en curso</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setView('events')}
                                    className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-xl border border-emerald-500/20 transition-all uppercase tracking-[2px] flex items-center justify-center gap-2 group/btn"
                                >
                                    <Calendar className="size-4" />
                                    Gestionar Instancias
                                </button>
                            </div>

                            {/* Branding Summary */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-950/80">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
                                    <Palette className="size-40" />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Identidad Visual</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            {brandingConfig.logo_url ? (
                                                <img src={brandingConfig.logo_url} className="h-8 object-contain" alt="Logo" />
                                            ) : (
                                                <div className="size-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5">
                                                    <Shield className="size-4 text-slate-600" />
                                                </div>
                                            )}
                                            <div className="size-6 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: brandingConfig.primary_color }}></div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setView('branding')}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-xl border border-white/10 transition-all uppercase tracking-[2px]"
                                >
                                    Editar Identidad Visual
                                </button>
                            </div>
                        </section>

                        {/* Metrics Chart */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 glass-card">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Actividad de Generación</h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Fotos creadas por día (Últimos 7 días)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-[#135bec] animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tiempo Real</span>
                                </div>
                            </div>

                            <div className="h-48 flex items-end gap-2 px-2">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - (6 - i));
                                    const dateStr = date.toISOString().split('T')[0];
                                    const count = generationsData.filter(g => g.created_at.startsWith(dateStr)).length;

                                    // Calculate max for normalization
                                    const counts = Array.from({ length: 7 }).map((_, j) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - j));
                                        const ds = d.toISOString().split('T')[0];
                                        return generationsData.filter(g2 => g2.created_at.startsWith(ds)).length;
                                    });
                                    const maxCount = Math.max(...counts, 1);
                                    const height = (count / maxCount) * 100;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="w-full relative h-[140px] flex items-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, 5)}%` }}
                                                    className={`w-full rounded-t-xl transition-all duration-500 hover:brightness-125 ${count > 0 ? 'bg-gradient-to-t from-[#135bec] to-[#7f13ec]' : 'bg-white/5'}`}
                                                />
                                                {count > 0 && (
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#0f172a] text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                        {count} fotos
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase">
                                                {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'events' && (
                    <motion.div
                        key="events"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mis Eventos</h2>
                                <p className="text-slate-500 text-xs mt-1">Gestiona las instancias activas y el consumo de créditos.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#135bec] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o slug..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-[#135bec] focus:border-[#135bec] w-64 transition-all outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowCreateEventModal(true)}
                                    className="px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[10px] font-black rounded-xl shadow-lg shadow-[#135bec]/20 transition-all uppercase tracking-[2px] flex items-center gap-2"
                                >
                                    <Plus className="size-4" />
                                    Nuevo Evento
                                </button>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/[0.03] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificación</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Consumo de Créditos</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Panel de Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredEvents.map(event => {
                                        const percent = event.credits_allocated ? Math.min(100, Math.round((event.credits_used / event.credits_allocated) * 100)) : 0;
                                        return (
                                            <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-xl bg-gradient-to-br from-[#135bec]/20 to-[#0a1f4d]/20 border border-[#135bec]/20 flex items-center justify-center text-[#135bec] font-black text-sm group-hover:scale-110 transition-transform">
                                                            {(event?.event_name || 'E').substring(0, 2).toUpperCase()}
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
                                                    <div className="w-48">
                                                        <div className="flex justify-between text-[10px] mb-1.5 font-bold">
                                                            <span className="text-slate-400">{event.credits_used.toLocaleString()} / {event.credits_allocated.toLocaleString()}</span>
                                                            <span className={`${percent > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{percent}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-[1px]">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percent}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                                className={`h-full ${percent > 90 ? 'bg-rose-500' : 'bg-[#135bec]'} rounded-full shadow-[0_0_8px_rgba(19,91,236,0.5)]`}
                                                            ></motion.div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${event.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        <span className={`size-2 rounded-full ${event.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                        {event.is_active ? 'En Línea' : 'Pausado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => setEventToTopUp(event)}
                                                            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl text-emerald-500 hover:text-white transition-all group/action"
                                                            title="Cargar Créditos"
                                                        >
                                                            <ShoppingCart className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEventToModerate(event);
                                                                fetchEventPhotos(event.id);
                                                                setView('moderation');
                                                            }}
                                                            className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 rounded-xl text-indigo-500 hover:text-white transition-all group/action"
                                                            title="Moderación de Galería"
                                                        >
                                                            <LayoutIcon className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingEvent(event)}
                                                            className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all group/action"
                                                            title="Editar Evento"
                                                        >
                                                            <Edit2 className="w-4 h-4 group-hover/action:rotate-12 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.open(`https://photobooth.creativa-labs.com/?event=${event.event_slug}`, '_blank')}
                                                            className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all group/action"
                                                            title="Ver Kiosco (Público)"
                                                        >
                                                            <ExternalLink className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                        </button>
                                                        {onProxyClient && event.client_email && (
                                                            <button
                                                                onClick={() => onProxyClient(event.client_email!)}
                                                                className="p-2.5 bg-[#135bec]/10 hover:bg-[#135bec] border border-[#135bec]/20 rounded-xl text-[#135bec] hover:text-white transition-all group/action"
                                                                title="Gestionar Branding como Cliente"
                                                            >
                                                                <MonitorIcon className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEventToDelete({ id: event.id, name: event.event_name })}
                                                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-xl text-rose-500 hover:text-white transition-all group/action"
                                                            title="Eliminar Instancia"
                                                        >
                                                            <Trash2 className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEvents.length === 0 && (
                                        <tr><td colSpan={4} className="p-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="size-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                                                    <Calendar className="size-8 text-slate-600 opacity-20" />
                                                </div>
                                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No hay eventos para mostrar</p>
                                                <p className="text-slate-600 text-[10px] mt-1">Crea tu primera instancia para comenzar.</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {view === 'moderation' && (
                    <motion.div
                        key="moderation"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView('events')}
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all border border-white/5"
                                >
                                    <ArrowDownRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Galería: {eventToModerate?.event_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`size-2 rounded-full ${filteredPhotos.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                            {filteredPhotos.length} de {eventPhotos.length} Fotos
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                                        <input
                                            type="text"
                                            placeholder="Buscar email o ID..."
                                            className="bg-slate-950/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-white focus:border-[#135bec] outline-none transition-all w-52 placeholder:text-slate-700 font-bold uppercase tracking-widest"
                                            value={moderationSearchTerm}
                                            onChange={(e) => setModerationSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                                        <input
                                            type="date"
                                            className="bg-slate-950/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-white focus:border-[#135bec] outline-none transition-all w-40 font-bold"
                                            value={moderationDateFilter}
                                            onChange={(e) => setModerationDateFilter(e.target.value)}
                                        />
                                    </div>
                                    {(moderationSearchTerm || moderationDateFilter) && (
                                        <button
                                            onClick={() => { setModerationSearchTerm(''); setModerationDateFilter(''); }}
                                            className="p-2.5 hover:bg-white/5 text-slate-500 hover:text-white transition-all rounded-xl"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="w-px h-8 bg-white/5 mx-1" />
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const urls = filteredPhotos.map(p => p.image_url).join('\n');
                                            if (urls.length === 0) return showToast('No hay links para exportar', 'error');
                                            const blob = new Blob([urls], { type: 'text/plain' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `links-${eventToModerate?.event_slug}-filtrados.txt`;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            showToast('Links filtrados exportados');
                                        }}
                                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-xl border border-white/5 transition-all uppercase tracking-[2px] flex items-center gap-2"
                                    >
                                        <Download className="size-4" />
                                        Exportar Links
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (filteredPhotos.length === 0) return showToast('No hay fotos para descargar', 'error');

                                            try {
                                                showToast('Preparando descarga ZIP (Filtrada)...', 'info');
                                                const zip = new JSZip();
                                                const folder = zip.folder(`${eventToModerate?.event_slug}-photos-filtered`);

                                                if (!folder) throw new Error('No se pudo crear la carpeta en el ZIP');

                                                // Fetch filtered images
                                                const photoPromises = filteredPhotos.map(async (photo, index) => {
                                                    try {
                                                        const response = await fetch(photo.image_url);
                                                        const blob = await response.blob();
                                                        const extension = photo.image_url.split('.').pop()?.split('?')[0] || 'jpg';
                                                        folder.file(`photo-${index + 1}.${extension}`, blob);
                                                    } catch (err) {
                                                        console.error('Error al descargar foto para el ZIP:', err);
                                                    }
                                                });

                                                await Promise.all(photoPromises);

                                                const content = await zip.generateAsync({ type: "blob" });
                                                const url = window.URL.createObjectURL(content);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `galeria-${eventToModerate?.event_slug}.zip`;
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                showToast('Galería completa descargada');
                                            } catch (err) {
                                                console.error('Error al generar ZIP:', err);
                                                showToast('Error al generar el archivo ZIP', 'error');
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[10px] font-black rounded-xl shadow-lg border border-white/10 transition-all uppercase tracking-[2px] flex items-center gap-2"
                                    >
                                        <Layers className="size-4" />
                                        Descargar Todo (ZIP)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {moderationLoading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-4">
                                <div className="size-12 border-4 border-[#135bec]/30 border-t-[#135bec] rounded-full animate-spin" />
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sincronizando Galería...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredPhotos.map((photo) => (
                                    <div key={photo.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-slate-900 shadow-xl">
                                        <img
                                            src={photo.image_url}
                                            alt="Generation"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <p className="text-[8px] font-mono text-white/50 mb-1 truncate">{photo.id}</p>
                                            <p className="text-[10px] font-black text-white mb-4 truncate uppercase tracking-widest">{photo.profiles?.email || 'Anónimo'}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                    className="p-2.5 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/30 rounded-xl text-rose-500 hover:text-white transition-all group/del"
                                                    title="Eliminar de la galería"
                                                >
                                                    <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => window.open(photo.image_url, '_blank')}
                                                    className="flex-1 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="size-3" />
                                                    Ver Original
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredPhotos.length === 0 && (
                                    <div className="col-span-full h-64 flex flex-col items-center justify-center bg-slate-900/50 rounded-[32px] border border-dashed border-white/5">
                                        <AlertTriangle className="size-8 text-slate-800 mb-4" />
                                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No hay fotos en este evento</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'wallet' && (
                    <motion.div
                        key="wallet"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-8"
                    >
                        {/* Huge Balance Sheet */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 glass-card rounded-3xl p-10 bg-gradient-to-br from-[#135bec] to-[#0a1f4d] border-none shadow-2xl shadow-[#135bec]/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <ShoppingBag className="size-64" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <p className="text-white/60 text-[11px] font-black uppercase tracking-[3px] mb-2">Créditos Totales Disponibles</p>
                                        <h2 className="text-7xl font-black text-white tracking-tighter">
                                            {availableCredits.toLocaleString()}
                                            <span className="text-2xl text-white/40 ml-4 font-medium uppercase tracking-widest">unidades</span>
                                        </h2>
                                    </div>
                                    <div className="mt-12 flex flex-wrap gap-8 items-end">
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-[10px] font-bold uppercase">Consumo Total</p>
                                            <div className="flex items-center gap-2 text-white">
                                                <TrendingUp className="size-5 text-emerald-400" />
                                                <span className="text-2xl font-black">{partner?.credits_used?.toLocaleString() || 0}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-[10px] font-bold uppercase">Eventos Activos</p>
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Zap className="size-5 text-yellow-400" />
                                                <span className="text-2xl font-black">{events.filter(e => e.is_active).length}</span>
                                            </div>
                                        </div>
                                        <button className="ml-auto px-8 py-4 bg-white text-[#135bec] font-black rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-[2px] shadow-xl">
                                            Recargar Créditos
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                        <History className="size-5 text-[#135bec]" />
                                        Últimas Recargas
                                    </h3>
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {transactions.length > 0 ? transactions.map((item, idx) => (
                                            <div key={item.id} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5 group hover:border-[#135bec]/30 transition-all">
                                                <div>
                                                    <p className="text-xs font-bold text-white">+{item.amount.toLocaleString()} Créditos</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${item.type === 'top-up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                                                    {item.type === 'top-up' ? 'Carga' : 'Ajuste'}
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="text-center py-10 opacity-40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Sin movimientos</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-600 text-center mt-6">
                                    <Info className="size-3 inline mr-1" />
                                    Los créditos no poseen fecha de vencimiento.
                                </p>
                            </div>
                        </section>

                        {/* Usage by Event */}
                        <section className="glass-card rounded-2xl p-8 border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 bg-white/5 -mx-8 -mt-8 p-8 border-b border-white/5">Consumo por Evento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {events.map(event => (
                                    <div key={event.id} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#135bec]/30 transition-all group relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 size-20 bg-[#135bec]/5 rounded-full blur-2xl group-hover:bg-[#135bec]/10 transition-all"></div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate pr-4">{event.event_name}</p>
                                            <div className="flex items-end justify-between">
                                                <h4 className="text-2xl font-black text-white">{event.credits_used || 0}</h4>
                                                <p className="text-[10px] text-slate-600 font-bold">utilizados</p>
                                            </div>
                                            <div className="mt-4 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#135bec] h-full"
                                                    style={{ width: `${Math.min(100, ((event.credits_used || 0) / (event.credits_allocated || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-2 text-[8px] font-bold uppercase tracking-widest text-slate-700">
                                                <span>{Math.round(((event.credits_used || 0) / (event.credits_allocated || 1)) * 100)}%</span>
                                                <span>de {event.credits_allocated}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="col-span-full py-10 text-center opacity-30">
                                        <p className="text-xs font-bold uppercase tracking-[2px]">No hay datos de consumo disponibles</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </motion.div>
                )}

                {view === 'branding' && (
                    <motion.div
                        key="branding"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 xl:grid-cols-12 gap-8"
                    >
                        {/* Left Column: Configuration */}
                        <div className="xl:col-span-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Partner Branding Column */}
                                <section className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl h-fit">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Identidad Visual</h2>
                                            <p className="text-slate-500 text-xs">Personaliza tu panel de control.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-4">Logo Corporativo</label>
                                            <div
                                                className="w-full border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer group hover:border-[#135bec]/50 shadow-inner"
                                                onClick={() => document.getElementById('brandingLogoInput')?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="brandingLogoInput"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                />
                                                {brandingConfig.logo_url ? (
                                                    <div className="relative group/logo">
                                                        <img src={brandingConfig.logo_url} className="h-12 object-contain mb-2 group-hover:opacity-50 transition-opacity" alt="Logo" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                                            <Edit2 className="size-5 text-white" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="w-8 h-8 text-slate-700 group-hover:text-[#135bec] mb-3 transition-colors" />
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Subir Identidad</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-4">Color de Acento</label>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="size-12 rounded-xl border-2 border-white/10 shadow-2xl cursor-pointer hover:scale-105 transition-all"
                                                        style={{ backgroundColor: brandingConfig.primary_color }}
                                                        onClick={() => document.getElementById('brandingColorPicker')?.click()}
                                                    ></div>
                                                    <input
                                                        id="brandingColorPicker"
                                                        type="color"
                                                        className="sr-only"
                                                        value={brandingConfig.primary_color}
                                                        onChange={(e) => setBrandingConfig({ ...brandingConfig, primary_color: e.target.value })}
                                                    />
                                                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white font-mono flex items-center justify-between">
                                                        <span>{brandingConfig.primary_color.toUpperCase()}</span>
                                                        <Edit2 className="size-3 text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-4">Radio de Bordes</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white focus:ring-1 focus:ring-[#135bec] outline-none appearance-none cursor-pointer pr-10"
                                                        value={brandingConfig.radius}
                                                        onChange={(e) => setBrandingConfig({ ...brandingConfig, radius: e.target.value })}
                                                    >
                                                        <option value="4px">4px (Recto)</option>
                                                        <option value="8px">8px (Suave)</option>
                                                        <option value="12px">12px (Premium)</option>
                                                        <option value="20px">20px (Redondeado)</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <ArrowDownRight className="size-3 text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleUpdateBranding}
                                            className="w-full py-4 bg-white text-slate-900 text-[10px] font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] uppercase tracking-[3px] flex items-center justify-center gap-2 group"
                                        >
                                            <CheckCircle2 className="size-4 group-hover:scale-110 transition-transform" />
                                            Sincronizar Panel
                                        </button>
                                    </div>
                                </section>

                                {/* Design Pack Column */}
                                <div className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden h-fit">
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-[#135bec]/10 border border-[#135bec]/20 rounded-xl text-[#135bec]">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Estilos IA</h2>
                                                <p className="text-slate-500 text-xs">Packs activos para clientes.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        {PREFERRED_PACK_ORDER.map(style => {
                                            const sample = IDENTITIES.find(id => id.subCategory === style) || IDENTITIES[0];
                                            return (
                                                <label key={style} className="relative block cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={brandingConfig.style_presets.includes(style)}
                                                        onChange={() => toggleStylePreset(style)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className={`aspect-square rounded-2xl overflow-hidden relative border-2 transition-all duration-300 ${brandingConfig.style_presets.includes(style) ? 'border-[#135bec] scale-[1.02] shadow-xl shadow-[#135bec]/20' : 'border-white/5 opacity-40 hover:border-white/20 hover:opacity-80'}`}>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                                        <img
                                                            alt={style}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            src={sample.url}
                                                        />
                                                        <div className="absolute bottom-2 left-3 z-20">
                                                            <p className="text-[8px] font-black uppercase text-white tracking-[1px] leading-tight">{style}</p>
                                                        </div>
                                                        {brandingConfig.style_presets.includes(style) && (
                                                            <div className="absolute top-2 right-2 z-20">
                                                                <div className="bg-[#135bec] rounded-full p-1 shadow-xl border border-white/20">
                                                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Mockup */}
                        <div className="xl:col-span-4 sticky top-8">
                            <div className="flex flex-col items-center">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[4px]">Live Preview (Kiosk)</span>
                                </div>

                                <div className="relative w-[280px] h-[580px] bg-slate-800 rounded-[50px] p-3 border-[6px] border-slate-700 shadow-2xl overflow-hidden shadow-black/60">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-b-2xl z-50"></div>

                                    {/* Content Screen */}
                                    <div className="w-full h-full bg-[#071121] rounded-[40px] overflow-hidden flex flex-col relative">
                                        {/* BG pattern */}
                                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${brandingConfig.primary_color}33 0%, transparent 70%)` }} />

                                        {/* Mockup Top Nav */}
                                        <div className="p-6 flex flex-col items-center justify-center pt-10">
                                            {brandingConfig.logo_url ? (
                                                <img src={brandingConfig.logo_url} className="h-10 object-contain mb-4" alt="Mockup Logo" />
                                            ) : (
                                                <div className="h-10 w-32 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-[8px] text-slate-600 font-black uppercase tracking-[2px]">Your Logo Here</div>
                                            )}
                                            <div className="w-12 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${brandingConfig.primary_color}, transparent)` }}></div>
                                        </div>

                                        {/* Mockup Title */}
                                        <div className="px-6 py-2 text-center">
                                            <h3 className="text-[14px] font-black text-white uppercase tracking-tighter italic">Descubre tu Identidad</h3>
                                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1 opacity-60">Selecciona un estandar de estilo</p>
                                        </div>

                                        {/* Mockup Grid */}
                                        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
                                            <div className="grid grid-cols-2 gap-3">
                                                {brandingConfig.style_presets.slice(0, 4).map((style, i) => {
                                                    const sample = IDENTITIES.find(id => id.subCategory === style) || IDENTITIES[0];
                                                    return (
                                                        <div key={i} className="aspect-[3/4] overflow-hidden relative border shadow-lg" style={{ borderRadius: brandingConfig.radius, borderColor: i === 0 ? brandingConfig.primary_color : 'rgba(255,255,255,0.05)' }}>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                                            <img src={sample.url} className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-2 left-2 z-20">
                                                                <p className="text-[7px] font-black text-white uppercase">{style}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {brandingConfig.style_presets.length < 4 && Array.from({ length: 4 - brandingConfig.style_presets.length }).map((_, i) => (
                                                    <div key={i} className="aspect-[3/4] bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-800" style={{ borderRadius: brandingConfig.radius }}>
                                                        <span className="material-symbols-outlined !text-sm">add</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mockup Button */}
                                        <div className="p-6">
                                            <div
                                                className="w-full py-3 text-center text-white text-[9px] font-black uppercase tracking-[2px] shadow-lg shadow-black/20"
                                                style={{ backgroundColor: brandingConfig.primary_color, borderRadius: brandingConfig.radius }}
                                            >
                                                Comenzar Experiencia
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UI Modals */}
            <AnimatePresence>
                {/* Create Event Modal */}
                {showCreateEventModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-7 border-b border-white/5">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Crear Evento</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Nueva instancia</p>
                                </div>
                                <button onClick={() => setShowCreateEventModal(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="p-7 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre del Evento</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nombre comercial"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800"
                                            value={newEvent.name}
                                            onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                        />
                                    </div>
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
                                                onChange={e => setNewEvent({ ...newEvent, client_email: e.target.value.toLowerCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Personalizado</label>
                                            <input
                                                type="text"
                                                placeholder="slug"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs font-mono"
                                                value={newEvent.slug}
                                                onChange={e => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Créditos</label>
                                            <div className="relative">
                                                <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-[#135bec] size-4" />
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs font-bold"
                                                    value={newEvent.credits}
                                                    onChange={e => setNewEvent({ ...newEvent, credits: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Inicio</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                                value={newEvent.start_date}
                                                onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Fin</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                                value={newEvent.end_date}
                                                onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[#135bec]/5 border border-[#135bec]/10 rounded-xl flex items-center gap-4">
                                        <div className="size-8 rounded-lg bg-[#135bec]/10 flex items-center justify-center text-[#135bec]">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Verificación de Balance</p>
                                            <p className="text-[11px] text-slate-400 mt-1 leading-tight">Se deducirán {newEvent.credits} créditos de tu balance mayorista ({availableCredits} disponibles).</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[11px] font-black rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {loading ? 'Creando...' : (
                                        <span className="flex items-center justify-center gap-2">
                                            Activar Instancia de Evento
                                            <Zap className="size-4 group-hover:scale-110 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Edit Event Modal */}
                {editingEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-7 border-b border-white/5">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Editar Evento</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Modificar parámetros</p>
                                </div>
                                <button onClick={() => setEditingEvent(null)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-7 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Nombre del Evento</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#135bec] outline-none transition-all placeholder:text-slate-800"
                                            value={editingEvent.event_name}
                                            onChange={e => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Inicio</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                                value={new Date(editingEvent.start_date).toISOString().split('T')[0]}
                                                onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Fin</label>
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all text-xs"
                                                value={new Date(editingEvent.end_date).toISOString().split('T')[0]}
                                                onChange={e => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${editingEvent.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            <Zap className="size-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Estado</p>
                                            <p className="text-[9px] text-slate-500 uppercase mt-1 leading-none">{editingEvent.is_active ? 'En Línea' : 'Inactivo'}</p>
                                        </div>
                                        <button
                                            onClick={() => setEditingEvent({ ...editingEvent, is_active: !editingEvent.is_active })}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editingEvent.is_active ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            {editingEvent.is_active ? 'Pausar' : 'Activar'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            const { error } = await supabase
                                                .from('events')
                                                .update({
                                                    event_name: editingEvent.event_name,
                                                    start_date: new Date(editingEvent.start_date).toISOString(),
                                                    end_date: new Date(editingEvent.end_date).toISOString(),
                                                    is_active: editingEvent.is_active
                                                })
                                                .eq('id', editingEvent.id);

                                            if (error) throw error;
                                            showToast('Evento actualizado correctamente');
                                            setEditingEvent(null);
                                            fetchPartnerData();
                                        } catch (err: any) {
                                            showToast('Error al actualizar: ' + err.message, 'error');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="w-full py-5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[11px] font-black rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase tracking-[3px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sincronizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Fast Top-up Modal */}
                {eventToTopUp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-7 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Recargar Evento</h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{eventToTopUp.event_name}</p>
                                </div>
                                <button onClick={() => setEventToTopUp(null)} className="size-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-7 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Cantidad de Créditos</label>
                                    <div className="relative">
                                        <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 size-4" />
                                        <input
                                            type="number"
                                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-11 pr-5 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold text-center text-xl"
                                            value={topUpAmount}
                                            onChange={e => setTopUpAmount(Number(e.target.value))}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-3 text-center uppercase tracking-widest">
                                        Disponibles: <span className="text-white">{availableCredits.toLocaleString()}</span>
                                    </p>
                                </div>

                                <button
                                    disabled={loading || topUpAmount <= 0 || topUpAmount > availableCredits}
                                    onClick={handleTopUpEvent}
                                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#071121] text-[11px] font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[3px] disabled:opacity-30 disabled:grayscale"
                                >
                                    {loading ? 'Procesando...' : 'Confirmar Transferencia'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Toast System */}
            <AnimatePresence>
                {toast.type && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[100]"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' :
                            toast.type === 'info' ? 'bg-[#135bec]/20 border-[#135bec]/30 text-[#135bec]' :
                                'bg-[#13ec80]/20 border-[#13ec80]/30 text-[#13ec80]'
                            }`}>
                            {toast.type === 'error' ? <AlertTriangle className="size-5" /> :
                                toast.type === 'info' ? <Info className="size-5" /> :
                                    <CheckCircle2 className="size-5" />}
                            <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {eventToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="size-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                                    <AlertTriangle className="size-10 text-rose-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">¿Eliminar Evento?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Esta acción es permanente. Se eliminará el evento <span className="text-white font-bold">"{eventToDelete.name}"</span> y todos sus datos asociados.
                                </p>
                            </div>
                            <div className="flex border-t border-white/5 p-4 bg-slate-950/50 gap-3">
                                <button
                                    onClick={() => setEventToDelete(null)}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-xl transition-all uppercase tracking-[2px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 uppercase tracking-[2px]"
                                >
                                    Confirmar Baja
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

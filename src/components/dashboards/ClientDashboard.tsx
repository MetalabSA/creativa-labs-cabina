import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import {
    Calendar,
    Palette,
    Zap,
    QrCode,
    Download,
    Link as LinkIcon,
    Save,
    Upload,
    Sparkles,
    Layout,
    Monitor,
    Image as ImageIcon,
    Clock,
    Users,
    ChevronRight,
    CheckCircle2,
    Info,
    ExternalLink,
    Mail,
    Plus,
    X,
    Heart,
    Shield,
    Trash2,
    Edit2,
    Smartphone,
    ChevronLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PREFERRED_PACK_ORDER, IDENTITIES } from '../../lib/constants';

// Interfaces
interface EventConfig {
    logo_url?: string;
    primary_color?: string;
    welcome_text?: string;
    radius?: string;
}

interface EventData {
    id: string;
    event_name: string;
    event_slug: string;
    config: EventConfig;
    selected_styles: string[];
    is_active: boolean;
    credits_allocated: number;
    credits_used: number;
    start_date?: string;
}

interface ClientDashboardProps {
    user: any;
    profile: any;
    onBack?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, profile, onBack }) => {
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
        message: '',
        type: null
    });

    // Config state
    const [config, setConfig] = useState<EventConfig>({
        primary_color: '#7f13ec',
        welcome_text: '¡Bienvenidos a la celebración!',
        radius: '12px'
    });

    const [partnerBranding, setPartnerBranding] = useState<any>(null);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');

    useEffect(() => {
        fetchEventForClient();
    }, [profile.email]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 3000);
    };

    const fetchEventForClient = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*, partner:partners(*)')
                .ilike('client_email', profile.email.toLowerCase())
                .maybeSingle();

            if (data) {
                setEvent(data);
                setEventName(data.event_name);
                setEventDate(data.start_date ? data.start_date.split('T')[0] : '');

                // Prioritize event config, then partner config
                const finalConfig = {
                    ...data.partner?.config,
                    ...data.config
                };

                setConfig({
                    primary_color: finalConfig.primary_color || '#7f13ec',
                    welcome_text: finalConfig.welcome_text || '¡Bienvenidos!',
                    radius: finalConfig.radius || '12px',
                    logo_url: finalConfig.logo_url || ''
                });

                if (data.partner?.config) {
                    setPartnerBranding(data.partner.config);
                }

                // Fetch recent photos
                const { data: photos } = await supabase
                    .from('generations')
                    .select('*')
                    .eq('event_id', data.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                setRecentPhotos(photos || []);
            }
        } catch (error) {
            console.error('Error fetching event for client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!event) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('events')
                .update({
                    event_name: eventName,
                    start_date: eventDate,
                    config: config
                })
                .eq('id', event.id);

            if (error) throw error;
            alert('¡Configuración guardada con éxito!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `event-logo-${event?.id}-${Date.now()}.${fileExt}`;

        try {
            setSaving(true);
            const { data, error } = await supabase.storage
                .from('logos') // OR public
                .upload(fileName, file);

            if (error) {
                // Fallback to public bucket
                const { error: publicError } = await supabase.storage
                    .from('public')
                    .upload(`logos/${fileName}`, file);
                if (publicError) throw publicError;
                const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(`logos/${fileName}`);
                setConfig({ ...config, logo_url: publicUrlData.publicUrl });
            } else {
                const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
                setConfig({ ...config, logo_url: publicUrlData.publicUrl });
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir el logo');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            setSaving(true);
            const defaultSlug = `boda-${Date.now().toString().slice(-4)}`;
            const { data, error } = await supabase.from('events').insert({
                client_email: profile.email.toLowerCase(),
                event_slug: defaultSlug,
                event_name: 'Mi Celebración',
                is_active: true,
                credits_allocated: 50,
                config: { primary_color: '#7f13ec', welcome_text: '¡Bienvenidos!' }
            }).select().single();

            if (error) throw error;
            if (data) {
                setEvent(data);
                setEventName(data.event_name);
                fetchEventForClient();
            }
        } catch (e: any) {
            console.error('Error creating event:', e);
            alert('Error al inicializar evento: ' + (e.message || e.error_description || 'Permisos insuficientes'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white p-10 flex justify-center items-center h-screen bg-[#0a0a0a]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#7f13ec]"></div></div>;

    if (!event) return (
        <div className="text-white min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center gap-6">
            <div className="w-16 h-16 bg-[#7f13ec]/20 rounded-full flex items-center justify-center text-[#7f13ec] mb-2">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
            </div>
            <h2 className="text-2xl font-bold">No hay evento activo</h2>
            <p className="text-slate-400 max-w-md">
                No encontramos un evento vinculado a <strong>{profile.email}</strong>.
                Si eres un nuevo cliente, puedes inicializar tu panel ahora.
            </p>
            <button
                onClick={handleCreateEvent}
                disabled={saving}
                className="bg-[#7f13ec] hover:bg-[#690cc4] text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2"
            >
                {saving ? 'Creando...' : 'Inicializar Evento'}
            </button>
            <button
                onClick={() => window.location.reload()}
                className="text-slate-500 hover:text-white text-sm underline"
            >
                Reintentar
            </button>
        </div>
    );

    const eventLink = `https://kiosk.metalabia.com/?event=${event.event_slug}`;
    const creditsUsed = event.credits_used || 0;
    const creditsTotal = event.credits_allocated || 500;
    const percentageUsed = Math.min(100, Math.round((creditsUsed / creditsTotal) * 100));
    const dashOffset = 552.92 - (552.92 * percentageUsed) / 100; // For the gauge

    return (
        <div className="bg-[#0f172a] text-slate-100 min-h-screen font-sans selection:bg-[#7f13ec]/30 overflow-x-hidden">
            {/* Header con inyección de Branding */}
            <header className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#7f13ec]/20 border border-white/10 hover:border-[#7f13ec]/30 text-slate-400 hover:text-[#7f13ec] transition-all group/back mr-2"
                                title="Volver al Panel Partner"
                            >
                                <ChevronLeft className="size-5 group-hover/back:-translate-x-1 transition-transform" />
                            </button>
                        )}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#7f13ec] to-[#ec4899] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-[#0f172a] p-2.5 rounded-xl border border-white/10 shadow-2xl">
                                {config.logo_url ? (
                                    <img src={config.logo_url} alt="Logo" className="h-7 w-auto object-contain" />
                                ) : (
                                    <Sparkles className="w-6 h-6 text-[#7f13ec]" />
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                {event.event_name}
                                <span className="px-2 py-0.5 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] text-[10px] uppercase font-black border border-[#7f13ec]/30 shadow-[0_0_15px_rgba(127,19,236,0.2)]">
                                    Panel de Anfitrión
                                </span>
                            </h1>
                            {partnerBranding && (
                                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                                    PROVISTO POR <span className="text-slate-300 font-bold">{partnerBranding.name || 'PARTNER OFICIAL'}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-inner">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.1em]">Evento Activo</span>
                        </div>

                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center shadow-lg group hover:border-[#7f13ec]/50 transition-all cursor-pointer">
                            <Users className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Hero Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">
                            Gestión de Anfitrión
                        </h2>
                        <p className="text-slate-400 text-lg flex items-center gap-2">
                            Personaliza la experiencia para tus invitados
                            <Save className="w-4 h-4 text-[#7f13ec]" />
                        </p>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="group relative px-8 py-4 bg-[#7f13ec] text-white rounded-2xl font-bold flex items-center gap-3 overflow-hidden transition-all shadow-2xl shadow-[#7f13ec]/30 hover:shadow-[#7f13ec]/50 disabled:opacity-50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer duration-1000"></div>
                        {saving ? (
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                <span>Guardando...</span>
                            </div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Guardar Cambios</span>
                            </>
                        )}
                    </motion.button>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Panel Izquierdo: Configuración */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">

                        {/* 1. Configuración del Evento */}
                        <section className="group bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:border-[#7f13ec]/30 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-[#7f13ec]/10 rounded-2xl border border-[#7f13ec]/20 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6 text-[#7f13ec]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Configuración General</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Paso 01 — Datos del Evento</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre del Evento</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-0 bg-[#7f13ec]/20 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                                        <input
                                            className="relative w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec]/50 text-white outline-none transition-all placeholder:text-slate-600"
                                            type="text"
                                            placeholder="Ej: Boda de Lucas & Martina"
                                            value={eventName}
                                            onChange={(e) => setEventName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha del Evento</label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec]/50 text-white outline-none transition-all"
                                            type="date"
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-full space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                        Mensaje de Bienvenida
                                        <span className="text-[#7f13ec]/60 font-medium normal-case">Se muestra al iniciar la cámara</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec]/50 text-white outline-none transition-all"
                                        rows={3}
                                        placeholder="¡Bienvenidos a nuestra fiesta! Hazte una foto mágica..."
                                        value={config.welcome_text}
                                        onChange={(e) => setConfig({ ...config, welcome_text: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Personalización de Marca (Branding) */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm group hover:border-[#7f13ec]/30 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-[#7f13ec]/10 rounded-2xl border border-[#7f13ec]/20 group-hover:scale-110 transition-transform">
                                    <Palette className="w-6 h-6 text-[#7f13ec]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Identidad Visual</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Paso 02 — Branding del Evento</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logo Personalizado</p>
                                    <motion.div
                                        whileHover={{ borderColor: 'rgba(127,19,236,0.5)' }}
                                        className="relative group cursor-pointer"
                                        onClick={() => document.getElementById('clientLogoInput')?.click()}
                                    >
                                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-[#0f172a]/50 hover:bg-[#7f13ec]/5 transition-all">
                                            <input type="file" id="clientLogoInput" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                            {config.logo_url ? (
                                                <div className="relative">
                                                    <img src={config.logo_url} alt="Logo" className="h-20 max-w-full object-contain filter drop-shadow-2xl" />
                                                    <div className="absolute -top-3 -right-3 p-1 bg-white/10 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit2 className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#7f13ec]/20 transition-colors">
                                                        <Upload className="w-6 h-6 text-slate-500 group-hover:text-[#7f13ec]" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-slate-300">Subir Logo</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">PNG o JPG (Max 5MB)</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color de Acento</p>
                                    <div className="grid grid-cols-5 gap-3">
                                        {['#7f13ec', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                                            <button
                                                key={c}
                                                className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 ${config.primary_color === c ? 'border-white ring-4 ring-[#7f13ec]/20' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setConfig({ ...config, primary_color: c })}
                                            />
                                        ))}
                                        <div className="relative group">
                                            <input
                                                type="color"
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                value={config.primary_color}
                                                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                            />
                                            <div className="aspect-square rounded-xl bg-[#0f172a] border border-white/10 flex items-center justify-center group-hover:border-[#7f13ec] transition-colors">
                                                <Plus className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                        Este color se aplicará a todos los botones e indicadores que vean tus invitados.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Galería en Tiempo Real */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm group hover:border-[#7f13ec]/30 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#7f13ec]/10 rounded-2xl border border-[#7f13ec]/20 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-[#7f13ec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Galería Live Feed</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Fotos Generadas</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ x: 5 }}
                                    onClick={() => window.open(eventLink, '_blank')}
                                    className="text-xs font-bold text-[#7f13ec]/80 hover:text-[#7f13ec] uppercase tracking-widest flex items-center gap-2 transition-colors"
                                >
                                    Abrir Galería <ExternalLink className="w-4 h-4" />
                                </motion.button>
                            </div>

                            <div className="flex gap-5 overflow-x-auto pb-6 scroll-smooth custom-scrollbar snap-x">
                                {recentPhotos.length > 0 ? (
                                    recentPhotos.map((photo, idx) => (
                                        <motion.div
                                            key={photo.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="min-w-[180px] group/photo relative aspect-[3/4] rounded-2xl overflow-hidden snap-start border border-white/5 shadow-2xl"
                                        >
                                            <img src={photo.image_url} alt="Generation" className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-[#7f13ec]" />
                                                    <p className="text-[10px] text-white font-bold opacity-80">
                                                        {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="w-full h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 bg-[#0f172a]/20">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium italic">Las fotos de tu fiesta aparecerán aquí conforme se generen...</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Barra Lateral Derecha */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">

                        {/* 4. Créditos & Monitoreo */}
                        <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7f13ec]/10 blur-[100px] rounded-full pointer-events-none"></div>

                            <div className="relative z-10 text-center space-y-6">
                                <div className="flex flex-col items-center gap-1">
                                    <Zap className="w-8 h-8 text-[#7f13ec] mb-2" />
                                    <h3 className="text-lg font-bold text-white tracking-tight">Balance de Fotos</h3>
                                    <p className="text-[10px] text-[#7f13ec] font-black uppercase tracking-[0.2em]">Créditos de Evento</p>
                                </div>

                                <div className="relative flex items-center justify-center py-4">
                                    <svg className="w-48 h-48 transform -rotate-[225deg]">
                                        <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="82" stroke="currentColor" strokeWidth="10" strokeDasharray="515" strokeLinecap="round"></circle>
                                        <motion.circle
                                            initial={{ strokeDashoffset: 515 }}
                                            animate={{ strokeDashoffset: 515 - (515 * (percentageUsed / 100) * 0.75) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="text-[#7f13ec]"
                                            cx="96" cy="96"
                                            fill="transparent" r="82"
                                            stroke="currentColor"
                                            strokeWidth="10"
                                            strokeDasharray="515"
                                            strokeLinecap="round"
                                            filter="drop-shadow(0 0 8px rgba(127,19,236,0.6))"
                                        ></motion.circle>
                                    </svg>
                                    <div className="absolute flex flex-col items-center group">
                                        <span className="text-6xl font-black text-white group-hover:scale-110 transition-transform duration-300">{creditsUsed}</span>
                                        <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 mt-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DE {creditsTotal} USADOS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-left">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Disponibles</p>
                                            <p className="text-xl font-black text-white tracking-tight">{creditsTotal - creditsUsed}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado</p>
                                            <p className={`text-xs font-bold ${percentageUsed > 90 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {percentageUsed > 90 ? 'Crítico' : 'Saludable'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentageUsed}%` }}
                                            className="bg-gradient-to-r from-[#7f13ec] to-[#ec4899] h-full shadow-[0_0_15px_rgba(127,19,236,0.5)]"
                                        ></motion.div>
                                    </div>

                                    <button
                                        onClick={() => alert(`Para recargar créditos, contacta a tu proveedor: ${partnerBranding?.email || 'Partner Creativa Labs'}`)}
                                        className="w-full py-4 bg-[#7f13ec]/10 border border-[#7f13ec]/30 text-[#7f13ec] text-xs font-black uppercase tracking-[0.15em] rounded-2xl hover:bg-[#7f13ec] hover:text-white transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Solicitar Recarga
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 5. Acceso Invitados (QR) */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm group hover:border-[#7f13ec]/30 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-[#7f13ec]/10 rounded-2xl border border-[#7f13ec]/20 group-hover:scale-110 transition-transform">
                                    <QrCode className="w-6 h-6 text-[#7f13ec]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Acceso Invitados</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Control de Entrada</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button className="w-full py-4 bg-white text-[#0f172a] font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-transform active:scale-95 group">
                                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                                    Descargar QR
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(eventLink);
                                        showToast('¡Link copiado con éxito! ✨');
                                    }}
                                    className="w-full py-4 bg-white/10 text-white border border-white/10 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-95 group"
                                >
                                    <LinkIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    Copiar Enlace
                                </button>
                            </div>

                            <div className="mt-8 p-6 bg-[#0f172a]/80 rounded-3xl border border-white/10 flex flex-col items-center gap-5 shadow-inner">
                                <div className="bg-white p-3 rounded-2xl shadow-2xl relative group">
                                    <div className="absolute -inset-2 bg-[#7f13ec]/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <QRCodeSVG value={eventLink} size={140} className="relative rounded-lg" />
                                </div>
                                <div className="text-center w-full px-2 overflow-hidden">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Shield className="w-3 h-3 text-emerald-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enlace de Seguridad Activo</p>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 truncate hover:text-[#7f13ec] cursor-pointer transition-colors" title={eventLink}>
                                        {eventLink.replace('https://', '')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 6. Quick Stats Refined */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center group hover:bg-[#7f13ec]/5 transition-colors">
                                <Users className="w-5 h-5 text-slate-600 mx-auto mb-3 group-hover:text-[#7f13ec]" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invitados</p>
                                <p className="text-3xl font-black text-white tracking-tighter">--</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center group hover:bg-[#7f13ec]/5 transition-colors">
                                <Zap className="w-5 h-5 text-slate-600 mx-auto mb-3 group-hover:text-[#ec4899]" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tiempo IA</p>
                                <p className="text-3xl font-black text-white tracking-tighter">~15s</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Toast System */}
            <AnimatePresence>
                {toast.message && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 min-w-[300px]"
                    >
                        <div className={`p-2 rounded-xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-[#7f13ec]/20 text-[#7f13ec]'
                            }`}>
                            {toast.type === 'error' ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 5px;
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(127, 19, 236, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(127, 19, 236, 0.4);
                }
            `}</style>
        </div>
    );
};

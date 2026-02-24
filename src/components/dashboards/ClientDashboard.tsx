import React, { useState, useEffect, useMemo } from 'react';
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
    ChevronLeft,
    Filter,
    Check,
    Trophy,
    TrendingUp,
    Maximize,
    Play,
    Pause,
    LogOut,
    ChevronDown
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PREFERRED_PACK_ORDER, IDENTITIES } from '../../lib/constants';
import JSZip from 'jszip';

// Interfaces
interface EventConfig {
    logo_url?: string;
    primary_color?: string;
    welcome_text?: string;
    radius?: string;
    show_welcome_screen?: boolean;
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

// Custom Premium DatePicker
const AlquimiaDatePicker = ({ value, onChange, primaryColor }: { value: string, onChange: (v: string) => void, primaryColor: string }) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    const [isOpen, setIsOpen] = useState(false);
    const date = value ? new Date(value + 'T00:00:00') : new Date();
    const [viewDate, setViewDate] = useState(new Date(date));

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleSelectDate = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        const y = newDate.getFullYear();
        const m = (newDate.getMonth() + 1).toString().padStart(2, '0');
        const d = newDate.getDate().toString().padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-white/20 transition-all text-white text-sm"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-slate-500" style={{ color: isOpen ? primaryColor : undefined }} />
                    <span className="font-medium">{value ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seleccionar fecha'}</span>
                </div>
                <ChevronDown className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-3 p-6 bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 w-[320px] md:w-[350px]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><ChevronLeft className="size-4 text-white" /></button>
                                <div className="text-center">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{months[currentMonth]}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold">{currentYear}</p>
                                </div>
                                <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><ChevronRight className="size-4 text-white" /></button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {days.map(d => <div key={d} className="text-[10px] font-black text-slate-600 text-center uppercase tracking-widest py-2">{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = value === `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleSelectDate(day)}
                                            className={`aspect-square rounded-xl text-xs font-bold transition-all relative flex items-center justify-center
                                                ${isSelected ? 'bg-white text-black scale-110 shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                            `}
                                            style={isSelected ? { backgroundColor: primaryColor, color: 'white' } : {}}
                                        >
                                            {day}
                                            {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// Custom Premium TimePicker
const AlquimiaTimePicker = ({ value, onChange, primaryColor }: { value: string, onChange: (v: string) => void, primaryColor: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [h, m] = value.split(':');

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-white/20 transition-all text-white text-sm font-mono"
            >
                <div className="flex items-center gap-3">
                    <Clock className="size-4 text-slate-500" style={{ color: isOpen ? primaryColor : undefined }} />
                    <span className="font-bold tracking-widest">{h}:{m} <span className="text-[10px] text-slate-500 font-sans ml-1 uppercase">HS</span></span>
                </div>
                <ChevronDown className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-3 p-4 bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                        >
                            <div className="flex gap-2 h-48">
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center mb-2 sticky top-0 bg-primary/80 py-1">Hora</p>
                                    {hours.map(hr => (
                                        <button
                                            key={hr}
                                            onClick={() => onChange(`${hr}:${m}`)}
                                            className={`w-full py-2 rounded-lg text-sm font-mono transition-all ${h === hr ? 'bg-white/10 font-black' : 'text-slate-500 hover:text-white'}`}
                                            style={h === hr ? { color: primaryColor } : {}}
                                        >
                                            {hr}
                                        </button>
                                    ))}
                                </div>
                                <div className="w-px bg-white/5 my-4" />
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center mb-2 sticky top-0 bg-primary/80 py-1">Min</p>
                                    {minutes.map(min => (
                                        <button
                                            key={min}
                                            onClick={() => onChange(`${h}:${min}`)}
                                            className={`w-full py-2 rounded-lg text-sm font-mono transition-all ${m === min ? 'bg-white/10 font-black' : 'text-slate-500 hover:text-white'}`}
                                            style={m === min ? { color: primaryColor } : {}}
                                        >
                                            {min}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

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
    const [downloading, setDownloading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
    const [slideshowIndex, setSlideshowIndex] = useState(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
        message: '',
        type: null
    });

    // Config state
    const [config, setConfig] = useState<EventConfig>({
        primary_color: '#7f13ec',
        welcome_text: '¡Bienvenidos a la celebración!',
        radius: '12px',
        show_welcome_screen: true
    });

    const [partnerBranding, setPartnerBranding] = useState<any>(null);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('00:00');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

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
                setEventTime(data.start_date && data.start_date.includes('T') ? data.start_date.split('T')[1].substring(0, 5) : '00:00');
                setSelectedStyles(data.selected_styles || []);

                // Prioritize event config, then partner config
                const finalConfig = {
                    ...data.partner?.config,
                    ...data.config
                };

                setConfig({
                    primary_color: finalConfig.primary_color || '#7f13ec',
                    welcome_text: finalConfig.welcome_text || '¡Bienvenidos!',
                    radius: finalConfig.radius || '12px',
                    logo_url: finalConfig.logo_url || '',
                    show_welcome_screen: finalConfig.show_welcome_screen ?? true
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

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
        window.location.reload();
    };

    const downloadAllPhotos = async () => {
        if (recentPhotos.length === 0) return;
        try {
            setDownloading(true);
            const zip = new JSZip();
            const folder = zip.folder(`fotos-${event?.event_slug}`);

            const photoPromises = recentPhotos.map(async (photo, index) => {
                try {
                    const response = await fetch(photo.image_url);
                    const blob = await response.blob();
                    folder?.file(`generacion-${index + 1}.jpg`, blob);
                } catch (err) {
                    console.error('Error downloading photo:', err);
                }
            });

            await Promise.all(photoPromises);
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `event-photos-${event?.event_slug}.zip`;
            link.click();
            showToast('¡Descarga iniciada con éxito! 📦');
        } catch (error) {
            console.error('Error generating ZIP:', error);
            showToast('Error al generar el archivo ZIP', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.')) return;
        try {
            setDeletingId(photoId);
            const { error } = await supabase.from('generations').delete().eq('id', photoId);
            if (error) throw error;
            setRecentPhotos(recentPhotos.filter(p => p.id !== photoId));
            showToast('Foto eliminada correctamente');
        } catch (error: any) {
            showToast('Error al eliminar: ' + error.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = async () => {
        if (!event) return;
        try {
            setSaving(true);
            const fullStartDate = (eventDate && eventTime) ? `${eventDate}T${eventTime}:00` : eventDate;

            const { error } = await supabase
                .from('events')
                .update({
                    event_name: eventName,
                    start_date: fullStartDate,
                    config: config,
                    selected_styles: selectedStyles
                })
                .eq('id', event.id);

            if (error) throw error;
            showToast('¡Configuración guardada con éxito! ✨');
        } catch (error: any) {
            console.error('Error saving:', error);
            showToast(error.message || 'Error al guardar los cambios.', 'error');
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

    // Group identities by style pack
    const stylePacks = useMemo(() => {
        // Filter IDENTITIES by partner style_presets if they exist
        const partnerConfig = (event as any)?.partner?.config;
        const allowedStyles = partnerConfig?.style_presets;

        let filteredIdentities = IDENTITIES;
        if (allowedStyles && Array.isArray(allowedStyles) && allowedStyles.length > 0) {
            filteredIdentities = IDENTITIES.filter(i => allowedStyles.includes(i.id));
        }

        const uniquePacks = Array.from(new Set(filteredIdentities.map(i => i.subCategory)));
        return uniquePacks.map(pack => {
            const firstIdentity = filteredIdentities.find(i => i.subCategory === pack);
            return {
                id: pack,
                name: pack,
                thumbnail: firstIdentity?.url || '',
                category: firstIdentity?.category || 'General'
            };
        });
    }, [event]);

    // Calculate real stats
    const stats = useMemo(() => {
        const totalPhotos = recentPhotos.length;
        const uniqueUsers = new Set(recentPhotos.map(p => p.user_id)).size;

        const styleCounts: Record<string, number> = {};
        recentPhotos.forEach(p => {
            const styleId = p.style_id || p.model_id || 'unknown';
            styleCounts[styleId] = (styleCounts[styleId] || 0) + 1;
        });

        const topStyleEntry = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
        const topStyle = topStyleEntry ? topStyleEntry[0] : 'Ninguno';

        return {
            totalPhotos,
            uniqueUsers: uniqueUsers || '--',
            topStyle
        };
    }, [recentPhotos]);

    // Slideshow Auto-play logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSlideshowOpen && recentPhotos.length > 0) {
            interval = setInterval(() => {
                setSlideshowIndex(prev => (prev + 1) % recentPhotos.length);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isSlideshowOpen, recentPhotos.length]);

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

    const toggleStyle = (styleId: string) => {
        if (selectedStyles.includes(styleId)) {
            setSelectedStyles(selectedStyles.filter(s => s !== styleId));
        } else {
            setSelectedStyles([...selectedStyles, styleId]);
        }
    };



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

                        {!onBack && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl flex items-center gap-2 transition-all font-bold text-[10px] uppercase tracking-wider"
                            >
                                <LogOut className="size-3.5" />
                                <span className="hidden sm:inline">Cerrar Sesión</span>
                            </motion.button>
                        )}
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
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha y Hora de Inicio</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <AlquimiaDatePicker
                                            value={eventDate}
                                            onChange={setEventDate}
                                            primaryColor={config.primary_color || '#7f13ec'}
                                        />
                                        <AlquimiaTimePicker
                                            value={eventTime}
                                            onChange={setEventTime}
                                            primaryColor={config.primary_color || '#7f13ec'}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-full space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[#7f13ec]/5 border border-[#7f13ec]/20 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#7f13ec]/10 rounded-xl">
                                                <Smartphone className="w-4 h-4 text-[#7f13ec]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Pantalla de Bienvenida</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-medium">Mostrar antes de que inicie el evento</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setConfig({ ...config, show_welcome_screen: !config.show_welcome_screen })}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${config.show_welcome_screen ? 'bg-[#7f13ec]' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${config.show_welcome_screen ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                            Mensaje de Bienvenida
                                            <span className="text-[#7f13ec]/60 font-medium normal-case">Se muestra al iniciar la cámara</span>
                                        </label>
                                        <textarea
                                            className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec]/50 text-white outline-none transition-all"
                                            rows={2}
                                            placeholder="¡Bienvenidos a nuestra fiesta! Hazte una foto mágica..."
                                            value={config.welcome_text}
                                            onChange={(e) => setConfig({ ...config, welcome_text: e.target.value })}
                                        />
                                    </div>
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
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={downloadAllPhotos}
                                        disabled={downloading || recentPhotos.length === 0}
                                        className="text-xs font-bold text-[#7f13ec] hover:text-[#7f13ec]/80 uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {downloading ? 'Generando ZIP...' : 'Descargar Todo'} <Download className="w-4 h-4" />
                                    </motion.button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <motion.button
                                        whileHover={{ x: 5 }}
                                        onClick={() => window.open(eventLink.replace('kiosk', 'photobooth'), '_blank')}
                                        className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
                                    >
                                        Abrir Galería <ExternalLink className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>

                            <div className="flex gap-5 overflow-x-auto pb-6 scroll-smooth custom-scrollbar snap-x">
                                {recentPhotos.length > 0 ? (
                                    recentPhotos.map((photo, idx) => (
                                        <motion.div
                                            key={photo.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="min-w-[180px] group/photo relative aspect-[3/4] rounded-2xl overflow-hidden snap-start border border-white/5 shadow-2xl bg-slate-900"
                                        >
                                            <img src={photo.image_url} alt="Generation" className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />

                                            {/* Moderation Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300">
                                                <div className="absolute top-3 right-3 flex flex-col gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeletePhoto(photo.id)}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl backdrop-blur-md transition-all border border-red-500/20"
                                                    >
                                                        {deletingId === photo.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </motion.button>
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-[#7f13ec]" />
                                                        <p className="text-[10px] text-white font-bold opacity-80 uppercase tracking-tighter">
                                                            {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
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

                        {/* 3. Curaduría de Experiencias (Estilos) */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm group hover:border-[#7f13ec]/30 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#7f13ec]/10 rounded-2xl border border-[#7f13ec]/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-6 h-6 text-[#7f13ec]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Curaduría de Experiencias</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Paso 03 — Pack de Estilos IA</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-[#7f13ec]/10 rounded-full border border-[#7f13ec]/20 text-[10px] font-black text-[#7f13ec] uppercase tracking-widest">
                                    {selectedStyles.length} Packs Activos
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {stylePacks.map((pack) => {
                                    const isActive = selectedStyles.includes(pack.id);
                                    return (
                                        <motion.div
                                            key={pack.id}
                                            whileHover={{ y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleStyle(pack.id)}
                                            className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${isActive ? 'border-[#7f13ec] shadow-[0_0_20px_rgba(127,19,236,0.2)]' : 'border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <img
                                                src={pack.thumbnail}
                                                alt={pack.name}
                                                className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                                            {isActive && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#7f13ec] rounded-full flex items-center justify-center shadow-lg border border-white/20 z-10 animate-in zoom-in duration-300">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p className="text-[10px] font-black text-[#7f13ec] uppercase tracking-widest mb-1">{pack.category}</p>
                                                <h4 className="text-xs font-bold text-white leading-tight">{pack.name}</h4>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest">Control de Calidad</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Solo los packs seleccionados aquí aparecerán en la pantalla de invitados. Recomendamos elegir entre 3 y 5 para una experiencia óptima.</p>
                                </div>
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
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Participantes</p>
                                <p className="text-3xl font-black text-white tracking-tighter">{stats.uniqueUsers}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center group hover:bg-[#7f13ec]/5 transition-colors overflow-hidden">
                                <Trophy className="w-5 h-5 text-slate-600 mx-auto mb-3 group-hover:text-[#ec4899]" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estilo Favorito</p>
                                <p className="text-xl font-black text-white tracking-tighter truncate">{stats.topStyle || '--'}</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 group hover:border-[#7f13ec]/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#7f13ec]/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-[#7f13ec]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Crecimiento</p>
                                        <p className="text-sm font-bold text-white mt-1">Nivel de Engagement</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-[#7f13ec] uppercase">Alto</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Basado en {stats.totalPhotos} fotos</p>
                                </div>
                            </div>
                        </div>
                        {/* 7. Live Slideshow Trigger */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsSlideshowOpen(true)}
                            className="w-full py-6 rounded-3xl bg-gradient-to-r from-[#7f13ec] to-[#ec4899] text-white font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(127,19,236,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden mt-8"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <Monitor className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Inaugurar Slideshow</span>
                            <div className="p-1 bg-white/20 rounded-lg relative z-10">
                                <Maximize className="w-3 h-3" />
                            </div>
                        </motion.button>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mt-4">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic text-center">
                                Abre esta vista en una pantalla secundaria o proyector para mostrar las creaciones en tiempo real.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Live Slideshow Overlay */}
            <AnimatePresence>
                {isSlideshowOpen && recentPhotos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsSlideshowOpen(false)}
                            className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/20 z-[210] transition-all"
                        >
                            <X className="w-8 h-8" />
                        </motion.button>

                        <div className="absolute top-10 left-10 flex items-center gap-4 z-[210]">
                            <div className="p-3 bg-[#7f13ec] rounded-2xl shadow-2xl">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">{eventName}</h2>
                                <p className="text-[#7f13ec] font-bold tracking-widest uppercase text-xs">Live Slideshow Mode</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={recentPhotos[slideshowIndex].id}
                                initial={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="relative w-full h-full flex items-center justify-center p-20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 z-10"></div>
                                <img
                                    src={recentPhotos[slideshowIndex].image_url}
                                    alt="Slideshow"
                                    className="max-w-full max-h-full object-contain rounded-[40px] shadow-[0_0_100px_rgba(127,19,236,0.3)] border-4 border-white/10"
                                />

                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-center">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="inline-block px-8 py-4 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl"
                                    >
                                        <p className="text-lg font-black text-white uppercase tracking-[0.3em]">
                                            Escanea y crea la tuya
                                        </p>
                                    </motion.div>

                                    <div className="mt-8 flex items-center justify-center gap-10">
                                        <div className="p-4 bg-white rounded-[32px] shadow-2xl">
                                            <QRCodeSVG value={eventLink} size={150} level="M" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5">
                            <motion.div
                                key={slideshowIndex}
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-full bg-[#7f13ec]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

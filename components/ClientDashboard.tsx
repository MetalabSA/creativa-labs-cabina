import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Calendar,
    Settings,
    Palette,
    QrCode,
    LayoutGrid,
    CheckCircle2,
    Save,
    ExternalLink,
    Image as ImageIcon,
    Download
} from 'lucide-react';
import { PREFERRED_PACK_ORDER } from '../lib/constants';

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
}

interface ClientDashboardProps {
    user: any;
    profile: any;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, profile }) => {
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config state
    const [config, setConfig] = useState<EventConfig>({
        primary_color: '#135bec',
        welcome_text: '¡Bienvenidos a nuestro evento!',
        radius: '12px'
    });
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

    useEffect(() => {
        fetchEventForClient();
    }, [profile.email]);

    const fetchEventForClient = async () => {
        try {
            setLoading(true);
            // Search event where client_email matches profile email or linked via partner
            // For now, let's assume we search by client_email in the events table
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .ilike('client_email', profile.email.toLowerCase())
                .single();

            if (data) {
                setEvent(data);
                if (data.config) setConfig(data.config);
                if (data.selected_styles) setSelectedStyles(data.selected_styles);
            }
        } catch (error) {
            console.error('Error fetching event for client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!event) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('events')
                .update({
                    config: config,
                    selected_styles: selectedStyles
                })
                .eq('id', event.id);

            if (error) throw error;
            alert('¡Configuración guardada con éxito!');
        } catch (error) {
            console.error('Error saving event config:', error);
            alert('Error al guardar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    const toggleStyle = (style: string) => {
        setSelectedStyles(prev =>
            prev.includes(style)
                ? prev.filter(s => s !== style)
                : [...prev, style]
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white gap-4">
                <div className="size-10 border-2 border-t-[#135bec] border-slate-800 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Cargando tu evento...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto border border-white/5">
                <Calendar className="size-16 text-slate-800 mx-auto mb-6 opacity-30" />
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No se encontró tu evento</h2>
                <p className="text-slate-400 text-sm mb-8">Parece que aún no tienes un evento asignado a tu correo ({profile.email}). Por favor, contacta a tu proveedor.</p>
                <button className="px-8 py-3 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-bold rounded-xl transition-all shadow-xl shadow-[#135bec]/20 uppercase text-xs tracking-widest">Contactar Soporte</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Hero Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-500/20">Evento Activo</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: #{event.id.substring(0, 8)}</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">{event.event_name}</h1>
                    <p className="text-slate-400 text-sm max-w-xl">Bienvenido a tu panel de control. Aquí puedes personalizar cómo verán la experiencia tus invitados y gestionar el contenido generado.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open(`https://photobooth.creativa-labs.com/?event=${event.event_slug}`, '_blank')}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
                    >
                        <ExternalLink className="size-4" />
                        Ver Experiencia
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Visual Config */}
                    <section className="glass-card rounded-2xl p-8 border border-white/5 space-y-8">
                        <div className="flex items-center gap-3">
                            <Palette className="size-6 text-[#135bec]" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Identidad Visual</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Color de Acento</label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="size-12 rounded-xl border-2 border-white/10 shadow-2xl cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: config.primary_color }}
                                            onClick={() => document.getElementById('clientColorPicker')?.click()}
                                        ></div>
                                        <input
                                            id="clientColorPicker"
                                            type="color"
                                            className="sr-only"
                                            value={config.primary_color}
                                            onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-[#135bec] outline-none"
                                                value={config.primary_color}
                                                onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Texto de Bienvenida</label>
                                    <textarea
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#135bec] outline-none min-h-[100px] resize-none"
                                        placeholder="Ej: ¡Bienvenidos a la boda de Javi y Sofi! Hazte una foto increíble..."
                                        value={config.welcome_text}
                                        onChange={e => setConfig({ ...config, welcome_text: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Redondeo de Interfaz (Radius)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['0px', '8px', '16px', '32px'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setConfig({ ...config, radius: r })}
                                                className={`py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${config.radius === r ? 'bg-[#135bec] text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                            >
                                                {r === '0px' ? 'Cuadrado' : r === '32px' ? 'Redondo' : r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] block mb-3">Logo del Evento</label>
                                    <div className="w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-slate-900/40 hover:bg-slate-900 transition-all cursor-pointer group hover:border-[#135bec]/40">
                                        <ImageIcon className="size-8 text-slate-700 group-hover:text-[#135bec] mb-2 transition-colors" />
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subir Identidad</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSaveConfig}
                                disabled={saving}
                                className="flex items-center gap-2 px-10 py-4 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-black text-xs uppercase tracking-[3px] rounded-2xl transition-all shadow-2xl shadow-[#135bec]/30 disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {saving ? 'Gurdando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    </section>

                    {/* Style Selection */}
                    <section className="glass-card rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="size-6 text-[#135bec]" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Estilos Disponibles</h2>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedStyles.length} Habilitados</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {PREFERRED_PACK_ORDER.map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleStyle(style)}
                                    className={`relative group h-28 rounded-2xl overflow-hidden border-2 transition-all ${selectedStyles.includes(style) ? 'border-[#135bec] scale-[1.05] shadow-xl shadow-[#135bec]/20' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"></div>
                                    <img
                                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${style}`}
                                        className="size-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={style}
                                    />
                                    <span className="absolute bottom-3 left-3 z-20 text-[9px] font-black uppercase text-white tracking-widest leading-none">{style}</span>
                                    {selectedStyles.includes(style) && (
                                        <div className="absolute top-3 right-3 z-20 bg-[#135bec] rounded-full p-1 animate-in zoom-in">
                                            <CheckCircle2 className="size-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Info Column */}
                <div className="space-y-8">
                    {/* QR Section */}
                    <div className="glass-card rounded-2xl p-8 border border-[#135bec]/20 bg-[#135bec]/5 text-center flex flex-col items-center">
                        <div className="size-16 bg-[#135bec] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#135bec]/30">
                            <QrCode className="size-10 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">QR del Evento</h3>
                        <p className="text-slate-400 text-xs mb-8">Tus invitados pueden escanear este código para entrar directamente a la experiencia.</p>

                        <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8 group cursor-pointer hover:scale-105 transition-transform duration-500">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://photobooth.creativa-labs.com/?event=${event.event_slug}&color=030712&bgcolor=ffffff`}
                                className="size-48"
                                alt="QR Code"
                            />
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            <button className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
                                <Download className="size-4" />
                                Descargar para Impresión
                            </button>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{event.credits_used} / {event.credits_allocated} Créditos Usados</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-card rounded-2xl p-8 border border-white/5 space-y-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Settings className="size-5 text-slate-500" />
                            Resumen
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug de URL</span>
                                <span className="text-xs font-mono text-[#135bec]">/{event.event_slug}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiración</span>
                                <span className="text-xs text-white uppercase font-bold">{new Date(event.end_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Soporte</span>
                                <span className="text-xs text-white uppercase font-bold">VIP Activo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react'; // Assuming this package is available or I can use an image service

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
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, profile }) => {
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recentPhotos, setRecentPhotos] = useState<any[]>([]);

    // Config state
    const [config, setConfig] = useState<EventConfig>({
        primary_color: '#7f13ec',
        welcome_text: 'Welcome to the celebration!',
        radius: '12px'
    });

    // Form state
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');

    useEffect(() => {
        fetchEventForClient();
    }, [profile.email]);

    const fetchEventForClient = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .ilike('client_email', profile.email.toLowerCase())
                .single();

            if (data) {
                setEvent(data);
                setEventName(data.event_name);
                setEventDate(data.start_date ? data.start_date.split('T')[0] : '');

                if (data.config) {
                    setConfig({
                        ...config,
                        ...data.config,
                        primary_color: data.config.primary_color || '#7f13ec'
                    });
                }

                // Fetch recent photos (mock or real)
                // const { data: photos } = await supabase.from('generations').select('*').eq('event_slug', data.event_slug).limit(10);
                // setRecentPhotos(photos || []);
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
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save changes.');
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
            alert('Error uploading logo');
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

    const eventLink = `https://photobooth.creativa-labs.com/?event=${event.event_slug}`;
    const creditsUsed = event.credits_used || 0;
    const creditsTotal = event.credits_allocated || 500;
    const percentageUsed = Math.min(100, Math.round((creditsUsed / creditsTotal) * 100));
    const dashOffset = 552.92 - (552.92 * percentageUsed) / 100; // For the gauge

    return (
        <div className="bg-[#0a0a0a] text-slate-100 min-h-screen font-[Spline Sans,sans-serif]">
            {/* Navigation */}
            <header className="border-b border-[#2d1b42] bg-[#16111d]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#7f13ec] p-2 rounded-lg">
                            <span className="material-symbols-outlined text-white">auto_awesome</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">AI Photo Booth <span className="text-[#7f13ec]">Pro</span></h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#" className="text-sm font-medium hover:text-[#7f13ec] transition-colors flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-lg">dashboard</span> Dashboard
                        </a>
                        <a href="#" className="text-sm font-medium text-slate-400 hover:text-[#7f13ec] transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">photo_library</span> Gallery
                        </a>
                        <a href="#" className="text-sm font-medium text-slate-400 hover:text-[#7f13ec] transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">settings</span> Settings
                        </a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Event Live</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#7f13ec]/20 border border-[#7f13ec]/30 flex items-center justify-center overflow-hidden">
                            {/* Avatar placeholder */}
                            <div className="bg-[#7f13ec] text-white w-full h-full flex items-center justify-center font-bold">
                                {profile.email[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Dashboard Header */}
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2 text-white">Event Host Dashboard</h2>
                        <p className="text-slate-400 text-lg">Managing: <span className="text-white font-semibold">{event.event_name}</span></p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#7f13ec] hover:bg-[#690cc4] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#7f13ec]/20"
                    >
                        {saving ? 'Saving...' : <><span className="material-symbols-outlined">save</span> Save Changes</>}
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column: Setup & Branding */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* 1. Event Setup */}
                        <section className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#7f13ec]">edit_calendar</span>
                                <h3 className="text-xl font-bold text-white">1. Event Setup</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Event Name</label>
                                    <input
                                        className="w-full bg-[#0a0a0a] border border-[#2d1b42] rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec] text-white outline-none"
                                        type="text"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Date</label>
                                    <input
                                        className="w-full bg-[#0a0a0a] border border-[#2d1b42] rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec] text-white outline-none"
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Welcome Message</label>
                                    <textarea
                                        className="w-full bg-[#0a0a0a] border border-[#2d1b42] rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#7f13ec] focus:border-[#7f13ec] text-white outline-none"
                                        rows={3}
                                        value={config.welcome_text}
                                        onChange={(e) => setConfig({ ...config, welcome_text: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Event Branding */}
                        <section className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#7f13ec]">palette</span>
                                <h3 className="text-xl font-bold text-white">2. Event Branding</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-slate-300">Event Logo</p>
                                    <div
                                        className="border-2 border-dashed border-[#2d1b42] rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#7f13ec]/50 transition-colors cursor-pointer group bg-[#0a0a0a]/50"
                                        onClick={() => document.getElementById('clientLogoInput')?.click()}
                                    >
                                        <input type="file" id="clientLogoInput" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        {config.logo_url ? (
                                            <img src={config.logo_url} alt="Logo" className="h-16 object-contain" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-[#7f13ec]">upload_file</span>
                                                <p className="text-xs text-slate-500">Drag and drop or click to upload</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-slate-300">Interface Theme Color</p>
                                    <div className="flex flex-wrap gap-4">
                                        {['#7f13ec', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                                            <button
                                                key={c}
                                                className={`w-12 h-12 rounded-full hover:scale-105 transition-transform ${config.primary_color === c ? 'ring-4 ring-[#7f13ec]/30 text-white' : ''}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setConfig({ ...config, primary_color: c })}
                                            />
                                        ))}
                                        <div className="relative">
                                            <input
                                                type="color"
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                value={config.primary_color}
                                                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                            />
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer border border-white/10">
                                                <span className="material-symbols-outlined text-xl text-slate-400">colorize</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">This color will be the primary accent for your guests.</p>
                                </div>
                            </div>
                        </section>

                        {/* 5. Real-time Gallery */}
                        <section className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#7f13ec]">auto_awesome_motion</span>
                                    <h3 className="text-xl font-bold text-white">Live Gallery Feed</h3>
                                </div>
                                <button onClick={() => window.open(eventLink, '_blank')} className="text-xs font-bold text-[#7f13ec] uppercase tracking-widest flex items-center gap-1 hover:underline">
                                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                {/* Placeholder Generation Cards - Since we don't have Fetch Logic connected to real images yet */}
                                <div className="min-w-[180px] aspect-[3/4] rounded-lg bg-slate-800 overflow-hidden relative group snap-start flex items-center justify-center border border-white/5">
                                    <p className="text-xs text-slate-500 text-center px-4">Photos taken at your event will appear here</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Monitoring & Actions */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* 4. Live Monitoring */}
                        <section className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-8 relative overflow-hidden">
                            {/* Radial Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7f13ec]/10 blur-[80px] rounded-full"></div>

                            <div className="text-center relative z-10">
                                <h3 className="text-lg font-bold mb-8 text-white">Photo Credits</h3>
                                {/* Gauge Chart Implementation */}
                                <div className="relative flex items-center justify-center mb-6">
                                    <svg className="w-48 h-48 transform -rotate-90">
                                        <circle className="text-slate-800" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                                        <circle className="text-[#7f13ec]" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="12"></circle>
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-5xl font-black text-white">{creditsUsed}</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">OF {creditsTotal} USED</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Remaining</span>
                                        <span className="text-white font-bold">{creditsTotal - creditsUsed} Photos</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#7f13ec] h-full" style={{ width: `${percentageUsed}%` }}></div>
                                    </div>
                                    <button onClick={() => alert('Contact your partner to top up credits')} className="w-full py-3 bg-[#7f13ec]/10 border border-[#7f13ec]/30 text-[#7f13ec] font-bold rounded-lg hover:bg-[#7f13ec]/20 transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">add_circle</span> Top Up Credits
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 3. QR Center */}
                        <section className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                                <span className="material-symbols-outlined text-[#7f13ec]">qr_code_2</span> Guest Access
                            </h3>
                            <div className="space-y-4">
                                <button className="w-full py-4 bg-[#7f13ec] text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#7f13ec]/20 hover:scale-[1.02] transition-transform active:scale-95">
                                    <span className="material-symbols-outlined">download</span> Download QR for Print
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(eventLink);
                                        alert('Link copied!');
                                    }}
                                    className="w-full py-4 bg-[#0a0a0a] text-slate-300 border border-[#2d1b42] font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined">link</span> Copy Event Link
                                </button>
                            </div>
                            <div className="mt-6 p-4 bg-[#0a0a0a]/50 rounded-lg border border-[#2d1b42] flex items-center gap-4">
                                <div className="bg-white p-1 rounded-md">
                                    <QRCodeSVG value={eventLink} size={64} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Link</p>
                                    <p className="text-xs font-medium text-slate-300 truncate hover:text-white cursor-pointer" title={eventLink}>{eventLink.replace('https://', '')}</p>
                                </div>
                            </div>
                        </section>

                        {/* Quick Stats */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-4 text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Guests</p>
                                <p className="text-2xl font-black text-white">--</p>
                            </div>
                            <div className="bg-[#16111d] border border-[#2d1b42] rounded-xl p-4 text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Process</p>
                                <p className="text-2xl font-black text-white">~15s</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4d3267;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

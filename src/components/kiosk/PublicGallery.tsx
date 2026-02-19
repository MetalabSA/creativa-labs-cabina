
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Sparkles, Camera, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface PublicGalleryProps {
    eventConfig: any;
    supabase: any;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({ eventConfig, supabase }) => {
    const [photos, setPhotos] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhotos = async () => {
            const { data } = await supabase
                .from('generations')
                .select('id, image_url, created_at')
                .eq('event_id', eventConfig.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setPhotos(data);
            setLoading(false);
        };

        fetchPhotos();

        // Realtime subscription
        const channel = supabase
            .channel(`public-gallery-${eventConfig.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'generations',
                filter: `event_id=eq.${eventConfig.id}`
            }, (payload: any) => {
                setPhotos(prev => [payload.new, ...prev.slice(0, 49)]);
                setCurrentIndex(0); // Jump to the new photo
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventConfig.id]);

    // Slideshow logic
    useEffect(() => {
        if (photos.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % photos.length);
            }, 8000); // 8 seconds per photo
            return () => clearInterval(timer);
        }
    }, [photos.length]);

    const brandingStyle = {
        '--accent-color': eventConfig?.config?.primary_color || '#7f13ec',
    } as React.CSSProperties;

    // Build the guest link for the QR
    const guestUrl = `${window.location.origin}/?event=${eventConfig.event_slug}`;

    return (
        <div
            className="fixed inset-0 bg-[#050505] text-white flex flex-col overflow-hidden z-[100] font-sans"
            style={brandingStyle}
        >
            {/* Main Display Area */}
            <div className="relative flex-1 flex items-center justify-center p-8 md:p-12">
                <AnimatePresence mode="wait">
                    {photos.length > 0 ? (
                        <motion.div
                            key={photos[currentIndex]?.id}
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative w-full h-full max-w-4xl flex items-center justify-center"
                        >
                            <div className="relative w-full h-full rounded-[40px] md:rounded-[60px] overflow-hidden border-[10px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                                <img
                                    src={photos[currentIndex]?.image_url}
                                    alt="Live Event"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />

                                {/* Photo Timestamp / Info */}
                                <div className="absolute bottom-10 left-10 z-10">
                                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-black uppercase tracking-[4px]">Live from {eventConfig.event_name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 text-white/20">
                            <Camera className="w-24 h-24 animate-pulse" />
                            <p className="text-xl font-black uppercase tracking-[10px]">Esperando la primera Alquimia...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sidebar / QR Panel */}
            <div className="h-48 md:h-auto md:w-[400px] bg-black/40 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 p-10 flex md:flex-col items-center justify-between md:justify-center gap-8 relative z-20">
                <div className="text-center md:mb-8">
                    {eventConfig.config?.logo_url ? (
                        <img src={eventConfig.config.logo_url} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-6" />
                    ) : (
                        <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
                    )}
                    <h2 className="hidden md:block text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">¡Hazte la Tuya!</h2>
                    <p className="hidden md:block text-[10px] font-bold text-white/40 uppercase tracking-[4px]">Escanea el código QR</p>
                </div>

                <div className="bg-white p-4 rounded-[40px] shadow-2xl relative">
                    <QRCodeCanvas
                        value={guestUrl}
                        size={window.innerWidth < 768 ? 120 : 200}
                        level="H"
                        includeMargin={true}
                    />
                    <div className="absolute -inset-2 border-2 border-accent/30 rounded-[48px] animate-pulse pointer-events-none" />
                </div>

                <div className="hidden md:flex flex-col items-center gap-4 mt-8 opacity-40">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase tracking-[2px]">Usa tu móvil</span>
                    </div>
                </div>

                {/* Event Name Footer for Mobile Sidebar */}
                <div className="md:hidden text-right">
                    <h2 className="text-lg font-black uppercase italic tracking-tighter text-accent leading-none">{eventConfig.event_name}</h2>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-[2px] mt-1">Live Gallery</p>
                </div>
            </div>

            {/* Global Branding Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
        </div>
    );
};

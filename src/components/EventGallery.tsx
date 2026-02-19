import React, { useEffect, useState } from 'react';
import { Download, Loader2, Camera, ArrowLeft, RefreshCw } from 'lucide-react';

interface EventGalleryProps {
    eventConfig: any;
    supabase: any;
    onBack: () => void;
    onViewPhoto: (url: string) => void;
}

export const EventGallery: React.FC<EventGalleryProps> = ({ eventConfig, supabase, onBack, onViewPhoto }) => {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPhotos = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const { data, error } = await supabase
                .from('generations')
                .select('id, image_url, style_id, created_at')
                .eq('event_id', eventConfig.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setPhotos(data);
            }
        } catch (err) {
            console.error('Error fetching event gallery:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
        // Auto-refresh cada 30 segundos para ver fotos nuevas en tiempo real
        const interval = setInterval(() => fetchPhotos(true), 30000);
        return () => clearInterval(interval);
    }, [eventConfig.id]);

    const remaining = (eventConfig.credits_allocated || 0) - (eventConfig.credits_used || 0);

    return (
        <div className="animate-[fadeIn_0.5s_ease-out] max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center mb-12 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">📸</span>
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tight text-white mb-2">
                    {eventConfig.event_name}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-[1px] w-8 bg-accent/50" />
                    <p className="text-[10px] tracking-[4px] text-white/40 uppercase">Galería del Evento</p>
                    <div className="h-[1px] w-8 bg-accent/50" />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-accent">{photos.length}</span>
                        <span className="text-[8px] tracking-[2px] text-white/30 uppercase">Fotos</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{remaining}</span>
                        <span className="text-[8px] tracking-[2px] text-white/30 uppercase">Créditos</span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/60 hover:text-white text-[10px] font-bold tracking-[1px] uppercase"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                    <button
                        onClick={() => fetchPhotos(true)}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-accent/10 border border-accent/20 rounded-xl hover:bg-accent/20 transition-all text-accent text-[10px] font-bold tracking-[1px] uppercase ${refreshing ? 'opacity-50' : ''}`}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Grid de fotos */}
            {loading ? (
                <div className="flex flex-col items-center py-20 opacity-40">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[2px]">Cargando galería...</span>
                </div>
            ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
                    <Camera className="w-12 h-12 text-white/10 mb-6" />
                    <p className="text-white/30 text-xs font-black uppercase tracking-[4px] mb-4">
                        Aún no hay fotos en este evento
                    </p>
                    <p className="text-white/20 text-[10px] tracking-[1px] max-w-sm text-center">
                        Las fotos aparecerán aquí a medida que los invitados las generen.
                        Esta galería se actualiza automáticamente.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative aspect-[4/5] rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/10 bg-[#0a0a0c] hover:border-accent/40 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500"
                            >
                                <img
                                    src={photo.image_url}
                                    alt="Foto del evento"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                    crossOrigin="anonymous"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                                    <span className="text-[8px] font-black uppercase tracking-[2px] text-accent mb-2 block">
                                        {new Date(photo.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onViewPhoto(photo.image_url)}
                                            className="flex-1 bg-white text-black py-3 rounded-xl text-[8px] font-black uppercase tracking-[1px] hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>Ver</span>
                                        </button>
                                        <a
                                            href={photo.image_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-3 bg-white/10 rounded-xl text-white hover:bg-white hover:text-black transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Auto-refresh indicator */}
                    <div className="flex items-center justify-center gap-2 mt-8 text-white/20">
                        <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                        <span className="text-[9px] tracking-[1px]">actualización automática cada 30s</span>
                    </div>
                </>
            )}
        </div>
    );
};

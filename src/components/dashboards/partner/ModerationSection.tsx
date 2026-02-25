import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowDownRight,
    Search,
    Calendar,
    X,
    Download,
    Layers,
    Trash2,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';
import { Event } from '../../../types/index';

interface ModerationSectionProps {
    eventToModerate: Event | null;
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
    filteredPhotos: any[];
    eventPhotos: any[];
    moderationSearchTerm: string;
    setModerationSearchTerm: (term: string) => void;
    moderationDateFilter: string;
    setModerationDateFilter: (date: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    handleDeletePhoto: (id: string) => void;
    loading: boolean;
    selectedPhotos: string[];
    setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
    handleBulkDelete: () => Promise<void>;
}

export const ModerationSection: React.FC<ModerationSectionProps> = ({
    eventToModerate,
    setView,
    filteredPhotos,
    eventPhotos,
    moderationSearchTerm,
    setModerationSearchTerm,
    moderationDateFilter,
    setModerationDateFilter,
    showToast,
    handleDeletePhoto,
    loading,
    selectedPhotos,
    setSelectedPhotos,
    handleBulkDelete
}) => {
    const handleDownloadZip = async (photosToDownload: any[], filename: string) => {
        if (photosToDownload.length === 0) return showToast('No hay fotos para descargar', 'error');

        try {
            showToast('Preparando descarga ZIP...', 'info');
            const zip = new JSZip();
            const folder = zip.folder(filename);

            if (!folder) throw new Error('No se pudo crear la carpeta en el ZIP');

            const photoPromises = photosToDownload.map(async (photo, index) => {
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
            a.download = `${filename}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Archivo ZIP descargado con éxito');
        } catch (err) {
            console.error('Error al generar ZIP:', err);
            showToast('Error al generar el archivo ZIP', 'error');
        }
    };

    return (
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
                            onClick={() => handleDownloadZip(filteredPhotos, `galeria-${eventToModerate?.event_slug}`)}
                            className="px-6 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 text-white text-[10px] font-black rounded-xl shadow-lg border border-white/10 transition-all uppercase tracking-[2px] flex items-center gap-2"
                        >
                            <Layers className="size-4" />
                            Descargar Todo (ZIP)
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedPhotos.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 backdrop-blur-2xl border border-[#135bec]/30 rounded-2xl px-8 py-4 flex items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#135bec] uppercase tracking-widest">Selección Activa</span>
                            <span className="text-xl font-black text-white">{selectedPhotos.length} <span className="text-xs text-slate-500 font-medium">Fotos</span></span>
                        </div>

                        <div className="w-px h-10 bg-white/10" />

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedPhotos([])}
                                className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const selectedFullPhotos = eventPhotos.filter(p => selectedPhotos.includes(p.id));
                                    handleDownloadZip(selectedFullPhotos, 'seleccion-fotos');
                                }}
                                className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-[2px] flex items-center gap-2"
                            >
                                <Download className="size-4" />
                                Descargar ZIP
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-6 py-2.5 bg-rose-500 text-white text-[10px] font-black rounded-xl hover:bg-rose-600 transition-all uppercase tracking-[2px] flex items-center gap-2"
                            >
                                <Trash2 className="size-4" />
                                Eliminar Seleccionadas
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="size-12 border-4 border-[#135bec]/30 border-t-[#135bec] rounded-full animate-spin" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sincronizando Galería...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            onClick={() => {
                                if (selectedPhotos.includes(photo.id)) {
                                    setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
                                } else {
                                    setSelectedPhotos(prev => [...prev, photo.id]);
                                }
                            }}
                            className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer shadow-xl ${selectedPhotos.includes(photo.id) ? 'border-[#135bec] scale-[0.98] ring-4 ring-[#135bec]/20' : 'border-white/5 bg-slate-900'
                                }`}
                        >
                            <div className={`absolute top-4 left-4 z-20 size-5 rounded-md border flex items-center justify-center transition-all ${selectedPhotos.includes(photo.id) ? 'bg-[#135bec] border-[#135bec] text-white' : 'bg-black/20 border-white/20 text-transparent opacity-0 group-hover:opacity-100'
                                }`}>
                                <span className="text-[14px] font-black">✓</span>
                            </div>

                            <img
                                src={photo.image_url}
                                alt="Generation"
                                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${selectedPhotos.includes(photo.id) ? 'opacity-50' : ''}`}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                <p className="text-[8px] font-mono text-white/50 mb-0.5 truncate">{photo.id}</p>
                                <p className="text-[10px] font-black text-white mb-3 truncate uppercase tracking-widest">{photo.profiles?.email || 'Anónimo'}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                                        className="p-2.5 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/30 rounded-xl text-rose-500 hover:text-white transition-all group/del"
                                        title="Eliminar de la galería"
                                    >
                                        <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.open(photo.image_url, '_blank'); }}
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
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No hay fotos en este evento</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Upload,
    Edit2,
    ArrowDownRight,
    CheckCircle2,
    Zap
} from 'lucide-react';
import { PREFERRED_PACK_ORDER, IDENTITIES } from '../../../lib/constants';

interface BrandingPanelProps {
    brandingConfig: any;
    setBrandingConfig: (config: any) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUpdateBranding: () => Promise<void>;
    isSavingBranding: boolean;
    toggleStylePreset: (style: string) => void;
    recentGlobalPhotos: any[];
    events: any[];
    setView: (view: 'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients') => void;
}

export const BrandingPanel: React.FC<BrandingPanelProps> = ({
    brandingConfig,
    setBrandingConfig,
    handleLogoUpload,
    handleUpdateBranding,
    isSavingBranding,
    toggleStylePreset,
    recentGlobalPhotos,
    events,
    setView
}) => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
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
                                disabled={isSavingBranding}
                                className={`w-full py-4 bg-white text-slate-900 text-[10px] font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] uppercase tracking-[3px] flex items-center justify-center gap-2 group ${isSavingBranding ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSavingBranding ? (
                                    <div className="size-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 className="size-4 group-hover:scale-110 transition-transform" />
                                )}
                                {isSavingBranding ? 'Sincronizando...' : 'Sincronizar Panel'}
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
                                    {brandingConfig.style_presets.slice(0, 4).map((style: string, i: number) => {
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
                                            <span className="text-sm">+</span>
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

                {/* Live Feed Component - Global Activity */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Zap className="size-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Global Live Feed</h4>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[2px]">Últimas capturas en tus eventos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setView('events')}
                            className="text-[9px] font-black text-[#135bec] uppercase tracking-widest hover:underline"
                        >
                            Ver todos los eventos
                        </button>
                    </div>

                    <div className="relative group/feed">
                        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-smooth">
                            {recentGlobalPhotos.length > 0 ? (
                                recentGlobalPhotos.map((photo, idx) => (
                                    <motion.div
                                        key={photo.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="min-w-[140px] md:min-w-[180px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-slate-900 shadow-xl relative group/item"
                                    >
                                        <img
                                            src={photo.image_url}
                                            alt="Recent"
                                            className="w-full h-full object-cover grayscale-[0.5] group-hover/item:grayscale-0 transition-all duration-500"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-0.5">
                                                {events.find(e => e.id === photo.event_id)?.event_name || 'Evento'}
                                            </p>
                                            <p className="text-[8px] font-bold text-white uppercase">
                                                Hace {Math.floor((Date.now() - new Date(photo.created_at).getTime()) / 60000)}m
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="w-full h-40 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600">
                                    <X className="size-8 mb-2 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[2px]">Esperando actividad...</p>
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0c0b]/50 to-transparent pointer-events-none opacity-0 group-hover/feed:opacity-100 transition-opacity"></div>
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0c0b]/50 to-transparent pointer-events-none opacity-0 group-hover/feed:opacity-100 transition-opacity"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

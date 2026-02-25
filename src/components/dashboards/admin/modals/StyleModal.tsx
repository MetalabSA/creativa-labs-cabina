import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StyleMetadata } from './types';

interface StyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (styleData: any) => Promise<void>;
    onDelete?: (styleId: string) => Promise<void>;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<string | null>;
    style: any | null; // Can be 'new' or a StyleMetadata object
    isSaving: boolean;
    stylesMetadata: StyleMetadata[];
    stats: { allGenerations: any[] };
}

export const StyleModal: React.FC<StyleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    onImageUpload,
    style,
    isSaving,
    stylesMetadata,
    stats
}) => {
    const isNew = style === 'new';

    const [formData, setFormData] = useState({
        id: '',
        label: '',
        category: '',
        subcategory: '',
        image_url: '',
        prompt: '',
        tags: [] as string[],
        is_premium: false,
        is_active: true
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && style) {
            if (isNew) {
                setFormData({
                    id: '',
                    label: '',
                    category: '',
                    subcategory: '',
                    image_url: '',
                    prompt: '',
                    tags: [],
                    is_premium: false,
                    is_active: true
                });
            } else {
                setFormData({
                    id: style.id || '',
                    label: style.label || '',
                    category: style.category || '',
                    subcategory: style.subcategory || '',
                    image_url: style.image_url || '',
                    prompt: style.prompt || '',
                    tags: Array.isArray(style.tags) ? style.tags : (style.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
                    is_premium: !!style.is_premium,
                    is_active: style.is_active !== false
                });
            }
        }
    }, [isOpen, style, isNew]);

    const handleInternalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploading(true);
        const url = await onImageUpload(e);
        if (url) {
            setFormData(prev => ({ ...prev, image_url: url }));
        }
        setUploading(false);
    };

    const handleSubmit = async () => {
        await onSave(formData);
    };

    const addTag = (tag: string) => {
        if (tag && !formData.tags.includes(tag)) {
            setFormData({ ...formData, tags: [...formData.tags, tag] });
        }
    };

    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl overflow-hidden">
            <div className="bg-[#0a0c0b] border border-[#1f2b24] rounded-[40px] w-full max-w-5xl max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                {/* Left Side: Preview */}
                <div className="w-full md:w-[35%] bg-white/5 p-8 flex flex-col items-center justify-start border-r border-[#1f2b24] relative overflow-y-auto no-scrollbar">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#13ec80] blur-[150px] rounded-full"></div>
                    </div>

                    <div className="relative z-10 w-full mb-8">
                        <div className="aspect-[4/5] rounded-[32px] overflow-hidden border-2 border-[#13ec80]/30 shadow-2xl relative group">
                            <img
                                src={
                                    !formData.image_url ? '/placeholder-style.jpg' :
                                        (formData.image_url.startsWith('http') || formData.image_url.startsWith('blob')) ? formData.image_url :
                                            (formData.image_url.startsWith('/') ? formData.image_url : `/${formData.image_url}`)
                                }
                                alt="Preview"
                                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ${uploading ? 'opacity-30' : 'opacity-60'} group-hover:opacity-100`}
                                onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    if (img.src.includes('placeholder')) return;
                                    img.src = '/placeholder-style.jpg';
                                }}
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-[#13ec80] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0b] via-transparent to-transparent opacity-80"></div>
                            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center">
                                <label className="w-12 h-12 bg-[#13ec80] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,128,0.4)] group/btn">
                                    <span className="material-symbols-outlined text-[#0a0c0b] group-hover:rotate-90 transition-transform">add_a_photo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleInternalImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-[10px] font-black text-[#13ec80] uppercase tracking-[4px] mb-2">Protocolo Activo</p>
                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{formData.label || 'Nueva Identidad'}</h4>
                        </div>
                    </div>

                    <div className="w-full space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Sync Status:</span>
                            <span className={uploading || isSaving ? "text-amber-400 animate-pulse" : "text-[#13ec80]"}>
                                {uploading || isSaving ? "PROCESANDO..." : "STANDBY"}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full bg-[#13ec80] transition-all duration-500 ${uploading || isSaving ? 'w-1/2 animate-pulse' : 'w-full opacity-50'}`}></div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex flex-col items-center">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic antialiased text-center">
                            IDENTITY PREVIEW MODULE <br />
                            <span className="text-[#13ec80]/40">V 1.5.0-STABLE</span>
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">
                                {isNew ? 'Initialize Protocol' : 'Sync Identity Data'}
                            </h3>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[3px] mt-1 text-center md:text-left">Sintonización de Red Neuronal</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-lg">close</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-[#13ec80] uppercase tracking-widest ml-1">Identity Handle (ID)</label>
                                <input
                                    className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                    value={formData.id}
                                    disabled={!isNew}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Visual Title</label>
                                <input
                                    className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] text-sm"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">System URL / Storage Path</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-[10px]"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                                <button
                                    onClick={() => {
                                        if (formData.image_url) {
                                            navigator.clipboard.writeText(formData.image_url);
                                            // showToast can be passed if needed, but for now we'll skip internal toasts
                                        }
                                    }}
                                    className="px-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-[#13ec80] transition-colors"
                                    title="Copiar URL"
                                >
                                    <span className="material-symbols-outlined !text-sm">content_copy</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Category (Pack)</label>
                                <input
                                    list="category-suggestions"
                                    className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] text-xs"
                                    placeholder="Escribir o seleccionar categoría..."
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                                <datalist id="category-suggestions">
                                    {Array.from(new Set(stylesMetadata.map(s => s.category).filter(Boolean).map(c => c.toLowerCase()))).map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Legacy Subcategory</label>
                                <input
                                    list="subcategory-suggestions"
                                    className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-[10px]"
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                />
                                <datalist id="subcategory-suggestions">
                                    {Array.from(new Set(stylesMetadata.filter(s => s.category?.toLowerCase() === formData.category?.toLowerCase()).map(s => s.subcategory).filter(Boolean))).map(sub => (
                                        <option key={sub} value={sub} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Visibility Toggles */}
                        <div className="bg-[#121413] border border-[#1f2b24] rounded-[24px] p-6 flex items-center justify-between group hover:border-[#13ec80]/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.is_active ? 'bg-[#13ec80]/10 text-[#13ec80]' : 'bg-slate-500/10 text-slate-500'}`}>
                                    <span className="material-symbols-outlined">{formData.is_active ? 'visibility' : 'visibility_off'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-black text-white uppercase tracking-widest block">Visibility Status</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{formData.is_active ? 'Active in application' : 'Hidden from users'}</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <div className="w-14 h-7 bg-white/5 border border-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#13ec80] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                            </label>
                        </div>

                        <div className="bg-[#121413] border border-[#1f2b24] rounded-[24px] p-6 flex items-center justify-between group hover:border-[#ff5500]/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#ff5500]/10 flex items-center justify-center text-[#ff5500]">
                                    <span className="material-symbols-outlined">workspace_premium</span>
                                </div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">Elevate to Premium Status (VIP Access Only)</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.is_premium}
                                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                                />
                                <div className="w-14 h-7 bg-white/5 border border-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ff5500] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <label className="text-[10px] font-black text-[#13ec80] uppercase tracking-widest ml-1 block mb-1 underline decoration-2 underline-offset-4">NEURO-CORE PROMPT (MASTER TEMPLATE)</label>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[2px]">Estructura base de la red neuronal</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-white leading-none">{formData.prompt?.split(/\s+/).filter(Boolean).length || 0} WORDS</p>
                                        <p className="text-[7px] font-bold text-slate-650 uppercase">Neural Load</p>
                                    </div>
                                    <div className="w-px h-6 bg-white/10" />
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-[#13ec80] leading-none">{formData.prompt?.length || 0} CHARS</p>
                                        <p className="text-[7px] font-bold text-slate-650 uppercase">Capacity</p>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Studio Area */}
                            <div className="relative group/prompt">
                                <textarea
                                    className="w-full bg-[#0a0c0b] border-2 border-[#1f2b24] group-hover/prompt:border-[#13ec80]/30 rounded-[32px] px-8 py-7 text-white outline-none focus:border-[#13ec80] text-sm leading-relaxed min-h-[160px] resize-none font-mono shadow-inner transition-all placeholder:text-slate-800"
                                    placeholder="Inject system instructions here..."
                                    value={formData.prompt}
                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                />
                                <div className="absolute right-6 top-6 opacity-20 group-hover/prompt:opacity-100 transition-opacity">
                                    <div className="size-2 rounded-full bg-[#13ec80] animate-pulse"></div>
                                </div>
                            </div>

                            {/* Prompt Helpers */}
                            <div className="bg-[#121413]/50 border border-[#1f2b24] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined !text-[14px] text-[#13ec80]">bolt</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural Boosters (Inject Tokens)</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Photorealistic', token: 'hyper-realistic, photorealistic, 8k resolution, highly detailed' },
                                        { label: 'Cinematic', token: 'cinematic lighting, dramatic shadows, professional photography' },
                                        { label: 'Sharp Focus', token: 'sharp focus, masterpiece, intricate details' },
                                        { label: 'Digital Art', token: 'concept art, matte painting, trending on artstation' },
                                        { label: 'Analog Style', token: '35mm film grain, analog photography, retro vintage feel' }
                                    ].map((booster) => (
                                        <button
                                            key={booster.label}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.prompt || '';
                                                const separator = current && !current.endsWith(',') && !current.endsWith(', ') ? ', ' : '';
                                                setFormData({ ...formData, prompt: current + separator + booster.token });
                                            }}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest hover:border-[#13ec80] hover:text-[#13ec80] transition-all"
                                        >
                                            {booster.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity for THIS style */}
                        {!isNew && (
                            <div className="space-y-4 pt-4 border-t border-[#1f2b24]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Real-World Outcomes (Recent Captures)</label>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[2px]">Previsualización de ejecuciones reales con esta identidad</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Live Feed</span>
                                        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {stats.allGenerations
                                        .filter(g => g.style_id === style.id)
                                        .slice(0, 4)
                                        .map((gen, idx) => (
                                            <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-slate-900 group/outcome relative">
                                                <img
                                                    src={gen.image_url}
                                                    className="w-full h-full object-cover grayscale group-hover/outcome:grayscale-0 transition-all duration-700"
                                                    alt="Outcome"
                                                />
                                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/outcome:opacity-100 transition-opacity"></div>
                                                <div className="absolute bottom-1 right-1 opacity-0 group-hover/outcome:opacity-100 transition-opacity">
                                                    <button onClick={() => window.open(gen.image_url, '_blank')} className="p-1 bg-black/60 rounded-md text-white">
                                                        <span className="material-symbols-outlined !text-[12px]">open_in_new</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {stats.allGenerations.filter(g => g.style_id === style.id).length === 0 && (
                                        <div className="col-span-4 h-24 rounded-2xl border border-dashed border-[#1f2b24] flex items-center justify-center">
                                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[2px]">No hay ejecuciones recientes detectadas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tactical Tags</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                        {tag.trim()}
                                        <button onClick={() => removeTag(tag)} className="text-slate-600 hover:text-white transition-colors">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80]"
                                    id="new-tag-modal-input"
                                    placeholder="Add tactical label..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const input = e.target as HTMLInputElement;
                                            addTag(input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('new-tag-modal-input') as HTMLInputElement;
                                        addTag(input.value.trim());
                                        input.value = '';
                                    }}
                                    className="bg-white/5 border border-white/10 text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 flex gap-4">
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving || uploading}
                                className="flex-1 py-6 bg-gradient-to-r from-orange-600 to-[#ff5500] text-white font-black rounded-[32px] text-xs tracking-[4px] shadow-[0_20px_40px_rgba(255,85,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase italic disabled:opacity-50"
                            >
                                {isSaving ? 'Sincronizando...' : 'Finalize Protocol Sync'}
                            </button>
                            {!isNew && onDelete && (
                                <button
                                    onClick={() => onDelete(formData.id)}
                                    className="px-6 border border-red-500/30 text-red-500 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500/10 transition-all"
                                    disabled={isSaving || uploading}
                                >
                                    Purge
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="aspect-square w-16 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center text-slate-500 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined">query_stats</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

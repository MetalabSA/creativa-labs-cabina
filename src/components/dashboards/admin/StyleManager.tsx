import React from 'react';
import { Search } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface StyleMetadata {
    id: string;
    label: string;
    category?: string;
    subcategory?: string;
    is_premium?: boolean;
    is_active?: boolean;
    usage_count?: number;
    prompt?: string;
    tags?: any;
    image_url?: string;
}

interface StyleManagerProps {
    stylesMetadata: any[];
    setEditingStyle: (style: any) => void;
    fetchData: () => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StyleManager: React.FC<StyleManagerProps> = ({
    stylesMetadata,
    setEditingStyle,
    fetchData,
    showToast
}) => {
    const [styleSearchQuery, setStyleSearchQuery] = React.useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState('all');
    const [loading, setLoading] = React.useState(false);

    const handleCategoryToggle = async (category: string) => {
        const stylesInCat = stylesMetadata.filter(s => s.category?.toLowerCase() === category.toLowerCase());
        const targetActive = !stylesInCat.every(s => s.is_active);

        try {
            setLoading(true);
            const { error: updateError } = await (window as any).supabase
                .from('styles_metadata')
                .update({ is_active: targetActive })
                .ilike('category', category);
            if (updateError) throw updateError;

            const { error: upsertError } = await (window as any).supabase
                .from('styles_metadata')
                .upsert({
                    id: category.toLowerCase(),
                    is_active: targetActive,
                    category: category
                }, { onConflict: 'id' });
            if (upsertError) throw upsertError;

            showToast(`Categoría ${targetActive ? 'activada' : 'ocultada'} correctamente`);
            fetchData();
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategoryToggle = async (sub: string, category: string) => {
        const stylesInSub = stylesMetadata.filter(s => s.subcategory === sub && s.category?.toLowerCase() === category.toLowerCase());
        const targetActive = !stylesInSub.every(s => s.is_active);

        try {
            setLoading(true);
            const { error: updateError } = await (window as any).supabase
                .from('styles_metadata')
                .update({ is_active: targetActive })
                .eq('subcategory', sub)
                .ilike('category', category);
            if (updateError) throw updateError;

            const { error: upsertError } = await (window as any).supabase
                .from('styles_metadata')
                .upsert({
                    id: sub.toLowerCase(),
                    is_active: targetActive,
                    subcategory: sub,
                    category: category
                }, { onConflict: 'id' });
            if (upsertError) throw upsertError;

            showToast(`Subcategoría ${targetActive ? 'activada' : 'ocultada'} correctamente`);
            fetchData();
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStyle = async (style: StyleMetadata) => {
        if (confirm(`🚨 PURGA CRÍTICA: ¿Estás seguro de eliminar "${style.id}" definitivamente?`)) {
            try {
                setLoading(true);
                await Promise.all([
                    (window as any).supabase.from('styles_metadata').delete().eq('id', style.id),
                    (window as any).supabase.from('identity_prompts').delete().eq('id', style.id)
                ]);
                showToast('Identidad purgada del sistema');
                fetchData();
            } catch (err: any) {
                showToast('Error al purgar: ' + err.message, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Identity Repository <span className="text-[#13ec80]">({stylesMetadata.length})</span></h2>
                    <p className="text-slate-500 text-sm">Protocolo de gestión de identidades y mallas IA Maestro</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar identidad..."
                            value={styleSearchQuery}
                            onChange={(e) => setStyleSearchQuery(e.target.value)}
                            className="bg-[#121413] border border-[#1f2b24] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#13ec80] outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingStyle('new');
                        }}
                        className="bg-[#13ec80] text-[#0a0c0b] px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                    >
                        <span className="material-symbols-outlined">add_box</span> Nueva Identidad
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['all', ...Array.from(new Set(stylesMetadata.map(s => s.category?.toLowerCase()).filter(Boolean)))].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat!)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategoryFilter === cat
                                ? 'bg-[#13ec80] text-black shadow-[0_0_15px_rgba(19,236,128,0.3)]'
                                : 'bg-white/5 text-slate-500 border border-white/10 hover:border-white/20'
                                }`}
                        >
                            {cat === 'all' ? 'Todas / All' : cat}
                        </button>
                    ))}
                </div>

                {/* Bulk Actions for Selected Category */}
                {selectedCategoryFilter !== 'all' && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 animate-in zoom-in-95 duration-300">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grupo {selectedCategoryFilter}:</span>
                        <button
                            onClick={() => handleCategoryToggle(selectedCategoryFilter)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${stylesMetadata.filter(s => s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active)
                                ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/30 hover:bg-[#13ec80]/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20'
                                }`}
                        >
                            <span className="material-symbols-outlined !text-sm">
                                {stylesMetadata.filter(s => s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active) ? 'visibility' : 'visibility_off'}
                            </span>
                            {stylesMetadata.filter(s => s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active) ? 'Hide Category' : 'Show Category'}
                        </button>
                    </div>
                )}
            </div>

            {/* Subcategory Bar (Dynamic) */}
            {selectedCategoryFilter !== 'all' && (
                <div className="flex flex-wrap items-center gap-4 mb-8 pl-4 border-l-2 border-[#13ec80]/20 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {Array.from(new Set(stylesMetadata.filter(s => s.category?.toLowerCase() === selectedCategoryFilter).map(s => s.subcategory).filter(Boolean))).map(sub => (
                            <button
                                key={sub}
                                className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/10 hover:border-[#13ec80]/30 transition-all flex items-center gap-2 group/sub"
                            >
                                {sub}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubcategoryToggle(sub!, selectedCategoryFilter);
                                    }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${stylesMetadata.filter(s => s.subcategory === sub && s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active)
                                        ? 'bg-[#13ec80]/10 text-[#13ec80] hover:bg-[#13ec80]/20'
                                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        }`}
                                    title={stylesMetadata.filter(s => s.subcategory === sub && s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active) ? 'Ocultar Subcategoría' : 'Mostrar Subcategoría'}
                                >
                                    <span className="material-symbols-outlined !text-[12px]">
                                        {stylesMetadata.filter(s => s.subcategory === sub && s.category?.toLowerCase() === selectedCategoryFilter).every(s => s.is_active) ? 'visibility' : 'visibility_off'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stylesMetadata
                    .filter(s => {
                        const matchesSearch = (s.label || '').toLowerCase().includes(styleSearchQuery.toLowerCase()) ||
                            (s.id || '').toLowerCase().includes(styleSearchQuery.toLowerCase());
                        const matchesCat = selectedCategoryFilter === 'all' || s.category?.toLowerCase() === selectedCategoryFilter;
                        return matchesSearch && matchesCat;
                    })
                    .map(style => (
                        <div
                            key={style.id}
                            className="bg-[#121413] border border-[#1f2b24] rounded-[32px] overflow-hidden group hover:border-[#13ec80]/50 transition-all cursor-pointer relative"
                        >
                            {/* Purge Button (Direct) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStyle(style);
                                }}
                                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                title="Purgar Identidad"
                            >
                                <span className="material-symbols-outlined !text-sm">delete_forever</span>
                            </button>

                            <div onClick={() => {
                                setEditingStyle(style);
                            }}>
                                {/* Preview Image */}
                                <div className="aspect-[4/5] relative overflow-hidden">
                                    <img
                                        src={
                                            !style.image_url ? '/placeholder-style.jpg' :
                                                (style.image_url.startsWith('http') || style.image_url.startsWith('blob')) ? style.image_url :
                                                    (style.image_url.startsWith('/') ? style.image_url : `/${style.image_url}`)
                                        }
                                        alt={style.label}
                                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${style.is_active === false ? 'grayscale brightness-50 opacity-40' : 'opacity-60 group-hover:opacity-100'}`}
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            if (img.src.includes('placeholder')) return;
                                            img.src = '/placeholder-style.jpg';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0b] via-transparent to-transparent opacity-90 group-hover:opacity-40 transition-opacity"></div>

                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {style.is_premium && (
                                            <span className="bg-[#ff5500] text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">Premium</span>
                                        )}
                                        {style.is_active === false && (
                                            <span className="bg-slate-600 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[10px]">visibility_off</span>
                                                Hidden
                                            </span>
                                        )}
                                        <span className="bg-[#1f2b24]/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border border-white/10">
                                            {style.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 absolute bottom-0 left-0 right-0">
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1 group-hover:text-[#13ec80] transition-colors">{style.label}</h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic opacity-60 group-hover:opacity-100 transition-opacity">
                                        "{style.prompt || 'Sin prompt definido...'}"
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            SUB: {style.subcategory || 'General'}
                                        </span>
                                        <span className="material-symbols-outlined !text-sm text-slate-600">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

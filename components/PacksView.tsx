import React, { useMemo } from 'react';
import { ChevronLeft, Lock, Unlock, Sparkles, Zap } from 'lucide-react';

interface PacksViewProps {
    onBack: () => void;
    identities: any[];
    unlockedPacks: string[];
    userCredits: number;
    onUnlock: (packId: string, price: number) => void;
    isUnlocking: boolean;
}

const PREMIUM_PACK_PRICE = 3000;

export const PacksView: React.FC<PacksViewProps> = ({
    onBack,
    identities,
    unlockedPacks = [],
    userCredits,
    onUnlock,
    isUnlocking
}) => {

    const packs = useMemo(() => {
        const packMap = new Map();
        identities.forEach(id => {
            if (!packMap.has(id.subCategory)) {
                packMap.set(id.subCategory, {
                    id: id.subCategory,
                    title: id.subCategory,
                    preview: id.url,
                    count: 0
                });
            }
            packMap.get(id.subCategory).count++;
        });
        return Array.from(packMap.values());
    }, [identities]);

    const handleUnlockClick = (packId: string) => {
        onUnlock(packId, PREMIUM_PACK_PRICE);
    };

    return (
        <div className="w-full max-w-7xl mx-auto pt-32 px-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Volver</span>
                </button>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tienda de Packs</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => {
                    const isUnlocked = unlockedPacks.includes(pack.id);
                    const canAfford = userCredits >= PREMIUM_PACK_PRICE;

                    return (
                        <div
                            key={pack.id}
                            className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300"
                        >
                            {/* Preview Image */}
                            <div className="h-48 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                                <img
                                    src={pack.preview}
                                    alt={pack.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />

                                {isUnlocked ? (
                                    <div className="absolute top-4 right-4 z-20 bg-green-500/20 backdrop-blur-md border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                                        <Unlock className="w-3 h-3" />
                                        Adquirido
                                    </div>
                                ) : (
                                    <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 text-white/60 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                                        <Lock className="w-3 h-3" />
                                        Premium
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 relative z-20">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{pack.title}</h3>
                                        <p className="text-white/40 text-sm">{pack.count} Estilos incluidos</p>
                                    </div>
                                </div>

                                {!isUnlocked ? (
                                    <button
                                        onClick={() => handleUnlockClick(pack.id)}
                                        disabled={!canAfford || isUnlocking}
                                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${canAfford
                                                ? 'bg-white text-black hover:bg-accent hover:text-white'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                                            }`}
                                    >
                                        {isUnlocking ? (
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Desbloquear</span>
                                                <div className="flex items-center gap-1 text-xs opacity-50 ml-2 border-l border-black/20 pl-2">
                                                    <Zap className="w-3 h-3" />
                                                    {PREMIUM_PACK_PRICE}
                                                </div>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-4 rounded-xl font-black uppercase tracking-widest bg-white/5 text-green-400 opacity-50 flex items-center justify-center gap-2 cursor-default"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Disponible
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CheckCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

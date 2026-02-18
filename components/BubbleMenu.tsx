import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, Shield, LayoutGrid, Heart, History,
    ShoppingBag, Settings, HelpCircle, LogOut, ChevronDown, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface BubbleMenuProps {
    user: any;
    profile: any;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    categories: { id: string, label: string }[];
    currentView: string;
}

export const BubbleMenu: React.FC<BubbleMenuProps> = ({
    user,
    profile,
    onNavigate,
    onLogout,
    categories,
    currentView
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCategories, setShowCategories] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleNav = (view: string) => {
        onNavigate(view);
        setIsOpen(false);
    };

    return (
        <>
            <div className="fixed top-6 inset-x-0 z-[200] flex justify-center md:justify-end md:pr-12 px-4 pointer-events-none">
                <div className="pointer-events-auto relative">
                    <motion.div
                        layout
                        className={clsx(
                            "bg-black/60 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden",
                            isOpen ? "rounded-[32px] w-[320px]" : "rounded-full w-auto"
                        )}
                        initial={{ borderRadius: 50 }}
                        animate={{
                            width: isOpen ? 320 : 'auto',
                            borderRadius: isOpen ? 32 : 999
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Top Bar (Always Visible-ish logic, but strictly inside the bubble) */}
                        <div className="flex items-center justify-between p-3 gap-4">
                            {/* Logo / Brand Area */}
                            <div
                                className={clsx("flex items-center gap-3 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-100")}
                                onClick={() => !isOpen && toggleMenu()}
                            >
                                <div className="w-10 h-10 bg-gradient-to-tr from-accent to-purple-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 cursor-pointer">
                                    <span className="font-black italic text-white text-lg">C</span>
                                </div>

                                {/* Collapsed Info - Only show when closed */}
                                {!isOpen && (
                                    <div className="flex flex-col pr-4 cursor-pointer" onClick={toggleMenu}>
                                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Créditos</span>
                                        <span className="text-sm font-black text-white leading-none">
                                            {profile?.is_master ? '∞' : profile?.credits || 0}
                                        </span>
                                    </div>
                                )}

                                {/* Expanded User Info */}
                                {isOpen && (
                                    <div className="flex flex-col">
                                        <span className="text- font-bold text-white leading-tight">Hola, {user.email?.split('@')[0]}</span>
                                        <span className="text-[10px] text-accent font-black uppercase tracking-wider">
                                            {profile?.is_master ? 'Master Admin' : `${profile?.credits} Créditos`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Toggle Button */}
                            <button
                                onClick={toggleMenu}
                                className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                            >
                                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Expanded Menu Content */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-6"
                                >
                                    <div className="space-y-2 mt-4">

                                        {/* Dashboard (Admin) */}
                                        {profile?.is_master && (
                                            <MenuItem
                                                icon={Shield}
                                                label="Dashboard"
                                                onClick={() => handleNav('admin')}
                                                active={currentView === 'admin'}
                                                highlight
                                            />
                                        )}

                                        {/* Categories Dropdown */}
                                        <div className="overflow-hidden rounded-xl bg-white/5 border border-white/5">
                                            <button
                                                onClick={() => setShowCategories(!showCategories)}
                                                className="w-full flex items-center justify-between p-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <LayoutGrid className="w-4 h-4 text-white/70" />
                                                    <span>Categorías</span>
                                                </div>
                                                <ChevronDown className={clsx("w-4 h-4 transition-transform", showCategories && "rotate-180")} />
                                            </button>

                                            <AnimatePresence>
                                                {showCategories && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 'auto' }}
                                                        exit={{ height: 0 }}
                                                        className="bg-black/20"
                                                    >
                                                        <div className="p-2 space-y-1">
                                                            {/* Favorites & My Photos inside Categories as requested, or top level? Request said "Tambien pondriamos una categoria de FAVORITOS, y 'Mis Fotos'" inside Categories */}

                                                            {categories.map(cat => (
                                                                <SubMenuItem
                                                                    key={cat.id}
                                                                    label={cat.label}
                                                                    onClick={() => handleNav(`category_${cat.id}`)}
                                                                />
                                                            ))}
                                                            <div className="h-px bg-white/10 my-1" />
                                                            <SubMenuItem
                                                                label="Mis Favoritos"
                                                                icon={Heart}
                                                                onClick={() => handleNav('favorites')}
                                                                className="text-pink-400 hover:text-pink-300"
                                                            />
                                                            <SubMenuItem
                                                                label="Mis Fotos"
                                                                icon={History}
                                                                onClick={() => handleNav('history')}
                                                                className="text-blue-400 hover:text-blue-300"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>



                                        <MenuItem
                                            icon={Sparkles}
                                            label="Comprar Créditos"
                                            onClick={() => handleNav('buy_credits')}
                                            highlight={true}
                                        />

                                        <MenuItem
                                            icon={ShoppingBag}
                                            label="Packs"
                                            onClick={() => handleNav('packs')}
                                            active={currentView === 'packs'}
                                        />

                                        <MenuItem
                                            icon={Settings}
                                            label="Ajustes"
                                            onClick={() => handleNav('settings')}
                                            active={currentView === 'settings'}
                                        />

                                        <MenuItem
                                            icon={HelpCircle}
                                            label="Soporte"
                                            onClick={() => handleNav('support')}
                                            active={currentView === 'support'}
                                        />

                                        <div className="h-px bg-white/10 my-2" />

                                        <button
                                            onClick={onLogout}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Cerrar Sesión</span>
                                        </button>

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div >
            </div >
        </>
    );
};

const MenuItem = ({ icon: Icon, label, onClick, active, highlight }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all group",
            active ? "bg-accent text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
            highlight && !active && "bg-gradient-to-r from-accent/20 to-transparent border border-accent/20 text-accent"
        )}
    >
        <Icon className={clsx("w-4 h-4", active ? "text-white" : "text-white/70 group-hover:text-white")} />
        <span>{label}</span>
    </button>
);

const SubMenuItem = ({ label, onClick, icon: Icon, className }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium pl-9 text-white/60 hover:bg-white/10 hover:text-white transition-colors",
            className
        )}
    >
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
    </button>
);

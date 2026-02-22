import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search } from 'lucide-react';
import { IDENTITIES } from '../../lib/constants';
import Background3D from '../Background3D';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface Partner {
    id: string;
    name?: string;
    business_name?: string;
    company_name?: string;
    contact_email: string;
    contact_phone?: string;
    is_active?: boolean;
    eventCount?: number;
    activeEvents?: number;
    credits_total: number;
    credits_used: number;
    config?: any;
    user_id?: string;
    is_from_profile?: boolean;
}

interface UserProfile {
    id: string;
    email: string;
    credits: number;
    total_generations: number;
    role: string;
    unlocked_packs?: string[];
    full_name?: string;
    created_at?: string;
}

interface AdminProps {
    onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
    const [view, setView] = useState<'overview' | 'partners' | 'b2c' | 'styles' | 'logs' | 'settings'>('overview');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [b2cUsers, setB2CUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePartner, setShowCreatePartner] = useState(false);
    const [showTopUp, setShowTopUp] = useState<{ id: string, name: string } | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(1000);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [b2cSearchQuery, setB2CSearchQuery] = useState('');
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        credits: 1000,
        packs: ''
    });
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalPartners: 0,
        totalCreditsSold: 0,
        activeEvents: 0
    });
    const [b2cStats, setB2CStats] = useState({
        totalUsers: 0,
        totalB2CCredits: 0,
        totalB2CGenerations: 0,
        topStyles: [] as { id: string, count: number, label: string }[],
        recentTransactions: [] as any[]
    });
    const [partnerStats, setPartnerStats] = useState({
        totalPartners: 0,
        totalEvents: 0,
        creditsInCirculation: 0,
        avgConsumptionRate: 0,
        topPartners: [] as any[]
    });
    const [editingStyle, setEditingStyle] = useState<any | null>(null);
    const [styleForm, setStyleForm] = useState({
        id: '',
        label: '',
        category: '',
        subcategory: '',
        image_url: '',
        prompt: '',
        tags: '' as string | string[],
        is_premium: false,
        usage_count: 0,
        is_active: true
    });

    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [partnerForm, setPartnerForm] = useState({
        name: '',
        company_name: '',
        contact_email: '',
        contact_phone: '',
        is_active: true
    });
    const [isSavingPartner, setIsSavingPartner] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
        message: '',
        type: null
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 4000);
    };
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stylesMetadata, setStylesMetadata] = useState<any[]>([]);
    const [styleSearchQuery, setStyleSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // New Partner Form
    const [newPartner, setNewPartner] = useState({
        name: '',
        email: '',
        password: '',
        initialCredits: 1000
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [partnersRes, eventsRes, profilesRes, generationsRes, stylesRes, promptsRes] = await Promise.all([
                supabase.from('partners').select('*'),
                supabase.from('events').select('*'),
                supabase.from('profiles').select('*'),
                supabase.from('generations').select('id, created_at, model_id, event_id, events(event_name)').order('created_at', { ascending: false }),
                supabase.from('styles_metadata').select('*'),
                supabase.from('identity_prompts').select('*')
            ]);

            if (partnersRes.error) throw partnersRes.error;
            if (profilesRes.error) throw profilesRes.error;

            const partnersFromTable = partnersRes.data || [];
            const profilesData = profilesRes.data || [];
            const eventsData = eventsRes.data || [];
            const generationsData = generationsRes.data || [];

            // --- MERGE PARTNERS LOGIC ---
            // We take everything from the 'partners' table as primary
            // But we also look for any profile with role: 'partner' that isn't in that table yet
            const extraPartnersFromProfiles = profilesData
                .filter(p => p.role === 'partner')
                .filter(p => !partnersFromTable.some(pd => pd.contact_email?.toLowerCase() === p.email?.toLowerCase() || pd.user_id === p.id))
                .map(p => ({
                    id: p.id,
                    name: p.full_name || p.email.split('@')[0],
                    business_name: p.full_name,
                    contact_email: p.email,
                    credits_total: p.credits || 0,
                    credits_used: p.total_generations || 0,
                    user_id: p.id,
                    is_from_profile: true
                }));

            const finalPartners = [...partnersFromTable, ...extraPartnersFromProfiles].map(p => {
                const partnerEvents = eventsData.filter(e => e.partner_id === p.id);
                return {
                    ...p,
                    eventCount: partnerEvents.length,
                    activeEvents: partnerEvents.filter(e => e.is_active).length
                };
            });
            setPartners(finalPartners);

            const b2cUsersData = profilesData.filter(p => p.role === 'user' || !p.role);
            setB2CUsers(b2cUsersData);

            // --- MERGE LOGIC ---
            const dbStyles = stylesRes?.data || [];
            const dbPrompts = promptsRes?.data || [];
            const styleMap = new Map();

            // 1. Process Static IDENTITIES (Base)
            IDENTITIES.forEach(staticStyle => {
                const dbStyle = dbStyles.find(s => s.id === staticStyle.id);
                const dbPrompt = dbPrompts.find(p => p.id === staticStyle.id);
                const subCatMeta = dbStyles.find(m => m.id?.toLowerCase() === staticStyle.subCategory?.toLowerCase());
                const catMeta = dbStyles.find(m => m.id?.toLowerCase() === staticStyle.category?.toLowerCase());

                let isInheritedInactive = (catMeta?.is_active === false) || (subCatMeta?.is_active === false);

                styleMap.set(staticStyle.id, {
                    id: staticStyle.id,
                    label: dbStyle?.label || staticStyle.title,
                    category: dbStyle?.category || staticStyle.category,
                    subcategory: dbStyle?.subcategory || staticStyle.subCategory,
                    image_url: dbStyle?.image_url || staticStyle.url,
                    prompt: dbPrompt?.master_prompt || '',
                    tags: dbStyle?.tags || staticStyle.tags || [],
                    is_premium: dbStyle?.is_premium ?? staticStyle.isPremium,
                    usage_count: dbStyle?.usage_count || 0,
                    is_active: isInheritedInactive ? false : (dbStyle?.is_active ?? true),
                    source: 'static'
                });
            });

            // 2. Add DB Styles that are NOT in static list
            dbStyles.forEach(dbStyle => {
                if (!dbStyle.label && !dbStyle.image_url) return;
                if (!styleMap.has(dbStyle.id)) {
                    const dbPrompt = dbPrompts.find(p => p.id === dbStyle.id);
                    const subCatMeta = dbStyles.find(m => m.id?.toLowerCase() === dbStyle.subcategory?.toLowerCase());
                    const catMeta = dbStyles.find(m => m.id?.toLowerCase() === dbStyle.category?.toLowerCase());
                    let isInheritedInactive = (catMeta?.is_active === false) || (subCatMeta?.is_active === false);

                    styleMap.set(dbStyle.id, {
                        id: dbStyle.id,
                        label: dbStyle.label || dbStyle.id,
                        category: dbStyle.category || 'General',
                        subcategory: dbStyle.subcategory || 'General',
                        image_url: dbStyle.image_url || '/placeholder-style.jpg',
                        prompt: dbPrompt?.master_prompt || '',
                        tags: dbStyle.tags || [],
                        is_premium: dbStyle.is_premium || false,
                        usage_count: dbStyle.usage_count || 0,
                        is_active: isInheritedInactive ? false : (dbStyle.is_active ?? true),
                        source: 'db_metadata'
                    });
                }
            });

            const finalStyles = Array.from(styleMap.values()).filter(s => {
                const excludeKeywords = ['magia', 'urbano', 'superhéroes', 'series', 'sports', 'general', 'legacy', 'all', 'fantasy', 'cinema', 'f1', 'formula 1'];
                const isLikelyCategory = excludeKeywords.includes(s.id.toLowerCase()) ||
                    excludeKeywords.includes((s.label || '').toLowerCase());
                return s.id && !isLikelyCategory;
            });

            setStylesMetadata(finalStyles);

            // Calculate Stats
            const totalCredits = finalPartners.reduce((acc, curr) => acc + (curr.credits_total || 0), 0);
            const partnerUsageTotal = finalPartners.reduce((acc, curr) => acc + (curr.credits_used || 0), 0);
            const b2cUsageTotal = b2cUsersData.reduce((acc, curr) => acc + (curr.total_generations || 0), 0);
            const totalGenerationsGlobal = partnerUsageTotal + b2cUsageTotal;
            const activeEventsCount = eventsData.filter(e => e.is_active).length || 0;

            setStats({
                totalGenerations: totalGenerationsGlobal,
                totalPartners: finalPartners.length,
                totalCreditsSold: totalCredits,
                activeEvents: activeEventsCount
            });

            const totalB2CCredits = b2cUsersData.reduce((acc, curr) => acc + (curr.credits || 0), 0);
            const totalB2CGenerations = b2cUsageTotal;

            const styleCounts: Record<string, number> = {};
            generationsData.forEach((g: any) => {
                if (g.model_id) {
                    styleCounts[g.model_id] = (styleCounts[g.model_id] || 0) + 1;
                }
            });

            const topStyles = Object.entries(styleCounts)
                .map(([id, count]) => ({ id, count, label: id }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setB2CStats({
                totalUsers: b2cUsersData.length,
                totalB2CCredits,
                totalB2CGenerations,
                topStyles,
                recentTransactions: generationsData.slice(0, 5)
            });

            const consumptionRate = totalCredits > 0 ? (partnerUsageTotal / totalCredits) * 100 : 0;

            setPartnerStats({
                totalPartners: finalPartners.length,
                totalEvents: eventsData.length,
                creditsInCirculation: totalCredits - partnerUsageTotal,
                avgConsumptionRate: consumptionRate,
                topPartners: [...finalPartners].sort((a, b) => (b.eventCount || 0) - (a.eventCount || 0)).slice(0, 5)
            });

            setRecentLogs(generationsData.slice(0, 10).map((g: any) => ({
                id: g.id,
                type: 'success',
                title: g.model_id ? `Generación: ${g.model_id}` : 'Generación Exitosa',
                text: g.event_id ? `Evento: ${g.events?.event_name}` : 'Usuario B2C',
                time: new Date(g.created_at).toLocaleTimeString()
            })));

        } catch (error: any) {
            console.error('Error fetching data:', error);
            showToast('Error al cargar datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            setIsSavingUser(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    credits: Number(editingUser.credits),
                    unlocked_packs: editingUser.unlocked_packs,
                    role: editingUser.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            showToast('Usuario actualizado correctamente');
            setEditingUser(null);
            fetchData();
        } catch (error: any) {
            console.error('Error updating user:', error);
            showToast('Error al actualizar usuario: ' + error.message, 'error');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSavingUser(true);

            const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', newUserForm.email).maybeSingle();

            if (existingUser) {
                showToast('Este usuario ya existe en la base de datos.', 'info');
                setIsSavingUser(false);
                return;
            }

            const { error: profError } = await supabase.from('profiles').insert({
                email: newUserForm.email.toLowerCase(),
                credits: Number(newUserForm.credits),
                unlocked_packs: newUserForm.packs.split(',').map(p => p.trim()).filter(p => p),
                role: 'user'
            });

            if (profError) throw profError;

            showToast('Usuario B2C creado correctamente.');
            setShowNewUserModal(false);
            setNewUserForm({ email: '', credits: 1000, packs: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            showToast('Error al crear usuario: ' + (error as any).message, 'error');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // 1. Check if user already exists in profiles
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', newPartner.email.toLowerCase())
                .maybeSingle();

            let targetUserId = existingProfile?.id;

            if (!targetUserId) {
                // Create Auth User ONLY if they don't exist
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: newPartner.email.toLowerCase(),
                    password: newPartner.password || 'Partner123!',
                });

                if (authError) throw authError;
                targetUserId = authData.user?.id;
            }

            if (!targetUserId) throw new Error("No se pudo obtener o crear el ID del usuario");

            // 2. Update Profile Role (Promote if existed, or set if new)
            await supabase.from('profiles').upsert({
                id: targetUserId,
                email: newPartner.email.toLowerCase(),
                role: 'partner',
                full_name: newPartner.name
            }, { onConflict: 'id' });

            // 3. Create Partner Entry
            const partnerObj: any = {
                business_name: newPartner.name,
                name: newPartner.name,
                contact_email: newPartner.email.toLowerCase(),
                user_id: targetUserId,
                credits_total: Number(newPartner.initialCredits),
                credits_used: 0
            };

            const { error: partError } = await supabase
                .from('partners')
                .insert(partnerObj);

            if (partError) {
                // If it fails because partner already exists in partner table, we just update it
                if (partError.code === '23505') {
                    await supabase.from('partners')
                        .update(partnerObj)
                        .eq('contact_email', newPartner.email.toLowerCase());
                } else {
                    throw partError;
                }
            }

            showToast('Partner creado con éxito.');
            setShowCreatePartner(false);
            setNewPartner({ name: '', email: '', password: '', initialCredits: 1000 });
            fetchData();
        } catch (error: any) {
            console.error('Error creating partner:', error);
            showToast('Error al crear partner: ' + (error.message || 'Error desconocido'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePartnerSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPartner) return;

        try {
            setIsSavingPartner(true);
            const { error } = await supabase
                .from('partners')
                .update({
                    name: partnerForm.name,
                    company_name: partnerForm.company_name,
                    business_name: partnerForm.company_name,
                    contact_email: partnerForm.contact_email,
                    contact_phone: partnerForm.contact_phone,
                    is_active: partnerForm.is_active
                })
                .eq('id', editingPartner.id);

            if (error) throw error;

            showToast('Partner actualizado con éxito');
            setEditingPartner(null);
            fetchData();
        } catch (error: any) {
            console.error('Error updating partner:', error);
            showToast('Error al actualizar partner: ' + error.message, 'error');
        } finally {
            setIsSavingPartner(false);
        }
    };

    const handleDeletePartner = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas dar de baja este partner? Esta acción desactivará su acceso.')) return;

        try {
            setIsSavingPartner(true);
            // Instead of deleting, we deactivate by default as requested (dar de baja)
            const { error } = await supabase
                .from('partners')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;

            showToast('Partner desactivado correctamente');
            fetchData();
        } catch (error: any) {
            console.error('Error deactivating partner:', error);
            showToast('Error al desactivar partner: ' + error.message, 'error');
        } finally {
            setIsSavingPartner(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${styleForm.id || 'new'}-${Date.now()}.${fileExt}`;
            const filePath = `styles/${fileName}`;

            // --- STRATEGY: Try multiple buckets in order of probability ---
            const buckets = ['public', 'styles', 'logos', 'generations'];
            let uploadSuccess = false;
            let finalPublicUrl = '';
            let lastError = '';

            for (const bucket of buckets) {
                try {
                    // Try with folder
                    const { data, error: uploadError } = await supabase.storage
                        .from(bucket)
                        .upload(filePath, file, { upsert: true });

                    if (!uploadError && data) {
                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(filePath);

                        finalPublicUrl = publicUrl;
                        uploadSuccess = true;
                        break;
                    }

                    // Try without folder (root)
                    const { data: rootData, error: rootError } = await supabase.storage
                        .from(bucket)
                        .upload(fileName, file, { upsert: true });

                    if (!rootError && rootData) {
                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(fileName);

                        finalPublicUrl = publicUrl;
                        uploadSuccess = true;
                        break;
                    }

                    if (uploadError) lastError = uploadError.message;
                } catch (e: any) {
                    lastError = e.message;
                }
            }

            if (!uploadSuccess) {
                showToast(`Falla de Almacenamiento: ${lastError || 'Buckets no encontrados'}. Por favor creá el bucket 'public' en Supabase Storage.`, 'error');
                return;
            }

            setStyleForm(prev => ({ ...prev, image_url: finalPublicUrl }));
            showToast('Imagen vinculada al protocolo correctamente');
        } catch (error: any) {
            console.error('Error uploading image:', error);
            showToast('Error al subir imagen: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStyle = async () => {
        if (!editingStyle) return;
        try {
            setLoading(true);

            // 1. Update Metadata
            const { error: metaError } = await supabase
                .from('styles_metadata')
                .upsert({
                    id: styleForm.id,
                    label: styleForm.label,
                    category: styleForm.category,
                    subcategory: styleForm.subcategory,
                    image_url: styleForm.image_url,
                    is_premium: styleForm.is_premium,
                    tags: Array.isArray(styleForm.tags) ? styleForm.tags : styleForm.tags.split(',').map(t => t.trim()).filter(t => t),
                    updated_at: new Date().toISOString()
                });

            if (metaError) throw metaError;

            // 2. Update Prompt
            if (styleForm.prompt) {
                const { error: promptError } = await supabase
                    .from('identity_prompts')
                    .upsert({
                        id: styleForm.id,
                        master_prompt: styleForm.prompt,
                        created_at: new Date().toISOString()
                    });
                if (promptError) throw promptError;
            }

            showToast('Estilo y Prompt actualizados correctamente');
            setEditingStyle(null);
            fetchData();
        } catch (error: any) {
            console.error('Error syncing style:', error);
            showToast('Error al sincronizar estilo: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (amount: number) => {
        if (!showTopUp) return;
        try {
            setLoading(true);
            // Check if it's a partner or a B2C user
            const partner = partners.find(p => p.id === showTopUp.id);
            if (partner) {
                const { error } = await supabase
                    .from('partners')
                    .update({ credits_total: (partner.credits_total || 0) + amount })
                    .eq('id', partner.id);

                if (error) {
                    if (error.message.includes('credits_total')) {
                        throw new Error('La columna "credits_total" no existe en la tabla "partners". Por favor, ejecuta la migración SQL necesaria.');
                    }
                    throw error;
                }
            } else {
                // Assume it's a B2C user profile
                const user = b2cUsers.find(u => u.id === showTopUp.id);
                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ credits: (user.credits || 0) + amount })
                        .eq('id', user.id);
                    if (error) throw error;
                }
            }

            showToast('Créditos actualizados exitosamente');
            setShowTopUp(null);
            fetchData();
        } catch (error: any) {
            console.error('Error al recargar créditos:', error);
            showToast('Error al recargar créditos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c0b] text-slate-100 font-display relative">
            <Background3D />

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[#1f2b24] bg-[#0a0c0b]/80 backdrop-blur-xl hidden md:flex flex-col z-20">
                <div className="p-6 border-b border-[#1f2b24] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#13ec80] rounded flex items-center justify-center text-[#0a0c0b] shadow-[0_0_15px_rgba(19,236,128,0.4)]">
                        <span className="material-symbols-outlined !text-[20px] font-bold">visibility</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-wider">Eagle-Eye</h1>
                        <p className="text-[10px] text-[#13ec80]/70 uppercase font-medium tracking-[0.2em]">Master Admin</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">General</p>
                    <button
                        onClick={() => setView('overview')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'overview' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Vista General</span>
                    </button>
                    <button
                        onClick={() => setView('partners')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'partners' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">corporate_fare</span>
                        <span className="text-sm font-medium">Revendedores (SaaS)</span>
                    </button>
                    <button
                        onClick={() => setView('b2c')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'b2c' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-sm font-medium">Usuarios App B2C</span>
                    </button>
                    <button
                        onClick={() => setView('styles')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'styles' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        <span className="text-sm font-medium">Motor de Estilos IA</span>
                    </button>

                    <p className="px-3 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistema</p>
                    <button
                        onClick={() => setView('settings')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'settings' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm font-medium">Ajustes</span>
                    </button>
                    <button
                        onClick={() => setView('logs')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left ${view === 'logs' ? 'bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">terminal</span>
                        <span className="text-sm font-medium">Visor de Registros</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-[#1f2b24] bg-[#121413]/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#13ec80]/20 flex items-center justify-center border border-[#13ec80]/40">
                            <span className="material-symbols-outlined !text-[18px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Admin_Root</p>
                            <p className="text-[10px] text-slate-500 truncate">Platform Owner</p>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <span className="material-symbols-outlined !text-sm">logout</span> Salir del Panel
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0a0c0b]/50 backdrop-blur-sm z-10 transition-all duration-500 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="h-16 border-b border-[#1f2b24] flex items-center justify-between px-8 bg-[#121413]/30 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex-1 max-w-2xl relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 !text-[18px]">search</span>
                        <input className="w-full bg-[#121413] border border-[#1f2b24] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-[#13ec80] focus:border-[#13ec80] placeholder-slate-600 transition-all outline-none" placeholder="Buscar en el motor..." type="text" />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Hora del Sistema</p>
                            <p className="text-xs font-mono text-[#13ec80] leading-tight">{new Date().toLocaleTimeString('es-AR', { hour12: false })} UTC</p>
                        </div>
                        <div className="h-8 w-px bg-[#1f2b24]"></div>
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#13ec80] rounded-full border-2 border-[#0a0c0b]"></span>
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    {view === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Centro de Mando Ejecutivo</h2>
                                    <p className="text-slate-500 text-sm">Resumen táctico del ecosistema Metalab Creative Labs</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData()} className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors">
                                        <span className="material-symbols-outlined !text-xl">sync</span>
                                    </button>
                                </div>
                            </div>

                            {/* Macro Financial & Performance Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatCard
                                    label="Ingresos Estimados"
                                    value={`$${((stats.totalCreditsSold * 0.1)).toLocaleString()}`}
                                    trend="+15.2%"
                                    color="#13ec80"
                                    icon="payments"
                                />
                                <StatCard
                                    label="Generaciones Totales"
                                    value={stats.totalGenerations.toLocaleString()}
                                    trend="+8.4%"
                                    color="#3b82f6"
                                    icon="auto_awesome"
                                />
                                <StatCard
                                    label="Cuentas Activas"
                                    value={(b2cStats.totalUsers + partnerStats.totalPartners).toLocaleString()}
                                    color="#f59e0b"
                                    icon="hub"
                                />
                                <StatCard
                                    label="Eficiencia Motor"
                                    value="99.8%"
                                    status="OPERATIVO"
                                    color="#13ec80"
                                    icon="monitoring"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                {/* Left Side: Performance Boxes */}
                                <div className="xl:col-span-8 space-y-8">

                                    {/* Sector Performance Split */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* B2C Segment Summary */}
                                        <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50"></div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm tracking-tight mb-1">Segmento B2C</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consumo en App Pública</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <span className="material-symbols-outlined">person</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Usuarios</p>
                                                    <p className="text-xl font-black text-white">{b2cStats.totalUsers}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Gens</p>
                                                    <p className="text-xl font-black text-white">{b2cStats.totalB2CGenerations}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setView('b2c')} className="w-full mt-6 py-2 border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase rounded-lg hover:bg-blue-500/10 transition-colors">
                                                Gestionar B2C
                                            </button>
                                        </div>

                                        {/* SaaS Partner Summary */}
                                        <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#13ec80] opacity-50"></div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm tracking-tight mb-1">Red de Partners</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SaaS & B2B Events</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-[#13ec80]/10 flex items-center justify-center text-[#13ec80]">
                                                    <span className="material-symbols-outlined">corporate_fare</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Agencias</p>
                                                    <p className="text-xl font-black text-white">{partnerStats.totalPartners}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Eventos</p>
                                                    <p className="text-xl font-black text-white">{partnerStats.totalEvents}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setView('partners')} className="w-full mt-6 py-2 border border-[#13ec80]/20 bg-[#13ec80]/5 text-[#13ec80] text-[10px] font-black uppercase rounded-lg hover:bg-[#13ec80]/10 transition-colors">
                                                Ecosistema SaaS
                                            </button>
                                        </div>
                                    </div>

                                    {/* Style Leaderboard across Platform */}
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-white font-black uppercase text-sm tracking-tight">👑 Ranking Global de Estilos</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rendimiento por IA Identity</span>
                                        </div>
                                        <div className="space-y-4">
                                            {b2cStats.topStyles.slice(0, 4).map((style, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-500">
                                                        #{idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span className="text-white">{style.id}</span>
                                                            <span className="text-[#13ec80]">{style.count.toLocaleString()} gens</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#0a0c0b] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-[#13ec80]"
                                                                style={{ width: `${(style.count / (b2cStats.topStyles[0]?.count || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: System Pulse & Quick Actions */}
                                <div className="xl:col-span-4 space-y-8">
                                    <div className="h-[400px]">
                                        <SystemPulse logs={recentLogs} />
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6">
                                        <h3 className="text-white font-black uppercase text-sm tracking-tight mb-4">Acciones Rápidas</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                onClick={() => {
                                                    setStyleForm({ id: '', label: '', category: '', is_premium: false, usage_count: 0, prompt: '', tags: '', subcategory: '', image_url: '' } as any);
                                                    setEditingStyle('new');
                                                    setView('styles');
                                                }}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                                            >
                                                <span className="material-symbols-outlined text-purple-400">auto_fix_high</span>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Inyectar Estilo</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Nueva identidad IA</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreatePartner(true);
                                                    setView('partners');
                                                }}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                                            >
                                                <span className="material-symbols-outlined text-amber-400">add_business</span>
                                                <div>
                                                    <p className="text-xs font-bold text-white">Onboarding Partner</p>
                                                    <p className="text-[9px] text-slate-500 uppercase">Nuevo contrato SaaS</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'partners' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Resellers Management (SaaS)</h2>
                                    <p className="text-slate-500 text-sm">Control total sobre tu red de agencias y eventos</p>
                                </div>
                                <button
                                    onClick={() => setShowCreatePartner(true)}
                                    className="bg-[#13ec80] text-[#0a0c0b] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                                >
                                    <span className="material-symbols-outlined">add</span> New Reseller
                                </button>
                            </div>

                            {/* Partner Analytics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Partners Activos</p>
                                    <h3 className="text-2xl font-black text-white">{partnerStats.totalPartners}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-[#13ec80]/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-[#13ec80] !text-sm">handshake</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Total Eventos Red</p>
                                    <h3 className="text-2xl font-black text-[#13ec80]">{partnerStats.totalEvents}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-blue-500 !text-sm">event</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Créditos en Canales</p>
                                    <h3 className="text-2xl font-black text-blue-400">{(partnerStats.creditsInCirculation || 0).toLocaleString()}</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-purple-500 !text-sm">account_balance_wallet</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ratio de Consumo</p>
                                    <h3 className="text-2xl font-black text-amber-400">{partnerStats.avgConsumptionRate.toFixed(1)}%</h3>
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                                        <span className="material-symbols-outlined text-amber-500 !text-sm">trending_up</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0a0c0b] border-b border-[#1f2b24]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner / Agencia</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Eventos</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Billetera</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Configuración</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1f2b24]/50">
                                        {partners.map(p => {
                                            const hasBranding = p.config?.primary_color || p.config?.logo_url;
                                            return (
                                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[#13ec80] font-black border border-[#13ec80]/20 shadow-inner">
                                                                {(p.business_name || p.name || p.company_name || p.contact_email || 'P')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">
                                                                    {p.business_name || p.name || p.company_name || p.contact_email?.split('@')[0] || 'Partner Sin Nombre'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-[#13ec80]"></span>
                                                                    {p.contact_email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-bold text-white">{p.eventCount || 0}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Eventos creados</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-white text-sm font-bold">{((p.credits_total || 0) - (p.credits_used || 0)).toLocaleString()}</span>
                                                                <span className="text-[10px] text-slate-600">/ {(p.credits_total || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="w-24 h-1 bg-[#1f2b24] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[#13ec80]"
                                                                    style={{ width: `${Math.min(100, (p.credits_used / (p.credits_total || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span title="Branding Configurado" className={`material-symbols-outlined !text-sm ${hasBranding ? 'text-blue-400' : 'text-white/10'}`}>palette</span>
                                                            <span title="Subdominio Activo" className="material-symbols-outlined !text-sm text-[#13ec80]">language</span>
                                                            <span title="Soporte VIP" className="material-symbols-outlined !text-sm text-amber-400">verified</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setShowTopUp({ id: p.id, name: p.business_name || p.name })}
                                                                className="text-[10px] font-black text-[#13ec80] border border-[#13ec80]/30 px-4 py-2 rounded-lg hover:bg-[#13ec80]/10 transition-all flex items-center gap-2"
                                                            >
                                                                RECARGAR
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPartner(p);
                                                                    setPartnerForm({
                                                                        name: p.name || '',
                                                                        company_name: p.company_name || p.business_name || '',
                                                                        contact_email: p.contact_email || '',
                                                                        contact_phone: (p as any).contact_phone || '',
                                                                        is_active: p.is_active !== false
                                                                    });
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined !text-lg">settings</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'b2c' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Active Operatives <span className="text-[#13ec80]">({b2cUsers.length})</span></h2>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Gestión de identidades y créditos de la red pública</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por email..."
                                            value={b2cSearchQuery}
                                            onChange={(e) => setB2CSearchQuery(e.target.value)}
                                            className="bg-[#121413] border border-[#1f2b24] rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-[#13ec80] outline-none w-full md:w-64 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowNewUserModal(true)}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.05] transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
                                    >
                                        <span className="material-symbols-outlined !text-lg">person_add</span> Enrolar Usuario
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                {/* Grid de Usuarios Principal */}
                                <div className="xl:col-span-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {b2cUsers
                                            .filter(u => u.email.toLowerCase().includes(b2cSearchQuery.toLowerCase()))
                                            .sort((a, b) => (b.total_generations || 0) - (a.total_generations || 0))
                                            .map(u => (
                                                <div key={u.id} className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-6 hover:border-[#13ec80]/30 transition-all group relative overflow-hidden">
                                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13ec80]/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                                                                <span className="text-xl font-black text-white uppercase">{u.full_name?.[0] || u.email[0]}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-white group-hover:text-[#13ec80] transition-colors line-clamp-1">{u.full_name || u.email.split('@')[0]}</h4>
                                                                <p className="text-[10px] text-slate-500 font-mono italic">{u.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingUser(u)}
                                                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#13ec80]/20 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined !text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setShowTopUp({ id: u.id, name: u.email })}
                                                                className="px-3 h-8 rounded-full bg-[#13ec80]/10 border border-[#13ec80]/20 text-[#13ec80] text-[9px] font-black uppercase tracking-tighter hover:bg-[#13ec80] hover:text-black transition-all"
                                                            >
                                                                Saldo
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Balance Disponible</p>
                                                            <p className="text-lg font-black text-[#13ec80]">{u.credits?.toLocaleString() || 0} pts</p>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Generaciones</p>
                                                            <p className="text-lg font-black text-white">{u.total_generations || 0}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(u.unlocked_packs || []).length > 0 ? (
                                                                u.unlocked_packs?.map(pack => (
                                                                    <span key={pack} className="text-[8px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md font-black uppercase tracking-tighter">{pack}</span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[8px] text-slate-700 font-black uppercase italic tracking-widest">No active packs</span>
                                                            )}
                                                        </div>
                                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-[#13ec80]"
                                                                style={{ width: `${Math.min(100, (u.total_generations || 0) * 2)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Background Glow */}
                                                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#13ec80]/5 blur-[60px] rounded-full group-hover:bg-[#13ec80]/10 transition-colors pointer-events-none"></div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-8">
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-8">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[4px] mb-8 flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse"></span>
                                            Market Analysis
                                        </h3>

                                        <div className="space-y-6">
                                            {b2cStats.topStyles.slice(0, 5).map((style, idx) => (
                                                <div key={style.id} className="group">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{style.id}</span>
                                                        <span className="text-[10px] font-mono font-bold text-[#13ec80]">{style.count} GENS</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#13ec80] to-[#13ec80]/40 transition-all duration-1000"
                                                            style={{ width: `${(style.count / (b2cStats.topStyles[0]?.count || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#13ec80]/20 to-blue-600/10 border border-[#13ec80]/30 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(19,236,128,0.1)] relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-xs font-black text-white uppercase tracking-[4px] mb-2 font-black italic">Network Load</h3>
                                            <p className="text-[11px] text-slate-300 leading-relaxed font-bold mb-6 italic opacity-80">
                                                B2C SEGMENT REPRESENTS <span className="text-[#13ec80]">
                                                    {Math.min(100, (b2cStats.totalB2CGenerations / (Math.max(1, stats.totalGenerations)) * 100)).toFixed(1)}%</span> OF TOTAL OPS.
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <div className="h-full bg-[#13ec80] rounded-full shadow-[0_0_15px_#13ec80]" style={{ width: `${(b2cStats.totalB2CGenerations / (Math.max(1, stats.totalGenerations)) * 100)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-mono font-black text-[#13ec80] tracking-tighter">SECURED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'styles' && (
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
                                            setStyleForm({ id: '', label: '', category: '', is_premium: false, usage_count: 0, prompt: '', tags: '', subcategory: '', image_url: '', is_active: true } as any);
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
                                            onClick={() => setSelectedCategoryFilter(cat)}
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
                                            onClick={async () => {
                                                const stylesInCat = stylesMetadata.filter(s => s.category?.toLowerCase() === selectedCategoryFilter);
                                                const targetActive = !stylesInCat.every(s => s.is_active);

                                                try {
                                                    setLoading(true);

                                                    // 1. Update individual styles in category
                                                    const { error: updateError } = await supabase
                                                        .from('styles_metadata')
                                                        .update({ is_active: targetActive })
                                                        .ilike('category', selectedCategoryFilter);
                                                    if (updateError) throw updateError;

                                                    // 2. Upsert master category switch
                                                    const { error: upsertError } = await supabase
                                                        .from('styles_metadata')
                                                        .upsert({
                                                            id: selectedCategoryFilter.toLowerCase(),
                                                            is_active: targetActive,
                                                            category: selectedCategoryFilter
                                                        }, { onConflict: 'id' });
                                                    if (upsertError) throw upsertError;

                                                    showToast(`Categoría ${targetActive ? 'activada' : 'ocultada'} correctamente`);
                                                    fetchData();
                                                } catch (err: any) {
                                                    showToast('Error: ' + err.message, 'error');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
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
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const stylesInSub = stylesMetadata.filter(s => s.subcategory === sub && s.category?.toLowerCase() === selectedCategoryFilter);
                                                        const targetActive = !stylesInSub.every(s => s.is_active);

                                                        try {
                                                            setLoading(true);

                                                            // 1. Update individual styles in subcategory
                                                            const { error: updateError } = await supabase
                                                                .from('styles_metadata')
                                                                .update({ is_active: targetActive })
                                                                .eq('subcategory', sub)
                                                                .ilike('category', selectedCategoryFilter);
                                                            if (updateError) throw updateError;

                                                            // 2. Upsert master subcategory switch
                                                            const { error: upsertError } = await supabase
                                                                .from('styles_metadata')
                                                                .upsert({
                                                                    id: sub.toLowerCase(),
                                                                    is_active: targetActive,
                                                                    subcategory: sub,
                                                                    category: selectedCategoryFilter
                                                                }, { onConflict: 'id' });
                                                            if (upsertError) throw upsertError;

                                                            showToast(`Subcategoría ${targetActive ? 'activada' : 'ocultada'} correctamente`);
                                                            fetchData();
                                                        } catch (err: any) {
                                                            showToast('Error: ' + err.message, 'error');
                                                        } finally {
                                                            setLoading(false);
                                                        }
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
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`🚨 PURGA CRÍTICA: ¿Estás seguro de eliminar "${style.id}" definitivamente?`)) {
                                                        try {
                                                            setLoading(true);
                                                            await Promise.all([
                                                                supabase.from('styles_metadata').delete().eq('id', style.id),
                                                                supabase.from('identity_prompts').delete().eq('id', style.id)
                                                            ]);
                                                            showToast('Identidad purgada del sistema');
                                                            fetchData();
                                                        } catch (err: any) {
                                                            showToast('Error al purgar: ' + err.message, 'error');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }
                                                }}
                                                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                title="Purgar Identidad"
                                            >
                                                <span className="material-symbols-outlined !text-sm">delete_forever</span>
                                            </button>

                                            <div onClick={() => {
                                                setEditingStyle(style);
                                                setStyleForm({
                                                    id: style.id,
                                                    label: style.label,
                                                    category: style.category || '',
                                                    is_premium: style.is_premium || false,
                                                    usage_count: style.usage_count || 0,
                                                    prompt: style.prompt || '',
                                                    tags: Array.isArray(style.tags) ? style.tags.join(', ') : (style.tags || ''),
                                                    subcategory: style.subcategory || '',
                                                    image_url: style.image_url || '',
                                                    is_active: style.is_active ?? true
                                                } as any);
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
                    )}

                    {view === 'settings' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Ajustes del Sistema</h2>
                                <p className="text-slate-500 text-sm">Configuración global de APIs, pasarelas de pago y parámetros del motor</p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* MercadoPago Integration */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">MercadoPago Cloud</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pasarela de Pagos B2C</p>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Public Key (Producción)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                                placeholder="APP_USR-..."
                                                defaultValue="APP_USR-78239012-4212-4211-9012-78239012"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Access Token (Secret)</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                                    placeholder="APP_USR-..."
                                                    defaultValue="APP_USR-78239012-4212-4211-9012-HIDDEN"
                                                />
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer hover:text-white transition-colors">visibility</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#13ec80]"></div>
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Estado: Conectado</span>
                                            </div>
                                            <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">Probar Conexión</button>
                                        </div>
                                    </div>
                                </div>

                                {/* KIE Master Engine */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <span className="material-symbols-outlined">bolt</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">KIE Engine API</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Motor de Generación IA</p>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">KIE API Endpoint</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                                placeholder="https://api.kie.com/v1"
                                                defaultValue="https://automatizaciones.metalab30.com/webhook/kie-pro"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Webhook Secret Key</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                                    defaultValue="KIE_PRO_MET_LAB_30"
                                                />
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">lock</span>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <p className="text-[10px] text-slate-600 leading-relaxed italic">
                                                * El endpoint de KIE procesa todas las solicitudes de generación de imagen para Usuarios B2C y Partners.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Platform Settings */}
                                <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl overflow-hidden shadow-2xl xl:col-span-2">
                                    <div className="p-6 border-b border-[#1f2b24] bg-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                            <span className="material-symbols-outlined">settings_applications</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase tracking-tight">Parámetros Globales</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control General de Plataforma</p>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">Modo Mantenimiento</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">Registro de Usuarios B2C</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13ec80]"></div>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Precio Crédito (Base)</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 font-bold">$</span>
                                                    <input type="number" className="bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-3 py-2 text-white outline-none focus:border-[#13ec80] w-full text-sm font-bold" defaultValue="100.00" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos por Invitación</label>
                                                <input type="number" className="bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-3 py-2 text-white outline-none focus:border-[#13ec80] w-full text-sm font-bold" defaultValue="10" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <button className="w-full py-4 bg-[#13ec80] text-[#0a0c0b] font-black rounded-xl shadow-[0_0_30px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all uppercase text-xs tracking-widest">
                                                Guardar Configuración Global
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Visor de Registros Maestro</h2>
                                    <p className="text-slate-500 text-sm">Monitor de actividad y salud del motor en tiempo real</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData()} className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors">
                                        <span className="material-symbols-outlined !text-xl">refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* System Health Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Tasa de Éxito</p>
                                    <div className="flex items-end gap-2">
                                        <h3 className="text-2xl font-black text-white">99.8%</h3>
                                        <span className="text-[10px] text-[#13ec80] font-bold mb-1">UP</span>
                                    </div>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Gens (Hoy)</p>
                                    <h3 className="text-2xl font-black text-blue-400">{recentLogs.length * 12}+</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Uso API</p>
                                    <h3 className="text-2xl font-black text-purple-400">Normal</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Estado Motor</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#13ec80] animate-pulse"></div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Online</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Actividad Reciente del Sistema</h3>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-[#13ec80]"></span> Éxito
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Proceso
                                        </span>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#1f2b24]/50">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.type === 'success' ? 'bg-[#13ec80]/10 text-[#13ec80]' : 'bg-amber-400/10 text-amber-400'
                                                    }`}>
                                                    <span className="material-symbols-outlined !text-lg">
                                                        {log.type === 'success' ? 'check_circle' : 'warning'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">{log.title}</p>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${log.text.includes('B2C')
                                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                            : 'bg-[#13ec80]/10 border-[#13ec80]/20 text-[#13ec80]'
                                                            }`}>
                                                            {log.text.includes('B2C') ? 'B2C Account' : 'Partner Event'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">{log.text}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-mono text-white/50">{log.time}</p>
                                                <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest group-hover:text-slate-500 transition-colors">Transaction ID: {log.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentLogs.length === 0 && (
                                        <div className="py-20 text-center">
                                            <span className="material-symbols-outlined !text-4xl text-white/5 mb-2">history</span>
                                            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No se encontraron registros recientes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Partner Modal */}
            {
                showCreatePartner && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#121413] border border-[#1f2b24] p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,1)]">
                            <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#13ec80]">add_business</span> Nuevo Revendedor
                            </h3>
                            <form onSubmit={handleCreatePartner} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Razón Social</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        placeholder="Nombre de la Agencia..."
                                        value={newPartner.name}
                                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email de Usuario (Login)</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        placeholder="admin@agencia.com"
                                        type="email"
                                        value={newPartner.email}
                                        onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contraseña Temporal</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        placeholder="Contraseña temporal para el partner"
                                        type="password"
                                        value={newPartner.password}
                                        onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Créditos Iniciales</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80]"
                                        type="number"
                                        value={newPartner.initialCredits}
                                        onChange={(e) => setNewPartner({ ...newPartner, initialCredits: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setShowCreatePartner(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors">CANCELAR</button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-[#13ec80] text-[#0a0c0b] font-black text-xs rounded-lg shadow-[0_0_20px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'CREANDO...' : 'CREAR PARTNER'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Partner Edit Modal */}
            {editingPartner && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#121413] border border-[#1f2b24] p-8 rounded-[32px] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
                    >
                        {/* Status Light */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 pointer-events-none ${partnerForm.is_active ? 'bg-[#13ec80]' : 'bg-red-500'}`}></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Partner <span className="text-[#13ec80]">Settings</span></h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[3px] mt-1">Configuración Maestro de Canal</p>
                            </div>
                            <button
                                onClick={() => setEditingPartner(null)}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePartnerSettings} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Razón Social / Empresa</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                        value={partnerForm.company_name}
                                        onChange={(e) => setPartnerForm({ ...partnerForm, company_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Nombre de Contacto</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                        value={partnerForm.name}
                                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Teléfono de Contacto</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] transition-all"
                                        value={partnerForm.contact_phone}
                                        onChange={(e) => setPartnerForm({ ...partnerForm, contact_phone: e.target.value })}
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email del Partner</label>
                                    <input
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white/50 outline-none cursor-not-allowed"
                                        value={partnerForm.contact_email}
                                        readOnly
                                    />
                                    <p className="text-[9px] text-slate-600 mt-1 italic">* El email es el identificador único y no puede cambiarse.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-xs font-bold text-white uppercase italic">Estado de Cuenta</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Permitir acceso y operaciones</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPartnerForm({ ...partnerForm, is_active: !partnerForm.is_active })}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${partnerForm.is_active ? 'bg-[#13ec80]' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${partnerForm.is_active ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleDeletePartner(editingPartner.id)}
                                    className="px-6 py-4 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                                >
                                    Dar de Baja
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingPartner}
                                    className="flex-1 py-4 bg-[#13ec80] text-[#0a0c0b] font-black text-[10px] rounded-xl shadow-[0_10px_30px_rgba(19,236,128,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {isSavingPartner ? 'Sincronizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Top Up Modal */}
            {
                showTopUp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#121413] border border-[#1f2b24] p-8 rounded-2xl w-full max-w-md">
                            <h3 className="text-xl font-black text-white uppercase mb-4">Recarga de Créditos</h3>
                            <p className="text-slate-400 text-sm mb-6">Asignando nuevos créditos a <span className="text-[#13ec80] font-bold">{showTopUp.name}</span></p>
                            <div className="grid grid-cols-2 gap-4">
                                {[1000, 5000, 10000, 50000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => handleTopUp(amt)}
                                        className="py-4 border border-[#1f2b24] bg-[#0a0c0b] rounded-xl text-white font-black hover:border-[#13ec80] hover:text-[#13ec80] transition-all uppercase"
                                    >
                                        +{amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowTopUp(null)} className="w-full mt-6 py-3 text-xs font-bold text-slate-500 hover:text-white tracking-widest uppercase">Cerrar</button>
                        </div>
                    </div>
                )
            }

            {/* Style Edit Modal - ADVANCED VERSION */}
            {
                editingStyle && (
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
                                                !styleForm.image_url ? '/placeholder-style.jpg' :
                                                    (styleForm.image_url.startsWith('http') || styleForm.image_url.startsWith('blob')) ? styleForm.image_url :
                                                        (styleForm.image_url.startsWith('/') ? styleForm.image_url : `/${styleForm.image_url}`)
                                            }
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                if (img.src.includes('placeholder')) return;
                                                img.src = '/placeholder-style.jpg';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0b] via-transparent to-transparent opacity-80"></div>
                                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center">
                                            <label className="w-12 h-12 bg-[#13ec80] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,128,0.4)] group/btn">
                                                <span className="material-symbols-outlined text-[#0a0c0b] group-hover:rotate-90 transition-transform">add_a_photo</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <p className="text-[10px] font-black text-[#13ec80] uppercase tracking-[4px] mb-2">Protocolo Activo</p>
                                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{styleForm.label || 'Nueva Identidad'}</h4>
                                    </div>
                                </div>

                                <div className="w-full space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Sync Status:</span>
                                        <span className={loading ? "text-amber-400 animate-pulse" : "text-[#13ec80]"}>
                                            {loading ? "PROCESANDO..." : "STANDBY"}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full bg-[#13ec80] transition-all duration-500 ${loading ? 'w-1/2 animate-pulse' : 'w-full opacity-50'}`}></div>
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
                                            {editingStyle === 'new' ? 'Initialize Protocol' : 'Sync Identity Data'}
                                        </h3>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[3px] mt-1 text-center md:text-left">Sintonización de Red Neuronal</p>
                                    </div>
                                    <button onClick={() => setEditingStyle(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined !text-lg">close</span>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-[#13ec80] uppercase tracking-widest ml-1">Identity Handle (ID)</label>
                                            <input
                                                className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs"
                                                value={styleForm.id}
                                                disabled={editingStyle !== 'new'}
                                                onChange={(e) => setStyleForm({ ...styleForm, id: e.target.value.toLowerCase() } as any)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Visual Title</label>
                                            <input
                                                className="w-full bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] text-sm"
                                                value={styleForm.label}
                                                onChange={(e) => setStyleForm({ ...styleForm, label: e.target.value } as any)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">System URL / Storage Path</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-[#121413] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-[10px]"
                                                value={styleForm.image_url}
                                                onChange={(e) => setStyleForm({ ...styleForm, image_url: e.target.value } as any)}
                                            />
                                            <button
                                                onClick={() => {
                                                    if (styleForm.image_url) {
                                                        navigator.clipboard.writeText(styleForm.image_url);
                                                        showToast('URL copiada al portapapeles');
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
                                                value={styleForm.category}
                                                onChange={(e) => setStyleForm({ ...styleForm, category: e.target.value } as any)}
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
                                                value={(styleForm as any).subcategory}
                                                onChange={(e) => setStyleForm({ ...styleForm, subcategory: e.target.value } as any)}
                                            />
                                            <datalist id="subcategory-suggestions">
                                                {Array.from(new Set(stylesMetadata.filter(s => s.category?.toLowerCase() === styleForm.category?.toLowerCase()).map(s => s.subcategory).filter(Boolean))).map(sub => (
                                                    <option key={sub} value={sub} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Visibility Toggle */}
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-[24px] p-6 flex items-center justify-between group hover:border-[#13ec80]/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styleForm.is_active ? 'bg-[#13ec80]/10 text-[#13ec80]' : 'bg-slate-500/10 text-slate-500'}`}>
                                                <span className="material-symbols-outlined">{styleForm.is_active ? 'visibility' : 'visibility_off'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest block">Visibility Status</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{styleForm.is_active ? 'Active in application' : 'Hidden from users'}</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={styleForm.is_active}
                                                onChange={(e) => setStyleForm({ ...styleForm, is_active: e.target.checked } as any)}
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
                                                checked={styleForm.is_premium}
                                                onChange={(e) => setStyleForm({ ...styleForm, is_premium: e.target.checked } as any)}
                                            />
                                            <div className="w-14 h-7 bg-white/5 border border-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ff5500] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Generation Prompt (Cerebro Core)</label>
                                            <span className="text-[8px] font-bold text-[#13ec80] uppercase">Neural Network Ready</span>
                                        </div>
                                        <textarea
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-[32px] px-8 py-6 text-white outline-none focus:border-[#13ec80] text-sm leading-relaxed min-h-[120px] resize-none"
                                            value={(styleForm as any).prompt}
                                            onChange={(e) => setStyleForm({ ...styleForm, prompt: e.target.value } as any)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tactical Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(Array.isArray(styleForm.tags) ? styleForm.tags : String(styleForm.tags || '').split(',').filter(Boolean)).map((tag, idx) => (
                                                <span key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                                    {tag.trim()}
                                                    <button onClick={() => {
                                                        const currentTags = (Array.isArray(styleForm.tags) ? styleForm.tags : String(styleForm.tags).split(',')).filter(t => t.trim() !== tag.trim());
                                                        setStyleForm({ ...styleForm, tags: currentTags } as any);
                                                    }} className="text-slate-600 hover:text-white transition-colors">×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-[#121413] border border-[#1f2b24] rounded-2xl px-5 py-4 text-white outline-none focus:border-[#13ec80]"
                                                id="new-tag-input"
                                                placeholder="Add tactical label..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const input = e.target as HTMLInputElement;
                                                        const newTag = input.value.trim();
                                                        if (newTag) {
                                                            const currentTags = String((styleForm as any).tags || '');
                                                            setStyleForm({ ...styleForm, tags: currentTags ? `${currentTags}, ${newTag}` : newTag } as any);
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('new-tag-input') as HTMLInputElement;
                                                    const newTag = input.value.trim();
                                                    if (newTag) {
                                                        const currentTags = String((styleForm as any).tags || '');
                                                        setStyleForm({ ...styleForm, tags: currentTags ? `${currentTags}, ${newTag}` : newTag } as any);
                                                        input.value = '';
                                                    }
                                                }}
                                                className="bg-white/5 border border-white/10 text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex gap-4">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setLoading(true);
                                                    // 1. Sync Prompt to identity_prompts
                                                    const { error: promptErr } = await supabase
                                                        .from('identity_prompts')
                                                        .upsert({
                                                            id: styleForm.id,
                                                            master_prompt: styleForm.prompt
                                                        });

                                                    if (promptErr) throw promptErr;

                                                    // 2. Sync Metadata to styles_metadata
                                                    const payload = {
                                                        id: styleForm.id,
                                                        label: styleForm.label,
                                                        category: styleForm.category,
                                                        is_premium: styleForm.is_premium,
                                                        tags: Array.isArray(styleForm.tags) ? styleForm.tags : String(styleForm.tags).split(',').map(t => t.trim()).filter(Boolean),
                                                        subcategory: styleForm.subcategory,
                                                        image_url: styleForm.image_url,
                                                        is_active: styleForm.is_active,
                                                        updated_at: new Date().toISOString()
                                                    };

                                                    console.log('Syncing identity metadata:', payload);

                                                    const { error: metaErr } = await supabase
                                                        .from('styles_metadata')
                                                        .upsert(payload);

                                                    if (metaErr) throw metaErr;

                                                    showToast('Identidad sincronizada en ambos núcleos');
                                                    setEditingStyle(null);
                                                    fetchData();
                                                } catch (err: any) {
                                                    showToast('Sync Failure: ' + err.message, 'error');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="flex-1 py-6 bg-gradient-to-r from-orange-600 to-[#ff5500] text-white font-black rounded-[32px] text-xs tracking-[4px] shadow-[0_20px_40px_rgba(255,85,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase italic"
                                        >
                                            Finalize Protocol Sync
                                        </button>
                                        {editingStyle !== 'new' && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('🚨 ¡ELIMINACIÓN CRÍTICA!\n\n¿Estás seguro de purgar esta identidad de todos los registros del motor?')) {
                                                        try {
                                                            setLoading(true);
                                                            await Promise.all([
                                                                supabase.from('styles_metadata').delete().eq('id', styleForm.id),
                                                                supabase.from('identity_prompts').delete().eq('id', styleForm.id)
                                                            ]);
                                                            showToast('Protocolo purgado correctamente');
                                                            setEditingStyle(null);
                                                            fetchData();
                                                        } catch (err: any) {
                                                            console.error(err);
                                                            showToast('Falla al purgar: ' + err.message, 'error');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }
                                                }}
                                                className="px-6 border border-red-500/30 text-red-500 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500/10 transition-all"
                                                disabled={loading}
                                            >
                                                Purge
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingStyle(null)}
                                            className="aspect-square w-16 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center text-slate-500 hover:text-white transition-all"
                                        >
                                            <span className="material-symbols-outlined">query_stats</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                editingUser && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <div className="bg-[#121413] border border-[#1f2b24] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-[#1f2b24]">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-500">manage_accounts</span>
                                    Editar Usuario B2C
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{editingUser.email}</p>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={editingUser.full_name || ''}
                                            onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                            className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Nombre del usuario..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos</label>
                                        <input
                                            type="number"
                                            value={editingUser.credits}
                                            onChange={e => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Packs Desbloqueados</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-[#0a0c0b] rounded-xl border border-[#1f2b24] custom-scrollbar">
                                        {Array.from(new Set(stylesMetadata.map(s => s.category))).filter(c => c).map(category => {
                                            const isChecked = editingUser.unlocked_packs?.includes(category);
                                            return (
                                                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={e => {
                                                            const packs = editingUser.unlocked_packs || [];
                                                            if (e.target.checked) {
                                                                setEditingUser({ ...editingUser, unlocked_packs: [...packs, category] });
                                                            } else {
                                                                setEditingUser({ ...editingUser, unlocked_packs: packs.filter(p => p !== category) });
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-4 h-4 rounded border ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-[#1f2b24] group-hover:border-slate-600'} flex items-center justify-center transition-all`}>
                                                        {isChecked && <span className="material-symbols-outlined !text-[12px] text-white">check</span>}
                                                    </div>
                                                    <span className={`text-[11px] uppercase font-bold tracking-tight ${isChecked ? 'text-white' : 'text-slate-500'}`}>{category}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingUser}
                                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {isSavingUser ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showNewUserModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <div className="bg-[#121413] border border-[#1f2b24] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-[#1f2b24]">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-500">person_add</span>
                                    Nuevo Usuario B2C
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Alta de cuenta pública y créditos</p>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email del Usuario</label>
                                    <input
                                        type="email"
                                        required
                                        value={newUserForm.email}
                                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                        placeholder="ejemplo@usuario.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Créditos Iniciales</label>
                                        <input
                                            type="number"
                                            required
                                            value={newUserForm.credits}
                                            onChange={e => setNewUserForm({ ...newUserForm, credits: parseInt(e.target.value) })}
                                            className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Rol Asignado</label>
                                        <div className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            USUARIO B2C
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Packs Desbloqueados (Separar por coma)</label>
                                    <input
                                        type="text"
                                        value={newUserForm.packs}
                                        onChange={e => setNewUserForm({ ...newUserForm, packs: e.target.value })}
                                        className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                        placeholder="Formula 1, John Wick, Magia..."
                                    />
                                    <p className="text-[9px] text-slate-600 mt-2 italic">* Los nombres deben coincidir con la subcategoría en el Motor de Estilos.</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewUserModal(false)}
                                        className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingUser}
                                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {isSavingUser ? 'CREANDO...' : 'CREAR USUARIO'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1f2b24;
                    border-radius: 10px;
                }
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(19, 236, 128, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(19, 236, 128, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(19, 236, 128, 0); }
                }
            `}</style>

            {/* Toast System (Master Layer) */}
            <AnimatePresence>
                {toast.type && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${toast.type === 'success' ? 'bg-[#13ec80]/10 border-[#13ec80]/30 text-[#13ec80]' :
                            toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            }`}
                    >
                        <span className="material-symbols-outlined">
                            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                        </span>
                        <p className="text-[11px] font-black uppercase tracking-widest">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ label, value, trend, status, color, icon }: any) => (
    <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl hover:border-[#13ec80]/30 transition-all group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <span className="material-symbols-outlined !text-8xl">{icon}</span>
        </div>
        <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            {trend && <span className="text-[10px] font-bold text-[#13ec80] px-1.5 py-0.5 bg-[#13ec80]/10 rounded tracking-tight">{trend}</span>}
            {status && <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#13ec80] tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse"></span> {status}</span>}
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-3xl font-black text-white leading-none">{value}</h3>
        </div>
        <div className="mt-4 border-t border-[#1f2b24] pt-3 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <span className="material-symbols-outlined !text-[14px]">arrow_outward</span> Sincronización en tiempo real
            </div>
        </div>
    </div>
);

const SystemPulse = ({ logs }: { logs: any[] }) => (
    <div className="bg-[#121413] border border-[#1f2b24] rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Pulse</p>
            <span className="material-symbols-outlined !text-[16px] text-[#13ec80] animate-pulse">sensors</span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? logs.map(log => (
                <LogItem
                    key={log.id}
                    type={log.type}
                    title={log.title}
                    text={log.text}
                    time={log.time}
                />
            )) : (
                <div className="text-center py-10">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">No hay actividad<br />reciente detectable</p>
                </div>
            )}
        </div>
        <div className="p-3 border-t border-[#1f2b24] bg-[#0a0c0b]">
            <button className="w-full text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors tracking-[0.2em]">Abrir Centro de Comando</button>
        </div>
    </div>
);

const LogItem = ({ type, title, text, time }: any) => {
    const colors = {
        success: 'bg-[#13ec80]',
        info: 'bg-blue-400',
        warning: 'bg-amber-400',
        error: 'bg-red-400'
    };
    return (
        <div className="flex gap-3 relative pb-2 group">
            <div className={`w-2 h-2 mt-1 rounded-full ${colors[type as keyof typeof colors]} shrink-0 shadow-[0_0_5px_currentColor] opacity-60 group-hover:opacity-100 transition-opacity`}></div>
            <div>
                <p className="text-[11px] font-bold text-white leading-tight">{title}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{text}</p>
                <p className="text-[8px] font-mono text-slate-600 mt-1 uppercase">{time}</p>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search } from 'lucide-react';
import { IDENTITIES } from '../../lib/constants';
import Background3D from '../Background3D';
import { motion, AnimatePresence } from 'framer-motion';
import { PartnerModal } from './admin/modals/PartnerModal';
import { TopUpModal } from './admin/modals/TopUpModal';
import { UserModal } from './admin/modals/UserModal';
import { StyleModal } from './admin/modals/StyleModal';
import { DeletePartnerModal } from './admin/modals/DeletePartnerModal';
import { Partner, UserProfile, StyleMetadata } from './admin/modals/types';

// Interfaces extracted to modals/types.ts

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
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalPartners: 0,
        totalCreditsSold: 0,
        activeEvents: 0,
        allGenerations: [] as any[]
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

    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [isSavingPartner, setIsSavingPartner] = useState(false);
    const [showInactivePartners, setShowInactivePartners] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<{ id: string, name: string } | null>(null);

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
    const [logFilterPartner, setLogFilterPartner] = useState('all');


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
                supabase.from('generations').select('id, created_at, style_id, event_id, user_id, image_url, events(event_name, partner_id), profiles(email)').order('created_at', { ascending: false }).limit(200),
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
                    is_active: true,
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
                activeEvents: activeEventsCount,
                allGenerations: generationsData
            });

            const totalB2CCredits = b2cUsersData.reduce((acc, curr) => acc + (curr.credits || 0), 0);
            const totalB2CGenerations = b2cUsageTotal;

            const styleCounts: Record<string, number> = {};
            generationsData.forEach((g: any) => {
                if (g.style_id) {
                    styleCounts[g.style_id] = (styleCounts[g.style_id] || 0) + 1;
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

            setRecentLogs(generationsData.map((g: any) => ({
                id: g.id,
                type: 'success',
                title: g.style_id ? `AI Generation: ${g.style_id}` : 'Generación Exitosa',
                text: g.event_id ? `Evento: ${g.events?.event_name || 'Desconocido'}` : 'Uso Directo B2C',
                time: new Date(g.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                event_id: g.event_id,
                partner_id: g.events?.partner_id, // Atribuido al partner del evento
                email: g.profiles?.email || 'Guest @ Event',
                cost: 0.12 // Costo estimado por generación
            })));

        } catch (error: any) {
            console.error('Error fetching data:', error);
            showToast('Error al cargar datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userData: any) => {
        if (!editingUser) return;
        try {
            setIsSavingUser(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: userData.full_name,
                    credits: Number(userData.credits),
                    unlocked_packs: userData.unlocked_packs,
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

    const handleCreateUser = async (userData: any) => {
        try {
            setIsSavingUser(true);

            const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', userData.email.toLowerCase()).maybeSingle();

            if (existingUser) {
                showToast('Este usuario ya existe en la base de datos.', 'info');
                setIsSavingUser(false);
                return;
            }

            const { error: profError } = await supabase.from('profiles').insert({
                email: userData.email.toLowerCase(),
                credits: Number(userData.credits),
                unlocked_packs: userData.unlocked_packs,
                role: 'user'
            });

            if (profError) throw profError;

            showToast('Usuario B2C creado correctamente.');
            setShowNewUserModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            showToast('Error al crear usuario: ' + (error as any).message, 'error');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleCreatePartner = async (partnerData: any) => {
        try {
            setLoading(true);

            // 1. Check if user already exists in profiles
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', partnerData.email.toLowerCase())
                .maybeSingle();

            let targetUserId = existingProfile?.id;

            if (!targetUserId) {
                // Create Auth User ONLY if they don't exist
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: partnerData.email.toLowerCase(),
                    password: partnerData.password || 'Partner123!',
                });

                if (authError) throw authError;
                targetUserId = authData.user?.id;
            }

            if (!targetUserId) throw new Error("No se pudo obtener o crear el ID del usuario");

            // 2. Update Profile Role
            await supabase.from('profiles').upsert({
                id: targetUserId,
                email: partnerData.email.toLowerCase(),
                role: 'partner',
                full_name: partnerData.company_name
            }, { onConflict: 'id' });

            // 3. Create Partner Entry
            const partnerObj: any = {
                company_name: partnerData.company_name,
                contact_email: partnerData.email.toLowerCase(),
                user_id: targetUserId,
                credits_total: Number(partnerData.credits || 1000),
                credits_used: 0,
                is_active: true
            };

            const { error: partError } = await supabase
                .from('partners')
                .insert(partnerObj);

            if (partError) {
                if (partError.code === '23505') {
                    await supabase.from('partners')
                        .update(partnerObj)
                        .eq('contact_email', partnerData.email.toLowerCase());
                } else {
                    throw partError;
                }
            }

            showToast('Partner creado con éxito.');
            setShowCreatePartner(false);
            fetchData();
        } catch (error: any) {
            console.error('Error creating partner:', error);
            showToast('Error al crear partner: ' + (error.message || 'Error desconocido'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePartnerSettings = async (partnerData: any) => {
        if (!editingPartner) return;

        try {
            setIsSavingPartner(true);
            const { error } = await supabase
                .from('partners')
                .update({
                    company_name: partnerData.company_name,
                    contact_email: partnerData.contact_email,
                    contact_phone: partnerData.contact_phone,
                    is_active: partnerData.is_active
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

    const handleDeletePartner = async (partnerId: string) => {
        try {
            setIsSavingPartner(true);
            const partner = partners.find(p => p.id === partnerId);
            if (!partner) throw new Error("Partner no encontrado");

            let error;
            if (partner.is_from_profile) {
                // No existe en la tabla partners, lo creamos como inactivo
                const { error: insertError } = await supabase
                    .from('partners')
                    .insert({
                        user_id: partner.user_id || partner.id,
                        contact_email: partner.contact_email,
                        company_name: partner.company_name || partner.name || `Partner ${partner.id.substring(0, 8)}`,
                        is_active: false
                    });
                error = insertError;
            } else {
                // Ya existe, lo actualizamos por ID
                const { error: updateError } = await supabase
                    .from('partners')
                    .update({ is_active: false })
                    .eq('id', partner.id);
                error = updateError;
            }

            if (error) throw error;

            showToast('Partner dado de baja correctamente');
            setEditingPartner(null);
            fetchData();
        } catch (error: any) {
            console.error('Error deactivating partner:', error);
            showToast('Error al desactivar partner: ' + error.message, 'error');
        } finally {
            setIsSavingPartner(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
        const file = e.target.files?.[0];
        if (!file) return null;

        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `styles-${Date.now()}.${fileExt}`;
            const filePath = `styles/${fileName}`;

            const buckets = ['public', 'styles', 'logos', 'generations'];
            let uploadSuccess = false;
            let finalPublicUrl = '';
            let lastError = '';

            for (const bucket of buckets) {
                try {
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
                return null;
            }

            showToast('Imagen vinculada al protocolo correctamente');
            return finalPublicUrl;
        } catch (error: any) {
            console.error('Error uploading image:', error);
            showToast('Error al subir imagen: ' + error.message, 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStyle = async (styleData: any) => {
        try {
            setLoading(true);

            // 1. Update Metadata
            const { error: metaError } = await supabase
                .from('styles_metadata')
                .upsert({
                    id: styleData.id,
                    label: styleData.label,
                    category: styleData.category,
                    subcategory: styleData.subcategory,
                    image_url: styleData.image_url,
                    is_premium: styleData.is_premium,
                    tags: Array.isArray(styleData.tags) ? styleData.tags : (styleData.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
                    updated_at: new Date().toISOString()
                });

            if (metaError) throw metaError;

            // 2. Update Prompt
            if (styleData.prompt) {
                const { error: promptError } = await supabase
                    .from('identity_prompts')
                    .upsert({
                        id: styleData.id,
                        master_prompt: styleData.prompt,
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
            // Al cargar créditos a un partner, debemos asegurarnos de actualizar tanto la tabla 'partners'
            // como la tabla 'profiles' por seguridad y redundancia, ya que algunos partners 
            // pueden estar viviendo solo en 'profiles' inicialmente.

            const partner = partners.find(p => p.id === showTopUp.id);
            if (partner) {
                if (partner.is_from_profile) {
                    // El partner existe solo en profiles, actualizamos allí
                    const { error } = await supabase
                        .from('profiles')
                        .update({ credits: (partner.credits_total || 0) + amount })
                        .eq('id', partner.id);
                    if (error) throw error;
                } else {
                    // Existe en la tabla partners
                    const { error } = await supabase
                        .from('partners')
                        .update({ credits_total: (partner.credits_total || 0) + amount })
                        .eq('id', partner.id);

                    if (error) {
                        if (error.message.includes('credits_total')) {
                            throw new Error('La columna "credits_total" no existe en la tabla "partners".');
                        }
                        throw error;
                    }

                    // Opcionalmente actualizamos también el profile si tiene user_id
                    if (partner.user_id) {
                        await supabase
                            .from('profiles')
                            .update({ credits: (partner.credits_total || 0) + amount })
                            .eq('id', partner.user_id);
                    }
                }
            } else {
                // Es un usuario B2C normal
                const user = b2cUsers.find(u => u.id === showTopUp.id);
                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ credits: (user.credits || 0) + amount })
                        .eq('id', user.id);
                    if (error) throw error;
                }
            }

            // --- REAL WALLET RECORDING ---
            // Registramos la transacción en el historial para que el partner pueda verla en su billetera
            try {
                await supabase.from('wallet_transactions').insert({
                    partner_id: showTopUp.id,
                    amount: amount,
                    type: 'top-up',
                    description: `Recarga de créditos por Master Admin`
                });
            } catch (e) {
                console.warn('Error recording wallet transaction:', e);
                // No lanzamos error para no bloquear la actualización de créditos si solo falla el log
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

                            {/* Global Network Activity Chart */}
                            <div className="bg-[#121413] border border-[#1f2b24] rounded-[32px] p-8 mb-8 relative overflow-hidden group">
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#13ec80]/5 blur-[100px] rounded-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Actividad de Red Global</h4>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-tighter">Fotos creadas por día (Últimos 7 días)</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-[#13ec80] animate-pulse" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Pulse</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-40 flex items-end gap-3 px-2 relative z-10">
                                    {Array.from({ length: 7 }).map((_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() - (6 - i));
                                        const dateStr = date.toISOString().split('T')[0];
                                        const count = stats.allGenerations.filter(g => g.created_at.startsWith(dateStr)).length;

                                        const counts = Array.from({ length: 7 }).map((_, j) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - (6 - j));
                                            const ds = d.toISOString().split('T')[0];
                                            return stats.allGenerations.filter(g2 => g2.created_at.startsWith(ds)).length;
                                        });
                                        const maxCount = Math.max(...counts, 1);
                                        const height = (count / maxCount) * 100;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                                <div className="w-full relative h-[120px] flex items-end">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(height, 5)}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                                                        className={`w-full rounded-t-xl transition-all duration-300 group-hover/bar:brightness-125 relative ${count > 0 ? 'bg-gradient-to-t from-[#0e5233] to-[#13ec80]' : 'bg-white/5'}`}
                                                    >
                                                        {count > 0 && (
                                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-xl" />
                                                        )}
                                                    </motion.div>
                                                    {count > 0 && (
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#13ec80] text-[#0a0c0b] text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap z-20 shadow-[0_5px_15px_rgba(19,236,128,0.4)]">
                                                            {count} GENS
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover/bar:text-slate-300 transition-colors">
                                                    {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
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

                                    {/* Partner Performance Ranking */}
                                    <div className="bg-[#121413] border border-[#1f2b24] rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6 text-[#13ec80]">
                                            <h3 className="text-white font-black uppercase text-sm tracking-tight">🏢 Ranking Facturación (SaaS)</h3>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top Partners por Créditos</span>
                                        </div>
                                        <div className="space-y-3">
                                            {partners
                                                .sort((a, b) => (b.credits_total || 0) - (a.credits_total || 0))
                                                .slice(0, 5)
                                                .map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-[#13ec80]/30 transition-all">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[10px] font-black text-[#13ec80] border border-[#13ec80]/20 shrink-0">
                                                            #{idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <h4 className="text-[11px] font-black text-white uppercase truncate tracking-tight">{p.company_name || p.name}</h4>
                                                                <span className="text-[10px] font-bold text-slate-400 font-mono">{(p.credits_total || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#13ec80] to-[#13ec80]/50"
                                                                    style={{ width: `${Math.min(100, ((p.credits_used || 0) / (Math.max(1, p.credits_total || 1))) * 100)}%` }}
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
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowInactivePartners(!showInactivePartners)}
                                        className={`px-4 py-3 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border ${showInactivePartners ? 'border-[#13ec80] text-[#13ec80] bg-[#13ec80]/10' : 'border-[#1f2b24] text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined !text-sm">{showInactivePartners ? 'visibility' : 'visibility_off'}</span>
                                        {showInactivePartners ? 'OCULTAR INACTIVOS' : 'VER INACTIVOS'}
                                    </button>
                                    <button
                                        onClick={() => setShowCreatePartner(true)}
                                        className="bg-[#13ec80] text-[#0a0c0b] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(19,236,128,0.3)]"
                                    >
                                        <span className="material-symbols-outlined">add</span> New Reseller
                                    </button>
                                </div>
                            </div>

                            {/* Partner Analytics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl relative overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Partners Activos</p>
                                    <h3 className="text-2xl font-black text-white">{partners.filter(p => p.is_active !== false).length}</h3>
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
                                        {partners.filter(p => showInactivePartners ? true : (p.is_active !== false)).map(p => {
                                            const isInactive = p.is_active === false;
                                            const hasBranding = p.config?.primary_color || p.config?.logo_url;
                                            return (
                                                <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors group ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#13ec80]/20 to-transparent flex items-center justify-center text-[#13ec80] font-black border border-[#13ec80]/20 shadow-inner">
                                                                {(p.company_name || p.name || p.contact_email || 'P')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white group-hover:text-[#13ec80] transition-colors">
                                                                    {p.company_name || p.name || p.contact_email?.split('@')[0] || 'Partner Sin Nombre'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-[#13ec80]"></span>
                                                                    {p.contact_email}
                                                                </p>
                                                                {isInactive && (
                                                                    <span className="mt-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/20 inline-block tracking-tighter">Inactivo / De Baja</span>
                                                                )}
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
                                                                onClick={() => setShowTopUp({ id: p.id, name: p.company_name || p.name })}
                                                                className="text-[10px] font-black text-[#13ec80] border border-[#13ec80]/30 px-4 py-2 rounded-lg hover:bg-[#13ec80]/10 transition-all flex items-center gap-2"
                                                            >
                                                                RECARGAR
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPartner(p);
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
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Visor de Registros Maestro</h2>
                                    <p className="text-slate-500 text-sm">Monitor de actividad y salud del motor en tiempo real</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <select
                                            value={logFilterPartner}
                                            onChange={(e) => setLogFilterPartner(e.target.value)}
                                            className="w-full bg-[#121413] border border-[#1f2b24] rounded-lg px-4 py-2.5 text-xs text-white appearance-none outline-none focus:ring-1 focus:ring-[#13ec80]"
                                        >
                                            <option value="all">Todos los Partners</option>
                                            {partners.map(p => (
                                                <option key={p.id} value={p.id}>{p.name || p.company_name || p.contact_email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={() => fetchData()} className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-[#13ec80] transition-colors flex items-center gap-2">
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
                                    <h3 className="text-2xl font-black text-blue-400">
                                        {recentLogs.filter(l => {
                                            const parts = l.time.split(':');
                                            const logTime = new Date();
                                            logTime.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
                                            // Simplificación: si lo trajo fetchData hoy, es de hoy
                                            return true;
                                        }).length}
                                    </h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Uso API</p>
                                    <h3 className="text-2xl font-black text-purple-400">Escalable</h3>
                                </div>
                                <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Estado Motor</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#13ec80] animate-pulse"></div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Latencia 2.4s</h3>
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
                                <div className="divide-y divide-[#1f2b24]/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {recentLogs
                                        .filter(log => logFilterPartner === 'all' || log.partner_id === logFilterPartner)
                                        .map((log) => (
                                            <div
                                                key={log.id}
                                                onClick={() => {
                                                    if (log.event_id) {
                                                        // Aquí podrías redirigir a una vista de evento si existiera
                                                        showToast(`Viendo detalles de: ${log.title}`, 'info');
                                                    }
                                                }}
                                                className="p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between group cursor-pointer"
                                            >
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
                                                                {log.type === 'success' ? 'SUCCESS' : 'LOG'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500">{log.text}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-bold text-slate-600 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <span className="material-symbols-outlined !text-[10px]">alternate_email</span>
                                                                {log.email}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-amber-500/80 bg-amber-500/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <span className="material-symbols-outlined !text-[10px]">payments</span>
                                                                Cost: ${log.cost.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-mono text-white/50">{log.time}</p>
                                                    <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest group-hover:text-slate-500 transition-colors">ID: {log.id.substring(0, 8)}</p>
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

            <PartnerModal
                isOpen={showCreatePartner || !!editingPartner}
                onClose={() => {
                    setShowCreatePartner(false);
                    setEditingPartner(null);
                }}
                partner={editingPartner}
                onSave={editingPartner ? handleUpdatePartnerSettings : handleCreatePartner}
                isSaving={loading || isSavingPartner}
                onDelete={(p) => setPartnerToDelete({ id: p.id, name: p.company_name || p.name })}
            />


            <TopUpModal
                isOpen={!!showTopUp}
                onClose={() => setShowTopUp(null)}
                targetName={showTopUp?.name || ''}
                onTopUp={handleTopUp}
            />

            <StyleModal
                isOpen={!!editingStyle}
                onClose={() => setEditingStyle(null)}
                style={editingStyle === 'new' ? 'new' : editingStyle}
                stylesMetadata={stylesMetadata}
                stats={{ allGenerations: stats.allGenerations }}
                onImageUpload={handleImageUpload}
                onSave={handleUpdateStyle}
                isSaving={loading}
                onDelete={async (id) => {
                    if (confirm('🚨 ¡ELIMINACIÓN CRÍTICA!\n\n¿Estás seguro de purgar esta identidad de todos los registros del motor?')) {
                        try {
                            setLoading(true);
                            await Promise.all([
                                supabase.from('styles_metadata').delete().eq('id', id),
                                supabase.from('identity_prompts').delete().eq('id', id)
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
            />

            <UserModal
                isOpen={showNewUserModal || !!editingUser}
                onClose={() => {
                    setShowNewUserModal(false);
                    setEditingUser(null);
                }}
                user={editingUser}
                stylesMetadata={stylesMetadata}
                onSave={editingUser ? handleUpdateUser : handleCreateUser}
                isSaving={isSavingUser}
            />

            <DeletePartnerModal
                isOpen={!!partnerToDelete}
                partnerName={partnerToDelete?.name || ''}
                onClose={() => setPartnerToDelete(null)}
                onConfirm={async () => {
                    if (partnerToDelete) {
                        await handleDeletePartner(partnerToDelete.id);
                        setPartnerToDelete(null);
                    }
                }}
            />

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

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {partnerToDelete && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#121413] border border-red-500/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden"
                        >
                            {/* Warning Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] pointer-events-none"></div>

                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                                <span className="material-symbols-outlined !text-4xl">warning</span>
                            </div>

                            <h3 className="text-2xl font-black text-white uppercase text-center mb-2 italic tracking-tighter">Confirmar <span className="text-red-500">Baja</span></h3>
                            <p className="text-slate-400 text-sm text-center mb-8 px-4">
                                ¿Estás seguro de que deseas dar de baja a <span className="text-white font-bold">{partnerToDelete.name}</span>?<br />
                                <span className="text-[10px] uppercase font-black text-red-500/60 tracking-[2px] mt-4 block p-2 bg-red-500/5 rounded-lg border border-red-500/10">Esta acción desactivará su acceso de inmediato</span>
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPartnerToDelete(null)}
                                    className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeletePartner(partnerToDelete.id);
                                        setPartnerToDelete(null);
                                    }}
                                    className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.2)] hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    Confirmar Baja
                                </button>
                            </div>
                        </motion.div>
                    </div>
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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { IDENTITIES } from '../lib/constants';

interface Partner {
    id: string;
    name?: string;
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

interface UseAdminProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useAdmin = ({ showToast }: UseAdminProps) => {
    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [b2cUsers, setB2CUsers] = useState<UserProfile[]>([]);
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
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stylesMetadata, setStylesMetadata] = useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = useState<UserProfile[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
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

            const pendingPartnersData = profilesData.filter(p => p.role === 'pending_partner');
            setPendingPartners(pendingPartnersData);

            const b2cUsersData = profilesData.filter(p => p.role === 'user' || !p.role);
            setB2CUsers(b2cUsersData);

            // --- MERGE LOGIC ---
            const dbStyles = stylesRes?.data || [];
            const dbPrompts = promptsRes?.data || [];
            const styleMap = new Map();

            IDENTITIES.forEach(staticStyle => {
                const dbStyle = dbStyles.find((s: any) => s.id === staticStyle.id);
                const dbPrompt = dbPrompts.find((p: any) => p.id === staticStyle.id);
                const subCatMeta = dbStyles.find((m: any) => m.id?.toLowerCase() === staticStyle.subCategory?.toLowerCase());
                const catMeta = dbStyles.find((m: any) => m.id?.toLowerCase() === staticStyle.category?.toLowerCase());

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

            dbStyles.forEach((dbStyle: any) => {
                if (!dbStyle.label && !dbStyle.image_url) return;
                if (!styleMap.has(dbStyle.id)) {
                    const dbPrompt = dbPrompts.find((p: any) => p.id === dbStyle.id);
                    const subCatMeta = dbStyles.find((m: any) => m.id?.toLowerCase() === dbStyle.subcategory?.toLowerCase());
                    const catMeta = dbStyles.find((m: any) => m.id?.toLowerCase() === dbStyle.category?.toLowerCase());
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

            const finalStyles = Array.from(styleMap.values()).filter((s: any) => {
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
                totalB2CGenerations: b2cUsageTotal,
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
                partner_id: g.events?.partner_id,
                email: g.profiles?.email || 'Guest @ Event',
                cost: 0.12
            })));

        } catch (error: any) {
            console.error('Error fetching data:', error);
            showToast('Error al cargar datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePartner = async (newPartner: any) => {
        try {
            setLoading(true);
            const { data: existingProfile } = await supabase.from('profiles').select('*').eq('email', newPartner.email.toLowerCase()).maybeSingle();
            let targetUserId = existingProfile?.id;

            if (!targetUserId) {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: newPartner.email.toLowerCase(),
                    password: newPartner.password || 'Partner123!',
                });
                if (authError) throw authError;
                targetUserId = authData.user?.id;
            }

            if (!targetUserId) throw new Error("No se pudo obtener o crear el ID del usuario");

            await supabase.from('profiles').upsert({
                id: targetUserId,
                email: newPartner.email.toLowerCase(),
                role: 'partner',
                full_name: newPartner.name
            }, { onConflict: 'id' });

            const partnerObj: any = {
                company_name: newPartner.name,
                contact_email: newPartner.email.toLowerCase(),
                user_id: targetUserId,
                credits_total: Number(newPartner.initialCredits),
                credits_used: 0,
                is_active: true
            };

            const { error: partError } = await supabase.from('partners').insert(partnerObj);
            if (partError && partError.code !== '23505') throw partError;
            if (partError?.code === '23505') {
                await supabase.from('partners').update(partnerObj).eq('contact_email', newPartner.email.toLowerCase());
            }

            showToast('Partner creado con éxito.');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePartner = async (partnerId: string, data: any) => {
        try {
            const { error } = await supabase.from('partners').update(data).eq('id', partnerId);
            if (error) throw error;
            showToast('Partner actualizado');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        }
    };

    const handleTopUpPartner = async (partnerId: string, partnerName: string, amount: number) => {
        try {
            const { data: partner } = await supabase.from('partners').select('credits_total, user_id').eq('id', partnerId).single();
            if (!partner) throw new Error("Partner no encontrado");

            const newTotal = (partner.credits_total || 0) + amount;
            const { error } = await supabase.from('partners').update({ credits_total: newTotal }).eq('id', partnerId);
            if (error) throw error;

            if (partner.user_id) {
                await supabase.from('profiles').update({ credits: newTotal }).eq('id', partner.user_id);
            }

            await supabase.from('wallet_transactions').insert({
                partner_id: partnerId,
                amount: amount,
                type: 'top-up',
                description: 'Recarga administrativa SuperAdmin'
            });

            showToast(`¡${amount} créditos acreditados a ${partnerName}!`);
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        }
    };

    const handleDeletePartner = async (partnerId: string) => {
        try {
            const partner = partners.find(p => p.id === partnerId);
            if (!partner) return false;

            const { error } = await supabase.from('partners').update({ is_active: false }).eq('id', partnerId);
            if (error) throw error;
            showToast('Partner desactivado');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        }
    };

    const handleApprovePartner = async (profileId: string) => {
        try {
            setLoading(true);
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (fetchError || !profile) throw new Error("Perfil no encontrado");

            // 1. Update role to partner
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'partner' })
                .eq('id', profileId);
            if (profileError) throw profileError;

            // 2. Check if already in partners, if not insert
            const { data: existingPartner } = await supabase
                .from('partners')
                .select('id')
                .eq('user_id', profileId)
                .maybeSingle();

            if (!existingPartner) {
                const { error: partnerError } = await supabase
                    .from('partners')
                    .insert({
                        user_id: profileId,
                        contact_email: profile.email,
                        company_name: profile.full_name || profile.email.split('@')[0],
                        credits_total: 0,
                        credits_used: 0,
                        is_active: true
                    });
                if (partnerError) throw partnerError;
            } else {
                await supabase.from('partners').update({ is_active: true }).eq('user_id', profileId);
            }

            showToast('Agencia aprobada con éxito');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error al aprobar: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRejectPartner = async (profileId: string) => {
        try {
            if (!confirm('¿Estás seguro de rechazar esta solicitud? El usuario volverá a ser un usuario básico.')) return false;

            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'user' })
                .eq('id', profileId);

            if (error) throw error;

            showToast('Solicitud rechazada');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (data: any) => {
        try {
            const { error } = await supabase.from('profiles').insert({
                email: data.email.toLowerCase(),
                credits: Number(data.credits),
                unlocked_packs: data.packs.split(',').map((p: string) => p.trim()).filter(Boolean),
                role: 'user'
            });
            if (error) throw error;
            showToast('Usuario creado');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        }
    };

    const handleUpdateUser = async (userId: string, data: any) => {
        try {
            const { error } = await supabase.from('profiles').update(data).eq('id', userId);
            if (error) throw error;
            showToast('Usuario actualizado');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        }
    };

    const handleUpdateStyle = async (formData: any) => {
        try {
            setIsSaving(true);
            const { prompt, ...styleData } = formData;

            // Prepare prompt object for identity_prompts table
            const promptObj = {
                id: styleData.id,
                master_prompt: prompt,
                updated_at: new Date().toISOString()
            };

            const { error: styleError } = await supabase
                .from('styles_metadata')
                .upsert(styleData);

            if (styleError) throw styleError;

            const { error: promptError } = await supabase
                .from('identity_prompts')
                .upsert(promptObj);

            if (promptError) throw promptError;

            showToast('Identidad sincronizada correctamente');
            fetchData();
            return true;
        } catch (error: any) {
            showToast('Error de sincronización: ' + error.message, 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleStyleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return null;

        try {
            setIsSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `styles/${fileName}`;

            const { error: uploadError } = await (supabase.storage as any)
                .from('styles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = (supabase.storage as any)
                .from('styles')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            showToast('Error al subir imagen: ' + error.message, 'error');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        loading,
        isSaving,
        partners,
        b2cUsers,
        stats,
        b2cStats,
        partnerStats,
        recentLogs,
        stylesMetadata,
        pendingPartners,
        fetchData,
        handleCreatePartner,
        handleUpdatePartner,
        handleTopUpPartner,
        handleDeletePartner,
        handleApprovePartner,
        handleRejectPartner,
        handleCreateUser,
        handleUpdateUser,
        handleUpdateStyle,
        handleStyleImageUpload
    };
};

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Partner, Event, Client } from '../types/index';
import { PREFERRED_PACK_ORDER } from '../lib/constants';

interface UsePartnerDashboardProps {
    profile: any;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const usePartnerDashboard = ({ profile, showToast }: UsePartnerDashboardProps) => {
    const [loading, setLoading] = useState(false);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [generationsData, setGenerationsData] = useState<any[]>([]);
    const [recentGlobalPhotos, setRecentGlobalPhotos] = useState<any[]>([]);

    const fetchPartnerData = useCallback(async () => {
        if (!profile) return;
        try {
            setLoading(true);
            let targetPartnerId = profile.partner_id;
            let isVirtual = false;

            if (!targetPartnerId) {
                const { data: existingPartner } = await supabase
                    .from('partners')
                    .select('id')
                    .or(`user_id.eq.${profile.id},contact_email.eq.${profile.email}`)
                    .single();

                if (existingPartner) {
                    targetPartnerId = existingPartner.id;
                } else {
                    isVirtual = true;
                }
            }

            if (isVirtual) {
                setPartner({
                    id: profile.id,
                    name: profile.full_name || profile.email.split('@')[0],
                    credits_total: profile.credits || 0,
                    credits_used: profile.total_generations || 0,
                    is_virtual: true,
                    config: { primary_color: '#135bec', logo_url: null }
                } as any);

                const [eRes, tRes] = await Promise.all([
                    supabase.from('events').select('*').eq('partner_id', profile.id).order('created_at', { ascending: false }),
                    supabase.from('wallet_transactions').select('*').eq('partner_id', profile.id).order('created_at', { ascending: false })
                ]);

                setEvents(eRes.data || []);
                setTransactions(tRes.data || []);
            } else {
                const [pRes, eRes, tRes] = await Promise.all([
                    supabase.from('partners').select('*').eq('id', targetPartnerId).single(),
                    supabase.from('events').select('*').eq('partner_id', targetPartnerId).order('created_at', { ascending: false }),
                    supabase.from('wallet_transactions').select('*').eq('partner_id', targetPartnerId).order('created_at', { ascending: false })
                ]);

                if (pRes.error) throw pRes.error;
                setPartner(pRes.data);
                setTransactions(tRes.data || []);


                if (eRes.data && eRes.data.length > 0) {
                    const eventIds = eRes.data.map(ev => ev.id);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    const { data: gens } = await supabase
                        .from('generations')
                        .select('id, created_at, event_id, image_url')
                        .in('event_id', eventIds)
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false });

                    setGenerationsData(gens || []);
                    setRecentGlobalPhotos(gens?.slice(0, 10) || []);
                }
                setEvents(eRes.data || []);
                const { data: clientsRes } = await supabase.from('clients').select('*').eq('partner_id', targetPartnerId).order('name');
                setClients(clientsRes || []);
            }
        } catch (error) {
            console.error('Error fetching partner data:', error);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchPartnerData();
    }, [fetchPartnerData]);

    const getClientBalance = useCallback((clientIdOrEmail: string) => {
        const client = clients.find(c => c.id === clientIdOrEmail || c.email === clientIdOrEmail);
        if (!client) return 0;
        const allocated = events
            .filter(e => e.client_id === client.id || e.client_email === client.email)
            .reduce((acc, curr) => acc + (curr.credits_allocated || 0), 0);
        return client.credits_total - allocated;
    }, [clients, events]);

    const handleCreateEvent = async (eventData: any) => {
        if (!partner) return;
        const client = clients.find(c => c.email === eventData.client_email);
        const creditsNeeded = Number(eventData.credits);

        if (client) {
            const available = getClientBalance(client.id);
            if (creditsNeeded > available) {
                showToast(`Créditos insuficientes en la cuenta del cliente (Disponibles: ${available}).`, 'error');
                return false;
            }
        } else if (creditsNeeded > (partner.credits_total - partner.credits_used)) {
            showToast('Créditos insuficientes en tu balance mayorista.', 'error');
            return false;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('events').insert([
                {
                    partner_id: partner.id,
                    client_id: client?.id || null,
                    event_name: eventData.name,
                    client_email: eventData.client_email,
                    event_slug: eventData.slug || eventData.name.toLowerCase().replace(/\s+/g, '-'),
                    credits_allocated: creditsNeeded,
                    credits_used: 0,
                    start_date: new Date(eventData.start_date).toISOString(),
                    end_date: new Date(eventData.end_date).toISOString(),
                    is_active: true,
                    selected_styles: eventData.selected_styles
                }
            ]);

            if (error) throw error;

            if (!client) {
                if (partner.is_virtual) {
                    await supabase.from('profiles').update({ credits: Math.max(0, partner.credits_total - creditsNeeded) }).eq('id', profile.id);
                } else {
                    await supabase.from('partners').update({ credits_used: (partner.credits_used || 0) + creditsNeeded }).eq('id', partner.id);
                }
            }

            showToast('Evento creado con éxito');
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error al crear el evento: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;
            showToast('Evento eliminado');
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error al eliminar: ' + error.message, 'error');
            return false;
        }
    };

    const handleUpdateEvent = async (eventId: string, eventData: any) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('events')
                .update({
                    event_name: eventData.event_name,
                    event_slug: eventData.event_slug,
                    start_date: new Date(eventData.start_date).toISOString(),
                    end_date: new Date(eventData.end_date).toISOString(),
                    is_active: eventData.is_active,
                    selected_styles: eventData.selected_styles
                })
                .eq('id', eventId);
            if (error) throw error;
            showToast('Evento actualizado');
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error al actualizar: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (clientData: any) => {
        if (!partner) return;
        try {
            setLoading(true);
            const { error } = await supabase.from('clients').insert([{
                partner_id: partner.id,
                name: clientData.name,
                email: clientData.email,
                contact_person: clientData.contact_person,
                phone: clientData.phone,
                contracted_styles: clientData.contracted_styles || [],
                invitation_sent_at: new Date().toISOString()
            }]);
            if (error) throw error;
            showToast('Cliente creado con éxito');
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async (clientId: string, clientData: any) => {
        try {
            setLoading(true);
            const { error } = await supabase.from('clients').update({
                name: clientData.name,
                email: clientData.email,
                contact_person: clientData.contact_person,
                phone: clientData.phone,
                contracted_styles: clientData.contracted_styles
            }).eq('id', clientId);
            if (error) throw error;
            showToast('Cliente actualizado');
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleClientTopUp = async (clientId: string, clientName: string, amount: number) => {
        if (!partner) return;
        try {
            setLoading(true);
            const { error } = await supabase.rpc('transfer_credits_to_client', {
                p_partner_id: partner.id,
                p_client_id: clientId,
                p_amount: amount
            });
            if (error) throw error;
            showToast(`¡${amount} créditos asignados a ${clientName}!`);
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleResendInvitation = async (client: Client) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('clients')
                .update({ invitation_sent_at: new Date().toISOString() })
                .eq('id', client.id);

            if (error) throw error;

            showToast(`Invitación re-enviada a ${client.email}`);
            fetchPartnerData();
            return true;
        } catch (error: any) {
            showToast('Error: ' + error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleTopUpEvent = async (event: any, amount: number) => {
        if (!partner) return;
        const client = clients.find(c => c.id === event.client_id || c.email === event.client_email);

        if (client) {
            const available = getClientBalance(client.id);
            if (amount > available) {
                showToast(`Créditos insuficientes en la cuenta del cliente (Disponibles: ${available}).`, 'error');
                return false;
            }
        } else {
            const partnerAvailable = (partner.credits_total || 0) - (partner.credits_used || 0);
            if (amount > partnerAvailable) {
                showToast('No tienes créditos suficientes en tu balance mayorista.', 'error');
                return false;
            }
        }

        try {
            setLoading(true);
            const { error: eErr } = await supabase
                .from('events')
                .update({ credits_allocated: (event.credits_allocated || 0) + amount })
                .eq('id', event.id);
            if (eErr) throw eErr;

            if (!client) {
                if (partner.is_virtual) {
                    await supabase.from('profiles').update({ credits: Math.max(0, partner.credits_total - amount) }).eq('id', profile.id);
                } else {
                    await supabase.from('partners').update({ credits_used: (partner.credits_used || 0) + amount }).eq('id', partner.id);
                }
            }

            await supabase.from('wallet_transactions').insert({
                partner_id: partner.id,
                amount: amount,
                type: 'usage',
                description: `Transferencia a evento: ${event.event_name}` + (client ? ` (Saldo Cliente: ${client.name})` : '')
            });

            showToast(`Se han transferido ${amount} créditos.`);
            fetchPartnerData();
            return true;
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan: any) => {
        if (!partner) return;
        try {
            setLoading(true);
            const redirectUrl = window.location.href;
            const response = await fetch('https://elesttjfwfhvzdvldytn.supabase.co/functions/v1/mercadopago-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: partner.id,
                    credits: plan.qty,
                    price: plan.price,
                    pack_name: plan.label,
                    redirect_url: redirectUrl
                })
            });

            const data = await response.json();
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error(data.message || 'Error al iniciar pago');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        partner,
        events,
        transactions,
        clients,
        generationsData,
        recentGlobalPhotos,
        fetchPartnerData,
        getClientBalance,
        handleCreateEvent,
        handleUpdateEvent,
        handleDeleteEvent,
        handleCreateClient,
        handleUpdateClient,
        handleClientTopUp,
        handleResendInvitation,
        handleTopUpEvent,
        handlePurchase
    };
};

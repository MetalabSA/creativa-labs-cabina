import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertTriangle,
    Info,
    X,
    ArrowLeft
} from 'lucide-react';
import { Client } from '../../types/index';

// Hooks
import { usePartnerDashboard } from '../../hooks/usePartnerDashboard';
import { useBranding } from '../../hooks/useBranding';
import { useGeneration } from '../../hooks/useGeneration';

// Components
import { DashboardHeader } from './partner/DashboardHeader';
import { OverviewSection } from './partner/OverviewSection';
import { ClientsSection } from './partner/ClientsSection';
import { EventsSection } from './partner/EventsSection';
import { ModerationSection } from './partner/ModerationSection';
import { BrandingPanel } from './partner/BrandingPanel';
import { WalletSection } from './partner/WalletSection';

// Modals
import { CreateEventModal } from './partner/modals/CreateEventModal';
import { EditEventModal } from './partner/modals/EditEventModal';
import { ClientModal } from './partner/modals/ClientModal';
import { ClientTopUpModal } from './partner/modals/ClientTopUpModal';
import { EventTopUpModal } from './partner/modals/EventTopUpModal';
import { DeleteEventModal } from './partner/modals/DeleteEventModal';

interface PartnerDashboardProps {
    user: any;
    profile: any;
    onBack: () => void;
    initialView?: 'overview' | 'events' | 'wallet' | 'branding';
    onProxyClient?: (email: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
    user,
    profile,
    onBack,
    initialView = 'overview',
    onProxyClient
}) => {
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 4000);
    }, []);

    const {
        loading: dashboardLoading,
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
        handleTopUpEvent
    } = usePartnerDashboard({ profile, showToast });

    const {
        brandingConfig,
        setBrandingConfig,
        isSaving: isSavingBranding,
        isUploading: isUploadingLogo,
        toggleStylePreset,
        handleUpdateBranding,
        handleLogoUpload
    } = useBranding({
        partner,
        initialConfig: partner?.config,
        showToast
    });

    const {
        eventPhotos,
        loading: photosLoading,
        moderationLoading: bulkLoading,
        fetchEventPhotos,
        handleDeletePhoto,
        handleBulkDelete,
        selectedPhotos,
        setSelectedPhotos
    } = useGeneration({ showToast });

    const moderationLoading = photosLoading || bulkLoading;

    // Local UI states only
    const [view, setView] = useState<'overview' | 'events' | 'branding' | 'wallet' | 'moderation' | 'clients'>(initialView);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Modal & Selection States
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [eventToTopUp, setEventToTopUp] = useState<any | null>(null);
    const [topUpAmount, setTopUpAmount] = useState(100);
    const [eventToDelete, setEventToDelete] = useState<any | null>(null);
    const [eventToModerate, setEventToModerate] = useState<any | null>(null);
    const [showCreateClientModal, setShowCreateClientModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showClientTopUpModal, setShowClientTopUpModal] = useState<Client | null>(null);
    const [clientTopUpAmount, setClientTopUpAmount] = useState(1000);
    const [moderationSearchTerm, setModerationSearchTerm] = useState('');
    const [moderationDateFilter, setModerationDateFilter] = useState('');

    const [newEvent, setNewEvent] = useState({
        name: '',
        slug: '',
        client_email: '',
        credits: 500,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        selected_styles: [] as string[]
    });

    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        contact_person: '',
        phone: '',
        contracted_styles: [] as string[]
    });

    const loading = dashboardLoading || localLoading || isSavingBranding || isUploadingLogo || moderationLoading;

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = (event.event_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.event_slug || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClient = !selectedClientId || event.client_email === selectedClientId;
            return matchesSearch && matchesClient;
        });
    }, [events, searchTerm, selectedClientId]);

    // MP Return Handling
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status') || params.get('collection_status');

        if (status === 'approved' || status === 'success') {
            showToast('¡Recarga acreditada con éxito! 🎉', 'success');
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            fetchPartnerData();
        } else if (status === 'failure') {
            showToast('El pago no pudo procesarse. Reintenta.', 'error');
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [fetchPartnerData, showToast]);

    // Sync view if initialView changes
    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    useEffect(() => {
        if (eventToModerate) {
            fetchEventPhotos(eventToModerate.id);
        }
    }, [eventToModerate, fetchEventPhotos]);

    useEffect(() => {
        fetchPartnerData();
    }, [profile.partner_id, fetchPartnerData]);

    // Actions
    const onClientCreate = async (data: any) => {
        const success = await handleCreateClient(data);
        if (success) setShowCreateClientModal(false);
    };

    const onClientUpdate = async (data: any) => {
        if (!editingClient) return;
        const success = await handleUpdateClient(editingClient.id, data);
        if (success) setEditingClient(null);
    };

    const onEventCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await handleCreateEvent(newEvent);
        if (success) {
            setShowCreateEventModal(false);
            setNewEvent({ name: '', slug: '', client_email: '', credits: 500, start_date: '', end_date: '', selected_styles: [] });
        }
    };

    const onEventUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;
        const success = await handleUpdateEvent(editingEvent.id, editingEvent);
        if (success) setEditingEvent(null);
    };

    const onClientTopUp = async () => {
        if (!showClientTopUpModal) return;
        const success = await handleClientTopUp(showClientTopUpModal.id, showClientTopUpModal.name, clientTopUpAmount);
        if (success) setShowClientTopUpModal(null);
    };

    const onEventTopUp = async () => {
        if (!eventToTopUp) return;
        const success = await handleTopUpEvent(eventToTopUp, topUpAmount);
        if (success) setEventToTopUp(null);
    };

    const onEventDelete = async () => {
        if (!eventToDelete) return;
        const success = await handleDeleteEvent(eventToDelete.id);
        if (success) setEventToDelete(null);
    };

    return (
        <div className="min-h-screen bg-[#071121] text-white font-['Outfit'] selection:bg-[#135bec]/30 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="group flex items-center gap-3 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-[3px]"
                >
                    <div className="size-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Volver al Inicio
                </button>

                <DashboardHeader
                    partnerName={partner?.name}
                    view={view}
                    setView={setView}
                />

                <main>
                    <AnimatePresence mode="wait">
                        {view === 'overview' && (
                            <OverviewSection
                                partner={partner}
                                events={events}
                                generationsData={generationsData}
                                setView={setView}
                            />
                        )}

                        {view === 'clients' && (
                            <ClientsSection
                                clients={clients}
                                events={events}
                                setShowCreateClientModal={setShowCreateClientModal}
                                setEditingClient={setEditingClient}
                                setShowClientTopUpModal={setShowClientTopUpModal}
                                setSelectedClientId={setSelectedClientId}
                                setView={setView}
                                exportClientReport={(client) => {
                                    showToast(`Exportando reporte de ${client.name}...`, 'info');
                                }}
                            />
                        )}

                        {view === 'events' && (
                            <EventsSection
                                events={events}
                                filteredEvents={filteredEvents}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectedClientId={selectedClientId}
                                setSelectedClientId={setSelectedClientId}
                                setShowCreateEventModal={setShowCreateEventModal}
                                setEditingEvent={setEditingEvent}
                                setEventToTopUp={setEventToTopUp}
                                setEventToDelete={setEventToDelete}
                                setEventToModerate={(ev) => {
                                    setEventToModerate(ev);
                                    setView('moderation');
                                }}
                                setView={setView}
                            />
                        )}

                        {view === 'wallet' && (
                            <WalletSection
                                availableCredits={(partner?.credits_total || 0) - (partner?.credits_used || 0)}
                                partner={partner}
                                events={events}
                                transactions={transactions}
                                setShowTopUpModal={() => setView('wallet')} // Example back-ref
                            />
                        )}

                        {view === 'branding' && (
                            <BrandingPanel
                                brandingConfig={brandingConfig}
                                setBrandingConfig={setBrandingConfig}
                                isSavingBranding={isSavingBranding}
                                handleLogoUpload={handleLogoUpload}
                                handleUpdateBranding={handleUpdateBranding}
                                toggleStylePreset={toggleStylePreset}
                                recentGlobalPhotos={recentGlobalPhotos}
                                events={events}
                                setView={setView}
                            />
                        )}

                        {view === 'moderation' && eventToModerate && (
                            <ModerationSection
                                eventToModerate={eventToModerate}
                                setView={setView}
                                filteredPhotos={eventPhotos.filter(p =>
                                    (!moderationSearchTerm || p.profiles?.email?.toLowerCase().includes(moderationSearchTerm.toLowerCase()) || p.id.includes(moderationSearchTerm)) &&
                                    (!moderationDateFilter || p.created_at.startsWith(moderationDateFilter))
                                )}
                                eventPhotos={eventPhotos}
                                moderationSearchTerm={moderationSearchTerm}
                                setModerationSearchTerm={setModerationSearchTerm}
                                moderationDateFilter={moderationDateFilter}
                                setModerationDateFilter={setModerationDateFilter}
                                showToast={showToast}
                                handleDeletePhoto={handleDeletePhoto}
                                loading={moderationLoading}
                                selectedPhotos={selectedPhotos}
                                setSelectedPhotos={setSelectedPhotos}
                                handleBulkDelete={handleBulkDelete}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals Container */}
            <AnimatePresence>
                <CreateEventModal
                    key="create-event-modal"
                    isOpen={showCreateEventModal}
                    onClose={() => setShowCreateEventModal(false)}
                    newEvent={newEvent}
                    setNewEvent={setNewEvent}
                    clients={clients}
                    partner={partner}
                    brandingConfig={brandingConfig}
                    getClientBalance={getClientBalance}
                    onEventCreate={onEventCreate}
                    loading={loading}
                />

                <EditEventModal
                    key="edit-event-modal"
                    isOpen={!!editingEvent}
                    onClose={() => setEditingEvent(null)}
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    clients={clients}
                    brandingConfig={brandingConfig}
                    onEventUpdate={onEventUpdate}
                    loading={loading}
                />

                <ClientModal
                    key="client-modal"
                    isOpen={showCreateClientModal || !!editingClient}
                    onClose={() => { setShowCreateClientModal(false); setEditingClient(null); }}
                    editingClient={editingClient}
                    newClient={newClient}
                    setNewClient={setNewClient}
                    setEditingClient={setEditingClient}
                    onClientCreate={onClientCreate}
                    onClientUpdate={onClientUpdate}
                    loading={loading}
                />

                <ClientTopUpModal
                    key="client-topup-modal"
                    isOpen={!!showClientTopUpModal}
                    onClose={() => setShowClientTopUpModal(null)}
                    client={showClientTopUpModal}
                    amount={clientTopUpAmount}
                    setAmount={setClientTopUpAmount}
                    partner={partner}
                    onTopUp={onClientTopUp}
                    loading={loading}
                />

                <EventTopUpModal
                    key="event-topup-modal"
                    isOpen={!!eventToTopUp}
                    onClose={() => setEventToTopUp(null)}
                    event={eventToTopUp}
                    amount={topUpAmount}
                    setAmount={setTopUpAmount}
                    availableCredits={(partner?.credits_total || 0) - (partner?.credits_used || 0)}
                    onTopUp={onEventTopUp}
                    loading={loading}
                />

                <DeleteEventModal
                    key="delete-event-modal"
                    isOpen={!!eventToDelete}
                    onClose={() => setEventToDelete(null)}
                    eventToDelete={eventToDelete}
                    onConfirm={onEventDelete}
                />
            </AnimatePresence>

            {/* Toast System */}
            <AnimatePresence>
                {toast.type && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[100]"
                    >
                        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                'bg-[#135bec]/10 border-[#135bec]/20 text-blue-400'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle2 className="size-5" /> :
                                toast.type === 'error' ? <AlertTriangle className="size-5" /> :
                                    <Info className="size-5" />}
                            <p className="text-sm font-bold">{toast.message}</p>
                            <button onClick={() => setToast({ message: '', type: null })} className="ml-2 opacity-50 hover:opacity-100">
                                <X className="size-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

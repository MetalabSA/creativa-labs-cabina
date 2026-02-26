import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../hooks/useAdmin';
import Background3D from '../Background3D';

// Modular Sections
import { AdminHeader } from './admin/AdminHeader';
import { AdminOverview } from './admin/AdminOverview';
import { PartnersSection } from './admin/PartnersSection';
import { B2CSection } from './admin/B2CSection';
import { StyleManager } from './admin/StyleManager';
import { AdminLogsSection } from './admin/AdminLogsSection';

// Modals
import { PartnerModal } from './admin/modals/PartnerModal';
import { TopUpModal } from './admin/modals/TopUpModal';
import { UserModal } from './admin/modals/UserModal';
import { StyleModal } from './admin/modals/StyleModal';
import { DeletePartnerModal } from './admin/modals/DeletePartnerModal';
import { Partner, UserProfile } from './admin/modals/types';

interface AdminProps {
    onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
    // UI State
    const [view, setView] = useState<'overview' | 'partners' | 'b2c' | 'styles' | 'logs' | 'settings'>('overview');
    const [showCreatePartner, setShowCreatePartner] = useState(false);
    const [showTopUp, setShowTopUp] = useState<{ id: string, name: string } | null>(null);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [showInactivePartners, setShowInactivePartners] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<{ id: string, name: string } | null>(null);
    const [editingStyle, setEditingStyle] = useState<any | null>(null);

    // Business Logic Hook
    const {
        loading,
        partners,
        pendingPartners,
        b2cUsers,
        stats,
        b2cStats,
        partnerStats,
        recentLogs,
        stylesMetadata,
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
        toast,
        showToast
    } = useAdmin();

    if (loading && partners.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#0a0c0b] flex items-center justify-center z-[100]">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-16 border-4 border-[#13ec80]/20 border-t-[#13ec80] rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-white uppercase tracking-[4px] animate-pulse">Iniciando Protocolos Admin...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0c0b] text-white selection:bg-[#13ec80] selection:text-black pb-20">
            <Background3D />

            <AdminHeader view={view} setView={setView} onBack={onBack} />

            <div className="max-w-7xl mx-auto px-6 pt-32 relative z-10">
                <AnimatePresence mode="wait">
                    {view === 'overview' && (
                        <AdminOverview
                            key="overview"
                            stats={stats}
                            b2cStats={b2cStats}
                            partnerStats={partnerStats}
                            recentLogs={recentLogs}
                            fetchData={fetchData}
                            setView={setView}
                            partners={partners}
                        />
                    )}

                    {view === 'partners' && (
                        <PartnersSection
                            key="partners"
                            partners={partners}
                            pendingPartners={pendingPartners}
                            partnerStats={partnerStats}
                            showInactivePartners={showInactivePartners}
                            setShowInactivePartners={setShowInactivePartners}
                            setShowCreatePartner={setShowCreatePartner}
                            setShowTopUp={setShowTopUp}
                            setEditingPartner={setEditingPartner}
                            setPartnerForm={() => { }} // Legacy prop if needed
                            onApprovePartner={handleApprovePartner}
                            onRejectPartner={handleRejectPartner}
                        />
                    )}

                    {view === 'b2c' && (
                        <B2CSection
                            key="b2c"
                            b2cUsers={b2cUsers}
                            b2cStats={b2cStats}
                            stats={stats}
                            setEditingUser={setEditingUser}
                            setShowTopUp={setShowTopUp}
                            setShowNewUserModal={setShowNewUserModal}
                        />
                    )}

                    {view === 'styles' && (
                        <StyleManager
                            key="styles"
                            stylesMetadata={stylesMetadata}
                            setEditingStyle={setEditingStyle}
                            fetchData={fetchData}
                            showToast={showToast}
                        />
                    )}

                    {view === 'logs' && (
                        <AdminLogsSection
                            key="logs"
                            recentLogs={recentLogs}
                            partners={partners}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCreatePartner && (
                    <PartnerModal
                        isOpen={true}
                        onClose={() => setShowCreatePartner(false)}
                        onSave={handleCreatePartner}
                    />
                )}

                {editingPartner && (
                    <PartnerModal
                        isOpen={true}
                        partner={editingPartner}
                        onClose={() => setEditingPartner(null)}
                        onSave={handleUpdatePartner}
                        onDelete={(id, name) => setPartnerToDelete({ id, name })}
                    />
                )}

                {showTopUp && (
                    <TopUpModal
                        isOpen={true}
                        target={showTopUp}
                        onClose={() => setShowTopUp(null)}
                        onConfirm={handleTopUpPartner}
                    />
                )}

                {(showNewUserModal || editingUser) && (
                    <UserModal
                        isOpen={true}
                        user={editingUser}
                        onClose={() => {
                            setShowNewUserModal(false);
                            setEditingUser(null);
                        }}
                        onSave={editingUser ? handleUpdateUser : handleCreateUser}
                        isSaving={isSaving}
                        stylesMetadata={stylesMetadata}
                    />
                )}

                {editingStyle && (
                    <StyleModal
                        isOpen={true}
                        style={editingStyle}
                        onClose={() => setEditingStyle(null)}
                        onSave={handleUpdateStyle}
                        onImageUpload={handleStyleImageUpload}
                        isSaving={isSaving}
                        stylesMetadata={stylesMetadata}
                        stats={stats}
                    />
                )}

                {partnerToDelete && (
                    <DeletePartnerModal
                        isOpen={true}
                        partner={partnerToDelete}
                        onClose={() => setPartnerToDelete(null)}
                        onConfirm={async () => {
                            const success = await handleDeletePartner(partnerToDelete.id);
                            if (success) setPartnerToDelete(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Global Toast */}
            <AnimatePresence>
                {toast.type && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[3px] z-[100] shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${toast.type === 'error'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-[#13ec80]/20 text-[#13ec80] border-[#13ec80]/30'
                            }`}
                    >
                        <span className="material-symbols-outlined !text-lg">
                            {toast.type === 'error' ? 'error' : 'check_circle'}
                        </span>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};

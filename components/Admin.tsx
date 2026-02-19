import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Search,
    UserPlus,
    MoreHorizontal,
    Shield,
    CreditCard,
    Activity,
    Users,
    Trash2,
    Settings,
    Edit2,
    CheckCircle2,
    XCircle,
    Download,
    X,
    Plus,
    Minus,
    ExternalLink
} from 'lucide-react';

interface AdminProps {
    IDENTITIES: any;
    onBack: () => void;
    initialView?: 'dashboard' | 'users' | 'partners' | 'styles';
}

export const Admin: React.FC<AdminProps> = ({ IDENTITIES, onBack, initialView = 'dashboard' }) => {
    const [activeTab, setActiveTab] = useState(initialView);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null); // State for editing

    // Form state for new user
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        role: 'client',
        is_master: false
    });

    // Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCredits: 0,
        activeEvents: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profilesRes, partnersRes] = await Promise.all([
                supabase.from('profiles').select('*, partner:partners(*)').order('created_at', { ascending: false }),
                supabase.from('partners').select('*').order('name', { ascending: true })
            ]);

            if (profilesRes.error) throw profilesRes.error;
            setProfiles(profilesRes.data || []);
            setPartners(partnersRes.data || []);

            // Calculate stats
            const totalC = partnersRes.data?.reduce((acc, curr) => acc + (curr.credits_total || 0), 0) || 0;
            setStats({
                totalUsers: profilesRes.data?.length || 0,
                totalCredits: totalC,
                activeEvents: 12 // Placeholder
            });
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCredits = async (partnerId: string, amount: number) => {
        if (!partnerId) return;
        try {
            const partner = partners.find(p => p.id === partnerId);
            if (!partner) return;

            const newTotal = (partner.credits_total || 0) + amount;
            const { error } = await supabase
                .from('partners')
                .update({ credits_total: newTotal })
                .eq('id', partnerId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error updating credits:', error);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // 1. Create auth user (Note: This usually needs an edge function or admin API, 
            // but for this MVP we might just insert into profiles if using custom auth or shared login)
            // Assuming for now we insert directly into profiles (trigger handles creation if needed or vice versa)

            const { data, error } = await supabase.from('profiles').insert([
                {
                    email: newUser.email,
                    full_name: newUser.full_name,
                    role: newUser.role,
                    is_master: newUser.is_master
                }
            ]).select();

            if (error) throw error;

            // If partner, create partner record
            if (newUser.role === 'partner') {
                const { error: pError } = await supabase.from('partners').insert([
                    { name: newUser.full_name, user_id: data[0].id, credits_total: 1000, credits_used: 0 }
                ]);
                if (pError) throw pError;
            }

            setShowAddUserModal(false);
            setNewUser({ email: '', full_name: '', role: 'client', is_master: false });
            fetchData();
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error adding user. Check console.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    role: editingUser.role,
                    is_master: editingUser.is_master
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            // If role changed to partner, ensure partner record exists (basic check)
            if (editingUser.role === 'partner') {
                const { data: partnerData } = await supabase.from('partners').select('id').eq('user_id', editingUser.id).single();
                if (!partnerData) {
                    await supabase.from('partners').insert([{ name: editingUser.full_name, user_id: editingUser.id, credits_total: 1000, credits_used: 0 }]);
                }
            }

            setEditingUser(null);
            fetchData();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPartners = partners.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Eagle Eye Admin</h1>
                    <p className="text-slate-400 text-sm">Global control center for user management & infrastructure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#135bec]/10 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#135bec] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('partners')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'partners' ? 'bg-[#135bec] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Partners
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-[#135bec] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Users List
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#135bec] hover:bg-[#135bec]/90 rounded-lg text-sm font-bold text-white shadow-lg shadow-[#135bec]/25 transition-all"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </header>

            {activeTab === 'dashboard' && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
                            <h3 className="text-3xl font-black text-white">{stats.totalUsers}</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 self-start px-2 py-1 rounded">
                            <Activity className="w-3 h-3" /> +5% this week
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Global Credits Distributed</p>
                            <h3 className="text-3xl font-black text-white">{stats.totalCredits.toLocaleString()}</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-[#135bec] font-bold bg-[#135bec]/10 self-start px-2 py-1 rounded">
                            <CreditCard className="w-3 h-3" /> Active Balance
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">System Health</p>
                            <h3 className="text-3xl font-black text-white">99.9%</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 self-start px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3" /> All Systems Operational
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'partners' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white">Registered Partners</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search partners..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:ring-[#135bec] focus:border-[#135bec] w-64 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Partner Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Credits (Used / Total)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Load Credits</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPartners.map(partner => (
                                    <tr key={partner.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded bg-[#135bec]/10 flex items-center justify-center text-[#135bec] font-bold text-xs">
                                                    {partner.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <p className="text-sm font-bold text-white">{partner.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-mono text-white">
                                                    {partner.credits_used?.toLocaleString()} / {partner.credits_total?.toLocaleString()}
                                                </span>
                                                <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#135bec]" style={{ width: `${(partner.credits_used / partner.credits_total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleUpdateCredits(partner.id, -500)} className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-500"><Minus className="w-4 h-4" /></button>
                                                <button onClick={() => handleUpdateCredits(partner.id, 500)} className="p-1 hover:bg-emerald-500/20 rounded text-slate-400 hover:text-emerald-500"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded text-white transition-all uppercase tracking-widest">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white">All System Users</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:ring-[#135bec] focus:border-[#135bec] w-64 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProfiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                                                    className="size-9 rounded-full bg-slate-800"
                                                    alt="Avatar"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{profile.full_name}</p>
                                                    <p className="text-[10px] text-slate-500">{profile.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile.is_master ? 'bg-amber-500/20 text-amber-500' : profile.role === 'partner' ? 'bg-[#135bec]/20 text-[#135bec]' : 'bg-slate-800 text-slate-400'}`}>
                                                {profile.is_master ? 'Master' : profile.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-slate-400">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setEditingUser(profile)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(profile.id)} className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h3 className="text-xl font-black text-white">EDIT USER</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleEditUser} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all"
                                    value={editingUser.full_name}
                                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Role</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all"
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        <option value="client">Client</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Access Level</label>
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox bg-slate-800 border-white/10 text-[#135bec] rounded"
                                            checked={editingUser.is_master}
                                            onChange={e => setEditingUser({ ...editingUser, is_master: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Master Admin</span>
                                    </label>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-black rounded-xl shadow-xl shadow-[#135bec]/20 transition-all uppercase tracking-[2px] text-xs"
                            >
                                {loading ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h3 className="text-xl font-black text-white">ADD NEW USER</h3>
                            <button onClick={() => setShowAddUserModal(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all"
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Role</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#135bec] outline-none transition-all"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="client">Client</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-2 block">Access Level</label>
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox bg-slate-800 border-white/10 text-[#135bec] rounded"
                                            checked={newUser.is_master}
                                            onChange={e => setNewUser({ ...newUser, is_master: e.target.checked })}
                                        />
                                        <span className="text-xs text-white">Master Admin</span>
                                    </label>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-black rounded-xl shadow-xl shadow-[#135bec]/20 transition-all uppercase tracking-[2px] text-xs"
                            >
                                {loading ? 'CREATING...' : 'CREATE USER ACCOUNT'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// We can keep these interfaces or adapt them
interface Partner {
    id: string;
    name: string;
    credits_total: number;
    credits_used: number;
    config?: any;
}

interface AdminProps {
    IDENTITIES: any;
    onBack: () => void;
    initialView?: string;
}

export const Admin: React.FC<AdminProps> = ({ IDENTITIES, onBack }) => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalPartners: 0,
        totalCreditsSold: 0,
        activeEvents: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [partnersRes, eventsRes] = await Promise.all([
                supabase.from('partners').select('*'),
                supabase.from('events').select('*')
            ]);

            if (partnersRes.error) throw partnersRes.error;

            const partnersData = partnersRes.data || [];
            setPartners(partnersData);

            // Calculate stats
            const totalCredits = partnersData.reduce((acc, curr) => acc + (curr.credits_total || 0), 0);
            const totalUsed = partnersData.reduce((acc, curr) => acc + (curr.credits_used || 0), 0);
            const activeEventsCount = eventsRes.data?.filter(e => e.is_active).length || 0;

            setStats({
                totalGenerations: totalUsed, // Approx as generations
                totalPartners: partnersData.length,
                totalCreditsSold: totalCredits,
                activeEvents: activeEventsCount
            });

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0c0b] text-slate-100 font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[#1f2b24] bg-[#0a0c0b] hidden md:flex flex-col">
                <div className="p-6 border-b border-[#1f2b24] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#13ec80] rounded flex items-center justify-center text-[#0a0c0b]">
                        <span className="material-symbols-outlined !text-[20px] font-bold">visibility</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white uppercase">Eagle-Eye</h1>
                        <p className="text-[10px] text-[#13ec80]/70 uppercase font-medium tracking-[0.2em]">Master Admin</p>
                    </div>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">General</p>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#13ec80]/10 text-[#13ec80] border border-[#13ec80]/20 cursor-pointer">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Overview</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">corporate_fare</span>
                        <span className="text-sm font-medium">Partners</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        <span className="text-sm font-medium">AI Style Engine</span>
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">payments</span>
                        <span className="text-sm font-medium">Ledger</span>
                    </a>
                </nav>
                <div className="p-4 border-t border-[#1f2b24] bg-[#121413]/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-[#13ec80]/20 flex items-center justify-center border border-[#13ec80]/40">
                            <span className="material-symbols-outlined text-[#13ec80] !text-[18px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Admin_Root</p>
                            <p className="text-[10px] text-slate-500 truncate">Platform Owner</p>
                        </div>
                        <button onClick={onBack} className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-white" title="Logout">logout</button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0a0c0b]">
                {/* Top Command Bar */}
                <header className="h-16 border-b border-[#1f2b24] flex items-center justify-between px-8 bg-[#121413]/30 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex-1 max-w-2xl relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 !text-[18px]">search</span>
                        <input className="w-full bg-[#121413] border border-[#1f2b24] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-[#13ec80] focus:border-[#13ec80] placeholder-slate-600 transition-all outline-none" placeholder="Search partner slugs, admin emails, or global event IDs..." type="text" />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">System Time</p>
                            <p className="text-xs font-mono text-[#13ec80] leading-tight">{new Date().toLocaleTimeString('en-US', { hour12: false })} UTC</p>
                        </div>
                        <div className="h-8 w-px bg-[#1f2b24]"></div>
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#13ec80] rounded-full border-2 border-[#0a0c0b]"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {/* 1. Global Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Generations Card */}
                        <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-lg hover:border-[#13ec80]/30 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo Generations</p>
                                <span className="text-[10px] font-bold text-[#13ec80] px-1.5 py-0.5 bg-[#13ec80]/10 rounded tracking-tight">+12.4%</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white leading-none">{stats.totalGenerations.toLocaleString()}</h3>
                                <span className="text-xs text-slate-500">/ Total</span>
                            </div>
                            <div className="mt-4 w-full bg-[#1f2b24] h-1 rounded-full overflow-hidden">
                                <div className="bg-[#13ec80] h-full w-[65%] shadow-[0_0_8px_rgba(19,236,128,0.3)]"></div>
                            </div>
                        </div>

                        {/* Partners Card */}
                        <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-lg hover:border-[#13ec80]/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Partners</p>
                                <span className="material-symbols-outlined text-slate-600 !text-[16px]">groups</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white leading-none">{stats.totalPartners}</h3>
                                <span className="text-xs text-slate-500">Active</span>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500">Global Resellers</p>
                        </div>

                        {/* Credits Card */}
                        <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-lg hover:border-[#13ec80]/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Credits Sold</p>
                                <span className="text-[10px] font-bold text-red-400 px-1.5 py-0.5 bg-red-400/10 rounded tracking-tight">-2.1%</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white leading-none">{(stats.totalCreditsSold / 1000).toFixed(1)}k</h3>
                                <span className="text-xs text-slate-500">Units</span>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500">Avg. $0.12 / credit</p>
                        </div>

                        {/* Status Card */}
                        <div className="bg-[#121413] p-5 border border-[#1f2b24] rounded-lg hover:border-[#13ec80]/30 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI API Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#13ec80]">LIVE</span>
                                    <span className="w-2 h-2 rounded-full bg-[#13ec80] animate-[pulse-green_2s_infinite]"></span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white leading-none">99.9%</h3>
                                <span className="text-xs text-slate-500">Uptime</span>
                            </div>
                            <p className="mt-2 text-[10px] text-[#13ec80]/70 font-mono tracking-tighter uppercase">Pulsing Green • Node-21-Alpha</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* 2. Partner Management Table */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white tracking-tight">Partner Management</h2>
                                <button className="text-xs font-bold text-[#13ec80] border border-[#13ec80]/30 px-3 py-1.5 rounded bg-[#13ec80]/5 hover:bg-[#13ec80]/10 transition-all">Export Report</button>
                            </div>
                            <div className="bg-[#121413] border border-[#1f2b24] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-[#1f2b24]">
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Partner Company</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Credit Pool</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Status</th>
                                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1f2b24]/50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-500">Loading partners...</td>
                                            </tr>
                                        ) : partners.map(partner => (
                                            <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                            {(partner?.name || 'P').substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{partner?.name}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">ID: {(partner?.id || '00000000').substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-mono text-white">{(partner?.credits_total || 0) - (partner?.credits_used || 0)}</p>
                                                        {(((partner?.credits_total || 0) - (partner?.credits_used || 0)) < 100) ? (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse-green_2s_infinite]"></span>
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#13ec80]"></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300">
                                                    {((partner?.credits_total || 0) - (partner?.credits_used || 0)) > 0 ? 'Active' : 'Inactive'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => alert('Top-up logic not implemented yet')}
                                                        className="text-[#13ec80] hover:bg-[#13ec80] hover:text-[#0a0c0b] px-3 py-1 rounded text-xs font-bold border border-[#13ec80]/20 transition-all"
                                                    >
                                                        Top-up
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Global Style Library (Static for now as per design) */}
                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white tracking-tight">Global Style Library</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Engine V4.2 - Stable</p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-4">
                                {/* Styles Mockup */}
                                {['Watercolor', 'Cyberpunk', 'F1 Racing', '3D Render'].map((style, idx) => (
                                    <div key={idx} className="bg-[#121413] border border-[#1f2b24] p-3 rounded-lg flex flex-col gap-3 group">
                                        <div className={`aspect-square rounded-md overflow-hidden relative border border-white/5 bg-gradient-to-br ${idx % 2 === 0 ? 'from-blue-900 to-indigo-900' : 'from-amber-900 to-orange-900'}`}>
                                            {/* Placeholder images */}
                                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-white drop-shadow-md">{style}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-500">Active</span>
                                            <button className="w-8 h-4 bg-[#13ec80] rounded-full relative transition-all">
                                                <span className="absolute right-1 top-1 w-2 h-2 bg-[#0a0c0b] rounded-full"></span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Activity/Alerts Feed */}
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white tracking-tight">System Pulse</h2>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        </div>
                        <div className="bg-[#121413] border border-[#1f2b24] rounded-xl h-64 flex flex-col">
                            <div className="p-4 border-b border-[#1f2b24] bg-white/5 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Logs</p>
                                <span className="material-symbols-outlined !text-[16px] text-slate-500">filter_list</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                <div className="flex gap-3 relative pb-4 before:content-[''] before:absolute before:left-[7px] before:top-6 before:bottom-0 before:w-px before:bg-[#1f2b24]">
                                    <div className="w-3.5 h-3.5 mt-1 rounded-full bg-[#13ec80]/20 border border-[#13ec80]/50 flex items-center justify-center shrink-0">
                                        <div className="w-1 h-1 bg-[#13ec80] rounded-full"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#13ec80] leading-tight">INFO: System Ready</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Dashboard initialized for Admin_Root.</p>
                                        <p className="text-[9px] font-mono text-slate-600 mt-1">Just now</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 relative pb-4">
                                    <div className="w-3.5 h-3.5 mt-1 rounded-full bg-slate-700/50 border border-slate-500/50 flex items-center justify-center shrink-0">
                                        <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 leading-tight">LOG: Database Sync</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Partner data synchronized.</p>
                                        <p className="text-[9px] font-mono text-slate-600 mt-1">1 min ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main >
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
            `}</style>
        </div >
    );
};

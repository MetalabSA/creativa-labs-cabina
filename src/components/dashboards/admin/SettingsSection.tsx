import React from 'react';

interface SettingsSectionProps {
    // Add props if needed, currently they seem to be hardcoded or static in Admin.tsx
}

export const SettingsSection: React.FC<SettingsSectionProps> = () => {
    return (
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
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Access Token (Secret)</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                    defaultValue="APP_USR-secret-token-dummy"
                                    readOnly
                                />
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">lock</span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#13ec80] uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#13ec80] animate-pulse"></span>
                                Conexión En Vivo (Producción)
                            </div>
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
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Webhook Secret Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    className="w-full bg-[#0a0c0b] border border-[#1f2b24] rounded-lg px-4 py-3 text-white outline-none focus:border-[#13ec80] font-mono text-xs pr-10"
                                    defaultValue="KIE_PRO_MET_LAB_30"
                                    readOnly
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
    );
};

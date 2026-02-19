
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Sparkles, RefreshCw, Check, X, QrCode,
    Download, Share2, ArrowRight, ArrowLeft, Loader2,
    Monitor, Layout, Smartphone, Heart, Zap, History,
    Printer, SmartphoneIcon, Info, HelpCircle
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import UploadCard from '../UploadCard';
import { IDENTITIES } from '../../lib/constants';

interface GuestExperienceProps {
    eventConfig: any;
    supabase: any;
    onBackToMain?: () => void;
}

type Step = 'WELCOME' | 'STYLE_SELECTION' | 'CAMERA' | 'PROCESSING' | 'RESULT';

export const GuestExperience: React.FC<GuestExperienceProps> = ({ eventConfig, supabase, onBackToMain }) => {
    const [step, setStep] = useState<Step>('WELCOME');
    const [selectedStyle, setSelectedStyle] = useState<any>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [showQR, setShowQR] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const PHRASES = [
        "Invocando a los genios digitales... ✨",
        "Analizando tu mejor ángulo... 🤳",
        "Mezclando píxeles y creatividad... 🎨",
        "Casi listo para la magia... 🪄",
        "Tu retrato está en el horno digital... 🥨",
        "Ajustando las luces del multiverso... 🌌"
    ];

    // Filter identities based on event config
    const availableStyles = React.useMemo(() => {
        if (eventConfig?.selected_styles?.length > 0) {
            return IDENTITIES.filter(id => eventConfig.selected_styles.includes(id.id));
        }
        return IDENTITIES.slice(0, 8); // Fallback
    }, [eventConfig]);

    useEffect(() => {
        if (processing) {
            const interval = setInterval(() => {
                setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [processing]);

    const initCamera = async () => {
        setCameraError(null);
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error(err);
            setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    };

    useEffect(() => {
        if (step === 'CAMERA') {
            initCamera();
        } else {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    }, [step]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            const width = video.videoWidth;
            const height = video.videoHeight;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, width, height);
                setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
                setStep('CAMERA'); // Keep at camera but show preview
            }
        }
    };

    const handleGenerate = async () => {
        if (!selectedStyle || !capturedImage) return;

        setStep('PROCESSING');
        setProcessing(true);
        setError(null);

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('cabina-vision', {
                body: {
                    user_photo: capturedImage,
                    model_id: selectedStyle.id,
                    aspect_ratio: '9:16', // Fixed for guest simplicity
                    event_id: eventConfig.id,
                    guest_id: `guest_${Date.now()}`
                }
            });

            if (invokeError) throw invokeError;
            if (!data?.success) throw new Error(data?.error || "Error en el procesamiento");

            setResultImage(data.image_url);
            setStep('RESULT');

            // Celebration
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [eventConfig.config?.primary_color || '#7f13ec', '#ffffff']
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lo sentimos, hubo un error. Intenta de nuevo.");
            setStep('RESULT');
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setStep('WELCOME');
        setSelectedStyle(null);
        setCapturedImage(null);
        setResultImage(null);
        setError(null);
    };

    const brandingStyle = {
        '--accent-color': eventConfig?.config?.primary_color || '#7f13ec',
        '--accent-glow': `${eventConfig?.config?.primary_color || '#7f13ec'}40`,
    } as React.CSSProperties;

    return (
        <div
            className="fixed inset-0 bg-[#050505] text-white flex flex-col items-center overflow-hidden z-[100] font-sans selection:bg-accent/30"
            style={brandingStyle}
        >
            {/* Background Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 blur-[150px] rounded-full -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

            {/* Content Container */}
            <main className="relative flex-1 w-full max-w-lg flex flex-col p-6 overflow-y-auto no-scrollbar">

                {/* Header (Branding) */}
                <div className="flex flex-col items-center mb-8 pt-4">
                    {eventConfig.config?.logo_url ? (
                        <motion.img
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            src={eventConfig.config.logo_url}
                            alt="Logo"
                            className="h-12 w-auto object-contain mb-4 drop-shadow-2xl"
                        />
                    ) : (
                        <Sparkles className="w-10 h-10 text-accent mb-4" />
                    )}
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-white/90">
                        {eventConfig.event_name}
                    </h1>
                </div>

                <AnimatePresence mode="wait">
                    {/* 1. WELCOME STEP */}
                    {step === 'WELCOME' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                                    {eventConfig.config?.welcome_text || '¡Bienvenidos a la fiesta!'}
                                </h2>
                                <p className="text-white/40 text-sm uppercase tracking-[4px] font-bold">
                                    Transforma tu foto con IA en segundos
                                </p>
                            </div>

                            <div className="w-full aspect-[4/5] bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                >
                                    <Camera className="w-24 h-24 text-accent drop-shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]" />
                                </motion.div>
                                <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <button
                                onClick={() => setStep('STYLE_SELECTION')}
                                className="w-full py-6 bg-accent rounded-3xl text-lg font-black uppercase tracking-[6px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                Iniciar Experiencia
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </motion.div>
                    )}

                    {/* 2. STYLE SELECTION */}
                    {step === 'STYLE_SELECTION' && (
                        <motion.div
                            key="styles"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="text-center mb-8">
                                <span className="text-accent text-[10px] font-black uppercase tracking-[4px]">Paso 01</span>
                                <h2 className="text-2xl font-black uppercase italic italic">Elegí tu Estilo</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-24">
                                {availableStyles.map((style) => (
                                    <UploadCard
                                        key={style.id}
                                        type="character"
                                        title={style.title}
                                        sampleImageUrl={style.url}
                                        isSelected={selectedStyle?.id === style.id}
                                        onSelect={() => {
                                            setSelectedStyle(style);
                                            setStep('CAMERA');
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 3. CAMERA */}
                    {step === 'CAMERA' && (
                        <motion.div
                            key="camera"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="text-center mb-8">
                                <span className="text-accent text-[10px] font-black uppercase tracking-[4px]">Paso 02</span>
                                <h2 className="text-2xl font-black uppercase italic">¡Sonríe!</h2>
                            </div>

                            <div className="relative w-full aspect-[3/4] rounded-[40px] overflow-hidden bg-black border border-white/10 shadow-2xl">
                                {!capturedImage ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover scale-x-[-1]"
                                        />
                                        {/* Camera Overlay */}
                                        <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
                                            <div className="w-full h-full border border-white/5 flex items-center justify-center">
                                                <div className="w-48 h-64 border border-accent/30 rounded-[100px] border-dashed" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captura" />
                                )}

                                {cameraError && (
                                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center mt-[-40px]">
                                        <X className="w-12 h-12 text-red-500 mb-4" />
                                        <p className="font-bold text-sm uppercase tracking-wider">{cameraError}</p>
                                        <button onClick={initCamera} className="mt-6 px-6 py-3 bg-white/10 rounded-full text-[10px] font-black uppercase">Reintentar</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-6">
                                {!capturedImage ? (
                                    <>
                                        <button
                                            onClick={() => setStep('STYLE_SELECTION')}
                                            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={takePhoto}
                                            className="w-24 h-24 rounded-full bg-white p-1.5 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                        >
                                            <div className="w-full h-full rounded-full border-4 border-black bg-black/5 flex items-center justify-center">
                                                <div className="w-6 h-6 bg-black rounded-full" />
                                            </div>
                                        </button>
                                        <div className="w-16" />
                                    </>
                                ) : (
                                    <div className="w-full space-y-4">
                                        <button
                                            onClick={handleGenerate}
                                            className="w-full py-6 bg-accent rounded-3xl text-lg font-black uppercase tracking-[6px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4"
                                        >
                                            Generar Arte
                                            <Sparkles className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => setCapturedImage(null)}
                                            className="w-full py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-[4px]"
                                        >
                                            Tomar otra foto
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* 4. PROCESSING */}
                    {step === 'PROCESSING' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="relative mb-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-48 h-48 rounded-full border-t-2 border-accent"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border-r-2 border-accent/30"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-12 h-12 text-accent animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black uppercase italic mb-4">Procesando Alquimia...</h2>
                            <p className="text-white/60 text-sm font-medium h-12 italic">
                                "{PHRASES[phraseIndex]}"
                            </p>
                        </motion.div>
                    )}

                    {/* 5. RESULT */}
                    {step === 'RESULT' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center"
                        >
                            {error ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                                        <X className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase text-red-500 italic">Algo salió mal</h3>
                                    <p className="text-white/40 text-sm">{error}</p>
                                    <button onClick={reset} className="px-8 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Reintentar</button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-black uppercase italic text-accent leading-none">¡Increíble!</h2>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[4px] mt-2">Tu Alquimia Digital ha terminado</p>
                                    </div>

                                    <div className="relative w-full aspect-[3/4] rounded-[40px] overflow-hidden border-2 border-accent shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] bg-black mb-8 group">
                                        <img src={resultImage || ''} alt="Resultado" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        <div className="absolute top-4 right-4 z-20">
                                            <button
                                                onClick={() => setShowQR(true)}
                                                className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl"
                                            >
                                                <QrCode className="w-6 h-6 text-white" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = resultImage!;
                                                    link.download = `creativa-${Date.now()}.jpg`;
                                                    link.click();
                                                }}
                                                className="py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[2px] text-[10px] flex items-center justify-center gap-3"
                                            >
                                                <Download className="w-4 h-4" />
                                                Descargar
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!resultImage) return;
                                                    try {
                                                        const response = await fetch(resultImage, { mode: 'cors' });
                                                        const blob = await response.blob();
                                                        const file = new File([blob], `creativa-${Date.now()}.png`, { type: 'image/png' });
                                                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                                                            await navigator.share({
                                                                files: [file],
                                                                title: eventConfig.event_name,
                                                                text: `📸 Mi Alquimia en ${eventConfig.event_name} ✨ metalab30.com`
                                                            });
                                                        } else {
                                                            const text = encodeURIComponent(`📸 ¡Mirá mi foto del evento ${eventConfig.event_name}! ✨ Creada por metalab30.com`);
                                                            window.open(`https://wa.me/?text=${text}`, '_blank');
                                                        }
                                                    } catch (e) {
                                                        const text = encodeURIComponent(`📸 ¡Mirá mi foto del evento ${eventConfig.event_name}! ✨ metalab30.com`);
                                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                                    }
                                                }}
                                                className="py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] flex items-center justify-center gap-3"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                        </div>
                                        <button
                                            onClick={reset}
                                            className="w-full py-4 bg-white/5 text-white/40 rounded-2xl text-[9px] font-black uppercase tracking-[4px]"
                                        >
                                            Hacer otra foto
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Logo Footer */}
            <footer className="py-8 opacity-20 hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-black uppercase tracking-[6px] italic">Powered by Creativa Labs</span>
            </footer>

            {/* QR MODAL */}
            <AnimatePresence>
                {showQR && resultImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <div className="relative w-full max-w-sm bg-[#0a0a0c] rounded-[48px] p-12 border border-white/10 text-center flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,1)]">
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <QrCode className="w-16 h-16 text-accent mb-6" />
                            <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Escanea y Guardá</h3>
                            <p className="text-white/40 text-[9px] uppercase tracking-[3px] mb-10 leading-relaxed">Apuntá con tu cámara<br />para descargar tu Alquimia</p>

                            <div className="p-6 bg-white rounded-[40px] shadow-2xl mb-10">
                                <QRCodeCanvas
                                    value={resultImage}
                                    size={220}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <button
                                onClick={() => setShowQR(false)}
                                className="text-[10px] font-black uppercase tracking-[4px] text-accent hover:text-white"
                            >
                                Volver a la Foto
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

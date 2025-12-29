
import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Sparkles, User, ArrowDown, Printer, AlertTriangle, Loader2 } from 'lucide-react';
import Background3D from './components/Background3D';
import UploadCard from './components/UploadCard';
import { FormState } from './types';

const IDENTITIES = [
  { id: 'f1_a', title: 'Identidad 1', url: `${import.meta.env.BASE_URL}F1-A.jpg` },
  { id: 'f1_b', title: 'Identidad 2', url: `${import.meta.env.BASE_URL}F1-B.jpg` },
  { id: 'f1_c', title: 'Identidad 3', url: `${import.meta.env.BASE_URL}F1-C.jpg` },
  { id: 'f1_d', title: 'Identidad 4', url: `${import.meta.env.BASE_URL}F1-D.jpg` },
  { id: 'bb_a', title: 'Identidad 5', url: `${import.meta.env.BASE_URL}BB-A.jpg` },
  { id: 'bb_b', title: 'Identidad 6', url: `${import.meta.env.BASE_URL}BB-B.jpg` },
  { id: 'bb_c', title: 'Identidad 7', url: `${import.meta.env.BASE_URL}BB-C.jpg` },
  { id: 'bb_d', title: 'Identidad 8', url: `${import.meta.env.BASE_URL}BB-D.jpg` },
  { id: 'suit_a', title: 'Identidad 9', url: `${import.meta.env.BASE_URL}SUIT-A.jpg` },
  { id: 'suit_b', title: 'Identidad 10', url: `${import.meta.env.BASE_URL}SUIT-B.jpg` },
  { id: 'suit_c', title: 'Identidad 11', url: `${import.meta.env.BASE_URL}SUIT-C.jpg` },
  { id: 'suit_d', title: 'Identidad 12', url: `${import.meta.env.BASE_URL}SUIT-D.jpg` },
  { id: 'pb_a', title: 'Identidad 13', url: `${import.meta.env.BASE_URL}PB-A.jpg` },
  { id: 'pb_b', title: 'Identidad 14', url: `${import.meta.env.BASE_URL}PB-B.jpg` },
  { id: 'pb_c', title: 'Identidad 15', url: `${import.meta.env.BASE_URL}PB-C.jpg` },
  { id: 'pb_d', title: 'Identidad 16', url: `${import.meta.env.BASE_URL}PB-D.jpg` }
];

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    selectedIdentity: null,
    details: 'Generación desde Cabina Creativa Labs',
    email: 'booth@creativa.lab',
    aspectRatio: '1:1',
    resolution: '1K',
    outputFormat: 'png'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // New state variables for webhook response
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      let attempts = 0;
      const assignStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else if (attempts < 10) {
          attempts++;
          setTimeout(assignStream, 100);
        }
      };
      assignStream();
    } catch (err: any) {
      console.error(err);
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  useEffect(() => {
    if (showCamera && isCapturing) {
      const timer = setTimeout(initCamera, 300);
      return () => clearTimeout(timer);
    }
  }, [showCamera, isCapturing]);

  useEffect(() => {
    let interval: any;
    if (isSubmitting) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const startCameraAction = () => {
    setShowCamera(true);
    setIsCapturing(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
        setIsCapturing(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedIdentity || !capturedImage) return;

    setIsSubmitting(true);
    setResultImage(null);
    setErrorMessage(null);

    const data = new FormData();
    data.append('user_photo', capturedImage);
    data.append('model_id', formData.selectedIdentity);
    data.append('timestamp', new Date().toISOString());

    try {
      const response = await fetch('https://automatizaciones.metalab30.com/webhook/cabina', {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (result.image_url) {
        setResultImage(result.image_url);
        setIsSuccess(true);
      } else if (result.error) {
        setErrorMessage(result.error);
        setIsSuccess(true);
      } else {
        setErrorMessage("Respuesta desconocida del servidor.");
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!resultImage) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Foto</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
              @media print {
                body { background: none; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${resultImage}" onload="setTimeout(function(){window.print();}, 500);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCapturedImage(null);
    setFormData(p => ({ ...p, selectedIdentity: null }));
    setResultImage(null);
    setErrorMessage(null);
    // Optional: Scroll to top or step 1
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isReady = capturedImage && formData.selectedIdentity;

  return (
    <div className="relative w-full min-h-screen font-sans text-white bg-primary overflow-x-hidden">
      <Background3D />

      {/* Hero */}
      <section className="relative h-[40vh] w-full flex flex-col items-center justify-center z-10 px-4">
        <div className="text-center pointer-events-none">
          <h1 className="font-black text-[clamp(2.5rem,10vw,10rem)] leading-none tracking-tighter uppercase select-none">
            Creativa <span className="text-white/20">Labs</span>
          </h1>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="h-[1px] w-16 bg-accent" />
            <div className="text-[10px] tracking-[0.5rem] text-white/40 uppercase">Photo Booth Experience</div>
          </div>
        </div>
      </section>

      {/* Main Experience */}
      <section className="relative min-h-screen w-full bg-[#050505]/95 backdrop-blur-md border-t border-white/5 py-20 px-6 z-20">
        <div className="max-w-[1200px] mx-auto">

          {/* STEP 1: Capture */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black tracking-[3px] uppercase mb-6">Paso 01</span>
            <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-8">Tu Rostro</h2>

            <div className="flex flex-col items-center gap-8">
              {!capturedImage ? (
                <button
                  onClick={startCameraAction}
                  className="group relative flex items-center justify-center gap-4 px-12 py-6 bg-white/5 border-2 border-white/10 rounded-2xl hover:bg-accent hover:border-accent transition-all duration-500 hover:scale-105"
                >
                  <Camera className="w-6 h-6 text-accent group-hover:text-white" />
                  <span className="font-black tracking-[4px] uppercase text-sm">Iniciar Cámara</span>
                </button>
              ) : (
                <div className="relative group">
                  <div className="w-64 aspect-[4/5] rounded-3xl overflow-hidden border-2 border-accent shadow-[0_0_40px_rgba(255,85,0,0.3)] relative">
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Tu foto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-accent/50 animate-[scan_2s_linear_infinite]" />
                  </div>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-xl z-30"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <p className="mt-4 text-[9px] font-black tracking-[3px] text-accent uppercase">Foto Capturada</p>
                </div>
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="relative py-20 flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-white/5" />
            <div className="relative px-8 bg-[#050505] flex flex-col items-center">
              <ArrowDown className={`w-5 h-5 transition-colors duration-500 ${capturedImage ? 'text-accent' : 'text-white/10'}`} />
            </div>
          </div>

          {/* STEP 2: Identities */}
          <div className={`transition-all duration-700 ${capturedImage ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black tracking-[3px] uppercase mb-6">Paso 02</span>
              <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-12">Elige el Estilo</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                {IDENTITIES.map((identity) => (
                  <UploadCard
                    key={identity.id}
                    type="character"
                    title={identity.title}
                    sampleImageUrl={identity.url}
                    isSelected={formData.selectedIdentity === identity.id}
                    onSelect={() => setFormData(p => ({ ...p, selectedIdentity: identity.id }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: Submit or Result */}
          {!isSuccess ? (
            <div className={`mt-32 max-w-sm mx-auto transition-all duration-700 ${isReady ? 'opacity-100 scale-100' : 'opacity-30 scale-95 pointer-events-none'}`}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isReady}
                className="group relative w-full h-20 rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl"
              >
                <div className={`absolute inset-0 transition-all duration-500 ${isReady ? 'bg-accent' : 'bg-white/10'}`} />
                <div className="relative flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[6px]">
                  {isSubmitting ? (
                    <div className="flex flex-col items-center leading-none">
                      <span>PROCESANDO... {elapsedSeconds}s</span>
                    </div>
                  ) : (
                    <>
                      <span>GENERAR MI FOTO</span>
                      {isReady && <Sparkles className="w-5 h-5 animate-pulse" />}
                    </>
                  )}
                </div>
              </button>
              {isSubmitting && (
                <p className="text-center mt-6 text-[10px] uppercase tracking-[3px] text-accent font-bold animate-pulse">
                  Por favor espera, el alquinista está trabajando...
                </p>
              )}
              {!isSubmitting && (
                <p className="text-center mt-6 text-[8px] uppercase tracking-[3px] text-white/20 font-bold">
                  {!capturedImage ? "* FALTA TU FOTO" : !formData.selectedIdentity ? "* ELIGE UN ESTILO" : "LISTO PARA LA ALQUIMIA"}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-32 p-12 bg-accent/5 border border-accent/20 rounded-[40px] text-center max-w-2xl mx-auto backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">

              {errorMessage ? (
                <>
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-4 uppercase italic text-red-500">Error</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-[2px] leading-relaxed max-w-md">
                    {errorMessage}
                  </p>
                  <p className="text-white/40 text-[10px] uppercase tracking-[2px] mt-4">
                    Por favor, intenta nuevamente el proceso.
                  </p>
                </>
              ) : resultImage ? (
                <>
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,85,0,0.4)]">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-8 uppercase italic">¡Tu Foto Está Lista!</h3>

                  <div className="w-64 aspect-[4/5] rounded-3xl overflow-hidden border-2 border-accent shadow-[0_0_40px_rgba(255,85,0,0.3)] mb-8 bg-black relative">
                    <img src={resultImage} alt="Resultado" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePrint}
                      className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50"
                    >
                      <Printer className="w-5 h-5" />
                      <span className="text-xs font-black tracking-[2px] uppercase">Imprimir</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-8">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <p>Respuesta inesperada del servidor.</p>
                </>
              )}

              <button
                onClick={handleReset}
                className="mt-12 text-[9px] font-black tracking-[4px] uppercase text-white/30 hover:text-white transition-colors"
              >
                Reiniciar Proceso
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-[3/4] bg-primary rounded-[40px] overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-black">
              {isCapturing ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <img src={capturedImage || ''} className="w-full h-full object-cover" alt="Previsualización" />
              )}
              {/* Overlay Técnico */}
              <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
                <div className="w-full h-full border border-white/5 relative flex items-center justify-center">
                  <div className="w-48 h-64 border border-accent/20 rounded-[100px]" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-0 w-full px-10 flex items-center justify-between z-20">
              {isCapturing ? (
                <>
                  <button onClick={() => setShowCamera(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><X className="w-5 h-5" /></button>
                  <button onClick={takePhoto} className="w-20 h-20 rounded-full bg-white p-1 shadow-2xl"><div className="w-full h-full rounded-full border-4 border-black bg-black/5 flex items-center justify-center"><div className="w-4 h-4 bg-black rounded-full" /></div></button>
                  <div className="w-12" />
                </>
              ) : (
                <>
                  <button onClick={() => setIsCapturing(true)} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10"><RefreshCw className="w-5 h-5" /></div><span className="text-[8px] font-black tracking-[2px] uppercase opacity-40">Reintentar</span></button>
                  <button onClick={() => setShowCamera(false)} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg"><Check className="w-6 h-6" /></div><span className="text-[8px] font-black tracking-[2px] uppercase">Listo</span></button>
                  <button onClick={() => { setCapturedImage(null); setShowCamera(false); }} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10"><X className="w-5 h-5" /></div><span className="text-[8px] font-black tracking-[2px] uppercase opacity-40">Cerrar</span></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <footer className="relative py-12 bg-primary border-t border-white/5 text-center z-20">
        <div className="text-white/10 text-[8px] uppercase tracking-[6px] font-bold italic">© 2024 Creativa Labs — Digital Alchemy Studio</div>
      </footer>
    </div>
  );
};

export default App;

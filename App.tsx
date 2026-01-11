import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Search, Sparkles, User, ArrowDown, Printer, AlertTriangle, Loader2, Download, QrCode, Smartphone, Layout, Monitor, Instagram, LogOut, Shield, History as LucideHistory, CreditCard, Zap, Plus } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Background3D from './components/Background3D';
import UploadCard from './components/UploadCard';
import { Auth } from './components/Auth';
import { Admin } from './components/Admin';
import { supabase } from './lib/supabaseClient';
import { FormState } from './types';
import confetti from 'canvas-confetti';

const IDENTITIES = [
  {
    id: 'f1_a',
    title: 'Red Bull Racing',
    url: '/cabina/F1-A.jpg',
    category: 'sports',
    subCategory: 'Formula 1',
    tags: ['speed', 'f1', 'action', 'professional', 'carrera', 'deporte', 'rojo', 'velocidad', 'auto', 'monaco'],
    isPremium: true
  },
  {
    id: 'f1_b',
    title: 'Ferrari Team',
    url: '/cabina/F1-B.jpg',
    category: 'sports',
    subCategory: 'Formula 1',
    tags: ['speed', 'f1', 'classic', 'racing', 'italia', 'rojo', 'leyenda', 'historico', 'caballino'],
    isPremium: true
  },
  {
    id: 'f1_c',
    title: 'Mercedes AMG',
    url: '/cabina/F1-C.jpg',
    category: 'sports',
    subCategory: 'Formula 1',
    tags: ['modern', 'f1', 'tech', 'silver', 'flecha', 'alemania', 'pro', 'campeon', 'plata'],
    isPremium: true
  },
  {
    id: 'f1_d',
    title: 'Pit Stop Vibe',
    url: '/cabina/F1-D.jpg',
    category: 'sports',
    subCategory: 'Formula 1',
    tags: ['mechanic', 'f1', 'teamwork', 'garage', 'trabajo', 'boxes', 'mecanico', 'equipo'],
    isPremium: true
  },
  {
    id: 'bb_a',
    title: 'The Heisenberg',
    url: '/cabina/BB-A.jpg',
    category: 'series',
    subCategory: 'Breaking Bad',
    tags: ['drama', 'meth', 'hat', 'cinematic', 'pelado', 'quimica', 'drogas', 'sombrero', 'lentes']
  },
  {
    id: 'bb_b',
    title: 'Desert Cook',
    url: '/cabina/BB-B.jpg',
    category: 'series',
    subCategory: 'Breaking Bad',
    tags: ['rv', 'desert', 'yellow', 'gasmask', 'careta', 'cocina', 'arena', 'desierto', 'amarillo']
  },
  {
    id: 'bb_c',
    title: 'Better Call Saul',
    url: '/cabina/BB-C.jpg',
    category: 'series',
    subCategory: 'Breaking Bad',
    tags: ['lawyer', 'suit', 'colorful', 'office', 'abogado', 'traje', 'comedia', 'estafador', 'carcel']
  },
  {
    id: 'bb_d',
    title: 'Los Pollos Hermanos',
    url: '/cabina/BB-D.jpg',
    category: 'series',
    subCategory: 'Breaking Bad',
    tags: ['chicken', 'fried', 'restaurant', 'yellow', 'empleado', 'delantal', 'comida', 'fastfood']
  },
  {
    id: 'suit_a',
    title: 'Harvey Specter',
    url: '/cabina/SUIT-A.jpg',
    category: 'series',
    subCategory: 'La Ley de los Audaces',
    tags: ['law', 'executive', 'expensive', 'classy', 'traje', 'corbata', 'lujo', 'abogado', 'exito']
  },
  {
    id: 'suit_b',
    title: 'Mike Ross Style',
    url: '/cabina/SUIT-B.jpg',
    category: 'series',
    subCategory: 'La Ley de los Audaces',
    tags: ['law', 'young', 'genius', 'bicycle', 'bici', 'mochila', 'bolso', 'joven', 'mensajero']
  },
  {
    id: 'suit_c',
    title: 'Donna Paulsen',
    url: '/cabina/SUIT-C.jpg',
    category: 'series',
    subCategory: 'La Ley de los Audaces',
    tags: ['secretary', 'powerful', 'fashion', 'redhead', 'vestido', 'pelirroja', 'secretaria', 'mujer']
  },
  {
    id: 'suit_d',
    title: 'Pearson Hardman',
    url: '/cabina/SUIT-D.jpg',
    category: 'series',
    subCategory: 'La Ley de los Audaces',
    tags: ['firm', 'luxury', 'office', 'success', 'oficina', 'socios', 'empresa', 'corporativo']
  },
  {
    id: 'pb_a',
    title: 'Thomas Shelby',
    url: '/cabina/PB-A.jpg',
    category: 'series',
    subCategory: 'Peaky Blinders',
    tags: ['gangster', 'vintage', 'cap', 'whiskey', 'boina', 'fuego', 'mafia', 'fumar', 'antiguo'],
    isPremium: true
  },
  {
    id: 'pb_b',
    title: 'Birmingham Streets',
    url: '/cabina/PB-B.jpg',
    category: 'series',
    subCategory: 'Peaky Blinders',
    tags: ['industrial', 'smoke', 'horse', 'family', 'caballo', 'niebla', 'calle', 'oscuro', 'frio'],
    isPremium: true
  },
  {
    id: 'pb_c',
    title: 'Garrison Pub',
    url: '/cabina/PB-C.jpg',
    category: 'series',
    subCategory: 'Peaky Blinders',
    tags: ['bar', 'drink', 'meeting', 'gentlemen', 'trago', 'reunion', 'poker', 'londres', 'taberna'],
    isPremium: true
  },
  {
    id: 'pb_d',
    title: 'The Razor Edge',
    url: '/cabina/PB-D.jpg',
    category: 'series',
    subCategory: 'Peaky Blinders',
    tags: ['razor', 'fight', 'strategy', 'british', 'navaja', 'pelea', 'sangre', 'inglaterra'],
    isPremium: true
  },
  {
    id: 'ph_a',
    title: 'Urban Explorer',
    url: '/cabina/PH-A.jpg',
    category: 'urban',
    subCategory: 'Urbano',
    tags: ['street', 'hoodie', 'city', 'night', 'buchon', 'noche', 'grafiti', 'ciudad', 'capucha']
  },
  {
    id: 'ph_b',
    title: 'Studio Portrait',
    url: '/cabina/PH-B.jpg',
    category: 'urban',
    subCategory: 'Urbano',
    tags: ['clean', 'lighting', 'vogue', 'model', 'estudio', 'flash', 'limpio', 'retrato', 'blanco']
  },
  {
    id: 'ph_c',
    title: 'Neon Life',
    url: '/cabina/PH-C.jpg',
    category: 'urban',
    subCategory: 'Urbano',
    tags: ['color', 'neon', 'asia', 'cyberpunk', 'futuro', 'luces', 'noche', 'tokyo', 'led']
  },
  {
    id: 'ph_d',
    title: 'Vintage Film',
    url: '/cabina/PH-D.jpg',
    category: 'urban',
    subCategory: 'Urbano',
    tags: ['analog', 'grainy', 'retro', '90s', 'rollo', 'sepia', 'viejo', 'fotografia', 'vhs']
  },
  {
    id: 'jhonw_a',
    title: 'Baba Yaga',
    url: '/cabina/jhonw_a.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'accion', 'suit', 'weapons', 'venganza', 'traje', 'asesino', 'perro'],
    isPremium: true
  },
  {
    id: 'jhonw_b',
    title: 'The Continental',
    url: '/cabina/jhonw_b.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'hotel', 'neon', 'mercy', 'noche', 'monedas', 'lujo', 'accion'],
    isPremium: true
  },
  {
    id: 'jhonw_c',
    title: 'High Table Legacy',
    url: '/cabina/jhonw_c.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'trama', 'poder', 'oro', 'consejo', 'elegante', 'noir'],
    isPremium: true
  },
  {
    id: 'jhonw_d',
    title: 'Excommunicado',
    url: '/cabina/jhonw_d.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'escape', 'lluvia', 'recompensa', 'reloj', 'correr', 'persecucion'],
    isPremium: true
  },
  {
    id: 'jhonw_e',
    title: 'Desert Assassin',
    url: '/cabina/jhonw_e.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'desierto', 'arena', 'casablanca', 'calor', 'caballo'],
    isPremium: true
  },
  {
    id: 'jhonw_f',
    title: 'Ballerina Soul',
    url: '/cabina/jhonw_f.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'danza', 'pelea', 'ballet', 'teatro', 'elegancia'],
    isPremium: true
  },
  {
    id: 'jhonw_g',
    title: 'Osaka Night',
    url: '/cabina/jhonw_g.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'japon', 'katana', 'neon', 'rojo', 'samurai'],
    isPremium: true
  },
  {
    id: 'jhonw_h',
    title: 'Last Stand',
    url: '/cabina/jhonw_h.jpg',
    category: 'cinema',
    subCategory: 'John Wick',
    tags: ['john wick', 'final', 'amanecer', 'escaleras', 'paris', 'sacrificio'],
    isPremium: true
  },
  {
    id: 'magic_a',
    title: 'El Gran Mago',
    url: '/cabina/magic_a.jpg',
    category: 'fantasy',
    subCategory: 'Magia',
    tags: ['magia', 'magos', 'cartas', 'ilusion', 'truco', 'chistera', 'misterio', 'humo'],
    isPremium: false
  },
  {
    id: 'magic_b',
    title: 'Ilusión Real',
    url: '/cabina/magic_b.jpg',
    category: 'fantasy',
    subCategory: 'Magia',
    tags: ['magia', 'cartas', 'fuego', 'levitacion', 'misterio', 'show', 'escenario', 'magico'],
    isPremium: false
  },
  {
    id: 'magic_c',
    title: 'Arcane Master',
    url: '/cabina/magic_c.jpg',
    category: 'fantasy',
    subCategory: 'Magia',
    tags: ['magia', 'hechizo', 'runas', 'libro', 'poder', 'energia', 'azul'],
    isPremium: false
  },
  {
    id: 'magic_d',
    title: 'Dark Illusion',
    url: '/cabina/magic_d.jpg',
    category: 'fantasy',
    subCategory: 'Magia',
    tags: ['magia', 'oscuro', 'sombras', 'vudu', 'miedo', 'cuervo'],
    isPremium: false
  },
  {
    id: 'magic_e',
    title: 'Street Magic',
    url: '/cabina/magic_e.jpg',
    category: 'fantasy',
    subCategory: 'Magia',
    tags: ['magia', 'calle', 'moneda', 'mano', 'close up', 'asombro'],
    isPremium: false
  },
  {
    id: 'sup_a',
    title: 'The Avenger',
    url: '/cabina/sup_a.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'ironman', 'avengers', 'tech', 'poder', 'vengadores', 'heroe', 'vuelo'],
    isPremium: true
  },
  {
    id: 'sup_b',
    title: 'Legacy of Thor',
    url: '/cabina/sup_b.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'thor', 'hulk', 'god', 'trueno', 'fuerza', 'martillo', 'epico'],
    isPremium: true
  },
  {
    id: 'sup_c',
    title: 'Cosmic Guardian',
    url: '/cabina/sup_c.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'guardian', 'galaxia', 'estrellas', 'vuelo', 'fuerza'],
    isPremium: true
  },
  {
    id: 'sup_d',
    title: 'Emerald Might',
    url: '/cabina/sup_d.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'hulk', 'fuerza', 'verde', 'destruccion', 'enojo'],
    isPremium: true
  },
  {
    id: 'sup_e',
    title: 'Justice Knight',
    url: '/cabina/sup_e.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'batman', 'noche', 'capa', 'justicia', 'murcielago'],
    isPremium: true
  },
  {
    id: 'sup_f',
    title: 'Knight Alt I',
    url: '/cabina/sup_f.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'variante', 'oscuro', 'armadura'],
    isPremium: true
  },
  {
    id: 'sup_g',
    title: 'Knight Alt II',
    url: '/cabina/sup_g.jpg',
    category: 'cinema',
    subCategory: 'Superhéroes',
    tags: ['superheroes', 'variante', 'tecnologico', 'azul'],
    isPremium: true
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Todo', icon: Sparkles },
  { id: 'series', label: 'Series', icon: Monitor },
  { id: 'cinema', label: 'Cine', icon: Layout },
  { id: 'fantasy', label: 'Fantasía', icon: Sparkles },
  { id: 'urban', label: 'Urbano', icon: Camera }
];

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    selectedIdentity: null,
    details: 'Generación desde Cabina Creativa Labs',
    email: 'booth@creativa.lab',
    aspectRatio: '9:16',
    resolution: '1K',
    outputFormat: 'png'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // New state variables for webhook response
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Auth & Profile State
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ credits: number, total_generations: number, is_master?: boolean, unlocked_packs?: string[] } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [userGenerations, setUserGenerations] = useState<any[]>([]);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [packToUnlock, setPackToUnlock] = useState<any>(null);
  const [showPremiumOffer, setShowPremiumOffer] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [stylesMetadata, setStylesMetadata] = useState<any[]>([]);
  const [appStep, setAppStep] = useState<'gallery' | 'setup' | 'processing' | 'result'>('gallery');
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error', action?: () => void }[]>([]);
  const [backgroundJob, setBackgroundJob] = useState<{ active: boolean, id: string | null, startTime: number } | null>(null);

  const PREMIUM_PACK_PRICE = 3000;

  // Merge static identities with DB metadata
  const mergedIdentities = React.useMemo(() => {
    return IDENTITIES.map(style => {
      // Check for individual override OR category-level override
      const meta = stylesMetadata.find(m => m.id === style.id || m.id === style.subCategory);
      return {
        ...style,
        isPremium: meta ? meta.is_premium : style.isPremium
      };
    });
  }, [stylesMetadata]);

  // Lógica "Para Vos": Seleccionamos 4 estilos destacados (aleatorios pero consistentes por sesión)
  const recommendedIdentities = React.useMemo(() => {
    // Definimos algunos IDs que queremos que aparezcan seguro o priorizamos
    const priorityIds = ['jhonw_a', 'sup_a', 'pb_a', 'f1_a', 'magic_a'];
    return mergedIdentities
      .filter(id => priorityIds.includes(id.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
  }, [mergedIdentities]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Log Search Queries (Debounced)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    const timer = setTimeout(async () => {
      try {
        await supabase.from('search_logs').insert({
          query: searchQuery.trim().toLowerCase(),
          user_id: session?.user?.id
        });
      } catch (err) {
        console.error('Error logging search:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery, session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchGenerations();
      fetchStylesMetadata();
    }
  }, [session]);

  const fetchStylesMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('styles_metadata')
        .select('*');
      if (error) throw error;
      setStylesMetadata(data || []);
    } catch (err) {
      console.error('Error fetching styles metadata:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('credits, total_generations, is_master, unlocked_packs')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      setLoadingGenerations(true);
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserGenerations(data || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoadingGenerations(false);
    }
  };

  const handleUnlockPack = async (subCategory: string) => {
    if (!profile || !session?.user) return;

    try {
      setIsUnlocking(true);

      // 1. Verificar saldo
      if (profile.credits < PREMIUM_PACK_PRICE) {
        setPackToUnlock(null);
        setShowPricing(true);
        return;
      }

      // 2. Actualizar en Supabase
      const newUnlockedPacks = [...(profile.unlocked_packs || []), subCategory];
      const newCredits = profile.credits - PREMIUM_PACK_PRICE;

      const { error } = await supabase
        .from('profiles')
        .update({
          credits: newCredits,
          unlocked_packs: newUnlockedPacks
        })
        .eq('id', session.user.id);

      if (error) throw error;

      // 3. Actualizar estado local
      setProfile(prev => prev ? { ...prev, credits: newCredits, unlocked_packs: newUnlockedPacks } : null);
      setPackToUnlock(null);
      setErrorMessage(null);

      // 🎉 Efecto Confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 500 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#ff5500', '#ffffff', '#00d2ff'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#ff5500', '#ffffff', '#00d2ff'] });
      }, 250);

    } catch (error) {
      console.error('Error unlocking pack:', error);
      setErrorMessage('No se pudo desbloquear el pack. Reintenta.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const PHRASES = [
    "Invocando a los genios digitales para tu retrato... ✨",
    "¿Sabías que la IA analiza miles de patrones para crear tu estilo? 🧠",
    "¡Estás quedando increíble! (O al menos eso dice nuestro algoritmo) 😉",
    "Extrayendo creatividad del éter digital... 🌌",
    "Dato curioso: La IA no duerme, pero toma mucho café virtual ☕",
    "Ajustando las luces y sombras para tu obra maestra... 🎨",
    "Casi listo... la perfección toma unos segundos extra ⌛",
    "Convirtiendo píxeles en arte puro para ti 💎",
    "Esperamos que estés disfrutando de la magia de Creativa Labs 🚀",
    "Buscando tu mejor ángulo en el multiverso digital... 🌀"
  ];

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
    let phraseInterval: any;

    if (isSubmitting) {
      setElapsedSeconds(0);
      setCurrentPhraseIndex(0);

      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      phraseInterval = setInterval(() => {
        setCurrentPhraseIndex(prev => (prev + 1) % PHRASES.length);
      }, 6000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      clearInterval(interval);
      clearInterval(phraseInterval);
    };
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
    if (!formData.selectedIdentity || !capturedImage || !session?.user) return;

    // 1. Check total credits (skip if master)
    const isMaster = profile?.is_master;
    if (!isMaster && (!profile || profile.credits < 100)) {
      if (profile && profile.total_generations >= 5) {
        setErrorMessage("Ya gastaste tus 500 créditos.");
      } else {
        setErrorMessage("Saldo insuficiente.");
      }
      setIsSuccess(true);
      setAppStep('result');
      return;
    }

    setIsSubmitting(true);
    setResultImage(null);
    setErrorMessage(null);

    // 2. Check daily limit (2 per day) - Skip if Master
    if (!isMaster) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from('generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', today.toISOString());

        if (countError) throw countError;

        if (count !== null && count >= 2) {
          setErrorMessage("Máximo de impresiones del día alcanzado.");
          setIsSuccess(true);
          setAppStep('result');
          return;
        }
      } catch (err) {
        console.error('Error checking daily limit:', err);
      }
    }

    const data = new FormData();
    data.append('user_photo', capturedImage);
    data.append('model_id', formData.selectedIdentity);
    data.append('aspect_ratio', formData.aspectRatio);
    data.append('email', session.user.email);
    data.append('user_id', session.user.id);
    data.append('timestamp', new Date().toISOString());

    // DASHBOARD UPDATE: Deduct credit before starting (unless master)
    if (!isMaster) {
      try {
        const { error: deductError } = await supabase
          .from('profiles')
          .update({ credits: profile.credits - 100 })
          .eq('id', session.user.id);
        if (deductError) throw deductError;
        // Optimization: update local state so UI reflects it immediately
        setProfile(prev => prev ? { ...prev, credits: prev.credits - 100 } : null);
      } catch (err) {
        console.error('Error early deducting credit:', err);
        setErrorMessage("Error al procesar créditos. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }
    }

    setAppStep('processing'); // Added this line

    try {
      const response = await fetch('https://automatizaciones.metalab30.com/webhook/cabina', {
        method: 'POST',
        body: data // Changed from 'body' to 'data' to match FormData variable
      });

      if (!response.ok) throw new Error('Error en la generación'); // Added this line

      const result = await response.json(); // Renamed from 'data' to 'result' to match original structure

      if (result.image_url) { // Using 'result'
        setResultImage(result.image_url);

        // Update total generations stats
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            total_generations: (profile.total_generations || 0) + 1
          })
          .eq('id', session.user.id);

        if (profileError) console.error('Error updating stats:', profileError);

        await supabase.from('generations').insert({
          user_id: session.user.id,
          style_id: formData.selectedIdentity,
          image_url: result.image_url,
          aspect_ratio: formData.aspectRatio
        });


        fetchProfile();
        fetchGenerations();
        setIsSuccess(true);
        setAppStep('result');
        setBackgroundJob(null);
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          message: '🪄 ¡Tu foto está lista!',
          type: 'success',
          action: () => {
            setAppStep('result');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }]);
      } else {
        // REFUND: If webhook returns error or unknown response
        if (!isMaster) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits }) // Refund to original value
            .eq('id', session.user.id);
          setProfile(prev => prev ? { ...prev, credits: profile.credits } : null);
        }
        setErrorMessage(result.error || "Respuesta desconocida del servidor.");
        setIsSuccess(true);
        setAppStep('result');
      }
    } catch (error) {
      console.error('Submission error:', error);
      // REFUND: On connection error
      if (!isMaster && profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits }) // Refund to original value
          .eq('id', session.user.id);
        setProfile(prev => prev ? { ...prev, credits: profile.credits } : null);
      }
      setErrorMessage("Error de conexión. Créditos devueltos.");
      setIsSuccess(true);
      setAppStep('result');
    } finally {
      setIsSubmitting(false);
      setBackgroundJob(null);
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

  const handleDownload = async () => {
    if (!resultImage) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      // Usar un nombre de archivo amigable
      const filename = `creativa-photo-${Date.now()}.png`;

      // Intentar descargar vía blob para evitar problemas de cross-origin
      const response = await fetch(resultImage, { mode: 'cors' });
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // En móviles, priorizar Share API
      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Mi Foto Creativa',
            text: '¡Mira mi foto generada con IA por Creativa Labs!'
          });
          return;
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') throw shareError;
          return; // Usuario canceló
        }
      }

      // Fallback para descarga estándar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download/Share error:', error);
      // Último recurso: abrir en pestaña nueva o redirección directa
      if (isMobile) {
        window.location.href = resultImage;
      } else {
        window.open(resultImage, '_blank');
      }
    }
  };
  const ASPECT_RATIOS = [
    { id: '9:16', label: '9:16', icon: Smartphone, desc: 'Portrait' },
    { id: '16:9', label: '16:9', icon: Monitor, desc: 'Landscape' },
    { id: '4:5', label: '4:5', icon: Instagram, desc: 'Classic' }
  ];

  const handleReset = () => {
    setCapturedImage(null);
    setResultImage(null);
    setIsSuccess(false);
    setIsSubmitting(false);
    setFormData(p => ({ ...p, selectedIdentity: null }));
    setAppStep('gallery');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isReady = capturedImage && formData.selectedIdentity;

  const handlePayment = async (pack: any) => {
    try {
      setProcessingPayment(pack.name);
      // Simulación temporal hasta tener las llaves definitivas
      setTimeout(() => {
        setErrorMessage("¡Próximamente! Estamos configurando los métodos de pago. Contactanos para obtener créditos anticipados.");
        setIsSuccess(true);
        setShowPricing(false);
        setProcessingPayment(null);
      }, 1000);

      /* 
      // Código de pago real comentado
      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: {
          user_id: session.user.id,
          credits: pack.credits,
          price: pack.price,
          pack_name: pack.name,
          redirect_url: window.location.origin
        }
      });
      if (error) throw error;
      const paymentUrl = data?.sandbox_init_point || data?.init_point;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
      */
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setErrorMessage("No se pudo iniciar el proceso de pago.");
      setProcessingPayment(null);
    }
  };

  if (!session) {
    return <Auth />;
  }

  if (showAdmin && profile?.is_master) {
    // Render Admin but keep the header accessible to go back
    return (
      <div className="relative w-full min-h-screen bg-primary">
        <Background3D />
        <div className="fixed top-0 left-0 w-full z-[150] p-6">
          <div className="max-w-[1400px] mx-auto flex justify-end items-center">
            <button
              onClick={() => setShowAdmin(false)}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-accent text-white border border-accent shadow-lg shadow-accent/20"
            >
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[2px]">Volver a la App</span>
            </button>
          </div>
        </div>
        <Admin onBack={() => setShowAdmin(false)} IDENTITIES={mergedIdentities} />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen font-sans text-white bg-primary overflow-x-hidden">
      <Background3D />

      {/* Profile/Credits/Logout Header */}
      <div className="fixed top-0 left-0 w-full z-[150] p-6 pointer-events-none">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 p-2 pr-6 rounded-full pointer-events-auto">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[2px] text-white/40">Créditos IA</span>
              <span className="text-sm font-black italic text-accent leading-none">
                {loadingProfile ? '...' : (profile?.is_master ? 'INFINITOS' : `${profile?.credits || 0} DISPONIBLES`)}
              </span>
            </div>
            {!profile?.is_master && (
              <button
                onClick={() => setShowPricing(true)}
                className="ml-4 w-8 h-8 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-full flex items-center justify-center transition-all group/plus pointer-events-auto"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            {profile?.is_master && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 border ${showAdmin
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-accent hover:text-accent'
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[2px]">{showAdmin ? 'Cerrar Panel' : 'Panel Admin'}</span>
              </button>
            )}

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/'; // Forzar redirección al inicio y limpieza de estado
              }}
              className="group flex items-center gap-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 px-6 py-3 rounded-full transition-all duration-500 pointer-events-auto"
            >
              <span className="text-[10px] font-black uppercase tracking-[2px] text-white/40 group-hover:text-red-400">Cerrar Sesión</span>
              <LogOut className="w-4 h-4 text-white/20 group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="fixed bottom-10 right-10 z-[500] flex flex-col gap-4">
        {notifications.map(notif => (
          <div
            key={notif.id}
            onClick={notif.action}
            className={`flex items-center gap-4 px-8 py-4 rounded-2xl border backdrop-blur-2xl animate-[fadeInRight_0.5s_ease-out] shadow-2xl cursor-pointer hover:scale-105 transition-all
              ${notif.type === 'success' ? 'bg-accent/20 border-accent/40 text-white' : 'bg-red-500/20 border-red-500/40 text-red-100'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'success' ? 'bg-accent' : 'bg-red-500'}`}>
              {notif.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[2px]">{notif.message}</span>
              {notif.action && <span className="text-[7px] font-bold text-accent uppercase tracking-[1px]">Clic para ver</span>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
              className="ml-4 opacity-40 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Active Job Bottom Bar */}
        {isSubmitting && backgroundJob?.active && (
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] shadow-2xl flex items-center gap-6 animate-[fadeInUp_0.5s_ease-out]">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-[1px] border-accent/20 rounded-full animate-spin" />
              <span className="text-[8px] font-black">{elapsedSeconds}s</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-white text-[10px] font-black uppercase tracking-[2px]">Alquimia en progreso...</span>
              <span className="text-white/40 text-[7px] uppercase tracking-[1px]">Podés seguir usando la app</span>
            </div>
            <button
              onClick={() => {
                setAppStep('gallery');
                setBackgroundJob({ active: false, id: null, startTime: Date.now() });
              }}
              className="px-4 py-2 bg-accent text-white rounded-lg text-[8px] font-black uppercase tracking-[1px] hover:bg-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isSubmitting && !backgroundJob?.active && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease-out]">
          <div className="relative mb-12">
            {/* Pulsing Glow Background */}
            <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full animate-pulse" />

            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 border-[1px] border-accent/20 rounded-full animate-[ping_3s_linear_infinite]" />
              <div className="absolute inset-[-10px] border-[1px] border-white/5 rounded-full animate-[ping_4s_linear_infinite]" />

              <Loader2 className="w-full h-full text-accent animate-spin stroke-[1px] opacity-40" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Monitor className="w-6 h-6 text-accent animate-pulse mb-1" />
                  <span className="text-xl font-black italic tracking-tighter text-white">AI</span>
                  <span className="text-[6px] font-black uppercase tracking-[2px] text-accent/60">Scanning...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-md space-y-8 relative z-10">
            <div className="space-y-2">
              <span className="text-accent text-[10px] font-black tracking-[5px] uppercase block animate-pulse">
                Procesando Alquimia Digital
              </span>
              <h3 className="text-2xl font-black italic uppercase tracking-tight h-20 flex items-center justify-center transition-all duration-500">
                {PHRASES[currentPhraseIndex]}
              </h3>
            </div>

            <div className="flex flex-col items-center gap-4 pt-8">
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(255,85,0,0.5)]"
                  style={{
                    width: `${(() => {
                      if (elapsedSeconds < 5) return (elapsedSeconds / 5) * 30; // 0-5s: 0-30%
                      if (elapsedSeconds < 25) return 30 + ((elapsedSeconds - 5) / 20) * 50; // 5-25s: 30-80%
                      if (elapsedSeconds < 60) return 80 + ((elapsedSeconds - 25) / 35) * 15; // 25-60s: 80-95%
                      return Math.min(99, 95 + ((elapsedSeconds - 60) / 60) * 4); // 60s+: -> 99%
                    })()}%`
                  }}
                />
              </div>
              <p className="text-[8px] text-white/30 font-black tracking-[3px] uppercase">
                {elapsedSeconds > 30 ? "Finalizando detalles finales..." : "Sincronizando con el servidor"}
              </p>
            </div>

            <button
              onClick={() => {
                setBackgroundJob({ active: true, id: null, startTime: Date.now() });
                setAppStep('gallery');
              }}
              className="px-8 py-4 mt-8 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[2px] hover:bg-white/10 transition-all flex items-center gap-3 group"
            >
              <Smartphone className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              Procesar en Segundo Plano
            </button>
          </div>
        </div>
      )}

      {/* Hero - Only show in Gallery */}
      {
        appStep === 'gallery' && (
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
        )
      }

      {/* Volver Button - Only show in Setup/Result */}
      {
        (appStep === 'setup' || appStep === 'result') && (
          <div className="fixed top-24 left-6 z-[160] animate-[fadeIn_0.5s_ease-out]">
            <button
              onClick={handleReset}
              className="group flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full hover:bg-white/10 transition-all pointer-events-auto shadow-2xl"
            >
              <ArrowDown className="w-4 h-4 text-accent rotate-90" />
              <span className="text-[10px] font-black uppercase tracking-[3px]">Volver a Estilos</span>
            </button>
          </div>
        )
      }

      {/* Main Experience */}
      <section className="relative min-h-screen w-full bg-[#050505]/95 backdrop-blur-md border-t border-white/5 py-20 px-6 z-20">
        <div className="max-w-[1200px] mx-auto">

          {/* GALLERY VIEW: Styles Selection */}
          {appStep === 'gallery' && (
            <div className="animate-[fadeIn_1s_ease-out]">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black tracking-[3px] uppercase mb-6">Discovery</span>
                <h2 className="text-4xl font-black tracking-tight uppercase mb-4 italic text-white">Elige tu destino</h2>
                <p className="text-white/30 text-[10px] uppercase tracking-[4px]">Navega por los universos visuales disponibles</p>
              </div>

              {/* Smart Search (Lupa) */}
              <div className="max-w-xl mx-auto mb-12 relative group">
                <div className="absolute inset-0 bg-accent/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent/50 transition-all duration-300">
                  <div className="pl-6 pointer-events-none">
                    <Search className={`w-5 h-5 transition-colors ${searchQuery ? 'text-accent' : 'text-white/20'}`} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busca por estilo, pack o tags (ej: f1, traje, neon)..."
                    className="w-full bg-transparent border-none px-6 py-5 text-sm font-bold placeholder:text-white/10 focus:outline-none focus:ring-0 text-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="pr-6 text-white/20 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Styles Grids and Categories (Existing Logic) */}
              {!searchQuery && (
                <div className="mb-20 animate-[fadeIn_0.8s_ease-out]">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <h3 className="text-[10px] font-black tracking-[4px] uppercase text-white/40">Recomendados para vos</h3>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  </div>
                  <div className="flex flex-nowrap overflow-x-auto pb-8 gap-4 px-4 no-scrollbar justify-center">
                    {recommendedIdentities.map((identity) => (
                      <div key={`rec-${identity.id}`} className="min-w-[140px] transform hover:scale-105 transition-transform duration-500">
                        <UploadCard
                          type="character"
                          title={identity.title}
                          sampleImageUrl={identity.url}
                          isSelected={formData.selectedIdentity === identity.id}
                          isPremium={identity.isPremium && !profile?.unlocked_packs?.includes(identity.subCategory) && !profile?.is_master}
                          tags={[]}
                          onSelect={() => {
                            const isActuallyPremium = identity.isPremium && !profile?.unlocked_packs?.includes(identity.subCategory) && !profile?.is_master;
                            if (isActuallyPremium) {
                              if (profile && profile.credits >= PREMIUM_PACK_PRICE) {
                                setPackToUnlock(identity);
                              } else {
                                setShowPremiumOffer(true);
                              }
                            } else {
                              setFormData(p => ({ ...p, selectedIdentity: identity.id }));
                              setAppStep('setup');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Selector */}
              <div className="flex flex-wrap justify-center gap-4 mb-16">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-500
                      ${activeCategory === cat.id
                        ? 'bg-accent border-accent text-white shadow-[0_0_30px_rgba(255,85,0,0.3)] scale-105'
                        : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                  >
                    <cat.icon className={`w-5 h-5 ${activeCategory === cat.id ? 'animate-pulse' : ''}`} />
                    <span className="font-black tracking-[2px] uppercase text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grouped Identities */}
              <div className="space-y-20">
                {Array.from(new Set(
                  mergedIdentities
                    .filter(id => {
                      const matchesCategory = activeCategory === 'all' || id.category === activeCategory;
                      const q = searchQuery.toLowerCase();
                      const matchesSearch =
                        id.title.toLowerCase().includes(q) ||
                        id.subCategory.toLowerCase().includes(q) ||
                        id.tags.some(tag => tag.toLowerCase().includes(q));
                      return matchesCategory && matchesSearch;
                    })
                    .map(id => id.subCategory)
                )).map(subCat => (
                  <div key={subCat} className="animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-[2px] w-8 bg-accent" />
                      <h3 className="text-sm font-black tracking-[4px] uppercase text-white/60 italic">{subCat}</h3>
                      <div className="flex-grow h-[1px] bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                      {mergedIdentities
                        .filter(id => {
                          const matchesCategory = activeCategory === 'all' || id.category === activeCategory;
                          const q = searchQuery.toLowerCase();
                          return id.subCategory === subCat && matchesCategory && (
                            id.title.toLowerCase().includes(q) ||
                            id.subCategory.toLowerCase().includes(q) ||
                            id.tags.some(tag => tag.toLowerCase().includes(q))
                          );
                        })
                        .map((identity) => (
                          <UploadCard
                            key={identity.id}
                            type="character"
                            title={identity.title}
                            sampleImageUrl={identity.url}
                            isSelected={formData.selectedIdentity === identity.id}
                            isPremium={identity.isPremium && !profile?.unlocked_packs?.includes(identity.subCategory) && !profile?.is_master}
                            tags={identity.tags}
                            onSelect={() => {
                              const isActuallyPremium = identity.isPremium && !profile?.unlocked_packs?.includes(identity.subCategory) && !profile?.is_master;
                              if (isActuallyPremium) {
                                if (profile && profile.credits >= PREMIUM_PACK_PRICE) {
                                  setPackToUnlock(identity);
                                } else {
                                  setShowPremiumOffer(true);
                                }
                              } else {
                                setFormData(p => ({ ...p, selectedIdentity: identity.id }));
                                setAppStep('setup');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                          />
                        ))}
                    </div>
                  </div>
                ))}

                {/* No results message */}
                {searchQuery && mergedIdentities.filter(id => {
                  const matchesCategory = activeCategory === 'all' || id.category === activeCategory;
                  const q = searchQuery.toLowerCase();
                  return matchesCategory && (
                    id.title.toLowerCase().includes(q) ||
                    id.subCategory.toLowerCase().includes(q) ||
                    id.tags.some(tag => tag.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                    <div className="py-20 text-center animate-pulse">
                      <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[4px]">
                        No hay resultados para "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-6 text-accent text-[8px] font-black uppercase tracking-[2px] hover:underline"
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* SETUP VIEW: Camera & Aspect Ratio */}
          {appStep === 'setup' && (
            <div className="animate-[fadeInDown_0.8s_ease-out]">
              {/* Selected Style Preview Header */}
              {formData.selectedIdentity && (
                <div className="flex flex-col items-center mb-16">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-accent mb-6 shadow-[0_0_30px_rgba(255,85,0,0.3)]">
                    <img
                      src={mergedIdentities.find(i => i.id === formData.selectedIdentity)?.url}
                      className="w-full h-full object-cover"
                      alt="Estilo"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-accent text-[8px] font-black uppercase tracking-[4px]">Transformación Elegida</span>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                      {mergedIdentities.find(i => i.id === formData.selectedIdentity)?.title}
                    </h2>
                  </div>
                </div>
              )}

              {/* Paso 1: Foto */}
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black tracking-[3px] uppercase mb-6">Paso 01</span>
                <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-8">Captura tu Rostro</h2>
                <p className="text-white/30 text-[9px] uppercase tracking-[3px] mb-12">Ubica tu cara en el centro para mejores resultados</p>

                <div className="flex flex-col items-center gap-8">
                  {!capturedImage ? (
                    <button
                      onClick={startCameraAction}
                      className="group relative flex items-center justify-center gap-4 px-12 py-6 bg-white/5 border-2 border-white/10 rounded-2xl hover:bg-accent hover:border-accent transition-all duration-500 hover:scale-105"
                    >
                      <Camera className="w-6 h-6 text-accent group-hover:text-white" />
                      <span className="font-black tracking-[4px] uppercase text-sm text-white">Iniciar Cámara</span>
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
                <ArrowDown className={`relative px-4 bg-[#050505] w-12 h-5 transition-colors duration-500 ${capturedImage ? 'text-accent' : 'text-white/10'}`} />
              </div>

              {/* Paso 2: Aspect Ratio */}
              <div className={`transition-all duration-700 ${capturedImage ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                <div className="text-center mb-16">
                  <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black tracking-[3px] uppercase mb-6">Paso 02</span>
                  <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-12">Formato de Imagen</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => setFormData(p => ({ ...p, aspectRatio: ratio.id }))}
                        className={`relative group flex flex-col items-center p-8 rounded-[32px] border-2 transition-all duration-500
                          ${formData.aspectRatio === ratio.id
                            ? 'border-accent bg-accent/5 shadow-[0_0_40px_rgba(255,85,0,0.2)]'
                            : 'border-white/5 bg-white/2 bg-[#121215] hover:border-white/20'}`}
                      >
                        <div className={`mb-6 p-4 rounded-2xl transition-all duration-500
                          ${formData.aspectRatio === ratio.id ? 'bg-accent text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                          <ratio.icon className="w-8 h-8" />
                        </div>
                        <span className={`text-xl font-black tracking-[4px] mb-2 ${formData.aspectRatio === ratio.id ? 'text-white' : 'text-white/40'}`}>
                          {ratio.label}
                        </span>
                        {formData.aspectRatio === ratio.id && <Check className="absolute top-4 right-4 w-5 h-5 text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className={`mt-32 max-w-sm mx-auto transition-all duration-700 ${isReady ? 'opacity-100 scale-100' : 'opacity-30 scale-95 pointer-events-none'}`}>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isReady}
                  className="group relative w-full h-20 rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl"
                >
                  <div className={`absolute inset-0 transition-all duration-500 ${isReady ? 'bg-accent' : 'bg-white/10'}`} />
                  <div className="relative flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[6px] text-white">
                    {isSubmitting ? <span>PROCESANDO...</span> : (
                      <>
                        <span>GENERAR ALQUIMIA</span>
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* RESULT VIEW */}
          {appStep === 'result' && (
            <div className="mt-8 p-12 bg-accent/5 border border-accent/20 rounded-[40px] text-center max-w-2xl mx-auto backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">
              {errorMessage ? (
                <>
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-8"><AlertTriangle className="w-8 h-8 text-white" /></div>
                  <h3 className="text-3xl font-black mb-4 uppercase italic text-red-500">Error</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-[2px] leading-relaxed">{errorMessage}</p>
                </>
              ) : resultImage ? (
                <>
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,85,0,0.4)]"><Check className="w-8 h-8 text-white" /></div>
                  <h3 className="text-3xl font-black mb-10 uppercase italic text-white">¡Tu Alquimia está Lista!</h3>
                  <div className="w-64 aspect-[4/5] rounded-3xl overflow-hidden border-2 border-accent shadow-[0_0_40px_rgba(255,85,0,0.3)] mb-10 bg-black">
                    <img src={resultImage} alt="Resultado" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={handlePrint}
                      className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl hover:bg-accent hover:text-white transition-all shadow-lg hover:shadow-accent/50"
                    >
                      <Printer className="w-5 h-5" />
                      <span className="text-xs font-black tracking-[2px] uppercase">Imprimir</span>
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="group flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/10 rounded-xl hover:bg-white/20 transition-all shadow-lg"
                    >
                      <QrCode className="w-5 h-5 text-accent" />
                      <span className="text-xs font-black tracking-[2px] uppercase">Generar QR</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="group flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/10 rounded-xl hover:bg-white/20 transition-all shadow-lg"
                    >
                      <Download className="w-5 h-5 text-accent" />
                      <span className="text-xs font-black tracking-[2px] uppercase">Descargar</span>
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
      {
        showCamera && (
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
        )
      }

      {/* QR Modal */}
      {
        showQR && resultImage && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-[#0a0a0c] rounded-[40px] p-12 border border-white/10 text-center flex flex-col items-center">
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-8">
                <QrCode className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase italic">Escanear para Descargar</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-[2px] mb-8">Escanea con tu cámara para guardar en tu móvil</p>

              <div className="p-4 bg-white rounded-3xl mb-8">
                <QRCodeCanvas
                  value={resultImage}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="text-[10px] font-black tracking-[4px] uppercase text-accent hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )
      }

      {/* Modal de Precios */}
      {
        showPricing && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-start sm:items-center justify-center p-4 py-12 md:py-20 overflow-y-auto">
            <div className="relative w-full max-w-6xl bg-[#0a0a0c] rounded-[40px] p-8 md:p-12 border border-white/10 text-center animate-[fadeIn_0.5s_ease-out]">
              <button
                onClick={() => setShowPricing(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-8 mx-auto">
                <CreditCard className="w-8 h-8 text-accent" />
              </div>

              <h3 className="text-3xl md:text-4xl font-black mb-2 uppercase italic tracking-tight">Elegí tu Pack</h3>
              <p className="text-accent text-[10px] font-black uppercase tracking-[4px] mb-2 shadow-accent/20 drop-shadow-sm">Desbloquea todos los estilos Premium</p>
              <p className="text-white/40 text-[8px] uppercase tracking-[4px] mb-12">Y obtené créditos para tus retratos con IA</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Starter', price: 4000, credits: 500, bonus: '', color: 'white/5', popular: false },
                  { name: 'Standard', price: 8000, credits: 1100, bonus: '+10% Extra', color: 'accent/5', popular: true },
                  { name: 'Business', price: 10000, credits: 1500, bonus: '+20% Extra', color: 'white/5', popular: false },
                  { name: 'Unlock Premium', price: 20000, credits: 3000, bonus: 'Pack Completo', color: 'accent/5', premium: true }
                ].map((pack) => (
                  <div
                    key={pack.name}
                    className={`relative p-8 rounded-[32px] border transition-all duration-500 flex flex-col items-center group
                    ${pack.popular ? 'bg-accent/5 border-accent shadow-[0_0_40px_rgba(255,85,0,0.2)]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                  >
                    {pack.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-[8px] font-black uppercase tracking-[2px] px-4 py-1 rounded-full">
                        Más Popular
                      </div>
                    )}
                    {pack.premium && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-300 text-[8px] font-black uppercase tracking-[2px] px-4 py-1 rounded-full text-black">
                        Especial Packs
                      </div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-white/40 mb-6">{pack.name}</span>
                    <div className="flex flex-col items-center mb-8">
                      <span className={`text-5xl font-black italic mb-2 ${pack.premium ? 'text-amber-400' : 'text-white'}`}>{pack.credits}</span>
                      <span className="text-[10px] font-black uppercase tracking-[2px] text-accent">Créditos</span>
                      {pack.bonus && (
                        <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full ${pack.premium ? 'bg-amber-500/20' : 'bg-accent/20'}`}>
                          <Zap className={`w-3 h-3 ${pack.premium ? 'text-amber-400' : 'text-accent'}`} />
                          <span className={`text-[8px] font-black uppercase tracking-[1px] ${pack.premium ? 'text-amber-400' : 'text-accent'}`}>{pack.bonus}</span>
                        </div>
                      )}
                    </div>
                    <div className={`text-2xl font-black italic mb-8 ${pack.premium ? 'text-amber-400' : 'text-white'}`}>${pack.price.toLocaleString()}</div>
                    <button
                      disabled={!!processingPayment}
                      onClick={() => handlePayment(pack)}
                      className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[2px] transition-all duration-300 flex items-center justify-center gap-2
                      ${pack.popular ? 'bg-accent text-white hover:bg-white hover:text-black' : 'bg-white text-black hover:bg-accent hover:text-white'}
                      ${processingPayment === pack.name ? 'opacity-50' : ''}`}
                    >
                      {processingPayment === pack.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Próximamente'
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-12 text-[8px] font-black tracking-[4px] uppercase text-white/20">
                Pagos protegidos por Mercado Pago
              </p>
            </div>
          </div>
        )
      }

      {/* Modal de Confirmación de Desbloqueo */}
      {
        packToUnlock && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="relative w-full max-w-md bg-[#0a0a0c] rounded-[40px] p-10 border border-white/10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-8 mx-auto">
                <Zap className="w-8 h-8 text-accent animate-pulse" />
              </div>

              <h3 className="text-2xl font-black mb-2 uppercase italic">Desbloquear Pack</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-[2px] mb-8">
                ¿Quieres desbloquear el pack <span className="text-white font-bold">{packToUnlock.subCategory}</span> por <span className="text-accent font-bold">{PREMIUM_PACK_PRICE} créditos</span>?
              </p>

              <div className="space-y-4">
                <button
                  disabled={isUnlocking}
                  onClick={() => handleUnlockPack(packToUnlock.subCategory)}
                  className="w-full h-16 bg-accent text-white rounded-2xl font-black uppercase tracking-[4px] text-xs hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                >
                  {isUnlocking ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirmar Compra
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  disabled={isUnlocking}
                  onClick={() => setPackToUnlock(null)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[3px] text-white/20 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <p className="mt-8 text-[8px] font-black tracking-[3px] text-white/10 uppercase">
                Tu saldo actual: {profile?.credits} créditos
              </p>
            </div>
          </div>
        )
      }

      {/* Modal de Oferta Premium Exclusiva - Más delicado y pequeño */}
      {
        showPremiumOffer && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1a1a1f] to-[#0a0a0c] rounded-[32px] p-8 border border-amber-500/20 text-center shadow-[0_0_80px_rgba(251,191,36,0.05)]">
              <button
                onClick={() => setShowPremiumOffer(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>

              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-300 rounded-2xl flex items-center justify-center mb-6 mx-auto rotate-6 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-7 h-7 text-black" />
              </div>

              <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
                Pack Premium
              </h3>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-[3px] mb-4 leading-relaxed">
                  Desbloquea estilos VIP + 3000 créditos
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black italic text-white leading-none">3000</span>
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Créditos</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-3xl font-black italic mb-1">$20.000</div>
                <div className="text-[7px] font-black uppercase tracking-[2px] text-white/15">Pago Único</div>
              </div>

              <button
                disabled={!!processingPayment}
                onClick={() => {
                  handlePayment({ name: 'Unlock Premium', price: 20000, credits: 3000 });
                  setShowPremiumOffer(false);
                }}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-white hover:to-white text-black font-black uppercase tracking-[4px] text-[10px] rounded-xl transition-all duration-500 shadow-[0_10px_20px_rgba(245,158,11,0.2)] active:scale-95 flex items-center justify-center gap-3"
              >
                {processingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    DESBLOQUEAR AHORA
                    <Zap className="w-3.5 h-3.5 fill-black" />
                  </>
                )}
              </button>
            </div>
          </div>
        )
      }

      <canvas ref={canvasRef} className="hidden" />
      <footer className="relative py-12 bg-primary border-t border-white/5 text-center z-20">
        <div className="text-white/10 text-[8px] uppercase tracking-[6px] font-bold italic">© 2024 Creativa Labs — Digital Alchemy Studio</div>
      </footer>

      {/* Historial de Imágenes */}
      {
        !showAdmin && session && (
          <section className="relative py-20 px-6 bg-black/50 backdrop-blur-xl border-t border-white/5 z-20">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <LucideHistory className="w-5 h-5 text-accent" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Mis Fotos</h2>
                  </div>
                  <p className="text-[10px] tracking-[3px] text-white/40 uppercase">Tus últimos retratos generados</p>
                </div>
                <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10">
                  <p className="text-[8px] font-black uppercase tracking-[2px] text-white/20">Las imágenes se mantienen en el historial por 20 días</p>
                </div>
              </div>

              {loadingGenerations ? (
                <div className="flex flex-col items-center py-20 opacity-20">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <span className="text-[10px] font-black uppercase tracking-[2px]">Cargando historial...</span>
                </div>
              ) : userGenerations.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]">
                  <p className="text-white/20 text-xs font-black uppercase tracking-[3px]">Aún no has generado imágenes</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {userGenerations.map((gen) => (
                    <div key={gen.id} className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c] hover:border-accent/40 transition-all duration-500">
                      <img src={gen.image_url} alt="Generación" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setResultImage(gen.image_url);
                              setIsSuccess(true);
                              setAppStep('result');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 bg-white text-black py-2 rounded-lg text-[8px] font-black uppercase tracking-[1px] hover:bg-accent transition-colors"
                          >
                            Ver
                          </button>
                          <a
                            href={gen.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-white/10 rounded-lg text-white hover:text-accent transition-colors"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      }
    </div >
  );
};

export default App;

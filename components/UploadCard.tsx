
import React, { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { UploadType } from '../types';

interface UploadCardProps {
  type: UploadType;
  title: string;
  sampleImageUrl: string;
  isSelected: boolean;
  onSelect: () => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ title, sampleImageUrl, isSelected, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reiniciar estados si cambia la URL
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    
    // Intento manual de precarga para debug en consola
    const img = new Image();
    img.src = sampleImageUrl;
    img.onload = () => console.log(`Imagen cargada con éxito: ${sampleImageUrl}`);
    img.onerror = () => console.warn(`Fallo al cargar imagen: ${sampleImageUrl}. Verifica que el archivo exista en la raíz.`);
  }, [sampleImageUrl]);

  return (
    <div 
      className={`relative w-full max-w-[320px] aspect-[4/5] rounded-[24px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group
                  backdrop-blur-xl border-2 cursor-pointer
                  hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(0,0,0,0.9)]
                  ${isSelected 
                    ? 'border-accent shadow-[0_0_50px_rgba(255,85,0,0.3)] scale-[1.05] z-10' 
                    : 'border-white/5 hover:border-white/20 bg-[#121215]'}`}
      onClick={onSelect}
    >
      {/* Dynamic Scan Line Animation */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-accent/60 blur-[2px] z-[10] pointer-events-none transition-opacity duration-500
        ${isSelected ? 'opacity-100 animate-[scan_3s_linear_infinite]' : 'opacity-0'}`} />

      {/* Outer Glow Effect */}
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none z-0
        ${isSelected ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'radial-gradient(circle at 50% 100%, rgba(255, 85, 0, 0.2) 0%, transparent 70%)' }} 
      />

      {/* Internal Rim Lighting */}
      <div className={`absolute inset-[1px] rounded-[22px] bg-gradient-to-br from-white/10 to-transparent z-[2] pointer-events-none transition-opacity
        ${isSelected ? 'opacity-100' : 'opacity-40'}`} />

      {/* Main Image Container */}
      <div className="absolute inset-0 z-[1] overflow-hidden bg-[#0a0a0c]">
        {!imageError ? (
          <img 
            src={sampleImageUrl} 
            alt={title} 
            className={`w-full h-full object-cover transition-all duration-1000 ease-out
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              ${isSelected ? 'scale-110 brightness-110 saturate-[1.1]' : 'scale-100 brightness-[0.6] saturate-[0.7] group-hover:brightness-90 group-hover:scale-105'}`} 
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] p-10 text-center animate-[fadeIn_0.5s_ease-out]">
            <AlertCircle className="w-12 h-12 text-accent/40 mb-4" />
            <div className="text-[8px] tracking-[4px] text-white/40 font-black uppercase leading-relaxed">
              Error de Archivo<br/>
              <span className="text-accent/60 mt-2 block">{sampleImageUrl}</span>
            </div>
            <p className="text-[6px] text-white/20 uppercase tracking-[2px] mt-4 max-w-[150px]">
              Asegúrate de que el archivo esté en la raíz con este nombre exacto.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#121215] z-[3]">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin shadow-[0_0_15px_rgba(255,85,0,0.2)]" />
          </div>
        )}
        
        {/* Tech Gradient Overlay */}
        <div className={`absolute inset-0 transition-all duration-700 pointer-events-none z-[4]
          ${isSelected ? 'bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90' : 'bg-black/20'}`} />
      </div>

      {/* Selection Badge / Content */}
      <div className="relative z-[15] flex flex-col items-center justify-end w-full h-full p-8">
        <div className={`flex flex-col items-center transition-all duration-500 transform
          ${isSelected ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-70 group-hover:translate-y-0 group-hover:opacity-100'}`}>
          
          <div className={`text-[10px] font-black tracking-[5px] uppercase mb-4 transition-colors duration-300
            ${isSelected ? 'text-accent' : 'text-white/60'}`}>
            {title}
          </div>
          
          <div className={`px-6 py-2.5 rounded-full border text-[9px] font-black tracking-[4px] uppercase transition-all duration-500 backdrop-blur-xl
            ${isSelected 
              ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(255,85,0,0.4)]' 
              : 'bg-black/60 text-white/40 border-white/10'}`}>
            {isSelected ? 'ACTIVO' : 'SELECCIONAR'}
          </div>
        </div>
      </div>

      {/* Corner Accents (F1 Style) */}
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/20 z-[6]" />
      <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-white/20 z-[6]" />
      <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-white/20 z-[6]" />
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/20 z-[6]" />
    </div>
  );
};

export default UploadCard;

import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;

      // Direct update for dot (instant)
      if (dotRef.current) {
        dotRef.current.style.left = `${clientX}px`;
        dotRef.current.style.top = `${clientY}px`;
      }

      // Animation for outline (smooth lag)
      if (outlineRef.current) {
        outlineRef.current.animate({
          left: `${clientX}px`,
          top: `${clientY}px`
        }, { duration: 500, fill: "forwards" });
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, input, textarea, label, .upload-target')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div 
        ref={dotRef}
        className={`fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200 
          ${isHovering ? 'w-2 h-2 bg-accent' : 'w-2 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'}`}
      />
      
      {/* Outline */}
      <div 
        ref={outlineRef}
        className={`fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200
          ${isHovering 
            ? 'w-[60px] h-[60px] border-accent bg-accent/5' 
            : 'w-[40px] h-[40px] border-white/40 bg-transparent'}`}
      />
    </>
  );
};

export default CustomCursor;
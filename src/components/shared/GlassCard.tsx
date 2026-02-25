import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
    animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    onClick,
    hover = true,
    animate = true
}) => {
    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 20 } : false}
            animate={animate ? { opacity: 1, y: 0 } : false}
            whileHover={hover && !onClick ? { y: -5, transition: { duration: 0.2 } } : hover && onClick ? { scale: 1.02, y: -5 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={`
                relative overflow-hidden
                bg-slate-900/40 backdrop-blur-xl
                border border-white/5 
                rounded-[32px] 
                transition-all duration-300
                ${onClick ? 'cursor-pointer hover:border-[#135bec]/30 shadow-lg hover:shadow-[#135bec]/10' : ''}
                ${className}
            `}
        >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Subtle inner glow */}
            <div className="absolute inset-[1px] rounded-[31px] border border-white/5 pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>

            {/* Decorative background element on hover */}
            {hover && (
                <div className="absolute -bottom-10 -right-10 size-40 bg-[#135bec]/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
        </motion.div>
    );
};

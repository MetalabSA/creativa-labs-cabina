import React from 'react';

interface LogItemProps {
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    text: string;
    time: string;
}

export const LogItem: React.FC<LogItemProps> = ({ type, title, text, time }) => {
    const colors = {
        success: 'bg-[#13ec80]',
        info: 'bg-blue-400',
        warning: 'bg-amber-400',
        error: 'bg-red-400'
    };
    return (
        <div className="flex gap-3 relative pb-2 group">
            <div className={`w-2 h-2 mt-1 rounded-full ${colors[type as keyof typeof colors]} shrink-0 shadow-[0_0_5px_currentColor] opacity-60 group-hover:opacity-100 transition-opacity`}></div>
            <div>
                <p className="text-[11px] font-bold text-white leading-tight">{title}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{text}</p>
                <p className="text-[8px] font-mono text-slate-600 mt-1 uppercase">{time}</p>
            </div>
        </div>
    );
};

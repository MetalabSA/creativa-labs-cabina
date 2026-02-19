import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';

interface EventQRGeneratorProps {
    eventConfig: any;
    onClose: () => void;
}

export const EventQRGenerator: React.FC<EventQRGeneratorProps> = ({ eventConfig, onClose }) => {
    const qrContainerRef = useRef<HTMLDivElement>(null);

    const eventUrl = `https://app.metalabia.com/?event=${eventConfig.event_slug}`;

    const handleDownloadQR = () => {
        const canvas = qrContainerRef.current?.querySelector('canvas');
        if (!canvas) return;

        // Crear un canvas más grande con branding
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        const padding = 60;
        const qrSize = 400;
        const headerHeight = 120;
        const footerHeight = 80;
        const totalWidth = qrSize + padding * 2;
        const totalHeight = headerHeight + qrSize + padding + footerHeight;

        exportCanvas.width = totalWidth;
        exportCanvas.height = totalHeight;

        // Fondo negro
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Borde sutil
        ctx.strokeStyle = 'rgba(255, 85, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 20);
        ctx.stroke();

        // Título del evento
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventConfig.event_name, totalWidth / 2, 55);

        // Subtítulo
        ctx.fillStyle = 'rgba(255, 85, 0, 0.8)';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText('📸  ESCANEÁ Y CREÁ TU FOTO CON IA', totalWidth / 2, 85);

        // Fondo blanco para el QR
        const qrX = (totalWidth - qrSize - 20) / 2;
        const qrY = headerHeight;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize + 20, qrSize + 20, 16);
        ctx.fill();

        // Dibujar el QR
        ctx.drawImage(canvas, qrX + 10, qrY + 10, qrSize, qrSize);

        // Footer
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillText('Powered by MetaLab IA  •  metalab30.com', totalWidth / 2, totalHeight - 30);

        // Descargar
        const link = document.createElement('a');
        link.download = `qr-${eventConfig.event_slug}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    };

    const handlePrint = () => {
        const canvas = qrContainerRef.current?.querySelector('canvas');
        if (!canvas) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${eventConfig.event_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              display: flex; flex-direction: column; align-items: center; 
              justify-content: center; min-height: 100vh; font-family: system-ui;
              background: white; color: black;
            }
            h1 { font-size: 32px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; }
            p.sub { font-size: 16px; color: #666; margin-bottom: 40px; }
            .qr { margin-bottom: 40px; }
            .qr img { width: 300px; height: 300px; }
            p.url { font-size: 12px; color: #999; margin-bottom: 8px; }
            p.brand { font-size: 11px; color: #ccc; }
          </style>
        </head>
        <body>
          <h1>${eventConfig.event_name}</h1>
          <p class="sub">📸 Escaneá y creá tu foto con IA</p>
          <div class="qr"><img src="${canvas.toDataURL()}" /></div>
          <p class="url">${eventUrl}</p>
          <p class="brand">Powered by MetaLab IA</p>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="relative w-full max-w-sm bg-[#0a0a0c] rounded-[40px] p-10 border border-white/10 text-center flex flex-col items-center">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">📱</span>
                </div>
                <h3 className="text-xl font-black mb-1 uppercase italic text-white">
                    {eventConfig.event_name}
                </h3>
                <p className="text-accent text-[10px] uppercase tracking-[3px] mb-8 font-bold">
                    Escaneá y creá tu foto con IA
                </p>

                {/* QR Code */}
                <div ref={qrContainerRef} className="p-5 bg-white rounded-3xl mb-8 shadow-[0_0_40px_rgba(255,85,0,0.15)]">
                    <QRCodeCanvas
                        value={eventUrl}
                        size={220}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                            src: '/icon-192x192.png',
                            height: 40,
                            width: 40,
                            excavate: true,
                        }}
                    />
                </div>

                {/* URL preview */}
                <p className="text-white/20 text-[9px] tracking-[1px] mb-8 break-all px-4">
                    {eventUrl}
                </p>

                {/* Action buttons */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={handleDownloadQR}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-xl hover:bg-accent/80 transition-all text-[10px] font-black tracking-[2px] uppercase"
                    >
                        <Download className="w-4 h-4" />
                        Descargar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 text-white border border-white/10 rounded-xl hover:bg-white/20 transition-all text-[10px] font-black tracking-[2px] uppercase"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                </div>

                {/* Tip */}
                <p className="text-white/15 text-[8px] tracking-[1px] mt-6 leading-relaxed">
                    Imprimí este QR y colocalo en las mesas del evento.
                    Los invitados escanean y generan sus fotos al instante.
                </p>
            </div>
        </div>
    );
};

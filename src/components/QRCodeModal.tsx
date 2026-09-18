import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  Smartphone,
  Share2,
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: 'emerald' | 'blue' | 'teal' | 'indigo' | 'purple';
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  subtitle,
  badgeText = 'Tautan Publik',
  badgeColor = 'emerald',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [qrSize, setQrSize] = useState<number>(320);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !url) return;

    // Generate high resolution QR code data URL
    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((res) => {
        setDataUrl(res);
      })
      .catch((err) => {
        console.error('[QRCodeModal] Failed to generate QR code:', err);
      });
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQR = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanFileName = title
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40)
      .toLowerCase();
    a.download = `qr_${cleanFileName || 'kode_qr'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const colorClasses = {
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      accent: 'text-emerald-700',
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      accent: 'text-blue-700',
    },
    teal: {
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      btn: 'bg-teal-600 hover:bg-teal-700 text-white',
      accent: 'text-teal-700',
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      accent: 'text-indigo-700',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      accent: 'text-purple-700',
    },
  }[badgeColor];

  return (
    <div
      id="modal-qrcode-preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`bg-white w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen ? 'max-w-4xl max-h-[96vh]' : 'max-w-md max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorClasses.badge}`}>
                  {badgeText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Scan Langsung
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                {title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isFullScreen ? 'Perkecil Layar' : 'Mode Layar Penuh / Proyektor'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex flex-col items-center text-center space-y-4">
          {subtitle && (
            <p className="text-xs text-slate-600 max-w-sm">
              {subtitle}
            </p>
          )}

          {/* QR Code Container */}
          <div className="relative p-4 sm:p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="QR Code Tautan Publik"
                className={`object-contain transition-all duration-300 rounded-lg ${
                  isFullScreen ? 'w-80 h-80 sm:w-96 sm:h-96' : 'w-56 h-56 sm:w-64 sm:h-64'
                }`}
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
                <QrCode className="w-10 h-10 animate-pulse text-slate-300" />
                <span className="text-xs">Membuat QR Code...</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Arahkan kamera smartphone atau Google Lens ke kode QR di atas</span>
          </div>

          {/* URL text display */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-[11px] font-mono text-slate-600 truncate focus:outline-hidden select-all"
            />
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-md transition-colors shrink-0 cursor-pointer"
              title="Salin Tautan"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQR}
              disabled={!dataUrl}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${colorClasses.btn}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh QR Code (PNG)</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tautan</span>
            </a>
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

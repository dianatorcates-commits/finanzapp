import React, { useState } from 'react';
import { Cookie } from 'lucide-react';
import { COOKIE_NOTICE_STORAGE_KEY, LEGAL_PRIVACY_VERSION } from '../constants/legal';

interface CookieNoticeBannerProps {
  onOpenCookies: () => void;
}

export const CookieNoticeBanner: React.FC<CookieNoticeBannerProps> = ({ onOpenCookies }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) === LEGAL_PRIVACY_VERSION;
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, LEGAL_PRIVACY_VERSION);
    } catch {
      // Ignore storage quota errors in restricted environments
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Aviso de almacenamiento técnico y cookies"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-[#141422]/95 backdrop-blur-md border border-[#302840] panel-rim rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.75)] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
    >
      <div className="flex items-start gap-2.5 text-xs text-[#E8E0F0] font-sans leading-snug">
        <div className="p-1.5 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 shrink-0 mt-0.5">
          <Cookie className="w-3.5 h-3.5" />
        </div>
        <p className="text-[11px] sm:text-xs text-[#A098B0]">
          Solo usamos almacenamiento técnico esencial para tu sesión.{' '}
          <strong className="text-white font-semibold">Cero rastreadores y cero publicidad.</strong>
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCookies}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-headline font-semibold text-[#00FFCC] hover:bg-[#00FFCC]/10 transition whitespace-nowrap"
        >
          Ver detalle
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-xl bg-[#00FFCC] hover:bg-[#00e6b8] text-[#0A0A12] text-[11px] font-headline font-black transition whitespace-nowrap"
        >
          Entendido
        </button>
      </div>
    </aside>
  );
};

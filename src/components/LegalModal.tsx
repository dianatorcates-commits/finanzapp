import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  FileText,
  Cookie,
  Mail,
  Copy,
  Check,
  Download,
  UserX,
  ExternalLink,
  Clock
} from 'lucide-react';
import { LegalTab } from '../types';
import {
  LEGAL_TERMS_VERSION,
  LEGAL_PRIVACY_VERSION,
  LEGAL_EFFECTIVE_DATE,
  SUPPORT_EMAIL,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  COOKIES_SECTIONS,
  CONTACT_INFO,
  LegalSectionItem
} from '../constants/legal';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  isAuthenticated?: boolean;
  onOpenAccountPrivacy?: () => void;
  onExportData?: () => void;
}

const TAB_CONFIG: Array<{
  id: LegalTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'privacy', label: 'Privacidad', icon: Lock },
  { id: 'terms', label: 'Términos', icon: FileText },
  { id: 'cookies', label: 'Cookies', icon: Cookie },
  { id: 'contact', label: 'Contacto y Reclamos', icon: Mail }
];

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  isAuthenticated = false,
  onOpenAccountPrivacy,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      setCopiedEmail(false);
    }
  };

  const renderSections = (sections: LegalSectionItem[]) => (
    <div className="space-y-4">
      {sections.map((sec) => (
        <section
          key={sec.id}
          className="bg-[#0E0E18] border border-[#302840] rounded-2xl p-4 sm:p-5 space-y-2.5"
        >
          <h4 className="font-headline font-bold text-sm text-[#00FFCC] tracking-tight">
            {sec.title}
          </h4>
          {sec.paragraphs.map((p, idx) => (
            <p key={idx} className="text-xs sm:text-[13px] text-[#E8E0F0]/90 leading-relaxed font-sans">
              {p}
            </p>
          ))}
          {sec.bullets && sec.bullets.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {sec.bullets.map((b, bIdx) => (
                <li
                  key={bIdx}
                  className="text-xs text-[#A098B0] leading-relaxed flex items-start gap-2 font-sans"
                >
                  <span className="text-[#FF2D78] font-bold mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );

  const activeVersion =
    activeTab === 'privacy' || activeTab === 'cookies'
      ? LEGAL_PRIVACY_VERSION
      : LEGAL_TERMS_VERSION;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-[80] bg-[#05070E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0E0E18] border-b border-[#302840] px-5 py-4 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="legal-modal-title"
                className="font-headline font-bold text-sm sm:text-base text-white tracking-tight truncate"
              >
                Centro Legal y Privacidad — FinanzApp
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30">
                  Versión {activeVersion}
                </span>
                <span className="text-[11px] font-sans text-[#A098B0]">
                  Vigencia: {LEGAL_EFFECTIVE_DATE}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A098B0] hover:text-white p-2 rounded-xl hover:bg-[#1C1C2E] border border-transparent hover:border-[#302840] transition shrink-0"
            aria-label="Cerrar centro legal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#0A0A12] border-b border-[#302840] px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-[#00FFCC]/15 text-[#00FFCC] border-[#00FFCC]/40 shadow-[0_0_12px_rgba(0,255,204,0.12)]'
                    : 'bg-[#141422] text-[#A098B0] border-[#302840] hover:text-white hover:border-[#A098B0]/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'privacy' && renderSections(PRIVACY_SECTIONS)}
          {activeTab === 'terms' && renderSections(TERMS_SECTIONS)}
          {activeTab === 'cookies' && renderSections(COOKIES_SECTIONS)}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              {/* Official Channel Card */}
              <div className="bg-[#0E0E18] border border-[#00FFCC]/30 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-headline font-bold text-sm text-white">
                      Canal Oficial de Privacidad, Reclamos y Derechos ARCO
                    </h4>
                    <p className="text-xs text-[#A098B0] mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00FFCC]" />
                      <span>Plazo de respuesta: {CONTACT_INFO.responseSla}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#141422] border border-[#302840] rounded-xl px-3 py-2">
                    <Mail className="w-4 h-4 text-[#00FFCC] shrink-0" />
                    <span className="text-xs font-mono font-bold text-white select-all">
                      {CONTACT_INFO.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] text-[11px] font-semibold transition"
                      title="Copiar correo de contacto"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-filled mailto cards */}
              <div className="grid grid-cols-1 gap-3">
                {CONTACT_INFO.reasons.map((reason) => {
                  const mailtoHref = `mailto:${encodeURIComponent(
                    CONTACT_INFO.email
                  )}?subject=${encodeURIComponent(reason.subject)}&body=${encodeURIComponent(
                    reason.bodyTemplate
                  )}`;
                  return (
                    <div
                      key={reason.id}
                      className="bg-[#0E0E18] border border-[#302840] hover:border-[#00FFCC]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <h5 className="font-headline font-bold text-xs sm:text-sm text-white">
                          {reason.title}
                        </h5>
                        <p className="text-xs text-[#A098B0] font-sans">
                          {reason.description}
                        </p>
                      </div>
                      <a
                        href={mailtoHref}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141422] hover:bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 text-xs font-headline font-bold whitespace-nowrap transition shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Redactar Correo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Direct authenticated self-service actions */}
              {isAuthenticated && (onExportData || onOpenAccountPrivacy) && (
                <div className="bg-[#0E0E18] border border-[#302840] rounded-2xl p-4 space-y-3">
                  <h5 className="font-headline font-bold text-xs uppercase tracking-wider text-[#A098B0]">
                    Autogestión Inmediata de tus Derechos
                  </h5>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {onExportData && (
                      <button
                        type="button"
                        onClick={onExportData}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141422] hover:bg-sky-500/10 text-sky-300 border border-[#302840] hover:border-sky-400/40 text-xs font-headline font-bold transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar mis datos (Excel)</span>
                      </button>
                    )}
                    {onOpenAccountPrivacy && (
                      <button
                        type="button"
                        onClick={onOpenAccountPrivacy}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-headline font-bold transition"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Ir a Mi Cuenta y Eliminación de Datos</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0E0E18] border-t border-[#302840] px-5 py-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-[#A098B0]">
            FinanzApp · Protección de Datos y Transparencia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C1C2E] hover:bg-[#25253C] text-white text-xs font-headline font-bold border border-[#302840] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

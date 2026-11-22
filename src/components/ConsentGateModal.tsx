import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, LogOut, CheckCircle2, Lock } from 'lucide-react';
import { LegalTab } from '../types';
import { LEGAL_TERMS_VERSION, LEGAL_PRIVACY_VERSION } from '../constants/legal';

interface ConsentGateModalProps {
  userEmail?: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onAccept: () => Promise<void> | void;
  onSignOut: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export const ConsentGateModal: React.FC<ConsentGateModalProps> = ({
  userEmail,
  isSubmitting,
  errorMessage,
  onAccept,
  onSignOut,
  onOpenLegal
}) => {
  const [checked, setChecked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checked || isSubmitting) return;
    void onAccept();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-gate-title"
      className="fixed inset-0 z-[75] bg-[#05070E]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-[#141422] border border-[#00FFCC]/40 panel-rim rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#0E0E18] border-b border-[#302840] p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3
              id="consent-gate-title"
              className="font-headline font-bold text-base text-white tracking-tight"
            >
              Actualización Legal y Privacidad
            </h3>
            <p className="text-xs text-[#A098B0] font-sans mt-0.5 truncate">
              {userEmail ? `Cuenta: ${userEmail}` : 'Requisito obligatorio para operar en la nube'}
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="bg-[#0E0E18] border border-[#302840] rounded-2xl p-4 space-y-2 text-xs text-[#E8E0F0]/90 leading-relaxed">
            <div className="flex items-center gap-2 text-[#00FFCC] font-headline font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Protección bajo la Ley N° 21.719 y Ley N° 19.628</span>
            </div>
            <p className="text-[#A098B0]">
              Para resguardar tus datos financieros y cumplir con el registro auditable de consentimiento,
              necesitamos confirmar que conoces y aceptas la versión vigente de nuestros documentos legales antes de continuar.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] font-mono bg-[#141422] text-[#A098B0] border border-[#302840] px-2 py-0.5 rounded-full">
                Términos: {LEGAL_TERMS_VERSION}
              </span>
              <span className="text-[10px] font-mono bg-[#141422] text-[#A098B0] border border-[#302840] px-2 py-0.5 rounded-full">
                Privacidad: {LEGAL_PRIVACY_VERSION}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mandatory Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#0A0A12] border border-[#302840] hover:border-[#00FFCC]/40 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#302840] bg-[#141422] text-[#00FFCC] focus:ring-[#00FFCC] focus:ring-offset-0 cursor-pointer shrink-0"
            />
            <span className="text-xs text-[#E8E0F0] leading-relaxed font-sans">
              Declaro ser <strong>mayor de 18 años</strong> y acepto los{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenLegal('terms');
                }}
                className="text-[#00FFCC] font-semibold hover:underline"
              >
                Términos y Condiciones
              </button>{' '}
              y la{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenLegal('privacy');
                }}
                className="text-[#00FFCC] font-semibold hover:underline"
              >
                Política de Privacidad
              </button>{' '}
              de FinanzApp.
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="submit"
              disabled={!checked || isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-[#00FFCC] hover:bg-[#00e6b8] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A12] font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,204,0.25)] transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Aceptar y Continuar'}</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl bg-[#1A1A2E] hover:bg-rose-500/15 text-[#A098B0] hover:text-rose-300 border border-[#302840] hover:border-rose-500/30 font-headline font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

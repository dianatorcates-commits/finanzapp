import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  Download,
  AlertTriangle,
  Trash2,
  UserX
} from 'lucide-react';
import { LegalConsentRecord, LegalTab } from '../types';

interface AccountPrivacyModalProps {
  isOpen: boolean;
  userEmail?: string;
  userName?: string;
  consentRecord: LegalConsentRecord | null;
  onClose: () => void;
  onOpenLegal: (tab: LegalTab) => void;
  onExportData: () => void;
  onDeleteAccount: () => Promise<void>;
}

function formatConsentDate(isoDate?: string): string {
  if (!isoDate) return 'Fecha no disponible';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export const AccountPrivacyModal: React.FC<AccountPrivacyModalProps> = ({
  isOpen,
  userEmail,
  userName,
  consentRecord,
  onClose,
  onOpenLegal,
  onExportData,
  onDeleteAccount
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setConfirmText('');
      setIsDeleting(false);
      setDeleteError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const isConfirmValid = confirmText.trim().toUpperCase() === 'ELIMINAR';

  const handleConfirmDelete = async () => {
    if (!isConfirmValid || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo completar la eliminación de la cuenta.';
      setDeleteError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-privacy-modal-title"
      className="fixed inset-0 z-[65] bg-[#05070E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0E0E18] border-b border-[#302840] px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="account-privacy-modal-title"
                className="font-headline font-bold text-base text-white tracking-tight truncate"
              >
                Mi Cuenta y Privacidad
              </h3>
              <p className="text-xs text-[#A098B0] font-sans truncate">
                {userName ? `${userName} · ` : ''}
                {userEmail || 'Usuario autenticado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#A098B0] hover:text-white p-2 rounded-xl hover:bg-[#1C1C2E] border border-transparent hover:border-[#302840] transition disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Section 1: Legal Consent Record */}
          <section className="bg-[#0E0E18] border border-[#302840] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-[#00FFCC]">
                Registro de Consentimiento Legal
              </h4>
              {consentRecord ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Vigente
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Pendiente de registro
                </span>
              )}
            </div>

            <div className="text-xs text-[#E8E0F0]/90 space-y-1.5 font-sans">
              <p>
                <span className="text-[#A098B0]">Cuenta titular:</span>{' '}
                <strong className="font-mono text-white">{userEmail || 'N/A'}</strong>
              </p>
              {consentRecord ? (
                <>
                  <p>
                    <span className="text-[#A098B0]">Aceptado el:</span>{' '}
                    <strong className="text-white">{formatConsentDate(consentRecord.acceptedAt)}</strong>
                  </p>
                  <p>
                    <span className="text-[#A098B0]">Versión Términos / Privacidad:</span>{' '}
                    <span className="font-mono text-[#00FFCC]">
                      {consentRecord.termsVersion} / {consentRecord.privacyVersion}
                    </span>
                  </p>
                  <p>
                    <span className="text-[#A098B0]">Confirmación +18 años:</span>{' '}
                    <span className="text-emerald-300 font-semibold">
                      {consentRecord.isAdultConfirmed ? 'Confirmada' : 'No confirmada'}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-[#A098B0] text-xs">
                  Aún no hay registro en la bitácora para esta sesión.
                </p>
              )}
            </div>

            {/* Quick Links to Legal Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#302840]/60">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141422] hover:bg-[#1C1C2E] text-xs text-[#E8E0F0] border border-[#302840] transition"
              >
                <Lock className="w-3.5 h-3.5 text-[#00FFCC]" />
                <span>Política de Privacidad</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141422] hover:bg-[#1C1C2E] text-xs text-[#E8E0F0] border border-[#302840] transition"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Términos y Condiciones</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('contact')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141422] hover:bg-[#1C1C2E] text-xs text-[#E8E0F0] border border-[#302840] transition"
              >
                <Mail className="w-3.5 h-3.5 text-[#FF2D78]" />
                <span>Canal de Reclamos</span>
              </button>
            </div>
          </section>

          {/* Section 2: Data Portability */}
          <section className="bg-[#0E0E18] border border-[#302840] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-headline font-bold text-sm text-white">
                Portabilidad de Datos (Derecho ARCO)
              </h4>
              <p className="text-xs text-[#A098B0] font-sans">
                Descarga una copia de respaldo de tus movimientos y montos en formato Excel antes de realizar cualquier cambio definitivo.
              </p>
            </div>
            <button
              type="button"
              onClick={onExportData}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-headline font-bold whitespace-nowrap transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Exportar a Excel</span>
            </button>
          </section>

          {/* Section 3: Danger Zone - Complete Account Deletion */}
          <section className="bg-rose-950/20 border border-rose-500/35 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-headline font-bold text-sm text-rose-300">
                  Zona de Peligro: Eliminar mi Cuenta y Todos mis Datos
                </h4>
                <p className="text-xs text-rose-200/80 leading-relaxed font-sans">
                  En ejercicio de tu derecho de supresión (Derecho al Olvido), esta acción es{' '}
                  <strong className="text-white">permanente e irreversible</strong>. Se eliminarán de Supabase y de este dispositivo:
                </p>
              </div>
            </div>

            <ul className="text-[11px] text-rose-200/75 space-y-1 pl-7 list-disc font-sans">
              <li>Todas tus cuentas bancarias y tarjetas de crédito configuradas.</li>
              <li>Todas las transacciones, cartolas importadas e imputaciones de pago.</li>
              <li>Todas tus metas de ahorro, aportes, créditos/cuotas, conciliaciones y presupuestos.</li>
              <li>Tus categorías personalizadas, reglas automáticas, vinculación de Telegram y credenciales de acceso.</li>
            </ul>

            {deleteError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 font-sans"
              >
                {deleteError}
              </div>
            )}

            {!showDeleteConfirm ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-headline font-bold transition"
                >
                  <UserX className="w-4 h-4" />
                  <span>Solicitar eliminación de cuenta</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#0A0A12] border border-rose-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <label className="block text-xs text-[#E8E0F0] font-sans">
                  Para confirmar la supresión definitiva, escribe la palabra{' '}
                  <strong className="font-mono text-rose-400">ELIMINAR</strong> en el recuadro:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  placeholder="Escribe ELIMINAR"
                  autoComplete="off"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#141422] border border-rose-500/40 rounded-xl text-white placeholder-[#A098B0]/40 focus:outline-none focus:border-rose-400 transition"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleConfirmDelete();
                    }}
                    disabled={!isConfirmValid || isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-headline font-black uppercase tracking-wider transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Eliminando datos...' : 'Eliminar cuenta permanentemente'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText('');
                      setDeleteError(null);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl bg-[#141422] hover:bg-[#1C1C2E] text-[#A098B0] hover:text-white border border-[#302840] text-xs font-headline font-bold transition disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="bg-[#0E0E18] border-t border-[#302840] px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-[#1C1C2E] hover:bg-[#25253C] text-white text-xs font-headline font-bold border border-[#302840] transition disabled:opacity-40"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

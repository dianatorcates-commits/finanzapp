import React from 'react';
import { AlertTriangle, Check, Trash2, ArrowRight, ShieldAlert } from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatCLP } from './MetricCards';

interface DuplicateAlertBannerProps {
  duplicates: Transaction[];
  accounts?: Account[];
  onDismissDuplicate: (id: string) => void;
  onDeleteDuplicate: (id: string) => void;
  onResolveAll: () => void;
  onOpenTransactions?: () => void;
}

export const DuplicateAlertBanner: React.FC<DuplicateAlertBannerProps> = ({
  duplicates,
  accounts = [],
  onDismissDuplicate,
  onDeleteDuplicate,
  onResolveAll,
  onOpenTransactions
}) => {
  if (!duplicates || duplicates.length === 0) return null;

  const count = duplicates.length;

  return (
    <div className="bg-[#F59E0B]/10 border-l-[4px] border-l-[#F59E0B] border border-[#302840] panel-rim rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md mb-6 space-y-3.5 animate-in fade-in duration-300">
      
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#302840]/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F59E0B]/20 text-[#FFE04A] border border-[#F59E0B]/30 flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-[#FFE04A]" />
          </div>
          <div>
            <h4 className="text-sm font-headline font-bold text-white flex items-center gap-2">
              <span>Alerta de Posible Duplicidad (RF-09)</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFE04A] text-black">
                {count} {count === 1 ? 'movimiento' : 'movimientos'}
              </span>
            </h4>
            <p className="text-xs text-[#A098B0] font-sans">
              Transacciones detectadas en la cartola que coinciden en monto y fecha cercana con compras registradas previamente por Google Wallet o Telegram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={onResolveAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-bold bg-[#FFE04A] text-black hover:bg-[#ffe66d] shadow-sm transition transform hover:scale-105 active:scale-95"
            title="Aceptar todas y quitar marca de duplicidad"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Aceptar Todas</span>
          </button>
          {onOpenTransactions && (
            <button
              onClick={onOpenTransactions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#141422] text-[#E8E0F0] hover:text-white border border-[#302840] hover:border-slate-600 transition"
            >
              <span>Ver en Cartola</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00FFCC]" />
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Items Comparison List (Up to 3 previewed) */}
      <div className="divide-y divide-[#302840]/60 space-y-2">
        {duplicates.slice(0, 3).map((tx) => (
          <div key={tx.id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#E8E0F0] font-headline">{tx.description}</span>
                <span className="font-mono font-bold text-[#00FFCC] bg-[#00FFCC]/10 px-2 py-0.5 rounded border border-[#00FFCC]/20 text-[11px]">
                  {formatCLP(tx.amount)}
                </span>
                <span className="text-[10px] text-[#A098B0] font-mono">{tx.date}</span>
              </div>
              {tx.duplicateOfDescription && (
                <div className="text-[11px] text-[#FFE04A]/90 flex items-center gap-1.5 bg-[#141422] px-2.5 py-1 rounded-lg border border-[#302840]">
                  <span className="font-semibold shrink-0">Coincide con:</span>
                  <span className="italic truncate">{tx.duplicateOfDescription}</span>
                </div>
              )}
            </div>

            {/* Item Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => onDismissDuplicate(tx.id)}
                className="px-2.5 py-1 rounded-lg bg-[#141422] text-[#00FFCC] hover:bg-[#00FFCC]/10 border border-[#00FFCC]/30 font-semibold text-[11px] transition"
                title="Confirmar que no es un duplicado y mantener en cartola"
              >
                No es Duplicada
              </button>
              <button
                onClick={() => onDeleteDuplicate(tx.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
                title="Eliminar este movimiento duplicado de la cartola"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {duplicates.length > 3 && (
          <div className="pt-2 text-center">
            <button
              onClick={onOpenTransactions}
              className="text-xs text-[#FFE04A] hover:underline font-semibold"
            >
              + Ver {duplicates.length - 3} movimientos duplicados más en la pestaña de Movimientos →
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

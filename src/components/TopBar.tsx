import React from 'react';
import { Menu, CreditCard, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { Account } from '../types';

interface TopBarProps {
  accounts: Account[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  currentUser?: any;
  isCloudLoading?: boolean;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  currentUser,
  isCloudLoading = false,
  onToggleMobileMenu
}) => {
  return (
    <header className="h-14 sm:h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 w-full sticky top-0 z-30 shadow-sm">
      
      {/* Extremo Izquierdo: Botón Menú Móvil + Selector de Cuenta Activa */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            aria-label="Abrir Menú Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Selector de Cuenta Activa */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-slate-200 shadow-inner hover:border-slate-700 transition">
          <CreditCard className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <select
            value={activeAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 max-w-[180px] sm:max-w-[280px] truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white font-normal">
              Todas las Cuentas & TC
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-900 text-white font-normal">
                {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
                {acc.closingDay ? ` [Corte: día ${acc.closingDay}]` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Extremo Derecho: Píldora de Sync Nube + Selector rápido de Período / Mes */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Píldora de Sync Nube */}
        {currentUser ? (
          isCloudLoading ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>Sincronizando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sync Nube</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Modo Demo</span>
          </div>
        )}

        {/* Selector rápido de Período / Mes */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-slate-200 shadow-inner hover:border-slate-700 transition">
          <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-slate-900 text-white font-normal">
              Todos los Períodos
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white font-normal">
                {m}
              </option>
            ))}
          </select>
        </div>

      </div>

    </header>
  );
};

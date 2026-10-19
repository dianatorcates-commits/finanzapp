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
  const selectedAcc = accounts.find((a) => a.id === activeAccountId);

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
      
      {/* Left: Hamburger (Mobile) + Active Account Switcher */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            aria-label="Abrir Menú Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Styled Dark Mode Account Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl shadow-inner transition group">
          <CreditCard className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <select
            value={activeAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 max-w-[200px] sm:max-w-[300px] truncate"
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

      {/* Right: Cloud Sync Status & Month Quick Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Cloud Sync Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm transition">
          {currentUser ? (
            isCloudLoading ? (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border-amber-500/30 px-2 py-0.5 rounded-lg">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Sincronizando Nube...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sync Nube Activa</span>
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400 bg-slate-900 border-slate-800 px-2.5 py-0.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Demo Local</span>
            </span>
          )}
        </div>

        {/* Quick Month / Period Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl shadow-inner transition">
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

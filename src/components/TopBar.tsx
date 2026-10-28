import React, { useRef, useEffect } from 'react';
import {
  Menu,
  CreditCard,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  Command
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { WakingMascotWidget } from './WakingMascotWidget';

interface TopBarProps {
  accounts: Account[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  currentUser?: any;
  transactions?: Transaction[];
  isCloudLoading?: boolean;
  onToggleMobileMenu?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notificationCount?: number;
}

function formatMonthLabel(monthStr: string): string {
  if (!monthStr || monthStr === 'ALL') return 'Todos los Meses';
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return monthStr;
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);
  const date = new Date(year, month - 1, 1);
  const name = date.toLocaleDateString('es-CL', { month: 'long' });
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return `${capitalized} ${year}`;
}

export const TopBar: React.FC<TopBarProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  currentUser,
  transactions,
  isCloudLoading = false,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
  notificationCount = 0
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation handlers for < Mes >
  const handlePrevMonth = () => {
    if (!availableMonths || availableMonths.length === 0) return;
    if (selectedMonth === 'ALL') {
      onSelectMonth(availableMonths[availableMonths.length - 1]);
      return;
    }
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      onSelectMonth(availableMonths[idx - 1]);
    }
  };

  const handleNextMonth = () => {
    if (!availableMonths || availableMonths.length === 0) return;
    if (selectedMonth === 'ALL') {
      onSelectMonth(availableMonths[0]);
      return;
    }
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1 && idx !== -1) {
      onSelectMonth(availableMonths[idx + 1]);
    }
  };

  const canGoPrev = selectedMonth !== 'ALL' && availableMonths.indexOf(selectedMonth) > 0;
  const canGoNext =
    selectedMonth !== 'ALL' &&
    availableMonths.indexOf(selectedMonth) < availableMonths.length - 1 &&
    availableMonths.indexOf(selectedMonth) !== -1;

  return (
    <header className="h-16 bg-[#0A0A12]/90 backdrop-blur-xl border-b border-[#302840]/60 flex items-center justify-between px-3 sm:px-6 w-full sticky top-0 z-30 shadow-sm font-sans">
      
      {/* Left Section: Mobile Menu Toggle + Account Selector */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-[#141422] border border-[#302840] transition"
            aria-label="Abrir Menú Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Account Selector */}
        <div className="flex items-center gap-2 bg-[#141422] border border-[#302840] panel-rim px-2.5 py-1.5 rounded-xl text-xs sm:text-sm text-[#E8E0F0] shadow-inner hover:border-slate-700 transition">
          <CreditCard className="w-4 h-4 text-[#00FFCC] shrink-0" />
          <select
            value={activeAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-[#E8E0F0] font-headline font-semibold focus:outline-none cursor-pointer pr-1 max-w-[130px] sm:max-w-[220px] md:max-w-[260px] truncate"
          >
            <option value="ALL" className="bg-[#0F0F1A] text-[#E8E0F0] font-normal">
              Todas las Cuentas y TC
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-[#0F0F1A] text-[#E8E0F0] font-normal">
                {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
                {acc.closingDay ? ` [Corte: día ${acc.closingDay}]` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Section: Global Search Bar with ⌘K Shortcut (Desktop & Tablet) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A098B0]">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Buscar por comercio, glosa o monto..."
            className="w-full pl-9 pr-14 py-1.5 bg-[#141422] border border-[#302840] panel-rim rounded-xl text-xs text-[#E8E0F0] placeholder-[#A098B0]/60 focus:outline-none focus:border-[#FF2D78]/60 focus:ring-1 focus:ring-[#FF2D78]/30 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#A098B0] bg-[#0A0A12] border border-[#302840] rounded shadow-sm">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section: Month Stepper Navigation + Cloud Sync + Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Month Selector with < Prev / Next > Buttons */}
        <div className="flex items-center bg-[#141422] border border-[#302840] panel-rim rounded-xl p-0.5 shadow-inner">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoPrev && selectedMonth !== 'ALL'}
            className="p-1 rounded-lg text-[#A098B0] hover:text-white hover:bg-[#1C1C2E] disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Mes Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#00FFCC] shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-xs text-[#E8E0F0] font-headline font-semibold focus:outline-none cursor-pointer text-center"
            >
              <option value="ALL" className="bg-[#0F0F1A] text-[#E8E0F0] font-normal">
                Todos
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#0F0F1A] text-[#E8E0F0] font-normal">
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={!canGoNext && selectedMonth !== 'ALL'}
            className="p-1 rounded-lg text-[#A098B0] hover:text-white hover:bg-[#1C1C2E] disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Mes Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Waking Mascot Mini Avatar Mood/Energy Indicator */}
        <WakingMascotWidget variant="mini-badge" transactions={transactions} />

        {/* Cloud Sync Status Pill */}
        {currentUser ? (
          isCloudLoading ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span className="hidden sm:inline">Sync...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-semibold bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] animate-pulse" />
              <span className="hidden sm:inline">Sync Nube</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-semibold bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30">
            <Sparkles className="w-3 h-3 text-[#FFE04A]" />
            <span className="hidden sm:inline">Demo</span>
          </div>
        )}

        {/* Notifications Icon with Badge (if applicable) */}
        {notificationCount > 0 && (
          <div className="relative">
            <button
              className="p-2 rounded-xl bg-[#141422] border border-[#302840] text-[#A098B0] hover:text-[#FFE04A] transition"
              title={`${notificationCount} notificaciones pendientes`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFE04A] ring-2 ring-[#0A0A12] animate-pulse" />
            </button>
          </div>
        )}

      </div>

    </header>
  );
};

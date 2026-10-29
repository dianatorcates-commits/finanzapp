import React, { useState } from 'react';
import { Sparkles, Plus, Upload, X, MessageSquare } from 'lucide-react';
import { Transaction, Account } from '../types';
import { getMascotState, MascotState } from '../utils/mascotEngine';
import { isDemoAccount } from '../utils/demoData';

interface WakingMascotWidgetProps {
  transactions?: Transaction[];
  accounts?: Account[];
  currentUser?: { created_at?: string; id?: string } | null;
  mascotState?: MascotState;
  variant?: 'floating' | 'dashboard' | 'sidebar' | 'compact' | 'mini-badge';
  onQuickAdd?: () => void;
  onOpenCreateAccount?: () => void;
  onOpenImportModal?: () => void;
  className?: string;
}

export const WakingMascotWidget: React.FC<WakingMascotWidgetProps> = ({
  transactions,
  accounts,
  currentUser,
  mascotState: propState,
  variant = 'floating',
  onQuickAdd,
  onOpenCreateAccount,
  onOpenImportModal,
  className = '',
}) => {
  // If user is authenticated, filter out any demo accounts so they don't block welcome onboarding (Issue #44)
  const realAccounts = currentUser?.id && accounts ? accounts.filter((a) => !isDemoAccount(a)) : (accounts || []);

  // If mascotState is provided directly use it, otherwise compute from transactions and user context
  const mascot: MascotState =
    propState ||
    getMascotState(transactions || [], {
      accountsCount: realAccounts.length,
      userCreatedAt: currentUser?.created_at
    });

  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [isPoked, setIsPoked] = useState(false);
  const [isSidebarTooltipOpen, setIsSidebarTooltipOpen] = useState(false);

  const handlePoke = () => {
    setIsPoked(true);
    // If speech bubble was closed, poke opens it; if open, poke can toggle or play bounce
    setIsBubbleOpen((prev) => !prev);
    setTimeout(() => setIsPoked(false), 700);
  };

  // 1. Variant: Compact Sidebar Header Integration
  if (variant === 'sidebar') {
    return (
      <div
        className={`relative group cursor-pointer ${className}`}
        onMouseEnter={() => setIsSidebarTooltipOpen(true)}
        onMouseLeave={() => setIsSidebarTooltipOpen(false)}
        onClick={() => setIsSidebarTooltipOpen((prev) => !prev)}
      >
        <div className="relative">
          <img
            src={mascot.image}
            alt={`Mascota FinanzApp - ${mascot.stateName}`}
            className={`w-9 h-9 object-contain drop-shadow-md transition-transform ${
              isPoked ? 'scale-125 rotate-6' : mascot.animationClass
            }`}
          />
          {/* Energy Ring / Mood Indicator */}
          <span
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-[#0A0A12] flex items-center justify-center text-[7px] font-bold ${
              mascot.tier === 'welcome'
                ? 'bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]'
                : mascot.tier === 3
                ? 'bg-[#FF2D78] shadow-[0_0_8px_#FF2D78]'
                : mascot.tier === 2
                ? 'bg-[#00FFCC] shadow-[0_0_8px_#00FFCC]'
                : mascot.tier === 1
                ? 'bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]'
                : mascot.tier === 0.5
                ? 'bg-[#FFE04A] shadow-[0_0_6px_#FFE04A]'
                : 'bg-slate-600'
            }`}
          />
        </div>

        {/* Floating Speech Bubble Tooltip on Hover */}
        <div
          className={`absolute left-0 top-12 z-50 w-64 p-3 bg-[#141422] border border-[#302840] panel-rim rounded-2xl shadow-2xl transition-all duration-200 pointer-events-none ${
            isSidebarTooltipOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#141422] border-t border-l border-[#302840] rotate-45" />

          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#302840]/60">
            <span className="text-[10px] font-mono font-bold text-[#00FFCC] uppercase tracking-wider flex items-center gap-1">
              <span>{mascot.moodEmoji}</span>
              <span>{mascot.stateName}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-[#A098B0]">
              {mascot.energyPercent}% Energía
            </span>
          </div>

          <p className="text-xs text-white font-medium leading-snug">
            "{mascot.message}"
          </p>

          <div className="mt-2 pt-1.5 border-t border-[#302840]/40 flex items-center justify-between text-[10px] text-[#A098B0] font-mono">
            {mascot.tier === 'welcome' ? (
              <>
                <span>Primeros pasos</span>
                <span className="text-[#00FFCC] font-bold">¡Bienvenido!</span>
              </>
            ) : (
              <>
                <span>Hoy: {mascot.txTodayCount} de 5</span>
                <span className={mascot.txTodayCount >= 5 ? 'text-[#00FFCC] font-bold' : ''}>
                  {mascot.statusBadge}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Variant: Mini Badge for Mobile TopBar or Mobile Header
  if (variant === 'mini-badge') {
    return (
      <div
        onClick={() => setIsBubbleOpen(!isBubbleOpen)}
        className={`relative inline-flex items-center gap-1.5 px-2 py-1 bg-[#141422] border border-[#302840] panel-rim rounded-full cursor-pointer hover:border-[#00FFCC]/50 transition ${className}`}
        title={mascot.message}
      >
        <div className="relative">
          <img
            src={mascot.image}
            alt={mascot.stateName}
            className={`w-5 h-5 object-contain ${mascot.animationClass}`}
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
              mascot.tier === 'welcome'
                ? 'bg-[#00FFCC]'
                : mascot.tier === 3
                ? 'bg-[#FF2D78]'
                : mascot.tier === 2
                ? 'bg-[#00FFCC]'
                : mascot.tier === 1
                ? 'bg-[#38bdf8]'
                : mascot.tier === 0.5
                ? 'bg-[#FFE04A]'
                : 'bg-slate-600'
            }`}
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-white">
          {mascot.energyPercent}%
        </span>
      </div>
    );
  }

  // 3. Variant: Compact Card
  if (variant === 'compact') {
    return (
      <div
        className={`p-3 rounded-2xl bg-[#141422] border border-[#302840] panel-rim flex items-center justify-between gap-3 shadow-md ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <img
            src={mascot.image}
            alt={mascot.stateName}
            className={`w-8 h-8 object-contain shrink-0 ${mascot.animationClass}`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-headline">{mascot.stateName}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0A0A12] border border-[#302840] text-[#00FFCC]">
                {mascot.energyPercent}%
              </span>
            </div>
            <p className="text-[11px] text-[#A098B0] line-clamp-1">{mascot.message}</p>
          </div>
        </div>

        {onQuickAdd && (
          <button
            onClick={onQuickAdd}
            className="p-1.5 rounded-xl bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30 transition shrink-0"
            title="Añadir movimiento rápido"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // 4. Variant: Dashboard Banner
  if (variant === 'dashboard') {
    return (
      <div
        className={`bg-gradient-to-r from-[#141422] via-[#111118] to-[#141422] border border-[#302840] panel-rim rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all hover:border-[#302840]/90 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div
              onClick={handlePoke}
              className="relative cursor-pointer shrink-0 group select-none"
              title="¡Tócame para interactuar!"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A0A12] border border-[#302840] flex items-center justify-center p-2 shadow-inner group-hover:border-[#00FFCC]/40 transition">
                <img
                  src={mascot.image}
                  alt={`Mascota FinanzApp - ${mascot.stateName}`}
                  className={`w-11 h-11 sm:w-12 sm:h-12 object-contain transition-transform duration-300 ${
                    isPoked ? 'scale-125 rotate-12' : mascot.animationClass
                  }`}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0A0A12] bg-[#00FFCC] text-black">
                {mascot.energyPercent}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 uppercase tracking-wider">
                  Billetera con Vida
                </span>
                <span className="text-[10px] font-mono text-[#A098B0]">
                  {mascot.stateName}
                </span>
              </div>
              <div className="relative inline-block bg-[#0A0A12] border border-[#302840] panel-rim rounded-2xl px-3.5 py-2 shadow-sm animate-speech-bubble">
                <p className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                  "{mascot.message}"
                </p>
              </div>
            </div>
          </div>

          {mascot.tier === 'welcome' ? (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onOpenCreateAccount && (
                <button
                  onClick={onOpenCreateAccount}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:from-[#00e6b8] hover:to-[#0ea5e9] text-[#0A0A12] text-xs font-black shadow-md transition transform hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Crear Primera Cuenta</span>
                </button>
              )}
              {onOpenImportModal && (
                <button
                  onClick={onOpenImportModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0A12] hover:bg-[#1A1A2E] text-white border border-[#302840] hover:border-[#00FFCC]/40 text-xs font-bold transition active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-[#00FFCC]" />
                  <span>Cargar Cartola</span>
                </button>
              )}
            </div>
          ) : (
            onQuickAdd && (
              <button
                onClick={onQuickAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] text-[#0A0A12] text-xs font-black shadow-md transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Registrar Gasto</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // 5. Default Primary Variant: Floating Fixed Widget in Bottom-Right Corner (Issue #31 & Issue #42)
  return (
    <aside
      aria-label="Mascota Virtual FinanzApp"
      className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 select-none flex flex-col items-end pointer-events-auto ${className}`}
    >
      {/* Floating Speech Bubble Above/Left of Avatar */}
      {isBubbleOpen && (
        <div
          className="relative mb-2 max-w-[270px] sm:max-w-[310px] p-3.5 bg-[#141422]/95 backdrop-blur-xl border border-[#302840] panel-rim rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200 text-left"
          role="status"
        >
          {/* Header of speech bubble */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#302840]/60">
            <div className="flex items-center gap-1.5">
              <span className="text-sm select-none">{mascot.moodEmoji}</span>
              <span className="text-[10px] font-mono font-bold text-[#00FFCC] uppercase tracking-wider">
                {mascot.stateName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                  mascot.tier === 'welcome'
                    ? 'bg-[#00FFCC]/20 text-[#00FFCC] border-[#00FFCC]/40'
                    : mascot.tier === 3
                    ? 'bg-[#FF2D78]/20 text-[#FF2D78] border-[#FF2D78]/40'
                    : mascot.tier === 2
                    ? 'bg-[#00FFCC]/20 text-[#00FFCC] border-[#00FFCC]/40'
                    : mascot.tier === 1
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40'
                    : mascot.tier === 0.5
                    ? 'bg-[#FFE04A]/20 text-[#FFE04A] border-[#FFE04A]/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {mascot.energyPercent}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBubbleOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e1e2d] transition"
                aria-label="Minimizar diálogo de la mascota"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Contextual message text */}
          <p className="text-xs font-semibold text-white tracking-tight leading-snug">
            "{mascot.message}"
          </p>

          {/* Welcome Action Buttons (Issue #42) or Progress bar */}
          {mascot.tier === 'welcome' ? (
            <div className="mt-2.5 pt-2 border-t border-[#302840]/60 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#00FFCC] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FFE04A]" />
                  <span>Primeros Pasos</span>
                </span>
                <span className="text-[#A098B0]">{realAccounts.length} cuentas</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-0.5">
                {onOpenCreateAccount && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreateAccount();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:from-[#00e6b8] hover:to-[#0ea5e9] text-black font-headline font-bold text-xs shadow-md transition transform hover:scale-[1.02] active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Crear Primera Cuenta</span>
                  </button>
                )}
                {onOpenImportModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenImportModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#0A0A12] hover:bg-[#1A1A2E] text-white border border-[#302840] hover:border-[#00FFCC]/40 font-headline font-bold text-xs transition active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>Cargar Cartola</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Progress bar towards 5 daily expenses */}
              <div className="mt-2.5 pt-2 border-t border-[#302840]/40 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                <span>Meta: {mascot.txTodayCount}/5 hoy</span>
                <span className={mascot.txTodayCount >= 5 ? 'text-[#00FFCC] font-bold' : 'text-[#FFE04A]'}>
                  {mascot.statusBadge}
                </span>
              </div>

              <div className="w-full bg-[#0A0A12] h-1.5 rounded-full overflow-hidden mt-1 border border-[#302840]/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    mascot.tier === 3
                      ? 'bg-gradient-to-r from-[#00FFCC] to-[#FF2D78] shadow-[0_0_8px_#FF2D78]'
                      : mascot.tier === 2
                      ? 'bg-[#00FFCC]'
                      : mascot.tier === 1
                      ? 'bg-[#38bdf8]'
                      : mascot.tier === 0.5
                      ? 'bg-[#FFE04A]'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${Math.min(100, (mascot.txTodayCount / 5) * 100)}%` }}
                />
              </div>
            </>
          )}

          {/* Downward pointer arrow towards the mascot */}
          <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-[#141422] border-b border-r border-[#302840] rotate-45" />
        </div>
      )}

      {/* Floating Avatar Container (64px mobile to 80px desktop) */}
      <div
        onClick={handlePoke}
        className="relative group cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
        title="¡Toca a la Billetera para interactuar!"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePoke();
          }
        }}
      >
        {/* Glow halo behind mascot */}
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity group-hover:opacity-75 ${
            mascot.tier === 'welcome'
              ? 'bg-[#00FFCC]'
              : mascot.tier === 3
              ? 'bg-[#FF2D78]'
              : mascot.tier === 2
              ? 'bg-[#00FFCC]'
              : mascot.tier === 1
              ? 'bg-[#38bdf8]'
              : mascot.tier === 0.5
              ? 'bg-[#FFE04A]'
              : 'bg-slate-500'
          }`}
        />

        {/* Mascot Avatar Image: Highlighted 64px–80px Size */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1">
          <img
            src={mascot.image}
            alt={`Mascota FinanzApp - ${mascot.stateName}`}
            className={`w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 ${
              isPoked ? 'scale-125 rotate-12' : mascot.animationClass
            }`}
          />

          {/* Mood Emoji or Energy Badge floating on corner */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full ring-2 ring-[#0A0A12] flex items-center justify-center text-xs shadow-lg ${
              mascot.tier === 'welcome'
                ? 'bg-[#00FFCC] text-black shadow-[0_0_10px_#00FFCC]'
                : mascot.tier === 3
                ? 'bg-[#FF2D78] text-white shadow-[0_0_10px_#FF2D78]'
                : mascot.tier === 2
                ? 'bg-[#00FFCC] text-black shadow-[0_0_10px_#00FFCC]'
                : mascot.tier === 1
                ? 'bg-[#38bdf8] text-black shadow-[0_0_8px_#38bdf8]'
                : mascot.tier === 0.5
                ? 'bg-[#FFE04A] text-black shadow-[0_0_8px_#FFE04A]'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {mascot.moodEmoji}
          </span>
        </div>
      </div>
    </aside>
  );
};

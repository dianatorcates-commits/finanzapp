import React, { useState } from 'react';
import { Sparkles, Zap, Plus, Info, CheckCircle2, Moon, Sun } from 'lucide-react';
import { Transaction } from '../types';
import { getMascotState, MascotState } from '../utils/mascotEngine';

interface WakingMascotWidgetProps {
  transactions?: Transaction[];
  mascotState?: MascotState;
  variant?: 'dashboard' | 'sidebar' | 'compact' | 'mini-badge';
  onQuickAdd?: () => void;
  className?: string;
}

export const WakingMascotWidget: React.FC<WakingMascotWidgetProps> = ({
  transactions,
  mascotState: propState,
  variant = 'dashboard',
  onQuickAdd,
  className = '',
}) => {
  // If mascotState is provided directly use it, otherwise compute from transactions
  const mascot: MascotState = propState || getMascotState(transactions || []);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isPoked, setIsPoked] = useState(false);

  const handlePoke = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 800);
  };

  // 1. Variant: Compact Sidebar Header Integration
  if (variant === 'sidebar') {
    return (
      <div
        className={`relative group cursor-pointer ${className}`}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        onClick={handlePoke}
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
              mascot.tier === 3
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
            isTooltipOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }`}
        >
          {/* Little triangle arrow pointing up */}
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
            <span>Hoy: {mascot.txTodayCount} de 5</span>
            <span className={mascot.txTodayCount >= 5 ? 'text-[#00FFCC] font-bold' : ''}>
              {mascot.statusBadge}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Variant: Mini Badge for Mobile Navigation Bar or Mobile TopBar
  if (variant === 'mini-badge') {
    return (
      <div
        onClick={() => setIsTooltipOpen(!isTooltipOpen)}
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
              mascot.tier === 3
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

        {/* Mobile Popover when tapped */}
        {isTooltipOpen && (
          <div className="absolute right-0 top-9 z-50 w-56 p-2.5 bg-[#0F0F1A] border border-[#302840] panel-rim rounded-2xl shadow-2xl text-left animate-in fade-in duration-150">
            <p className="text-[11px] text-white font-medium">"{mascot.message}"</p>
            <div className="mt-1 pt-1 border-t border-[#302840]/60 flex items-center justify-between text-[9px] font-mono text-[#A098B0]">
              <span>{mascot.stateName}</span>
              <span className="text-[#00FFCC] font-bold">{mascot.txTodayCount}/5 hoy</span>
            </div>
          </div>
        )}
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

  // 4. Variant: Full Dashboard Interactive Widget ("Billetera con Vida")
  return (
    <div
      className={`bg-gradient-to-r from-[#141422] via-[#111118] to-[#141422] border border-[#302840] panel-rim rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all hover:border-[#302840]/90 ${className}`}
    >
      {/* Decorative neon ambient backlight */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
          mascot.tier === 3
            ? 'bg-[#FF2D78]'
            : mascot.tier === 2
            ? 'bg-[#00FFCC]'
            : mascot.tier === 1
            ? 'bg-[#38bdf8]'
            : mascot.tier === 0.5
            ? 'bg-[#FFE04A]'
            : 'bg-indigo-600'
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        
        {/* Mascot Avatar + Speech Bubble */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          
          {/* Avatar Container with Poke Interaction */}
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

            {/* Energy Badge Floating */}
            <span
              className={`absolute -bottom-1 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0A0A12] border shadow-sm ${
                mascot.tier === 3
                  ? 'bg-[#FF2D78] text-white border-[#FF2D78]'
                  : mascot.tier === 2
                  ? 'bg-[#00FFCC] text-black border-[#00FFCC]'
                  : mascot.tier === 1
                  ? 'bg-[#38bdf8] text-black border-[#38bdf8]'
                  : mascot.tier === 0.5
                  ? 'bg-[#FFE04A] text-black border-[#FFE04A]'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {mascot.energyPercent}%
            </span>
          </div>

          {/* Speech Bubble */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 uppercase tracking-wider">
                Billetera con Vida
              </span>
              <span className="text-[10px] font-mono text-[#A098B0]">
                {mascot.stateName}
              </span>
            </div>

            {/* Contextual Message Bubble */}
            <div className="relative inline-block bg-[#0A0A12] border border-[#302840] panel-rim rounded-2xl px-3.5 py-2 shadow-sm animate-speech-bubble">
              <p className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                "{mascot.message}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Activity Progress & Quick Add */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-[#302840]/60 shrink-0">
          
          {/* Daily Goal Counter */}
          <div className="text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-mono font-bold text-white">
              <span className="text-[#A098B0] font-sans font-normal text-[11px]">Meta Diaria:</span>
              <span className={mascot.txTodayCount >= 5 ? 'text-[#00FFCC]' : 'text-white'}>
                {mascot.txTodayCount} / 5 gastos
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-28 sm:w-32 bg-[#0A0A12] h-1.5 rounded-full overflow-hidden mt-1.5 border border-[#302840]/60">
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
          </div>

          {/* Quick Action Button */}
          {onQuickAdd && (
            <button
              onClick={onQuickAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:opacity-90 text-[#0A0A12] text-xs font-black shadow-md shadow-[#00FFCC]/15 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Registrar Gasto</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

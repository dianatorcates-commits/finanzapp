import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Scale,
  Menu,
  X,
  Target,
  Landmark,
  Tag,
  Upload,
  Download,
  Send,
  Smartphone,
  LogOut,
  User,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Plus,
  Link2
} from 'lucide-react';
import { Transaction } from '../types';
import { WakingMascotWidget } from './WakingMascotWidget';
import { getMascotState } from '../utils/mascotEngine';

export interface BottomNavBarProps {
  activeTab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits') => void;
  duplicateCount?: number;
  currentUser?: any;
  transactions?: Transaction[];
  isTelegramLinked?: boolean;
  onOpenImport: () => void;
  onOpenAddTransaction?: () => void;
  onOpenAutoAllocate: () => void;
  onOpenTelegramModal: () => void;
  onOpenWalletModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onExport: () => void;
  onResetDemo: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  duplicateCount = 0,
  currentUser,
  transactions,
  isTelegramLinked = false,
  onOpenImport,
  onOpenAddTransaction,
  onOpenAutoAllocate,
  onOpenTelegramModal,
  onOpenWalletModal,
  onOpenAuthModal,
  onSignOut,
  onExport,
  onResetDemo
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mascot = getMascotState(transactions || []);

  const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Invitado';

  const handleTabClick = (tab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits') => {
    onSelectTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Action Sheet / Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sheet Panel */}
          <div className="relative bg-[#0F0F1A] border-t border-[#302840] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header with Title and Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#302840]/60">
              <div className="flex items-center gap-2">
                <WakingMascotWidget variant="sidebar" transactions={transactions} />
                <span className="font-headline font-bold text-base text-[#E8E0F0]">
                  Menú FinanzApp
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                aria-label="Cerrar Menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Summary */}
            <div className="p-3 rounded-2xl bg-[#141422] border border-[#302840]/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D78] to-[#00FFCC] text-black font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#E8E0F0] truncate font-headline">{userName}</p>
                  <p className="text-[10px] text-[#A098B0] truncate">{currentUser?.email || 'Modo Demostración'}</p>
                </div>
              </div>
              {currentUser ? (
                <button
                  onClick={() => {
                    onSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs flex items-center gap-1 shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuthModal();
                    setIsMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FF2D78] text-white font-bold text-xs shadow-sm hover:bg-[#ff1a6c] shrink-0"
                >
                  Acceder
                </button>
              )}
            </div>

            {/* Quick Actions: Cargar Movimiento (Principal) & Importar Cartola (Secundario) */}
            <div className="space-y-2">
              {onOpenAddTransaction && (
                <button
                  onClick={() => {
                    onOpenAddTransaction();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg glow-primary transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cargar Movimiento</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenImport();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#141422] hover:bg-[#1C1C2E] text-[#00FFCC] border border-[#00FFCC]/30 hover:border-[#00FFCC] font-headline font-semibold text-xs py-2.5 px-4 rounded-xl transition shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Cargar Cartola Bancaria</span>
              </button>
            </div>

            {/* Additional Modules */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#A098B0] uppercase tracking-wider px-2">
                Módulos y Gestión
              </p>

              <button
                onClick={() => handleTabClick('budgets')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  activeTab === 'budgets'
                    ? 'bg-[#141422] text-[#00FFCC] border border-[#00FFCC]/30 font-semibold'
                    : 'text-[#E8E0F0] hover:bg-[#141422]'
                }`}
              >
                <Target className="w-4 h-4 text-[#FFE04A]" />
                <span>Presupuestos y Metas de Ahorro</span>
              </button>

              <button
                onClick={() => handleTabClick('credits')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  activeTab === 'credits'
                    ? 'bg-[#141422] text-[#00FFCC] border border-[#00FFCC]/30 font-semibold'
                    : 'text-[#E8E0F0] hover:bg-[#141422]'
                }`}
              >
                <Landmark className="w-4 h-4 text-[#00FFCC]" />
                <span>Compras en Cuotas y Créditos</span>
              </button>

              <button
                onClick={() => handleTabClick('categories')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  activeTab === 'categories'
                    ? 'bg-[#141422] text-[#00FFCC] border border-[#00FFCC]/30 font-semibold'
                    : 'text-[#E8E0F0] hover:bg-[#141422]'
                }`}
              >
                <Tag className="w-4 h-4 text-[#FF2D78]" />
                <span>Categorías y Reglas Automáticas</span>
              </button>
            </div>

            {/* Integrations & Channels */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#A098B0] uppercase tracking-wider px-2">
                Integraciones en Tiempo Real
              </p>

              <button
                onClick={() => {
                  if (currentUser) {
                    onOpenTelegramModal();
                  } else {
                    onOpenAuthModal();
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#E8E0F0] hover:bg-[#141422] transition"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-sky-400 -rotate-12" />
                  <span>Bot de Telegram</span>
                </div>
                {isTelegramLinked ? (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Activo
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Conectar
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (currentUser) {
                    onOpenWalletModal();
                  } else {
                    onOpenAuthModal();
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#E8E0F0] hover:bg-[#141422] transition"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Google Wallet & Notificaciones</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Webhook
                </span>
              </button>
            </div>

            {/* Utility Actions */}
            <div className="space-y-1 pt-2 border-t border-[#302840]/60">
              <button
                onClick={() => {
                  onOpenAutoAllocate();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-emerald-400 transition"
              >
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Auto-asociar Pagos de TC</span>
              </button>

              <button
                onClick={() => {
                  onExport();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-sky-400 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Exportar Movimientos a Excel</span>
              </button>

              <button
                onClick={() => {
                  onResetDemo();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Restablecer Datos Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Bar */}
      <nav
        aria-label="Navegación Móvil Inferior"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A12]/95 backdrop-blur-md border-t border-[#302840]/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          
          {/* 1. Dashboard */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] rounded-xl transition-all select-none touch-manipulation ${
              activeTab === 'dashboard'
                ? 'text-[#FF2D78] font-bold'
                : 'text-[#A098B0] hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-[#FF2D78]/10' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
          </button>

          {/* 2. Movimientos */}
          <button
            onClick={() => handleTabClick('transactions')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] rounded-xl transition-all select-none touch-manipulation ${
              activeTab === 'transactions'
                ? 'text-[#FF2D78] font-bold'
                : 'text-[#A098B0] hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'transactions' ? 'bg-[#FF2D78]/10' : ''}`}>
              <ReceiptText className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Movimientos</span>
          </button>

          {/* 3. Cuentas */}
          <button
            onClick={() => handleTabClick('accounts')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] rounded-xl transition-all select-none touch-manipulation ${
              activeTab === 'accounts'
                ? 'text-[#FF2D78] font-bold'
                : 'text-[#A098B0] hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'accounts' ? 'bg-[#FF2D78]/10' : ''}`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Cuentas</span>
          </button>

          {/* 4. Conciliar (con Badge de Duplicados) */}
          <button
            onClick={() => {
              onSelectTab('transactions');
              onOpenAutoAllocate();
            }}
            className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] rounded-xl transition-all select-none touch-manipulation text-[#A098B0] hover:text-[#00FFCC] relative"
            title="Conciliar y auto-asociar pagos de TC"
          >
            <div className="p-1 rounded-xl relative">
              <Scale className="w-5 h-5" />
              {duplicateCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#FFE04A] text-black text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                  {duplicateCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Conciliar</span>
          </button>

          {/* 5. Menú Más Opciones con Mini-Mascota */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] rounded-xl transition-all select-none touch-manipulation ${
              isMenuOpen
                ? 'text-[#FF2D78] font-bold'
                : 'text-[#A098B0] hover:text-white'
            }`}
            title={`Mascota: ${mascot.stateName} (${mascot.energyPercent}% energía)`}
          >
            <div className={`p-1 rounded-xl transition relative ${isMenuOpen ? 'bg-[#FF2D78]/10' : ''}`}>
              <Menu className="w-5 h-5" />
              {/* Mini energy indicator */}
              <span className="absolute -top-1 -right-1 text-[9px] leading-none">
                {mascot.moodEmoji}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Menú</span>
          </button>

        </div>
      </nav>
    </>
  );
};

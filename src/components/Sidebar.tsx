import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  Upload,
  Link2,
  Download,
  CreditCard,
  Tag,
  Send,
  LogOut,
  User,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  Landmark,
  Smartphone,
  Plus,
  Zap,
  Bot
} from 'lucide-react';
import { Transaction } from '../types';
import { WakingMascotWidget } from './WakingMascotWidget';

interface SidebarProps {
  activeTab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits') => void;
  currentUser?: any;
  transactions?: Transaction[];
  isTelegramLinked?: boolean;
  onOpenImport: () => void;
  onOpenAccountModal?: () => void;
  onOpenCategoryModal?: () => void;
  onOpenBudgetModal?: () => void;
  onOpenTelegramModal: () => void;
  onOpenWalletModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onAutoAllocate: () => void;
  onResetDemo: () => void;
  onExport: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  transactions,
  isTelegramLinked,
  onOpenImport,
  onOpenAccountModal,
  onOpenCategoryModal,
  onOpenBudgetModal,
  onOpenTelegramModal,
  onOpenWalletModal,
  onOpenAuthModal,
  onSignOut,
  onAutoAllocate,
  onResetDemo,
  onExport,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const userName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split('@')[0] ||
    'Felipe el Ordenado';
  const userAvatar = currentUser?.user_metadata?.avatar_url;

  const content = (
    <div className="flex flex-col justify-between h-full p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 font-sans">
      
      {/* Upper Area */}
      <div className="space-y-5">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#302840]/60 px-1">
          <div className="flex items-center space-x-3">
            <WakingMascotWidget variant="sidebar" transactions={transactions} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-headline font-bold tracking-tight text-[#E8E0F0]">
                  FinanzApp
                </span>
                <span className="text-[9px] bg-[#FF2D78]/15 text-[#FF2D78] font-mono font-bold px-1.5 py-0.2 rounded border border-[#FF2D78]/30 uppercase tracking-wider">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-[#A098B0] font-mono leading-none">
                Terminal Financiero
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition"
              aria-label="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Action Button: + Nuevo Movimiento / Importar Cartola con Glow Neón */}
        <div className="pt-1">
          <button
            onClick={() => {
              onOpenImport();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-lg glow-primary transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nuevo Movimiento</span>
          </button>
        </div>

        {/* Section 1: Vistas Principales */}
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider px-3 mb-1.5">
            // Vistas Principales
          </p>
          
          <button
            onClick={() => {
              onSelectTab('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition group ${
              activeTab === 'dashboard'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118]'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 transition ${activeTab === 'dashboard' ? 'text-[#00FFCC]' : 'text-[#A098B0] group-hover:text-white'}`} />
            <span className="font-headline">Dashboard y Resumen</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('transactions');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition group ${
              activeTab === 'transactions'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118]'
            }`}
          >
            <ReceiptText className={`w-4 h-4 transition ${activeTab === 'transactions' ? 'text-[#00FFCC]' : 'text-[#A098B0] group-hover:text-white'}`} />
            <span className="font-headline">Movimientos y Cartola</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('budgets');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition group ${
              activeTab === 'budgets'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118] font-medium'
            }`}
          >
            <Target className={`w-4 h-4 transition ${activeTab === 'budgets' ? 'text-[#FFE04A]' : 'text-[#A098B0] group-hover:text-[#FFE04A]'}`} />
            <span className="font-headline">Presupuestos y Metas</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('credits');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition group ${
              activeTab === 'credits'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118] font-medium'
            }`}
          >
            <Landmark className={`w-4 h-4 transition ${activeTab === 'credits' ? 'text-[#00FFCC]' : 'text-[#A098B0] group-hover:text-[#00FFCC]'}`} />
            <span className="font-headline">Cuotas y Créditos</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('accounts');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition group ${
              activeTab === 'accounts'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118] font-medium'
            }`}
          >
            <CreditCard className={`w-4 h-4 transition ${activeTab === 'accounts' ? 'text-[#00FFCC]' : 'text-[#A098B0] group-hover:text-white'}`} />
            <span className="font-headline">Cuentas y Tarjetas</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('categories');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition group ${
              activeTab === 'categories'
                ? 'bg-[#141422] text-[#00FFCC] border-l-2 border-[#00FFCC] font-semibold shadow-inner'
                : 'text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#111118] font-medium'
            }`}
          >
            <Tag className={`w-4 h-4 transition ${activeTab === 'categories' ? 'text-[#FF2D78]' : 'text-[#A098B0] group-hover:text-[#FF2D78]'}`} />
            <span className="font-headline">Categorías y Reglas</span>
          </button>
        </div>

        {/* Section 2: Indicadores de Estado en Vivo (Live Status) */}
        <div className="space-y-1.5 pt-2 border-t border-[#302840]/60">
          <p className="text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider px-3 mb-1">
            // Canales en Vivo
          </p>

          {/* Telegram Bot Live Status */}
          <button
            onClick={() => {
              if (currentUser) {
                onOpenTelegramModal();
              } else {
                onOpenAuthModal();
              }
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#E8E0F0] hover:bg-[#141422] transition group"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-[#FF2D78] transition group-hover:scale-110" />
              <span className="text-xs">Telegram Bot</span>
            </div>
            {isTelegramLinked ? (
              <span className="flex items-center gap-1.5 text-[10px] text-[#FF2D78] bg-[#FF2D78]/10 border border-[#FF2D78]/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D78] animate-pulse" />
                Activo
              </span>
            ) : (
              <span className="text-[10px] bg-[#141422] text-[#A098B0] border border-[#302840] px-2 py-0.5 rounded-full font-mono">
                Conectar
              </span>
            )}
          </button>

          {/* MacroDroid / Wallet Live Status */}
          <button
            onClick={() => {
              if (currentUser) {
                onOpenWalletModal();
              } else {
                onOpenAuthModal();
              }
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#E8E0F0] hover:bg-[#141422] transition group"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[#00FFCC] transition group-hover:scale-110" />
              <span className="text-xs">MacroDroid / Wallet</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-[#00FFCC] bg-[#00FFCC]/10 border border-[#00FFCC]/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC]" />
              Conectado
            </span>
          </button>
        </div>

        {/* Section 3: Acciones Rápidas */}
        <div className="space-y-1 pt-2 border-t border-[#302840]/60">
          <p className="text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider px-3 mb-1">
            // Utilidades
          </p>

          <button
            onClick={() => {
              onAutoAllocate();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#111118] transition group"
            title="Asociar pagos cronológicamente a compras en tarjeta de crédito"
          >
            <Link2 className="w-3.5 h-3.5 text-[#A098B0] group-hover:text-[#00FFCC] transition" />
            <span>Auto-asociar Pagos</span>
          </button>

          <button
            onClick={() => {
              onExport();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#A098B0] hover:text-white hover:bg-[#111118] transition group"
          >
            <Download className="w-3.5 h-3.5 text-[#A098B0] group-hover:text-sky-400 transition" />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={() => {
              onResetDemo();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-[#111118] transition group"
            title="Restablecer datos de prueba a la cartola original"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
            <span>Restablecer Demo</span>
          </button>
        </div>

      </div>

      {/* Footer Area: User Profile Card (Stitch Terminal Style) */}
      <div className="pt-3 mt-3 border-t border-[#302840]/60">
        {currentUser ? (
          <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center space-x-2.5 min-w-0">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full border border-[#00FFCC]/40 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF2D78] to-[#00FFCC] text-black flex items-center justify-center font-headline font-bold text-xs flex-shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-headline font-bold text-[#E8E0F0] truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] font-mono text-[#A098B0] truncate leading-tight">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Cerrar Sesión"
              className="text-[#A098B0] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-[#141422] border border-[#FFE04A]/30 panel-rim rounded-2xl p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-headline font-bold text-[#FFE04A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFE04A]" />
                Modo Demo
              </span>
              <span className="text-[9px] bg-[#FFE04A]/10 text-[#FFE04A] font-mono font-semibold px-2 py-0.5 rounded border border-[#FFE04A]/30 uppercase">
                Invitado
              </span>
            </div>
            <p className="text-[10px] text-[#A098B0] leading-tight font-sans">
              Inicia sesión con Google para sincronizar tus transacciones en Supabase.
            </p>
            <button
              onClick={() => {
                onOpenAuthModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full bg-[#FF2D78] hover:bg-[#ff1a6c] text-white text-xs font-headline font-bold py-1.5 px-3 rounded-xl shadow-md transition transform hover:scale-[1.02]"
            >
              Iniciar Sesión
            </button>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (260px / w-64, #0A0A12) */}
      <aside className="hidden md:flex w-64 bg-[#0A0A12] border-r border-[#302840]/60 flex-col justify-between h-screen sticky top-0 z-40 select-none">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#0A0A12] border-r border-[#302840] shadow-2xl z-50 flex flex-col justify-between h-full animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

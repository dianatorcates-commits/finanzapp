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
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts' | 'credits') => void;
  currentUser?: any;
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
  const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Invitado';
  const userAvatar = currentUser?.user_metadata?.avatar_url;

  const content = (
    <div className="flex flex-col justify-between h-full p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* Upper Area */}
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 px-1">
          <div className="flex items-center space-x-3">
            <img
              src="/images/wallet_mascot_logo_128x128.png"
              alt="FinanzApp Logo"
              className="w-8 h-8 object-contain drop-shadow-md rounded-lg transition-transform hover:scale-105"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">FinanzApp</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/40 uppercase tracking-wider">
                PRO
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Section 1: Principal Navigation */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Vistas Principales
          </p>
          
          <button
            onClick={() => {
              onSelectTab('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition group ${
              activeTab === 'dashboard'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 transition ${activeTab === 'dashboard' ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span>Dashboard y Resumen</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('transactions');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition group ${
              activeTab === 'transactions'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ReceiptText className={`w-4 h-4 transition ${activeTab === 'transactions' ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span>Movimientos y Cartola</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('budgets');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition group ${
              activeTab === 'budgets'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 font-medium'
            }`}
          >
            <Target className={`w-4 h-4 transition ${activeTab === 'budgets' ? 'text-sky-400' : 'text-slate-500 group-hover:text-amber-400'}`} />
            <span>Presupuestos y Metas</span>
          </button>
        </div>

        {/* Section 2: Quick Actions */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Acciones Rápidas
          </p>

          {/* Featured Import Button */}
          <button
            onClick={() => {
              onOpenImport();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition transform hover:-translate-y-0.5 mb-2"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Cartola</span>
          </button>

          <button
            onClick={() => {
              onAutoAllocate();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-900/50 transition group"
            title="Asociar pagos cronológicamente a compras en tarjeta de crédito"
          >
            <Link2 className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
            <span>Auto-asociar Pagos</span>
          </button>

          <button
            onClick={() => {
              onExport();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition group"
          >
            <Download className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
            <span>Exportar a Excel</span>
          </button>
        </div>

        {/* Section 3: Configuration & Management */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Configuración y Canales
          </p>

          <button
            onClick={() => {
              onSelectTab('accounts');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition group ${
              activeTab === 'accounts'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 font-medium'
            }`}
          >
            <CreditCard className={`w-4 h-4 transition ${activeTab === 'accounts' ? 'text-sky-400' : 'text-slate-500 group-hover:text-sky-400'}`} />
            <span>Mis Cuentas y Tarjetas</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('credits');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition group ${
              activeTab === 'credits'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 font-medium'
            }`}
          >
            <Landmark className={`w-4 h-4 transition ${activeTab === 'credits' ? 'text-sky-400' : 'text-slate-500 group-hover:text-emerald-400'}`} />
            <span>Mis Créditos y Deudas</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('categories');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition group ${
              activeTab === 'categories'
                ? 'bg-slate-900/90 text-sky-400 border-l-2 border-sky-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 font-medium'
            }`}
          >
            <Tag className={`w-4 h-4 transition ${activeTab === 'categories' ? 'text-sky-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span>Categorías y Reglas</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) {
                onOpenTelegramModal();
              } else {
                onOpenAuthModal();
              }
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-sky-300 hover:bg-slate-900/50 transition group"
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4 text-sky-400 -rotate-12 transition group-hover:scale-110" />
              <span>Telegram Bot</span>
            </div>
            {isTelegramLinked ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Activo
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
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
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-900/50 transition group"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-400 transition group-hover:scale-110" />
              <span>Wallet / Android</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              Webhook
            </span>
          </button>

          {/* Reset Demo Option */}
          <button
            onClick={() => {
              onResetDemo();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 transition group"
            title="Restablecer datos de prueba a la cartola original"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
            <span>Restablecer Demo</span>
          </button>
        </div>

      </div>

      {/* Footer Area: User Profile Card */}
      <div className="pt-4 mt-4 border-t border-slate-800/80">
        {currentUser ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center space-x-2.5 min-w-0">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full border border-sky-500/40 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Cerrar Sesión"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Modo Demo
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 uppercase">
                Invitado
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Inicia sesión con Google para guardar tus transacciones reales en Supabase.
            </p>
            <button
              onClick={() => {
                onOpenAuthModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-md transition transform hover:scale-[1.02]"
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
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800/80 flex-col justify-between h-screen sticky top-0 z-40 select-none">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 flex flex-col justify-between h-full animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

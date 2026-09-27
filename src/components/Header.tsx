import React from 'react';
import { Wallet, Upload, CreditCard, RefreshCw, Link2, PlusCircle, Download, Tag, Sparkles, User, LogOut, Cloud } from 'lucide-react';
import { Account } from '../types';

interface HeaderProps {
  accounts: Account[];
  activeAccountId: string;
  currentUser?: any;
  onSelectAccount: (id: string) => void;
  onOpenImport: () => void;
  onOpenAccountModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onAutoAllocate: () => void;
  onResetDemo: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  activeAccountId,
  currentUser,
  onSelectAccount,
  onOpenImport,
  onOpenAccountModal,
  onOpenCategoryModal,
  onOpenBudgetModal,
  onOpenAuthModal,
  onSignOut,
  onAutoAllocate,
  onResetDemo,
  onExport
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500 p-2.5 rounded-xl shadow-lg shadow-sky-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                FinanzApp <span className="text-xs bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">v1.0</span>
              </h1>
              <p className="text-xs text-slate-400">
                Gestión de Cartolas de Cuenta & Tarjetas de Crédito con Asociación de Pagos
              </p>
            </div>
          </div>

          {/* Actions & Account Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Account Quick Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <select
                value={activeAccountId}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-transparent text-sm text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-800 text-white">Todas las Cuentas / Tarjetas</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-slate-800 text-white">
                    {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-Associate TC Payments */}
            <button
              onClick={onAutoAllocate}
              title="Asociar pagos de TC a compras en orden cronológico"
              className="flex items-center gap-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto-Asociar Pagos</span>
            </button>

            {/* Import Statement */}
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar Cartola</span>
            </button>

            {/* Add Account */}
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Cuenta</span>
            </button>

            {/* Categorías */}
            <button
              onClick={onOpenCategoryModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              title="Gestionar categorías de gastos e ingresos"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Categorías</span>
            </button>

            {/* Reglas & Presupuestos */}
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Reglas de auto-categorización e hitos de presupuesto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reglas & Presupuestos</span>
            </button>

            {/* Export */}
            <button
              onClick={onExport}
              title="Exportar movimientos a Excel"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Reset Demo */}
            <button
              onClick={onResetDemo}
              title="Restablecer datos de prueba"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Auth / Cloud Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-sky-950/80 border border-sky-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-200">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="max-w-[120px] truncate">{currentUser.email}</span>
                <button
                  onClick={onSignOut}
                  title="Cerrar Sesión"
                  className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

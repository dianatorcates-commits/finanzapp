import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sliders,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  PieChart,
  BarChart3,
  Target,
  Landmark,
  RotateCcw,
  Check,
  Sparkles
} from 'lucide-react';
import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from '../types';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onSaveConfig: (newConfig: DashboardConfig) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<DashboardConfig>(config);
  const [activeTab, setActiveTab] = useState<'metrics' | 'charts'>('metrics');

  if (!isOpen) return null;

  const handleToggleMetric = (key: keyof DashboardConfig['metrics']) => {
    setLocalConfig((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [key]: !prev.metrics[key],
      },
    }));
  };

  const handleToggleChart = (key: keyof DashboardConfig['charts']) => {
    setLocalConfig((prev) => ({
      ...prev,
      charts: {
        ...prev.charts,
        [key]: !prev.charts[key],
      },
    }));
  };

  const handleResetToDefault = () => {
    setLocalConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const enabledMetricsCount = Object.values(localConfig.metrics).filter(Boolean).length;
  const enabledChartsCount = Object.values(localConfig.charts).filter(Boolean).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Personalizar Dashboard
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
                  Vista Modular
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Elige qué métricas superiores y qué gráficos deseas ver en tu pantalla de inicio.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            aria-label="Cerrar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'metrics'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Métricas Superiores ({enabledMetricsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'charts'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Módulos y Gráficos ({enabledChartsCount})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Activa o desactiva las tarjetas métricas de la cabecera. La cuadrícula se auto-ajustará dinámicamente.
              </p>

              {/* 1. Gastos Totales (Original) */}
              <div
                onClick={() => handleToggleMetric('grossExpenses')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.metrics.grossExpenses
                    ? 'bg-slate-950/80 border-rose-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Gastos Totales (Original)</span>
                    <span className="text-[11px] text-slate-400">Suma bruta de todas las compras y cargos del período</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.metrics.grossExpenses} />
              </div>

              {/* 2. Abonos y Sueldos */}
              <div
                onClick={() => handleToggleMetric('totalPaymentsAndIncome')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.metrics.totalPaymentsAndIncome
                    ? 'bg-slate-950/80 border-emerald-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Abonos, Pagos y Sueldos</span>
                    <span className="text-[11px] text-slate-400">Total de ingresos, transferencias recibidas y abonos a TC</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.metrics.totalPaymentsAndIncome} />
              </div>

              {/* 3. Monto Real Utilizado */}
              <div
                onClick={() => handleToggleMetric('netAmountUsed')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.metrics.netAmountUsed
                    ? 'bg-slate-950/80 border-sky-500/40 ring-1 ring-sky-500/20'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sky-300 block flex items-center gap-1.5">
                      <span>Monto Real Utilizado</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-normal">Recomendado</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Gasto neto real deduciendo abonos aplicados</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.metrics.netAmountUsed} />
              </div>

              {/* 4. Abonos TC Sin Asignar */}
              <div
                onClick={() => handleToggleMetric('unallocatedTcPayments')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.metrics.unallocatedTcPayments
                    ? 'bg-slate-950/80 border-purple-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Abonos TC Sin Asignar</span>
                    <span className="text-[11px] text-slate-400">Pagos a tarjeta de crédito disponibles para asociar a compras</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.metrics.unallocatedTcPayments} />
              </div>

              {/* 5. Balance Neto / Ahorro */}
              <div
                onClick={() => handleToggleMetric('netBalance')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.metrics.netBalance
                    ? 'bg-slate-950/80 border-teal-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                      <span>Balance Neto / Ahorro Mensual</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-normal">Nuevo</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Diferencia neta entre ingresos y gastos totales del mes</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.metrics.netBalance} />
              </div>
            </div>
          )}

          {/* TAB 2: CHARTS */}
          {activeTab === 'charts' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Selecciona qué gráficos y paneles de análisis deseas desplegar en tu página principal.
              </p>

              {/* 1. Presupuestos Mensuales */}
              <div
                onClick={() => handleToggleChart('budgetsProgress')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.charts.budgetsProgress
                    ? 'bg-slate-950/80 border-emerald-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Control de Presupuestos Mensuales</span>
                    <span className="text-[11px] text-slate-400">Barras de progreso de consumo frente al tope por categoría</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.charts.budgetsProgress} />
              </div>

              {/* 2. Gráfico por Categoría (Dona) */}
              <div
                onClick={() => handleToggleChart('categoryPie')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.charts.categoryPie
                    ? 'bg-slate-950/80 border-sky-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Distribución de Gastos (Dona)</span>
                    <span className="text-[11px] text-slate-400">Porcentajes de gasto interactivos por categoría y subcategoría</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.charts.categoryPie} />
              </div>

              {/* 3. Evolución Mensual (Barras) */}
              <div
                onClick={() => handleToggleChart('monthlyTrend')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.charts.monthlyTrend
                    ? 'bg-slate-950/80 border-indigo-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Evolución Histórica Mensual</span>
                    <span className="text-[11px] text-slate-400">Comparativa de compras brutas, monto real y abonos mes a mes</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.charts.monthlyTrend} />
              </div>

              {/* 4. Resumen por Tarjeta / Cuenta */}
              <div
                onClick={() => handleToggleChart('accountBreakdown')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  localConfig.charts.accountBreakdown
                    ? 'bg-slate-950/80 border-amber-500/30'
                    : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Resumen por Tarjeta / Cuenta</span>
                    <span className="text-[11px] text-slate-400">Gasto y abonos por cuenta bancaria con insignias de ciclo de corte</span>
                  </div>
                </div>
                <ToggleSwitch active={localConfig.charts.accountBreakdown} />
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer por Defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Vista</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

// Reusable animated switch toggle
const ToggleSwitch: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <div
      className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ease-in-out ${
        active ? 'bg-sky-500' : 'bg-slate-800'
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ease-in-out ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </div>
  );
};

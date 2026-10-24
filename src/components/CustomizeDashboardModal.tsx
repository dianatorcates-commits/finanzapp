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
  Sparkles,
  Plus,
  Trash2,
  ShoppingCart,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  DashboardConfig,
  DEFAULT_DASHBOARD_CONFIG,
  CustomMetricCard,
  CustomChartWidget,
  MetricType,
  Account,
  CategoryMapping
} from '../types';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  accounts: Account[];
  categoryMappings?: CategoryMapping[];
  onSaveConfig: (newConfig: DashboardConfig) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  config,
  accounts,
  categoryMappings = [],
  onSaveConfig,
}) => {
  // Normalize config in case it's in an older format or undefined
  const initialConfig: DashboardConfig = {
    metrics: Array.isArray(config?.metrics) ? config.metrics : DEFAULT_DASHBOARD_CONFIG.metrics,
    charts: Array.isArray(config?.charts) ? config.charts : DEFAULT_DASHBOARD_CONFIG.charts,
  };

  const [localConfig, setLocalConfig] = useState<DashboardConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'metrics' | 'charts'>('metrics');

  // Form states for creating a new metric card
  const [isCreatingMetric, setIsCreatingMetric] = useState(false);
  const [newMetricTitle, setNewMetricTitle] = useState('');
  const [newMetricType, setNewMetricType] = useState<MetricType>('compra');
  const [newMetricAccountId, setNewMetricAccountId] = useState('ALL');
  const [newMetricCategory, setNewMetricCategory] = useState('ALL');
  const [newMetricColor, setNewMetricColor] = useState<CustomMetricCard['color']>('rose');
  const [newMetricIcon, setNewMetricIcon] = useState('shopping-cart');

  // Form states for adding an account-specific chart
  const [isCreatingChart, setIsCreatingChart] = useState(false);
  const [newChartAccountId, setNewChartAccountId] = useState(accounts[0]?.id || '');
  const [newChartTitle, setNewChartTitle] = useState('');

  if (!isOpen) return null;

  // Toggle metric enabled/disabled
  const handleToggleMetric = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    }));
  };

  // Delete metric card
  const handleDeleteMetric = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== id),
    }));
  };

  // Toggle chart enabled/disabled
  const handleToggleChart = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      charts: prev.charts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    }));
  };

  // Delete custom chart widget
  const handleDeleteChart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalConfig((prev) => ({
      ...prev,
      charts: prev.charts.filter((c) => c.id !== id),
    }));
  };

  // Submit new metric card
  const handleCreateMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricTitle.trim()) return;

    const newCard: CustomMetricCard = {
      id: `custom-metric-${Date.now()}`,
      title: newMetricTitle.trim(),
      type: newMetricType,
      filterAccountId: newMetricAccountId !== 'ALL' ? newMetricAccountId : undefined,
      filterCategory: newMetricCategory !== 'ALL' ? newMetricCategory : undefined,
      color: newMetricColor,
      icon: newMetricIcon,
      enabled: true,
      isSystem: false,
    };

    setLocalConfig((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newCard],
    }));

    // Reset form
    setNewMetricTitle('');
    setNewMetricType('compra');
    setNewMetricAccountId('ALL');
    setNewMetricCategory('ALL');
    setIsCreatingMetric(false);
  };

  // Submit new account-specific chart
  const handleCreateAccountChart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChartAccountId) return;

    const targetAcc = accounts.find((a) => a.id === newChartAccountId);
    const title = newChartTitle.trim() || `Evolución ${targetAcc?.name || 'Tarjeta'}`;

    const newChart: CustomChartWidget = {
      id: `custom-chart-acc-${newChartAccountId}-${Date.now()}`,
      title,
      chartType: 'account_specific',
      targetAccountId: newChartAccountId,
      enabled: true,
      isSystem: false,
    };

    setLocalConfig((prev) => ({
      ...prev,
      charts: [...prev.charts, newChart],
    }));

    setNewChartTitle('');
    setIsCreatingChart(false);
  };

  const handleResetToDefault = () => {
    setLocalConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const enabledMetricsCount = localConfig.metrics.filter((m) => m.enabled).length;
  const enabledChartsCount = localConfig.charts.filter((c) => c.enabled).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        
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
                  Constructor de Widgets
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Crea tus propias tarjetas métricas y activa o desactiva gráficos según lo que quieras analizar.
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
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 justify-between items-center">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('metrics'); setIsCreatingMetric(false); setIsCreatingChart(false); }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tarjetas Métricas ({enabledMetricsCount})</span>
            </button>
            <button
              onClick={() => { setActiveTab('charts'); setIsCreatingMetric(false); setIsCreatingChart(false); }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'charts'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos y Tarjetas ({enabledChartsCount})</span>
            </button>
          </div>

          {/* Action button inside tab bar */}
          {activeTab === 'metrics' && !isCreatingMetric && (
            <button
              onClick={() => setIsCreatingMetric(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-xl border border-sky-500/30 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Tarjeta</span>
            </button>
          )}

          {activeTab === 'charts' && !isCreatingChart && (
            <button
              onClick={() => setIsCreatingChart(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-xl border border-sky-500/30 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gráfico de Tarjeta</span>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">

              {/* Form: Create Custom Metric Card */}
              {isCreatingMetric && (
                <form
                  onSubmit={handleCreateMetric}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 space-y-4 shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Nueva Tarjeta Métrica</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingMetric(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nombre o Título de la Tarjeta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Compras Realizadas, Gastos en Supermercado, Pagos TC..."
                      value={newMetricTitle}
                      onChange={(e) => setNewMetricTitle(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Calculation Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        ¿Qué dato deseas calcular? *
                      </label>
                      <select
                        value={newMetricType}
                        onChange={(e) => setNewMetricType(e.target.value as MetricType)}
                        className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                      >
                        <option value="compra">🛍️ Solo Compras Realizadas (Gastos)</option>
                        <option value="pago_tc">💳 Solo Pagos Realizados a Tarjetas</option>
                        <option value="total_payments">💰 Abonos, Sueldos e Ingresos</option>
                        <option value="gross_expenses">📉 Gastos Totales Brutos</option>
                        <option value="net_amount_used">🛡️ Monto Real Utilizado (Deduciendo abonos)</option>
                        <option value="net_balance">🐷 Balance Neto / Ahorro (Ingresos - Gastos)</option>
                        <option value="custom">🎯 Filtro Personalizado (Por cuenta o categoría)</option>
                      </select>
                    </div>

                    {/* Account Filter */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Filtrar por Cuenta o Tarjeta
                      </label>
                      <select
                        value={newMetricAccountId}
                        onChange={(e) => setNewMetricAccountId(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                      >
                        <option value="ALL">Todas las Cuentas y Tarjetas</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.bank})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category Filter if custom */}
                  {newMetricType === 'custom' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Filtrar por Categoría
                      </label>
                      <select
                        value={newMetricCategory}
                        onChange={(e) => setNewMetricCategory(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                      >
                        <option value="ALL">Todas las Categorías</option>
                        {categoryMappings.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color & Icon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Color de Acento</label>
                      <div className="flex items-center gap-2">
                        {(['rose', 'emerald', 'sky', 'purple', 'teal', 'amber', 'indigo'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewMetricColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition ${
                              newMetricColor === c ? 'border-white scale-110' : 'border-transparent'
                            } ${
                              c === 'rose'
                                ? 'bg-rose-500'
                                : c === 'emerald'
                                ? 'bg-emerald-500'
                                : c === 'sky'
                                ? 'bg-sky-500'
                                : c === 'purple'
                                ? 'bg-purple-500'
                                : c === 'teal'
                                ? 'bg-teal-500'
                                : c === 'amber'
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ícono</label>
                      <select
                        value={newMetricIcon}
                        onChange={(e) => setNewMetricIcon(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                      >
                        <option value="shopping-cart">🛒 Carrito de Compras</option>
                        <option value="credit-card">💳 Tarjeta de Crédito</option>
                        <option value="trending-down">📉 Gasto / Flecha Abajo</option>
                        <option value="trending-up">📈 Ingreso / Flecha Arriba</option>
                        <option value="shield-check">🛡️ Escudo / Monto Real</option>
                        <option value="piggy-bank">🐷 Alcancía / Ahorro</option>
                        <option value="landmark">🏛️ Banco / Institución</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingMetric(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Guardar Tarjeta
                    </button>
                  </div>
                </form>
              )}

              {/* List of Existing Metric Cards */}
              <div className="space-y-2.5">
                {localConfig.metrics.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleToggleMetric(card.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      card.enabled
                        ? 'bg-slate-950/80 border-slate-700 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        {renderIcon(card.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{card.title}</span>
                          {!card.isSystem && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                              Personalizada
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {getMetricDescription(card, accounts)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!card.isSystem && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMetric(card.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Eliminar tarjeta personalizada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ToggleSwitch active={card.enabled} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: CHARTS */}
          {activeTab === 'charts' && (
            <div className="space-y-4">

              {/* Form: Add Account-Specific Chart */}
              {isCreatingChart && (
                <form
                  onSubmit={handleCreateAccountChart}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 space-y-4 shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Gráfico Exclusivo por Tarjeta</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingChart(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Selecciona la Tarjeta o Cuenta Bancaria *
                    </label>
                    <select
                      value={newChartAccountId}
                      onChange={(e) => {
                        const accId = e.target.value;
                        setNewChartAccountId(accId);
                        const acc = accounts.find((a) => a.id === accId);
                        if (acc) setNewChartTitle(`Evolución ${acc.name}`);
                      }}
                      className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bank})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Título del Módulo de Gráfico
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Análisis Exclusivo TC Infinite"
                      value={newChartTitle}
                      onChange={(e) => setNewChartTitle(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingChart(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Agregar Gráfico al Dashboard
                    </button>
                  </div>
                </form>
              )}

              {/* List of Existing Charts */}
              <div className="space-y-2.5">
                {localConfig.charts.map((chart) => {
                  const targetAcc = accounts.find((a) => a.id === chart.targetAccountId);

                  return (
                    <div
                      key={chart.id}
                      onClick={() => handleToggleChart(chart.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        chart.enabled
                          ? 'bg-slate-950/80 border-slate-700 shadow-sm'
                          : 'bg-slate-950/30 border-slate-800/80 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          {chart.chartType === 'budgets_progress' && <Target className="w-4 h-4 text-emerald-400" />}
                          {chart.chartType === 'category_pie' && <PieChart className="w-4 h-4 text-sky-400" />}
                          {chart.chartType === 'monthly_trend' && <BarChart3 className="w-4 h-4 text-indigo-400" />}
                          {chart.chartType === 'account_breakdown' && <Landmark className="w-4 h-4 text-amber-400" />}
                          {chart.chartType === 'account_specific' && <CreditCard className="w-4 h-4 text-rose-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{chart.title}</span>
                            {chart.chartType === 'account_specific' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                                {targetAcc?.name || 'Tarjeta'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {chart.chartType === 'budgets_progress' && 'Barras de cumplimiento de topes por categoría'}
                            {chart.chartType === 'category_pie' && 'Porcentajes interactivos de consumo por nivel general y subcategoría'}
                            {chart.chartType === 'monthly_trend' && 'Historial comparativo de compras, monto real y abonos por mes'}
                            {chart.chartType === 'account_breakdown' && 'Gasto y abonos agrupados por todas tus tarjetas y cuentas'}
                            {chart.chartType === 'account_specific' && `Gráfico exclusivo de compras y abonos para ${targetAcc?.name || 'esta tarjeta'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!chart.isSystem && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChart(chart.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Eliminar gráfico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ToggleSwitch active={chart.enabled} />
                      </div>
                    </div>
                  );
                })}
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
              <span>Guardar y Aplicar</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

function getMetricDescription(card: CustomMetricCard, accounts: Account[]) {
  const acc = card.filterAccountId ? accounts.find((a) => a.id === card.filterAccountId) : null;
  const accText = acc ? ` en ${acc.name}` : '';
  const catText = card.filterCategory && card.filterCategory !== 'ALL' ? ` en ${card.filterCategory}` : '';

  switch (card.type) {
    case 'gross_expenses':
      return 'Suma bruta de compras y cargos del período';
    case 'total_payments':
      return 'Total de sueldos, transferencias e ingresos recibidos';
    case 'net_amount_used':
      return 'Gasto real deduciendo abonos aplicados';
    case 'unallocated_tc':
      return 'Pagos a tarjeta de crédito disponibles para asociar';
    case 'net_balance':
      return 'Diferencia neta entre ingresos y gastos totales';
    case 'compra':
      return `Total exclusivo de compras realizadas${accText}`;
    case 'pago_tc':
      return `Total exclusivo de pagos realizados a tarjetas${accText}`;
    case 'custom':
      return `Cálculo personalizado${accText}${catText}`;
    default:
      return 'Métrica personalizada';
  }
}

function renderIcon(iconName?: string) {
  switch (iconName) {
    case 'trending-up': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'shield-check': return <ShieldCheck className="w-4 h-4 text-sky-400" />;
    case 'credit-card': return <CreditCard className="w-4 h-4 text-purple-400" />;
    case 'piggy-bank': return <PiggyBank className="w-4 h-4 text-teal-400" />;
    case 'shopping-cart': return <ShoppingCart className="w-4 h-4 text-rose-400" />;
    case 'landmark': return <Landmark className="w-4 h-4 text-amber-400" />;
    default: return <TrendingDown className="w-4 h-4 text-rose-400" />;
  }
}

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

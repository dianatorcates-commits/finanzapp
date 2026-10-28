import React, { useState, useEffect } from 'react';
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
  Equal,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Wallet,
  Calendar,
  Layers,
  Eye,
  SlidersHorizontal
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

const NEON_PALETTE: { id: string; name: string; hex: string }[] = [
  { id: 'neon-cyan', name: 'Cian Neón', hex: '#00FFCC' },
  { id: 'neon-magenta', name: 'Rosa Neón', hex: '#FF2D78' },
  { id: 'neon-amber', name: 'Amarillo Neón', hex: '#FFE04A' },
  { id: 'neon-blue', name: 'Azul Eléctrico', hex: '#38bdf8' },
  { id: 'purple', name: 'Púrpura', hex: '#A78BFA' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#10B981' },
  { id: 'rose', name: 'Rojo Carmesí', hex: '#F43F5E' },
];

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
  const [activeTab, setActiveTab] = useState<'metrics' | 'charts' | 'layout'>('metrics');

  // Drag and drop states for metrics
  const [draggedMetricIndex, setDraggedMetricIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchMetricIndex, setTouchMetricIndex] = useState<number | null>(null);

  // Drag and drop states for charts
  const [draggedChartIndex, setDraggedChartIndex] = useState<number | null>(null);
  const [touchChartStartY, setTouchChartStartY] = useState<number | null>(null);
  const [touchChartIndex, setTouchChartIndex] = useState<number | null>(null);

  // Synchronize localConfig whenever the modal opens or config updates
  useEffect(() => {
    if (isOpen && config) {
      setLocalConfig({
        metrics: Array.isArray(config.metrics) ? [...config.metrics] : [...DEFAULT_DASHBOARD_CONFIG.metrics],
        charts: Array.isArray(config.charts) ? [...config.charts] : [...DEFAULT_DASHBOARD_CONFIG.charts],
      });
    }
  }, [isOpen, config]);

  // Form states for creating a new metric card (Live Builder)
  const [isCreatingMetric, setIsCreatingMetric] = useState(false);
  const [newMetricTitle, setNewMetricTitle] = useState('');
  const [newMetricType, setNewMetricType] = useState<MetricType>('compra');
  const [newMetricAccountId, setNewMetricAccountId] = useState('ALL');
  const [newMetricCategory, setNewMetricCategory] = useState('ALL');
  const [newMetricColor, setNewMetricColor] = useState<string>('neon-cyan');
  const [newMetricIcon, setNewMetricIcon] = useState('shopping-cart');

  // Form states for adding an account-specific chart
  const [isCreatingChart, setIsCreatingChart] = useState(false);
  const [newChartAccountId, setNewChartAccountId] = useState(accounts[0]?.id || '');
  const [newChartTitle, setNewChartTitle] = useState('');

  if (!isOpen) return null;

  // Reorder helpers using accessible buttons
  const handleMoveMetric = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localConfig.metrics.length) return;

    const nextMetrics = [...localConfig.metrics];
    const item = nextMetrics.splice(index, 1)[0];
    nextMetrics.splice(targetIndex, 0, item);
    const nextConfig = { ...localConfig, metrics: nextMetrics };
    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);
  };

  const handleMoveChart = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localConfig.charts.length) return;

    const nextCharts = [...localConfig.charts];
    const item = nextCharts.splice(index, 1)[0];
    nextCharts.splice(targetIndex, 0, item);
    const nextConfig = { ...localConfig, charts: nextCharts };
    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);
  };

  // Desktop Drag & Drop Handlers for Metrics
  const handleDragStart = (index: number) => {
    setDraggedMetricIndex(index);
  };

  const handleDragOver = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedMetricIndex === null || draggedMetricIndex === targetIndex) return;

    setLocalConfig((prev) => {
      const nextMetrics = [...prev.metrics];
      const item = nextMetrics.splice(draggedMetricIndex, 1)[0];
      nextMetrics.splice(targetIndex, 0, item);
      return {
        ...prev,
        metrics: nextMetrics,
      };
    });
    setDraggedMetricIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedMetricIndex(null);
    onSaveConfig(localConfig);
  };

  // Mobile Touch Drag & Drop Handlers for Metrics
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    setTouchMetricIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchMetricIndex === null || touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY;

    if (Math.abs(diffY) > 35) {
      const direction = diffY > 0 ? 1 : -1;
      const targetIndex = touchMetricIndex + direction;

      if (targetIndex >= 0 && targetIndex < localConfig.metrics.length) {
        setLocalConfig((prev) => {
          const nextMetrics = [...prev.metrics];
          const item = nextMetrics.splice(touchMetricIndex, 1)[0];
          nextMetrics.splice(targetIndex, 0, item);
          return {
            ...prev,
            metrics: nextMetrics,
          };
        });
        setTouchMetricIndex(targetIndex);
        setTouchStartY(currentY);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchMetricIndex(null);
    setTouchStartY(null);
    onSaveConfig(localConfig);
  };

  // Desktop Drag & Drop Handlers for Charts
  const handleChartDragStart = (index: number) => {
    setDraggedChartIndex(index);
  };

  const handleChartDragOver = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedChartIndex === null || draggedChartIndex === targetIndex) return;

    setLocalConfig((prev) => {
      const nextCharts = [...prev.charts];
      const item = nextCharts.splice(draggedChartIndex, 1)[0];
      nextCharts.splice(targetIndex, 0, item);
      return {
        ...prev,
        charts: nextCharts,
      };
    });
    setDraggedChartIndex(targetIndex);
  };

  const handleChartDragEnd = () => {
    setDraggedChartIndex(null);
    onSaveConfig(localConfig);
  };

  // Mobile Touch Drag & Drop Handlers for Charts
  const handleChartTouchStart = (index: number, e: React.TouchEvent) => {
    setTouchChartIndex(index);
    setTouchChartStartY(e.touches[0].clientY);
  };

  const handleChartTouchMove = (e: React.TouchEvent) => {
    if (touchChartIndex === null || touchChartStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchChartStartY;

    if (Math.abs(diffY) > 35) {
      const direction = diffY > 0 ? 1 : -1;
      const targetIndex = touchChartIndex + direction;

      if (targetIndex >= 0 && targetIndex < localConfig.charts.length) {
        setLocalConfig((prev) => {
          const nextCharts = [...prev.charts];
          const item = nextCharts.splice(touchChartIndex, 1)[0];
          nextCharts.splice(targetIndex, 0, item);
          return {
            ...prev,
            charts: nextCharts,
          };
        });
        setTouchChartIndex(targetIndex);
        setTouchChartStartY(currentY);
      }
    }
  };

  const handleChartTouchEnd = () => {
    setTouchChartIndex(null);
    setTouchChartStartY(null);
    onSaveConfig(localConfig);
  };

  // Toggle metric enabled/disabled
  const handleToggleMetric = (id: string) => {
    setLocalConfig((prev) => {
      const nextConfig = {
        ...prev,
        metrics: prev.metrics.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
      };
      onSaveConfig(nextConfig);
      return nextConfig;
    });
  };

  // Delete metric card
  const handleDeleteMetric = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextConfig = {
      ...localConfig,
      metrics: localConfig.metrics.filter((m) => m.id !== id),
    };
    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);
  };

  // Toggle chart enabled/disabled
  const handleToggleChart = (id: string) => {
    setLocalConfig((prev) => {
      const nextConfig = {
        ...prev,
        charts: prev.charts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
      };
      onSaveConfig(nextConfig);
      return nextConfig;
    });
  };

  // Delete custom chart widget
  const handleDeleteChart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextConfig = {
      ...localConfig,
      charts: localConfig.charts.filter((c) => c.id !== id),
    };
    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);
  };

  // Submit new metric card (Live Builder)
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

    // Prepend new card so it immediately appears prominently
    const nextConfig = {
      ...localConfig,
      metrics: [newCard, ...localConfig.metrics],
    };

    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);

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

    const nextConfig = {
      ...localConfig,
      charts: [...localConfig.charts, newChart],
    };

    setLocalConfig(nextConfig);
    onSaveConfig(nextConfig);

    setNewChartTitle('');
    setIsCreatingChart(false);
  };

  const handleResetToDefault = () => {
    setLocalConfig(DEFAULT_DASHBOARD_CONFIG);
    onSaveConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const enabledMetricsCount = localConfig.metrics.filter((m) => m.enabled).length;
  const enabledChartsCount = localConfig.charts.filter((c) => c.enabled).length;
  const selectedColorHex = NEON_PALETTE.find((p) => p.id === newMetricColor)?.hex || '#00FFCC';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A12]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111118] border border-[#302840] panel-rim rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#302840] flex items-center justify-between bg-gradient-to-r from-[#141422] via-[#111118] to-[#141422]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00FFCC]/20 to-[#FF2D78]/20 border border-[#00FFCC]/40 flex items-center justify-center text-[#00FFCC] shadow-lg shadow-[#00FFCC]/10">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-headline font-bold text-white tracking-tight">
                  Personalizar Dashboard
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 uppercase tracking-wider">
                  Stitch Grid
                </span>
              </div>
              <p className="text-xs text-[#A098B0] mt-0.5">
                Crea indicadores en vivo, activa widgets y reordena la grilla a tu medida.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#1e1e2d] transition"
            aria-label="Cerrar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#302840] bg-[#0e0e18] px-3 sm:px-6 justify-between items-center overflow-x-auto scrollbar-none">
          <div className="flex shrink-0">
            {/* Tab 1: Metrics */}
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'border-[#00FFCC] text-[#00FFCC]'
                  : 'border-transparent text-[#A098B0] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tarjetas ({enabledMetricsCount}/{localConfig.metrics.length})</span>
            </button>

            {/* Tab 2: Charts */}
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'charts'
                  ? 'border-[#00FFCC] text-[#00FFCC]'
                  : 'border-transparent text-[#A098B0] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos ({enabledChartsCount}/{localConfig.charts.length})</span>
            </button>

            {/* Tab 3: Grid Layout Reorderer */}
            <button
              onClick={() => setActiveTab('layout')}
              className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'layout'
                  ? 'border-[#FFE04A] text-[#FFE04A]'
                  : 'border-transparent text-[#A098B0] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Disposición Grid</span>
            </button>
          </div>

          {/* Action buttons inside tab bar */}
          <div className="shrink-0 py-2">
            {activeTab === 'metrics' && !isCreatingMetric && (
              <button
                onClick={() => setIsCreatingMetric(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] text-xs font-bold rounded-xl border border-[#00FFCC]/40 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Constructor Métrica</span>
                <span className="sm:hidden">Crear</span>
              </button>
            )}

            {activeTab === 'charts' && !isCreatingChart && (
              <button
                onClick={() => setIsCreatingChart(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] text-xs font-bold rounded-xl border border-[#38bdf8]/40 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gráfico por Tarjeta</span>
                <span className="sm:hidden">Gráfico</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-[#302840]">
          
          {/* TAB 1: METRICS LIST & LIVE BUILDER */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">

              {/* Form: Live Builder for Custom Metric */}
              {isCreatingMetric && (
                <form
                  onSubmit={handleCreateMetric}
                  className="p-4 sm:p-5 rounded-2xl bg-[#141422] border border-[#00FFCC]/40 space-y-4 shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#302840]">
                    <span className="text-xs font-bold text-[#00FFCC] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Configurador de Indicador Personalizado (Live Builder)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingMetric(false)}
                      className="text-xs text-[#A098B0] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
                      Nombre o Título del Indicador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Gastos en Supermercado, Pagos Tarjeta Santander, Compras Ocio..."
                      value={newMetricTitle}
                      onChange={(e) => setNewMetricTitle(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#00FFCC]"
                    />
                  </div>

                  {/* Calculation Type & Account Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
                        ¿Qué dato deseas calcular? *
                      </label>
                      <select
                        value={newMetricType}
                        onChange={(e) => setNewMetricType(e.target.value as MetricType)}
                        className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#00FFCC]"
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

                    <div>
                      <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
                        Filtrar por Cuenta o Tarjeta
                      </label>
                      <select
                        value={newMetricAccountId}
                        onChange={(e) => setNewMetricAccountId(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#00FFCC]"
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
                      <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
                        Filtrar por Categoría
                      </label>
                      <select
                        value={newMetricCategory}
                        onChange={(e) => setNewMetricCategory(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#00FFCC]"
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

                  {/* Color Palette & Icon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A098B0] mb-1.5">
                        Color de Acento Stitch
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {NEON_PALETTE.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setNewMetricColor(p.id)}
                            title={p.name}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              newMetricColor === p.id ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: p.hex,
                              boxShadow: newMetricColor === p.id ? `0 0 10px ${p.hex}` : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#A098B0] mb-1.5">
                        Ícono
                      </label>
                      <select
                        value={newMetricIcon}
                        onChange={(e) => setNewMetricIcon(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#00FFCC]"
                      >
                        <option value="shopping-cart">🛒 Carrito de Compras</option>
                        <option value="credit-card">💳 Tarjeta de Crédito</option>
                        <option value="wallet">👛 Billetera / Disponible</option>
                        <option value="calendar">📅 Calendario / Facturación</option>
                        <option value="trending-down">📉 Gasto / Flecha Abajo</option>
                        <option value="trending-up">📈 Ingreso / Flecha Arriba</option>
                        <option value="shield-check">🛡️ Escudo / Monto Real</option>
                        <option value="piggy-bank">🐷 Alcancía / Ahorro</option>
                        <option value="landmark">🏛️ Banco / Institución</option>
                      </select>
                    </div>
                  </div>

                  {/* LIVE PREVIEW OF THE METRIC CARD */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#00FFCC] mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Previsualización en Vivo (Live Preview)</span>
                    </label>

                    <div className="p-4 rounded-2xl bg-[#111118] border border-[#302840] panel-rim shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              borderColor: `${selectedColorHex}40`,
                              color: selectedColorHex,
                              backgroundColor: `${selectedColorHex}15`,
                            }}
                          >
                            VISTA PREVIA
                          </span>
                          <span className="text-xs font-headline font-bold text-white truncate max-w-[180px]">
                            {newMetricTitle.trim() || 'Título del Indicador'}
                          </span>
                        </div>
                        <div
                          className="p-2 rounded-xl border shadow-sm"
                          style={{
                            borderColor: `${selectedColorHex}40`,
                            backgroundColor: `${selectedColorHex}15`,
                            color: selectedColorHex,
                          }}
                        >
                          {renderIcon(newMetricIcon, 'w-4 h-4')}
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-2xl font-mono font-bold tracking-tight" style={{ color: selectedColorHex }}>
                          $ 185.000
                        </p>
                        <p className="text-[11px] text-[#A098B0] mt-0.5">
                          {newMetricType === 'compra' && 'Total exclusivo de compras realizadas'}
                          {newMetricType === 'pago_tc' && 'Total de pagos a tarjetas de crédito'}
                          {newMetricType === 'total_payments' && 'Abonos, sueldos e ingresos registrados'}
                          {newMetricType === 'gross_expenses' && 'Suma bruta de gastos del período'}
                          {newMetricType === 'net_amount_used' && 'Gasto real neto descontando abonos'}
                          {newMetricType === 'net_balance' && 'Diferencia neta entre ingresos y gastos'}
                          {newMetricType === 'custom' &&
                            `Filtro: ${newMetricCategory !== 'ALL' ? newMetricCategory : 'Todas las categorías'}`}
                          {newMetricAccountId !== 'ALL' &&
                            ` • ${accounts.find((a) => a.id === newMetricAccountId)?.name || 'Cuenta'}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                        <span>Indicador Stitch</span>
                        <span className="font-bold" style={{ color: selectedColorHex }}>
                          Listo para agregar
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#302840]">
                    <button
                      type="button"
                      onClick={() => setIsCreatingMetric(false)}
                      className="px-3.5 py-2 text-xs text-[#A098B0] hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:opacity-90 text-[#0A0A12] font-black text-xs rounded-xl shadow-lg shadow-[#00FFCC]/20 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Añadir Indicador al Dashboard</span>
                    </button>
                  </div>
                </form>
              )}

              {/* List of Existing Metric Cards with Fast Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-[#A098B0] uppercase tracking-wider">
                    Indicadores Disponibles ({enabledMetricsCount} de {localConfig.metrics.length} activos)
                  </span>
                  <span className="text-[11px] text-[#A098B0]">
                    Haz clic en el switch para activar u ocultar
                  </span>
                </div>

                {localConfig.metrics.map((card, index) => {
                  const cardHex = getCardHexColor(card.color);

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleToggleMetric(card.id)}
                      className={`p-3.5 rounded-2xl border transition select-none flex items-center justify-between cursor-pointer ${
                        card.enabled
                          ? 'bg-[#141422] border-[#302840] shadow-sm hover:border-[#00FFCC]/40'
                          : 'bg-[#111118]/60 border-[#252538] opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2.5 rounded-xl border"
                          style={{
                            borderColor: `${cardHex}40`,
                            backgroundColor: `${cardHex}15`,
                            color: cardHex,
                          }}
                        >
                          {renderIcon(card.icon, 'w-4 h-4')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-headline font-bold text-white">{card.title}</span>
                            {!card.isSystem ? (
                              <span
                                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase"
                                style={{
                                  borderColor: `${cardHex}40`,
                                  backgroundColor: `${cardHex}20`,
                                  color: cardHex,
                                }}
                              >
                                Personalizada
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-slate-500 border border-[#302840] px-1.5 py-0.2 rounded uppercase">
                                Sistema
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#A098B0] block mt-0.5">
                            {getMetricDescription(card, accounts)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {!card.isSystem && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMetric(card.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF2D78] hover:bg-[#FF2D78]/10 transition"
                            title="Eliminar tarjeta personalizada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div onClick={() => handleToggleMetric(card.id)} className="cursor-pointer">
                          <ToggleSwitch active={card.enabled} />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  className="p-4 sm:p-5 rounded-2xl bg-[#141422] border border-[#38bdf8]/40 space-y-4 shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#302840]">
                    <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Gráfico Exclusivo por Tarjeta</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingChart(false)}
                      className="text-xs text-[#A098B0] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
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
                      className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#38bdf8]"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bank})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
                      Título del Módulo de Gráfico
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Análisis Exclusivo TC Infinite"
                      value={newChartTitle}
                      onChange={(e) => setNewChartTitle(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 bg-[#0A0A12] border border-[#302840] text-slate-100 rounded-xl focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-[#302840]">
                    <button
                      type="button"
                      onClick={() => setIsCreatingChart(false)}
                      className="px-3.5 py-2 text-xs text-[#A098B0] hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0A0A12] font-black text-xs rounded-xl shadow-md transition"
                    >
                      Agregar Gráfico al Dashboard
                    </button>
                  </div>
                </form>
              )}

              {/* List of Existing Charts */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-[#A098B0] uppercase tracking-wider">
                    Gráficos y Visualizaciones ({enabledChartsCount} de {localConfig.charts.length} activos)
                  </span>
                  <span className="text-[11px] text-[#A098B0]">
                    Haz clic en el switch para activar u ocultar
                  </span>
                </div>

                {localConfig.charts.map((chart) => {
                  const targetAcc = accounts.find((a) => a.id === chart.targetAccountId);

                  return (
                    <div
                      key={chart.id}
                      onClick={() => handleToggleChart(chart.id)}
                      className={`p-3.5 rounded-2xl border transition select-none flex items-center justify-between cursor-pointer ${
                        chart.enabled
                          ? 'bg-[#141422] border-[#302840] shadow-sm hover:border-[#38bdf8]/40'
                          : 'bg-[#111118]/60 border-[#252538] opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#0A0A12] border border-[#302840] text-slate-300">
                          {chart.chartType === 'budgets_progress' && <Target className="w-4 h-4 text-emerald-400" />}
                          {chart.chartType === 'category_pie' && <PieChart className="w-4 h-4 text-[#00FFCC]" />}
                          {chart.chartType === 'monthly_trend' && <BarChart3 className="w-4 h-4 text-[#A78BFA]" />}
                          {chart.chartType === 'account_breakdown' && <Landmark className="w-4 h-4 text-[#FFE04A]" />}
                          {chart.chartType === 'account_specific' && <CreditCard className="w-4 h-4 text-[#FF2D78]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-headline font-bold text-white">{chart.title}</span>
                            {chart.chartType === 'account_specific' && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FF2D78]/20 text-[#FF2D78] border border-[#FF2D78]/40 uppercase">
                                {targetAcc?.name || 'Tarjeta'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#A098B0] block mt-0.5">
                            {chart.chartType === 'budgets_progress' && 'Barras de cumplimiento de topes por categoría'}
                            {chart.chartType === 'category_pie' && 'Porcentajes interactivos de consumo por categoría y subcategoría'}
                            {chart.chartType === 'monthly_trend' && 'Historial comparativo de compras, monto real y abonos por mes'}
                            {chart.chartType === 'account_breakdown' && 'Gasto y abonos agrupados por todas tus tarjetas y cuentas'}
                            {chart.chartType === 'account_specific' && `Gráfico exclusivo de compras y abonos para ${targetAcc?.name || 'esta tarjeta'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {!chart.isSystem && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChart(chart.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF2D78] hover:bg-[#FF2D78]/10 transition"
                            title="Eliminar gráfico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div onClick={() => handleToggleChart(chart.id)} className="cursor-pointer">
                          <ToggleSwitch active={chart.enabled} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: GRID LAYOUT & REORDERER (DRAG & DROP + ARROWS) */}
          {activeTab === 'layout' && (
            <div className="space-y-6">

              {/* Informative Banner */}
              <div className="p-4 rounded-2xl bg-[#141422] border border-[#FFE04A]/30 panel-rim flex items-start gap-3">
                <SlidersHorizontal className="w-5 h-5 text-[#FFE04A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white">Organizador y Disposición de Grilla (Drag & Drop)</p>
                  <p className="text-[#A098B0] mt-0.5">
                    Reordena la posición de cada tarjeta y widget en el dashboard. Puedes arrastrarlos con el ícono de dos barras o usar los botones de subir/bajar posición.
                  </p>
                </div>
              </div>

              {/* Section 1: Metric Cards Reorderer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>Orden de Tarjetas de Indicadores ({localConfig.metrics.length})</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#00FFCC]">
                    {enabledMetricsCount} Activas en Dashboard
                  </span>
                </div>

                <div className="space-y-2">
                  {localConfig.metrics.map((card, index) => {
                    const cardHex = getCardHexColor(card.color);
                    const isFirst = index === 0;
                    const isLast = index === localConfig.metrics.length - 1;

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(index, e)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-2xl border transition select-none flex items-center justify-between ${
                          draggedMetricIndex === index || touchMetricIndex === index
                            ? 'opacity-40 border-[#00FFCC] ring-2 ring-[#00FFCC]/40 scale-[0.98]'
                            : card.enabled
                            ? 'bg-[#141422] border-[#302840] shadow-sm'
                            : 'bg-[#111118]/60 border-[#252538] opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Order Index Badge */}
                          <span className="w-6 h-6 rounded-lg bg-[#0A0A12] border border-[#302840] text-[11px] font-mono font-bold text-[#A098B0] flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>

                          <div
                            className="p-2 rounded-xl border shrink-0"
                            style={{
                              borderColor: `${cardHex}40`,
                              backgroundColor: `${cardHex}15`,
                              color: cardHex,
                            }}
                          >
                            {renderIcon(card.icon, 'w-3.5 h-3.5')}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-headline font-bold text-white">{card.title}</span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                                  card.enabled
                                    ? 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                }`}
                              >
                                {card.enabled ? 'Activa' : 'Oculta'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#A098B0] line-clamp-1">
                              {getMetricDescription(card, accounts)}
                            </span>
                          </div>
                        </div>

                        {/* Reorder Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveMetric(index, 'up')}
                            disabled={isFirst}
                            className={`p-1.5 rounded-lg border transition ${
                              isFirst
                                ? 'text-slate-600 border-[#252538] cursor-not-allowed'
                                : 'text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#1e1e2d] border-[#302840]'
                            }`}
                            title="Subir posición"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveMetric(index, 'down')}
                            disabled={isLast}
                            className={`p-1.5 rounded-lg border transition ${
                              isLast
                                ? 'text-slate-600 border-[#252538] cursor-not-allowed'
                                : 'text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#1e1e2d] border-[#302840]'
                            }`}
                            title="Bajar posición"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Drag Handle (Desktop & Touch) */}
                          <div
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00FFCC] hover:bg-[#1e1e2d] cursor-grab active:cursor-grabbing transition touch-none border border-transparent hover:border-[#302840]"
                            title="Mantén presionado y arrastra para reordenar"
                            onTouchStart={(e) => handleTouchStart(index, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            <Equal className="w-5 h-5 text-slate-400 hover:text-[#00FFCC]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Charts Reorderer */}
              <div className="space-y-3 pt-4 border-t border-[#302840]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Orden de Widgets Gráficos ({localConfig.charts.length})</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#38bdf8]">
                    {enabledChartsCount} Activos en Dashboard
                  </span>
                </div>

                <div className="space-y-2">
                  {localConfig.charts.map((chart, index) => {
                    const isFirst = index === 0;
                    const isLast = index === localConfig.charts.length - 1;

                    return (
                      <div
                        key={chart.id}
                        draggable
                        onDragStart={() => handleChartDragStart(index)}
                        onDragOver={(e) => handleChartDragOver(index, e)}
                        onDragEnd={handleChartDragEnd}
                        className={`p-3 rounded-2xl border transition select-none flex items-center justify-between ${
                          draggedChartIndex === index || touchChartIndex === index
                            ? 'opacity-40 border-[#38bdf8] ring-2 ring-[#38bdf8]/40 scale-[0.98]'
                            : chart.enabled
                            ? 'bg-[#141422] border-[#302840] shadow-sm'
                            : 'bg-[#111118]/60 border-[#252538] opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#0A0A12] border border-[#302840] text-[11px] font-mono font-bold text-[#A098B0] flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>

                          <div className="p-2 rounded-xl bg-[#0A0A12] border border-[#302840] text-slate-300 shrink-0">
                            {chart.chartType === 'budgets_progress' && <Target className="w-3.5 h-3.5 text-emerald-400" />}
                            {chart.chartType === 'category_pie' && <PieChart className="w-3.5 h-3.5 text-[#00FFCC]" />}
                            {chart.chartType === 'monthly_trend' && <BarChart3 className="w-3.5 h-3.5 text-[#A78BFA]" />}
                            {chart.chartType === 'account_breakdown' && <Landmark className="w-3.5 h-3.5 text-[#FFE04A]" />}
                            {chart.chartType === 'account_specific' && <CreditCard className="w-3.5 h-3.5 text-[#FF2D78]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-headline font-bold text-white">{chart.title}</span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                                  chart.enabled
                                    ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                }`}
                              >
                                {chart.enabled ? 'Activo' : 'Oculto'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#A098B0] line-clamp-1">
                              {chart.chartType === 'budgets_progress' && 'Control de presupuestos por categoría'}
                              {chart.chartType === 'category_pie' && 'Distribución de consumo por categoría'}
                              {chart.chartType === 'monthly_trend' && 'Historial comparativo de compras y abonos'}
                              {chart.chartType === 'account_breakdown' && 'Resumen comparativo entre cuentas'}
                              {chart.chartType === 'account_specific' && 'Evolución exclusiva para una tarjeta'}
                            </span>
                          </div>
                        </div>

                        {/* Reorder Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveChart(index, 'up')}
                            disabled={isFirst}
                            className={`p-1.5 rounded-lg border transition ${
                              isFirst
                                ? 'text-slate-600 border-[#252538] cursor-not-allowed'
                                : 'text-[#A098B0] hover:text-[#38bdf8] hover:bg-[#1e1e2d] border-[#302840]'
                            }`}
                            title="Subir posición"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveChart(index, 'down')}
                            disabled={isLast}
                            className={`p-1.5 rounded-lg border transition ${
                              isLast
                                ? 'text-slate-600 border-[#252538] cursor-not-allowed'
                                : 'text-[#A098B0] hover:text-[#38bdf8] hover:bg-[#1e1e2d] border-[#302840]'
                            }`}
                            title="Bajar posición"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Drag Handle */}
                          <div
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#38bdf8] hover:bg-[#1e1e2d] cursor-grab active:cursor-grabbing transition touch-none border border-transparent hover:border-[#302840]"
                            title="Mantén presionado y arrastra para reordenar"
                            onTouchStart={(e) => handleChartTouchStart(index, e)}
                            onTouchMove={handleChartTouchMove}
                            onTouchEnd={handleChartTouchEnd}
                          >
                            <Equal className="w-5 h-5 text-slate-400 hover:text-[#38bdf8]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#302840] bg-[#0e0e18] flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A098B0] hover:text-white rounded-xl hover:bg-[#1e1e2d] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer por Defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#141422] hover:bg-[#1e1e2d] text-[#A098B0] hover:text-white text-xs font-semibold rounded-xl transition border border-[#302840]"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:opacity-90 text-[#0A0A12] text-xs font-black rounded-xl shadow-lg shadow-[#00FFCC]/20 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar y Aplicar</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

function getCardHexColor(color?: string): string {
  switch (color) {
    case 'neon-cyan':
    case 'sky':
      return '#00FFCC';
    case 'neon-magenta':
    case 'rose':
      return '#FF2D78';
    case 'neon-amber':
    case 'amber':
      return '#FFE04A';
    case 'neon-blue':
    case 'indigo':
      return '#38bdf8';
    case 'purple':
      return '#A78BFA';
    case 'emerald':
    case 'teal':
      return '#10B981';
    default:
      return '#00FFCC';
  }
}

function getMetricDescription(card: CustomMetricCard, accounts: Account[]) {
  const acc = card.filterAccountId && card.filterAccountId !== 'ALL'
    ? accounts.find((a) => a.id === card.filterAccountId)
    : null;
  const accText = acc ? ` en ${acc.name}` : '';
  const catText = card.filterCategory && card.filterCategory !== 'ALL' ? ` en ${card.filterCategory}` : '';

  switch (card.type) {
    case 'liquidity':
      return 'Saldo neto total disponible en cuentas corrientes y vista';
    case 'credit_card_debt':
      return 'Deuda total utilizada en tarjetas de crédito y cupo disponible';
    case 'billing_projection':
      return 'Monto proyectado a pagar en el próximo corte de facturación';
    case 'monthly_net_spent':
      return 'Gasto real neto del mes comparado contra el presupuesto base';
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
      return 'Indicador métrico personalizado';
  }
}

function renderIcon(iconName?: string, className = "w-4 h-4") {
  switch (iconName) {
    case 'trending-up': return <TrendingUp className={className} />;
    case 'shield-check': return <ShieldCheck className={className} />;
    case 'credit-card': return <CreditCard className={className} />;
    case 'piggy-bank': return <PiggyBank className={className} />;
    case 'shopping-cart': return <ShoppingCart className={className} />;
    case 'landmark': return <Landmark className={className} />;
    case 'wallet': return <Wallet className={className} />;
    case 'calendar': return <Calendar className={className} />;
    default: return <TrendingDown className={className} />;
  }
}

const ToggleSwitch: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <div
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ease-in-out ${
        active ? 'bg-[#00FFCC] shadow-[0_0_12px_rgba(0,255,204,0.4)]' : 'bg-[#1e1e2d] border border-[#302840]'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          active ? 'translate-x-5 bg-[#0A0A12]' : 'translate-x-0 bg-slate-400'
        }`}
      />
    </div>
  );
};

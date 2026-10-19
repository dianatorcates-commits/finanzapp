import React, { useState } from 'react';
import {
  Wallet,
  Sparkles,
  ShieldCheck,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Send,
  Calendar,
  Building2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Bot,
  Zap,
  Check,
  X,
  FileText,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onTryDemo }) => {
  // State for interactive Bento Card 1 simulation
  const [demoAbonoApplied, setDemoAbonoApplied] = useState(false);
  // State for interactive Telegram chat simulator
  const [telegramSimStep, setTelegramSimStep] = useState<number>(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Radial Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[20%] w-[650px] h-[650px] bg-sky-500/15 rounded-full blur-[140px]" />
        <div className="absolute top-[25%] right-[-10%] w-[550px] h-[550px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onTryDemo}>
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-sky-500/25 border border-sky-400/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FinanzApp
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/40 uppercase tracking-wider">
                Pro
              </span>
            </span>
          </div>

          {/* Nav links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#hub-convergencia" className="hover:text-white transition">El Hub Central</a>
            <a href="#bento-features" className="hover:text-white transition">Características</a>
            <a href="#comparativa" className="hover:text-white transition">Comparativa</a>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onTryDemo}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition"
            >
              Probar Demo
            </button>
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transform hover:-translate-y-0.5"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                             */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-6 sm:pt-8 pb-8 text-center flex flex-col items-center">
        
        {/* Dynamic Badge (Hero Top) */}
        <div 
          onClick={onTryDemo}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-300 backdrop-blur-md shadow-lg shadow-sky-500/10 hover:border-sky-400/60 hover:bg-sky-500/15 transition cursor-pointer group mb-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>✨ Nuevo • Registra gastos al instante con Telegram y Ciclos de TC</span>
          <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Main Headline (Compact & Punchy) */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.2] max-w-3xl mb-3 sm:mb-4">
          Lleva el control real de{' '}
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            tus gastos
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed font-normal">
          Centraliza tus cartolas bancarias, sincroniza compras en 3 segundos con Telegram y visualiza tu{' '}
          <strong className="text-white font-semibold">Monto Real Utilizado</strong> descontando abonos y fechas de corte automáticamente.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-8 sm:mb-10">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 transition transform hover:-translate-y-0.5"
          >
            <span>Comenzar Gratis con Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-slate-700/80 hover:border-sky-500/40 transition shadow-lg backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Ver Modo Demo Interactivo</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* COMPONENTE ESTRELLA: "EL HUB DE CONVERGENCIA FINANCIERA"                  */}
        {/* ========================================================================= */}
        <div id="hub-convergencia" className="relative w-full max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 mb-8">
          
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[320px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/20 to-emerald-500/15 rounded-full blur-[110px]" />
          </div>

          {/* SVG Animated Convergence Lines with Extended Corridor */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-0"
            viewBox="0 0 1200 500"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              {/* High-luminosity gradients for flow rays */}
              <linearGradient id="grad-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-bl" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-tr" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-br" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>

              {/* Glow filter for intense neon highlights */}
              <filter id="glow-ray" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Top-Left (Tarjeta de Crédito) -> Center */}
            <path
              d="M 280 115 C 345 115, 375 210, 420 210"
              stroke="rgba(51, 65, 85, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <path
              d="M 280 115 C 345 115, 375 210, 420 210"
              stroke="url(#grad-tl)"
              strokeWidth="2.5"
              className="animate-dash-flow"
              filter="url(#glow-ray)"
            />
            <circle r="4.5" fill="#f43f5e" filter="url(#glow-ray)">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M 280 115 C 345 115, 375 210, 420 210" />
            </circle>

            {/* 2. Bottom-Left (Telegram Bot) -> Center */}
            <path
              d="M 280 385 C 345 385, 375 290, 420 290"
              stroke="rgba(51, 65, 85, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <path
              d="M 280 385 C 345 385, 375 290, 420 290"
              stroke="url(#grad-bl)"
              strokeWidth="2.5"
              className="animate-dash-flow"
              filter="url(#glow-ray)"
            />
            <circle r="4.5" fill="#38bdf8" filter="url(#glow-ray)">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 280 385 C 345 385, 375 290, 420 290" />
            </circle>

            {/* 3. Top-Right (Cuenta Corriente) -> Center */}
            <path
              d="M 920 115 C 855 115, 825 210, 780 210"
              stroke="rgba(51, 65, 85, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <path
              d="M 920 115 C 855 115, 825 210, 780 210"
              stroke="url(#grad-tr)"
              strokeWidth="2.5"
              className="animate-dash-flow"
              filter="url(#glow-ray)"
            />
            <circle r="4.5" fill="#34d399" filter="url(#glow-ray)">
              <animateMotion dur="2.2s" repeatCount="indefinite" path="M 920 115 C 855 115, 825 210, 780 210" />
            </circle>

            {/* 4. Bottom-Right (Cartola Bancaria) -> Center */}
            <path
              d="M 920 385 C 855 385, 825 290, 780 290"
              stroke="rgba(51, 65, 85, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <path
              d="M 920 385 C 855 385, 825 290, 780 290"
              stroke="url(#grad-br)"
              strokeWidth="2.5"
              className="animate-dash-flow"
              filter="url(#glow-ray)"
            />
            <circle r="4.5" fill="#a78bfa" filter="url(#glow-ray)">
              <animateMotion dur="3.0s" repeatCount="indefinite" path="M 920 385 C 855 385, 825 290, 780 290" />
            </circle>

            {/* Central Convergence Receiver Points */}
            <circle cx="420" cy="210" r="3.5" fill="#f43f5e" />
            <circle cx="420" cy="290" r="3.5" fill="#38bdf8" />
            <circle cx="780" cy="210" r="3.5" fill="#34d399" />
            <circle cx="780" cy="290" r="3.5" fill="#a78bfa" />
          </svg>

          {/* Grid Layout Container with Generous Gaps (Expanded Corridor) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* SATELLITES LEFT: Top-Left & Bottom-Left */}
            <div className="md:col-span-3 flex flex-col gap-6 lg:gap-8 order-2 md:order-1">
              
              {/* SATELLITE 1: Tarjeta de Crédito */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/30 backdrop-blur-md shadow-xl shadow-rose-500/10 text-left animate-float-slow hover:border-rose-400 transition cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">TC Falabella</span>
                    <span className="text-[10px] text-rose-300 font-mono">Corte día 24 • Vence día 5</span>
                  </div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between font-mono">
                    <span>Compra 26 Oct:</span>
                    <span className="text-rose-400 font-bold">$45.000</span>
                  </div>
                  <span className="inline-block text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-semibold">
                    ➔ Pasa al ciclo de Noviembre
                  </span>
                </div>
              </div>

              {/* SATELLITE 2: Telegram Bot */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-sky-500/30 backdrop-blur-md shadow-xl shadow-sky-500/10 text-left animate-float-reverse hover:border-sky-400 transition cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Telegram Bot</span>
                    <span className="text-[10px] text-sky-300 font-mono">@FinanzAppGastosBot</span>
                  </div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-mono text-sky-300 text-[10px] truncate">"14.000 almuerzo falabella"</p>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>Auto-registrado en segundos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NÚCLEO CENTRAL (FinanzApp Central Engine) */}
            <div className="md:col-span-6 my-2 md:my-0 order-1 md:order-2">
              <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-sky-500/50 backdrop-blur-2xl shadow-2xl shadow-sky-500/20 text-left transition transform hover:scale-[1.01]">
                
                {/* Engine Glowing Pulse Badge */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                        FinanzApp Engine
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">Cálculo en Tiempo Real • Período Octubre</p>
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Sync Activa
                  </span>
                </div>

                {/* Main Hero Metric: Monto Real Utilizado */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3.5 sm:p-4 rounded-2xl border border-sky-500/30 mb-3.5 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-sky-300 text-[10px]">
                      Monto Real Utilizado Calculado
                    </span>
                    <span className="text-emerald-400 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      - $180.000 en Abonos
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                    $340.000 <span className="text-xs font-normal text-slate-400">CLP a pagar</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>3 compras cubiertas al 100% por abonos parciales</span>
                  </p>
                </div>

                {/* Budget Progress Bar */}
                <div className="space-y-1 mb-3.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400 text-[10px] sm:text-[11px]">Presupuesto Mensual</span>
                    <span className="text-sky-300 text-[10px] sm:text-[11px] font-mono">56% ($340.000 / $600.000)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-sm shadow-sky-400/50" 
                      style={{ width: '56%' }}
                    />
                  </div>
                </div>

                {/* Live Processed Transactions Stream */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Flujo de transacciones asociadas:
                  </span>
                  
                  <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 font-mono text-[10px]">24 Oct</span>
                      <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[160px]">Almuerzo Mestizo</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
                      <span className="text-slate-400 line-through">$50.000</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9px] sm:text-[10px]">
                        $0 (Pagado)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 font-mono text-[10px]">26 Oct</span>
                      <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[160px]">Líder Supermercado</span>
                    </div>
                    <div className="font-mono text-[10px] sm:text-[11px] text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-400/20">
                      $68.000
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SATELLITES RIGHT: Top-Right & Bottom-Right */}
            <div className="md:col-span-3 flex flex-col gap-6 lg:gap-8 order-3 md:order-3">
              
              {/* SATELLITE 3: Cuenta Corriente */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-xl shadow-emerald-500/10 text-left animate-float-slow hover:border-emerald-400 transition cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cta. Corriente BCI</span>
                    <span className="text-[10px] text-emerald-300 font-mono">Detección de Sueldos</span>
                  </div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between font-mono">
                    <span>Remuneración:</span>
                    <span className="text-emerald-400 font-bold">+$1.200.000</span>
                  </div>
                  <span className="inline-block text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                    Disponible para cubrir saldo TC
                  </span>
                </div>
              </div>

              {/* SATELLITE 4: Cartola Bancaria */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-xl shadow-indigo-500/10 text-left animate-float-reverse hover:border-indigo-400 transition cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cartola Santander</span>
                    <span className="text-[10px] text-indigo-300 font-mono">Excel, CSV o PDF</span>
                  </div>
                </div>
                <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-mono text-indigo-300 text-[10px]">42 transacciones importadas</p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <Check className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span>Clasificadas por reglas y cuotas</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN BENTO GRID: CARACTERÍSTICAS DE ALTA GAMA                        */}
      {/* ========================================================================= */}
      <section id="bento-features" className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Funcionalidades de Vanguardia
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-3">
              Todo lo que necesitas para entender con precisión tu dinero
            </h2>
            <p className="text-sm text-slate-400">
              Diseñado especialmente para la realidad bancaria chilena: compras en cuotas, abonos a mitad de mes y fechas de corte desfasadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 1 (Grande, 2 Columnas): "El Motor de Monto Real Utilizado" */}
            {/* ------------------------------------------------------------------- */}
            <div className="md:col-span-2 p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/10 transition-all" />
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">El Motor de "Monto Real Utilizado"</h3>
                    <p className="text-xs text-slate-400">Deducción exacta de abonos y cuotas pagadas</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  Cuando compras con Tarjeta de Crédito y pagas parte de la deuda durante el mes, los bancos solo muestran tu cupo consumido global. FinanzApp asocia tus abonos a compras específicas mediante FIFO o de forma manual, calculando tu saldo neto pendiente real.
                </p>

                {/* Interactive Formula Simulation */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 mb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono pb-2 border-b border-slate-800 text-slate-300 gap-2">
                    <span className="text-slate-400">Fórmula de Cálculo:</span>
                    <span className="text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      (Compras y Cuotas) - (Abonos Asociados) = Monto Real a Pagar
                    </span>
                  </div>

                  {/* Simulated Transaction Item */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-700/60">
                    <div>
                      <div className="font-semibold text-xs text-white">Falabella • Cuota 02/06 Zapatillas</div>
                      <div className="text-[10px] text-slate-400">Total cuota: $50.000</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Monto Real Utilizado:</span>
                      {demoAbonoApplied ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 line-through">$50.000</span>
                          <span className="text-xs font-mono text-emerald-400 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                            $0 (Cubierto 100%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          $50.000 (Pendiente)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Simulation Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {demoAbonoApplied 
                    ? '🎉 ¡Abono de $50.000 aplicado! La cuota se saldó y no infla tu deuda.' 
                    : '👉 Presiona el botón para simular cómo un abono descuenta la cuota:'}
                </span>

                <button
                  onClick={() => setDemoAbonoApplied(!demoAbonoApplied)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                    demoAbonoApplied
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/20'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{demoAbonoApplied ? 'Restablecer Simulación' : 'Simular Abono de $50.000'}</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 2 (1 Columna): "Registra en 5 segundos con Telegram"     */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Bot de Telegram Oficial</h3>
                    <p className="text-xs text-sky-400 font-mono">@FinanzAppGastosBot</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  ¿Compraste un café o pagaste el almuerzo? Envíale un mensaje a tu bot de Telegram y se auto-categoriza en tu cuenta bancaria al instante.
                </p>

                {/* Simulated Telegram Chat UI */}
                <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 space-y-2.5 font-sans">
                  {/* Bot Welcome Bubble */}
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-sky-500/30 flex items-center justify-center text-sky-300 text-[10px] font-bold flex-shrink-0">
                      FA
                    </div>
                    <div className="bg-slate-900 text-[11px] text-slate-200 p-2 rounded-xl rounded-tl-none border border-slate-800 max-w-[85%]">
                      Escribe tu gasto: <br />
                      <span className="text-sky-300 font-mono">14000 almuerzo santander</span>
                    </div>
                  </div>

                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-sky-600/90 text-white text-[11px] font-mono px-3 py-1.5 rounded-xl rounded-tr-none shadow-sm">
                      14.000 almuerzo falabella
                    </div>
                  </div>

                  {/* Bot Confirmation Bubble */}
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-sky-500/30 flex items-center justify-center text-sky-300 text-[10px] font-bold flex-shrink-0">
                      FA
                    </div>
                    <div className="bg-slate-900 text-[11px] text-slate-200 p-2 rounded-xl rounded-tl-none border border-emerald-500/30 max-w-[85%] space-y-0.5">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Registrado con éxito
                      </span>
                      <p className="text-[10px] text-slate-400">
                        📁 Alimentación • 💳 TC Falabella
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Vinculación con token de 1 clic</span>
                <span className="text-sky-400 font-semibold">100% Seguro</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 3 (1 Columna): "Ciclos de Facturación & Días de Corte"     */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Ciclos & Fechas de Corte</h3>
                    <p className="text-xs text-indigo-300">Adiós a las sorpresas de fin de mes</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Configura el día de corte (ej: día 24) y fecha de vencimiento de tus tarjetas de crédito. FinanzApp asigna automáticamente los gastos posteriores al ciclo de facturación del mes siguiente.
                </p>

                {/* Visual Timeline Diagram */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>TC Visa (Corte: día 24)</span>
                    <span className="text-indigo-400 font-bold">Estado de Cuenta</span>
                  </div>
                  
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-slate-300">20 Oct: Compra $30.000</span>
                      <span className="text-sky-400 font-bold">➔ Fact. Octubre</span>
                    </div>

                    <div className="text-center py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                      ⚡ Día 24: Corte de Tarjeta
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="text-slate-300">26 Oct: Compra $45.000</span>
                      <span className="text-emerald-400 font-bold">➔ Fact. Noviembre</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Maneja meses con 30 días y bisiestos automáticamente.</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 4 (1 Columna): "Carga Universal de Cartolas (Chile)"       */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Importación Universal</h3>
                    <p className="text-xs text-emerald-300">Bancos de Chile soportados</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Sube archivos Excel, CSV o simplemente copia y pega el texto de tu cartola en PDF bancario. Nuestro motor inteligente extrae fecha, descripción, monto y cuotas al instante.
                </p>

                {/* Chilean Banks Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-300">
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">Banco de Chile</span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">Banco Santander</span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">BCI</span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">BancoEstado RUT</span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">TC Falabella</span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">Scotiabank / Ripley</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Detección automática de "Cuota 02/06"</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 5 (1 Columna): "Privacidad Primero & Supabase"             */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Privacidad Zero-Trust</h3>
                    <p className="text-xs text-purple-300">Sin acceso a tus claves de banco</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  A diferencia de otras apps que te piden las claves de tu banco, FinanzApp nunca toca tus credenciales bancarias. Tus datos están aislados por Row Level Security (RLS) en Supabase.
                </p>

                <div className="space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Autenticación OAuth con Google</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Cifrado SSL / TLS en tránsito y reposo</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Exporta tus datos a Excel cuando quieras</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Tus datos son 100% tuyos sin ataduras.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN COMPARATIVA: "¿POR QUÉ FINANZAPP?"                                */}
      {/* ========================================================================= */}
      <section id="comparativa" className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              ¿Por qué FinanzApp en lugar de tu App Bancaria o Excel?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              La diferencia entre perder el control y tener certidumbre total de lo que vas a pagar.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-md">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-300">
                  <th className="p-4 sm:p-5 font-bold">Capacidades Clave</th>
                  <th className="p-4 sm:p-5 text-center text-slate-400 font-medium">Planilla Excel</th>
                  <th className="p-4 sm:p-5 text-center text-slate-400 font-medium">App del Banco</th>
                  <th className="p-4 sm:p-5 text-center text-sky-400 font-extrabold bg-sky-500/10 border-x border-sky-500/20">
                    FinanzApp Pro ⚡
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Monto Real Utilizado (Deducción exacta de abonos a compras)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Fórmulas complejas</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Solo cupo global</td>
                  <td className="p-4 sm:p-5 text-center bg-sky-500/10 border-x border-sky-500/20 text-emerald-400 font-bold">
                    ✅ Automático (FIFO & Manual)
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Registro de compras por Telegram en 3 segundos
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ No disponible</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ No disponible</td>
                  <td className="p-4 sm:p-5 text-center bg-sky-500/10 border-x border-sky-500/20 text-emerald-400 font-bold">
                    ✅ Bot @FinanzAppGastosBot
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Soporte para Días de Corte de Tarjetas (Ciclos)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Manual</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">⚠️ Confuso</td>
                  <td className="p-4 sm:p-5 text-center bg-sky-500/10 border-x border-sky-500/20 text-emerald-400 font-bold">
                    ✅ Días 1 al 31 personalizables
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Lectura de cartolas PDF protegidas y Excel
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Copiar celda por celda</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Solo su propio banco</td>
                  <td className="p-4 sm:p-5 text-center bg-sky-500/10 border-x border-sky-500/20 text-emerald-400 font-bold">
                    ✅ Todos los bancos de Chile
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Privacidad sin entregar claves de banco
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">✅ Privado</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">⚠️ Centralizado</td>
                  <td className="p-4 sm:p-5 text-center bg-sky-500/10 border-x border-sky-500/20 text-emerald-400 font-bold">
                    ✅ Zero-Trust + Supabase
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION                                                      */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-sky-950/80 via-slate-900 to-slate-950 border border-sky-500/30 shadow-2xl shadow-sky-500/20 overflow-hidden">
            
            {/* Background Glow Effect */}
            <div className="absolute top-[-50%] left-[20%] w-[350px] h-[350px] bg-sky-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30">
                Comienza en 1 Minuto
              </span>
              
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Empieza hoy a tener visibilidad absoluta de tus tarjetas
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
                Sin configuraciones interminables ni suscripciones costosas. Accede directamente con tu cuenta de Google o explora el modo demostración.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={onOpenAuth}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 transition transform hover:-translate-y-0.5"
                >
                  <span>Comenzar Gratis con Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onTryDemo}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm px-7 py-4 rounded-2xl border border-slate-700 transition"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Probar Demo sin Registro</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-4 font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> 100% Gratuito en versión Pro
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Sin tarjeta de crédito requerida
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Listo en 60 segundos
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-1.5 rounded-lg">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">FinanzApp</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Control Inteligente de Finanzas & Tarjetas de Crédito</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3.5 h-3.5" /> PostgreSQL & Supabase RLS
            </span>
            <span>Hecho para Chile 🇨🇱</span>
            <span>© 2026 FinanzApp</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

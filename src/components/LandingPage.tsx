import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Lock,
  Send,
  Calendar,
  Building2,
  ChevronRight,
  RotateCcw,
  Bot,
  Zap,
  Check,
  FileText,
  AlertTriangle,
  Play,
  Database
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onTryDemo }) => {
  // State for interactive Bento Card 1 simulation
  const [demoAbonoApplied, setDemoAbonoApplied] = useState(false);

  return (
    <div className="min-h-screen bg-[#05070E] text-[#E8E0F0] flex flex-col font-sans selection:bg-[#FF2D78] selection:text-white relative overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. NEON TOKYO AMBIENT BACKLIGHT GLOWS & TECHNICAL GRID                   */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[15%] w-[650px] h-[650px] bg-[#00F2FE]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] bg-[#FF2D78]/10 rounded-full blur-[150px]" />
        <div className="absolute top-[55%] left-[-10%] w-[600px] h-[600px] bg-[#00FF88]/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[550px] h-[550px] bg-[#FFB703]/10 rounded-full blur-[150px]" />
      </div>

      {/* Subtle Technical Mesh Grid (48px radial + linear gradients) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(0, 242, 254, 0.15) 1px, transparent 0),
            linear-gradient(to right, rgba(255, 45, 120, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px, 48px 48px, 48px 48px'
        }}
      />

      {/* ========================================================================= */}
      {/* 2. NAVBAR & HEADER                                                        */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 border-b border-[#302840]/80 bg-[#05070E]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Minimalist Version */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <img
                src="/images/wallet_mascot_logo_128x128.png"
                alt="FinanzApp Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(0,242,254,0.6)] rounded-lg transition-transform hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#00FF88] rounded-full border-2 border-[#05070E] shadow-[0_0_8px_#00FF88]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-headline font-black tracking-tight text-white leading-none">
                FinanzApp
              </span>
              <span className="text-[10px] font-mono font-bold text-[#A098B0] tracking-wider mt-1">
                v2.0
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onTryDemo}
              className="text-xs font-headline font-bold text-[#A098B0] hover:text-white px-3.5 py-2 rounded-xl bg-[#141422] hover:bg-[#1C1C30] border border-[#302840] hover:border-[#00F2FE]/40 transition shadow-sm"
            >
              Modo Demo
            </button>
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white text-xs font-headline font-bold px-4 py-2 rounded-xl transition shadow-[0_0_20px_rgba(255,45,120,0.35)] transform hover:-translate-y-0.5 active:scale-95"
            >
              <span>Comenzar Gratis</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION & DIAGRAMA INTERACTIVO DEL MOTOR ("FINANZAPP ENGINE")     */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-6xl xl:max-w-7xl mx-auto px-4 pt-8 sm:pt-12 pb-10 text-center flex flex-col items-center">
        
        {/* Dynamic Interactive Pill */}
        <div 
          onClick={() => {
            const el = document.getElementById('hub-convergencia');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.2)] hover:border-[#00F2FE]/60 hover:bg-[#00F2FE]/15 transition cursor-pointer group mb-5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]"></span>
          </span>
          <span className="font-mono font-bold">✨ Nuevo • Registra gastos al instante con Telegram y Ciclos de TC</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#00F2FE] group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Main Headline with Tokyo Neon Gradient */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-black tracking-tight text-white leading-[1.15] max-w-4xl mb-4">
          Lleva el control real de{' '}
          <span className="bg-gradient-to-r from-[#00F2FE] via-[#00FF88] to-[#FF2D78] bg-clip-text text-transparent">
            tus gastos
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-[#A098B0] max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
          Centraliza tus cartolas bancarias, sincroniza compras en 3 segundos con Telegram y visualiza tu{' '}
          <strong className="text-white font-bold">Monto Real Utilizado</strong> descontando abonos y fechas de corte automáticamente.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10 sm:mb-14">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(255,45,120,0.35)] transition transform hover:-translate-y-0.5 active:scale-95"
          >
            <span>Comenzar Gratis con Google</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#141422] hover:bg-[#1A1A2E] text-white font-headline font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-[#302840] hover:border-[#00FFCC]/50 transition shadow-lg backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#00FFCC]" />
            <span>Ver Modo Demo Interactivo</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* COMPONENTE CENTRAL: "FINANZAPP ENGINE" & DIAGRAMA DE FLUJO                */}
        {/* ========================================================================= */}
        <div id="hub-convergencia" className="relative w-full max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 mb-12">
          
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[550px] h-[340px] bg-gradient-to-tr from-[#FF2D78]/15 via-[#00F2FE]/15 to-[#00FF88]/15 rounded-full blur-[120px]" />
          </div>

          {/* SVG Animated Convergence Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-0"
            viewBox="0 0 1200 500"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              {/* High-luminosity neon gradients for flow rays */}
              <linearGradient id="grad-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF2D78" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-bl" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-tr" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00FF88" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-br" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFB703" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="1" />
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
              stroke="rgba(48, 40, 64, 0.6)"
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
            <circle r="4.5" fill="#FF2D78" filter="url(#glow-ray)">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M 280 115 C 345 115, 375 210, 420 210" />
            </circle>

            {/* 2. Bottom-Left (Telegram Bot) -> Center */}
            <path
              d="M 280 385 C 345 385, 375 290, 420 290"
              stroke="rgba(48, 40, 64, 0.6)"
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
            <circle r="4.5" fill="#00F2FE" filter="url(#glow-ray)">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 280 385 C 345 385, 375 290, 420 290" />
            </circle>

            {/* 3. Top-Right (Cuenta Corriente) -> Center */}
            <path
              d="M 920 115 C 855 115, 825 210, 780 210"
              stroke="rgba(48, 40, 64, 0.6)"
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
            <circle r="4.5" fill="#00FF88" filter="url(#glow-ray)">
              <animateMotion dur="2.2s" repeatCount="indefinite" path="M 920 115 C 855 115, 825 210, 780 210" />
            </circle>

            {/* 4. Bottom-Right (Cartola Santander) -> Center */}
            <path
              d="M 920 385 C 855 385, 825 290, 780 290"
              stroke="rgba(48, 40, 64, 0.6)"
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
            <circle r="4.5" fill="#FFB703" filter="url(#glow-ray)">
              <animateMotion dur="3.0s" repeatCount="indefinite" path="M 920 385 C 855 385, 825 290, 780 290" />
            </circle>

            {/* Central Convergence Receiver Points */}
            <circle cx="420" cy="210" r="3.5" fill="#FF2D78" />
            <circle cx="420" cy="290" r="3.5" fill="#00F2FE" />
            <circle cx="780" cy="210" r="3.5" fill="#00FF88" />
            <circle cx="780" cy="290" r="3.5" fill="#FFB703" />
          </svg>

          {/* Grid Layout Container */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* SATELLITES LEFT: Top-Left & Bottom-Left */}
            <div className="md:col-span-3 flex flex-col gap-6 lg:gap-8 order-2 md:order-1">
              
              {/* SATELLITE 1: Tarjeta de Crédito (Falabella) */}
              <div className="p-4 rounded-2xl bg-[#0B0F19]/80 border border-[#FF2D78]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,45,120,0.15)] text-left animate-float-slow hover:border-[#FF2D78]/60 transition cursor-default">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-[#FF2D78]/20 text-[#FF2D78] border border-[#FF2D78]/30 shadow-inner">
                    <CreditCard className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-headline font-bold text-white block">TC Falabella</span>
                    <span className="text-[10px] text-[#FF2D78] font-mono font-bold">Corte día 24 • Vence día 5</span>
                  </div>
                </div>
                <div className="bg-[#05070E]/80 p-2.5 rounded-xl border border-[#302840] text-[11px] text-[#A098B0] space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Compra 26 Oct:</span>
                    <span className="text-[#FF2D78] font-bold">$45.000</span>
                  </div>
                  <span className="inline-block text-[10px] bg-[#FF2D78]/20 text-[#FF2D78] px-2 py-0.5 rounded font-mono font-bold">
                    ➔ Pasa al ciclo de Noviembre
                  </span>
                </div>
              </div>

              {/* SATELLITE 2: Telegram Bot */}
              <div className="p-4 rounded-2xl bg-[#0B0F19]/80 border border-[#00F2FE]/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,242,254,0.15)] text-left animate-float-reverse hover:border-[#00F2FE]/60 transition cursor-default">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 shadow-inner">
                    <Send className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-headline font-bold text-white block">Telegram Bot</span>
                    <span className="text-[10px] text-[#00F2FE] font-mono font-bold">@FinanzAppGastosBot</span>
                  </div>
                </div>
                <div className="bg-[#05070E]/80 p-2.5 rounded-xl border border-[#302840] text-[11px] text-[#A098B0] space-y-1.5">
                  <p className="font-mono text-[#00F2FE] text-[10px] truncate">"14.000 almuerzo falabella"</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00FF88] font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Auto-registrado en segundos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NÚCLEO CENTRAL (FinanzApp Central Engine) */}
            <div className="md:col-span-6 my-2 md:my-0 order-1 md:order-2">
              <div className="relative p-5 sm:p-7 rounded-3xl bg-[#0B0F19]/90 border-2 border-[#00F2FE]/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,254,0.2)] panel-rim text-left transition transform hover:scale-[1.01]">
                
                {/* Engine Glowing Pulse Badge */}
                <div className="flex items-center justify-between border-b border-[#302840] pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00F2FE] to-[#FF2D78] text-[#05070E] shadow-md shadow-[#00F2FE]/30">
                      <Zap className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-headline font-black text-white tracking-wider uppercase flex items-center gap-2">
                        FINANZAPP ENGINE
                        <span className="inline-block w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-[#A098B0]">Cálculo en Tiempo Real • Período Octubre</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 px-2.5 py-0.5 rounded-full font-bold">
                    Sync Activa
                  </span>
                </div>

                {/* Main Hero Metric: Monto Real Utilizado */}
                <div className="bg-[#05070E]/90 p-4 rounded-2xl border border-[#00F2FE]/30 mb-4 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-[#A098B0] mb-1.5">
                    <span className="font-mono font-bold uppercase tracking-wider text-[#00F2FE] text-[10px]">
                      Monto Real Utilizado Calculado
                    </span>
                    <span className="text-[#00FF88] text-[10px] font-mono font-bold bg-[#00FF88]/15 px-2.5 py-0.5 rounded-full border border-[#00FF88]/30">
                      - $180.000 en Abonos
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black text-white tracking-tight">
                    $340.000 <span className="text-xs font-normal text-[#A098B0] font-sans">CLP a pagar</span>
                  </div>
                  <p className="text-[11px] text-[#00FF88] font-mono font-bold mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>3 compras cubiertas al 100% por abonos parciales</span>
                  </p>
                </div>

                {/* Budget Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#A098B0] text-[11px] font-headline">Presupuesto Mensual</span>
                    <span className="text-[#00F2FE] text-[11px] font-mono font-bold">56% ($340.000 / $600.000)</span>
                  </div>
                  <div className="w-full bg-[#05070E] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#302840]">
                    <div 
                      className="bg-gradient-to-r from-[#00F2FE] via-[#00FF88] to-[#FF2D78] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,242,254,0.5)]" 
                      style={{ width: '56%' }}
                    />
                  </div>
                </div>

                {/* Live Processed Transactions Stream */}
                <div className="space-y-2 pt-2.5 border-t border-[#302840]">
                  <span className="text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider block">
                    Flujo de transacciones asociadas:
                  </span>
                  
                  <div className="flex items-center justify-between bg-[#05070E]/70 p-2.5 rounded-xl border border-[#302840] text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#A098B0] font-mono text-[10px]">24 Oct</span>
                      <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[160px]">Almuerzo Mestizo</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
                      <span className="text-[#A098B0] line-through">$50.000</span>
                      <span className="text-[#00FF88] font-bold bg-[#00FF88]/15 px-2 py-0.5 rounded border border-[#00FF88]/30 text-[10px]">
                        $0 (Pagado)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#05070E]/70 p-2.5 rounded-xl border border-[#302840] text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#A098B0] font-mono text-[10px]">26 Oct</span>
                      <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[160px]">Líder Supermercado</span>
                    </div>
                    <div className="font-mono text-[10px] sm:text-[11px] text-[#00F2FE] font-bold bg-[#00F2FE]/15 px-2.5 py-0.5 rounded-lg border border-[#00F2FE]/30">
                      $68.000
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SATELLITES RIGHT: Top-Right & Bottom-Right */}
            <div className="md:col-span-3 flex flex-col gap-6 lg:gap-8 order-3 md:order-3">
              
              {/* SATELLITE 3: Cuenta Corriente (BCI) */}
              <div className="p-4 rounded-2xl bg-[#0B0F19]/80 border border-[#00FF88]/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,136,0.15)] text-left animate-float-slow hover:border-[#00FF88]/60 transition cursor-default">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30 shadow-inner">
                    <Building2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-headline font-bold text-white block">Cta. Corriente BCI</span>
                    <span className="text-[10px] text-[#00FF88] font-mono font-bold">Detección de Sueldos</span>
                  </div>
                </div>
                <div className="bg-[#05070E]/80 p-2.5 rounded-xl border border-[#302840] text-[11px] text-[#A098B0] space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span>Remuneración:</span>
                    <span className="text-[#00FF88] font-bold">+$1.200.000</span>
                  </div>
                  <span className="inline-block text-[10px] bg-[#00FF88]/20 text-[#00FF88] px-2 py-0.5 rounded font-mono font-bold">
                    Disponible para cubrir saldo TC
                  </span>
                </div>
              </div>

              {/* SATELLITE 4: Cartola Santander */}
              <div className="p-4 rounded-2xl bg-[#0B0F19]/80 border border-[#FFB703]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,183,3,0.15)] text-left animate-float-reverse hover:border-[#FFB703]/60 transition cursor-default">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-[#FFB703]/20 text-[#FFB703] border border-[#FFB703]/30 shadow-inner">
                    <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-headline font-bold text-white block">Cartola Santander</span>
                    <span className="text-[10px] text-[#FFB703] font-mono font-bold">Excel, CSV o PDF</span>
                  </div>
                </div>
                <div className="bg-[#05070E]/80 p-2.5 rounded-xl border border-[#302840] text-[11px] text-[#A098B0] space-y-1.5">
                  <p className="font-mono text-[#FFB703] text-[10px]">42 transacciones importadas</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#E8E0F0]">
                    <Check className="w-3.5 h-3.5 text-[#00FF88] flex-shrink-0" />
                    <span>Clasificadas por reglas y cuotas</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. PILARES DE VALOR (VALUE PILLARS)                                       */}
      {/* ========================================================================= */}
      <section id="pilares-valor" className="relative z-10 py-16 border-t border-[#302840]/80 bg-[#070A14]">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold text-[#00FF88] uppercase tracking-widest bg-[#00FF88]/10 px-3 py-1 rounded-full border border-[#00FF88]/20">
              Pilares de Valor
            </span>
            <h2 className="text-2xl sm:text-4xl font-headline font-black text-white mt-3 mb-3">
              Construido para darte certidumbre absoluta
            </h2>
            <p className="text-xs sm:text-sm text-[#A098B0]">
              Tres pilares fundamentales diseñados para evitar errores humanos, ahorrar tiempo y proteger tu información.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Detección de Duplicados ±7 Días */}
            <div className="p-6 rounded-3xl bg-[#0B0F19]/80 border border-[#FFB703]/30 hover:border-[#FFB703]/60 transition-all shadow-xl panel-rim flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFB703]/15 text-[#FFB703] border border-[#FFB703]/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,183,3,0.2)]">
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-headline font-bold text-white mb-2">
                  Detección de Duplicados ±7 Días
                </h3>
                <p className="text-xs sm:text-sm text-[#A098B0] leading-relaxed">
                  Conciliación inteligente entre tus notificaciones instantáneas (Telegram / Google Wallet) y las cartolas bancarias. El motor detecta coincidencias por monto y ventana temporal de ±7 días para que nunca dupliques un gasto al subir tu estado de cuenta.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#302840] flex items-center gap-2 text-[11px] font-mono text-[#FFB703] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Conciliación automática sin fricción</span>
              </div>
            </div>

            {/* Pilar 2: Modo Demo sin Barreras */}
            <div className="p-6 rounded-3xl bg-[#0B0F19]/80 border border-[#00F2FE]/30 hover:border-[#00F2FE]/60 transition-all shadow-xl panel-rim flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
                  <Play className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-headline font-bold text-white mb-2">
                  Modo Demo sin Barreras
                </h3>
                <p className="text-xs sm:text-sm text-[#A098B0] leading-relaxed">
                  Exploración interactiva instantánea con un solo clic. Sin registro, sin tarjetas de crédito y sin barreras de entrada. Conoce todas las pantallas, gráficos, filtros y simuladores con datos precargados realistas antes de decidir crear tu cuenta.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#302840] flex items-center gap-2 text-[11px] font-mono text-[#00F2FE] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Prueba inmediata en 1 segundo</span>
              </div>
            </div>

            {/* Pilar 3: Infraestructura Segura $0 USD (RLS) */}
            <div className="p-6 rounded-3xl bg-[#0B0F19]/80 border border-[#00FF88]/30 hover:border-[#00FF88]/60 transition-all shadow-xl panel-rim flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                  <Database className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-headline font-bold text-white mb-2">
                  Infraestructura Segura $0 USD (RLS)
                </h3>
                <p className="text-xs sm:text-sm text-[#A098B0] leading-relaxed">
                  Cero acceso a tus claves de banco. Cifrado en reposo y aislamiento criptográfico estricto a nivel de fila (Row Level Security) en PostgreSQL vía Supabase. Tus finanzas están protegidas por políticas que solo permiten lectura y escritura a tu sesión verificada.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#302840] flex items-center gap-2 text-[11px] font-mono text-[#00FF88] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Aislamiento Zero-Trust por usuario</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECCIÓN BENTO GRID: CARACTERÍSTICAS DE ALTA GAMA                        */}
      {/* ========================================================================= */}
      <section id="bento-features" className="relative z-10 py-16 border-t border-[#302840]/80 bg-[#05070E]">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold text-[#FF2D78] uppercase tracking-widest bg-[#FF2D78]/10 px-3 py-1 rounded-full border border-[#FF2D78]/20">
              Funcionalidades de Vanguardia
            </span>
            <h2 className="text-3xl sm:text-4xl font-headline font-black text-white mt-3 mb-3">
              Todo lo que necesitas para entender con precisión tu dinero
            </h2>
            <p className="text-xs sm:text-sm text-[#A098B0]">
              Diseñado especialmente para la realidad bancaria chilena: compras en cuotas, abonos a mitad de mes y fechas de corte desfasadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 1 (Grande, 2 Columnas): "El Motor de Monto Real Utilizado" */}
            {/* ------------------------------------------------------------------- */}
            <div className="md:col-span-2 p-7 rounded-3xl bg-[#0B0F19]/80 border border-[#302840] hover:border-[#00F2FE]/40 transition-all shadow-xl panel-rim flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F2FE]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00F2FE]/10 transition-all" />
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] flex items-center justify-center border border-[#00F2FE]/30 shadow-inner">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-bold text-white">El Motor de "Monto Real Utilizado"</h3>
                    <p className="text-xs text-[#A098B0]">Deducción exacta de abonos y cuotas pagadas</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#E8E0F0] mb-6 leading-relaxed">
                  Cuando compras con Tarjeta de Crédito y pagas parte de la deuda durante el mes, los bancos solo muestran tu cupo consumido global. FinanzApp asocia tus abonos a compras específicas mediante FIFO o de forma manual, calculando tu saldo neto pendiente real.
                </p>

                {/* Interactive Formula Simulation */}
                <div className="bg-[#05070E]/90 p-4 rounded-2xl border border-[#302840] mb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono pb-2 border-b border-[#302840] text-[#A098B0] gap-2">
                    <span className="text-[#A098B0]">Fórmula de Cálculo:</span>
                    <span className="text-[#00F2FE] font-bold bg-[#00F2FE]/10 px-2.5 py-0.5 rounded border border-[#00F2FE]/30">
                      (Compras y Cuotas) - (Abonos Asociados) = Monto Real a Pagar
                    </span>
                  </div>

                  {/* Simulated Transaction Item */}
                  <div className="flex items-center justify-between bg-[#0B0F19] p-3 rounded-xl border border-[#302840]">
                    <div>
                      <div className="font-semibold text-xs text-white">Falabella • Cuota 02/06 Zapatillas</div>
                      <div className="text-[10px] text-[#A098B0] font-mono">Total cuota: $50.000</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#A098B0] block">Monto Real Utilizado:</span>
                      {demoAbonoApplied ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#A098B0] line-through">$50.000</span>
                          <span className="text-xs font-mono text-[#00FF88] font-black bg-[#00FF88]/20 px-2 py-0.5 rounded border border-[#00FF88]/30">
                            $0 (Cubierto 100%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-[#00F2FE] font-bold bg-[#00F2FE]/10 px-2 py-0.5 rounded border border-[#00F2FE]/30">
                          $50.000 (Pendiente)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Simulation Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[#A098B0]">
                  {demoAbonoApplied 
                    ? '🎉 ¡Abono de $50.000 aplicado! La cuota se saldó y no infla tu deuda.' 
                    : '👉 Presiona el botón para simular cómo un abono descuenta la cuota:'}
                </span>

                <button
                  onClick={() => setDemoAbonoApplied(!demoAbonoApplied)}
                  className={`text-xs font-headline font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                    demoAbonoApplied
                      ? 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
                      : 'bg-[#00FF88] hover:bg-[#00e67a] text-[#05070E] font-black shadow-[0_0_15px_rgba(0,255,136,0.3)]'
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
            <div id="telegram-bot" className="p-7 rounded-3xl bg-[#0B0F19]/80 border border-[#302840] hover:border-[#00F2FE]/40 transition-all shadow-xl panel-rim flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F2FE]/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] flex items-center justify-center border border-[#00F2FE]/30 shadow-inner">
                    <Bot className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-headline font-bold text-white">Bot de Telegram Oficial</h3>
                    <p className="text-xs text-[#00F2FE] font-mono font-bold">@FinanzAppGastosBot</p>
                  </div>
                </div>

                <p className="text-xs text-[#E8E0F0] mb-4 leading-relaxed">
                  ¿Compraste un café o pagaste el almuerzo? Envíale un mensaje a tu bot de Telegram y se auto-categoriza en tu cuenta bancaria al instante.
                </p>

                {/* Simulated Telegram Chat UI */}
                <div className="bg-[#05070E]/90 rounded-2xl p-3 border border-[#302840] space-y-2.5 font-sans">
                  {/* Bot Welcome Bubble */}
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-[#00F2FE]/30 flex items-center justify-center text-[#00F2FE] text-[10px] font-bold flex-shrink-0">
                      FA
                    </div>
                    <div className="bg-[#141422] text-[11px] text-[#E8E0F0] p-2 rounded-xl rounded-tl-none border border-[#302840] max-w-[85%]">
                      Escribe tu gasto: <br />
                      <span className="text-[#00F2FE] font-mono">14000 almuerzo falabella</span>
                    </div>
                  </div>

                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#00F2FE] to-[#38bdf8] text-[#05070E] text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl rounded-tr-none shadow-sm">
                      14.000 almuerzo falabella
                    </div>
                  </div>

                  {/* Bot Confirmation Bubble */}
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-[#00F2FE]/30 flex items-center justify-center text-[#00F2FE] text-[10px] font-bold flex-shrink-0">
                      FA
                    </div>
                    <div className="bg-[#141422] text-[11px] text-[#E8E0F0] p-2 rounded-xl rounded-tl-none border border-[#00FF88]/30 max-w-[85%] space-y-0.5">
                      <span className="text-[#00FF88] font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Registrado con éxito
                      </span>
                      <p className="text-[10px] text-[#A098B0]">
                        📁 Alimentación • 💳 TC Falabella
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#302840] flex items-center justify-between text-[11px] text-[#A098B0]">
                <span>Vinculación con token de 1 clic</span>
                <span className="text-[#00F2FE] font-bold font-mono">100% Seguro</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 3 (1 Columna): "Ciclos de Facturación & Días de Corte"     */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-[#0B0F19]/80 border border-[#302840] hover:border-[#FF2D78]/40 transition-all shadow-xl panel-rim flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF2D78]/20 text-[#FF2D78] flex items-center justify-center border border-[#FF2D78]/30 shadow-inner">
                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-headline font-bold text-white">Ciclos y Fechas de Corte</h3>
                    <p className="text-xs text-[#FF2D78]">Adiós a las sorpresas de fin de mes</p>
                  </div>
                </div>

                <p className="text-xs text-[#E8E0F0] mb-4 leading-relaxed">
                  Configura el día de corte (ej: día 24) y fecha de vencimiento de tus tarjetas de crédito. FinanzApp asigna automáticamente los gastos posteriores al ciclo de facturación del mes siguiente.
                </p>

                {/* Visual Timeline Diagram */}
                <div className="bg-[#05070E]/80 p-3.5 rounded-2xl border border-[#302840] space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-[10px] text-[#A098B0] border-b border-[#302840] pb-1.5">
                    <span>TC Visa (Corte: día 24)</span>
                    <span className="text-[#00F2FE] font-bold">Estado de Cuenta</span>
                  </div>
                  
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center bg-[#141422] p-1.5 rounded-lg border border-[#302840]">
                      <span className="text-[#E8E0F0]">20 Oct: Compra $30.000</span>
                      <span className="text-[#00F2FE] font-bold">➔ Fact. Octubre</span>
                    </div>

                    <div className="text-center py-0.5 bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30 rounded text-[10px] font-bold">
                      ⚡ Día 24: Corte de Tarjeta
                    </div>

                    <div className="flex justify-between items-center bg-[#141422] p-1.5 rounded-lg border border-[#302840]">
                      <span className="text-[#E8E0F0]">26 Oct: Compra $45.000</span>
                      <span className="text-[#00FF88] font-bold">➔ Fact. Noviembre</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#302840] text-[11px] text-[#A098B0]">
                <span>Maneja meses con 30 días y bisiestos automáticamente.</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 4 (1 Columna): "Carga Universal de Cartolas (Chile)"       */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-[#0B0F19]/80 border border-[#302840] hover:border-[#00FF88]/40 transition-all shadow-xl panel-rim flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00FF88]/20 text-[#00FF88] flex items-center justify-center border border-[#00FF88]/30 shadow-inner">
                    <FileText className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-headline font-bold text-white">Importación Universal</h3>
                    <p className="text-xs text-[#00FF88]">Bancos de Chile soportados</p>
                  </div>
                </div>

                <p className="text-xs text-[#E8E0F0] mb-4 leading-relaxed">
                  Sube archivos Excel, CSV o simplemente copia y pega el texto de tu cartola en PDF bancario. Nuestro motor inteligente extrae fecha, descripción, monto y cuotas al instante.
                </p>

                {/* Chilean Banks Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-[#E8E0F0]">
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">Banco de Chile</span>
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">Banco Santander</span>
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">BCI</span>
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">BancoEstado RUT</span>
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">TC Falabella</span>
                  <span className="bg-[#05070E] p-2 rounded-xl border border-[#302840] text-center">Scotiabank / Ripley</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#302840] text-[11px] text-[#A098B0]">
                <span>Detección automática de "Cuota 02/06"</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* BENTO CARD 5 (1 Columna): "Privacidad Primero & Supabase"             */}
            {/* ------------------------------------------------------------------- */}
            <div className="p-7 rounded-3xl bg-[#0B0F19]/80 border border-[#302840] hover:border-[#FFB703]/40 transition-all shadow-xl panel-rim flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB703]/20 text-[#FFB703] flex items-center justify-center border border-[#FFB703]/30 shadow-inner">
                    <Lock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-headline font-bold text-white">Privacidad Zero-Trust</h3>
                    <p className="text-xs text-[#FFB703]">Sin acceso a tus claves de banco</p>
                  </div>
                </div>

                <p className="text-xs text-[#E8E0F0] mb-4 leading-relaxed">
                  A diferencia de otras apps que te piden las claves de tu banco, FinanzApp nunca toca tus credenciales bancarias. Tus datos están aislados por Row Level Security (RLS) en Supabase.
                </p>

                <div className="space-y-2 bg-[#05070E]/80 p-3 rounded-2xl border border-[#302840] text-xs">
                  <div className="flex items-center gap-2 text-[#E8E0F0]">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] flex-shrink-0" />
                    <span>Autenticación OAuth con Google</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E8E0F0]">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] flex-shrink-0" />
                    <span>Cifrado SSL / TLS en tránsito y reposo</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E8E0F0]">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] flex-shrink-0" />
                    <span>Exporta tus datos a Excel cuando quieras</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#302840] text-[11px] text-[#A098B0]">
                <span>Tus datos son 100% tuyos sin ataduras.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECCIÓN COMPARATIVA: "¿POR QUÉ FINANZAPP?"                             */}
      {/* ========================================================================= */}
      <section id="comparativa" className="relative z-10 py-16 border-t border-[#302840]/80 bg-[#070A14]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-white mb-2">
              ¿Por qué FinanzApp en lugar de tu App Bancaria o Excel?
            </h2>
            <p className="text-xs sm:text-sm text-[#A098B0]">
              La diferencia entre perder el control y tener certidumbre total de lo que vas a pagar.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#302840] bg-[#0B0F19]/80 shadow-2xl backdrop-blur-md panel-rim">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#302840] bg-[#05070E] text-[#A098B0]">
                  <th className="p-4 sm:p-5 font-headline font-bold text-white">Capacidades Clave</th>
                  <th className="p-4 sm:p-5 text-center text-[#A098B0] font-medium">Planilla Excel</th>
                  <th className="p-4 sm:p-5 text-center text-[#A098B0] font-medium">App del Banco</th>
                  <th className="p-4 sm:p-5 text-center text-[#00F2FE] font-headline font-black bg-[#00F2FE]/10 border-x border-[#00F2FE]/30">
                    FinanzApp Pro ⚡
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302840] text-[#E8E0F0]">
                
                <tr className="hover:bg-[#141422]/50 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Monto Real Utilizado (Deducción exacta de abonos a compras)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Fórmulas complejas</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Solo cupo global</td>
                  <td className="p-4 sm:p-5 text-center bg-[#00F2FE]/10 border-x border-[#00F2FE]/30 text-[#00FF88] font-bold">
                    ✅ Automático (FIFO y Manual)
                  </td>
                </tr>

                <tr className="hover:bg-[#141422]/50 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Registro de compras por Telegram en 3 segundos
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ No disponible</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ No disponible</td>
                  <td className="p-4 sm:p-5 text-center bg-[#00F2FE]/10 border-x border-[#00F2FE]/30 text-[#00FF88] font-bold">
                    ✅ Bot @FinanzAppGastosBot
                  </td>
                </tr>

                <tr className="hover:bg-[#141422]/50 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Soporte para Días de Corte de Tarjetas (Ciclos)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Manual</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">⚠️ Confuso</td>
                  <td className="p-4 sm:p-5 text-center bg-[#00F2FE]/10 border-x border-[#00F2FE]/30 text-[#00FF88] font-bold">
                    ✅ Días 1 al 31 personalizables
                  </td>
                </tr>

                <tr className="hover:bg-[#141422]/50 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Lectura de cartolas PDF protegidas y Excel
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Copiar celda por celda</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">❌ Solo su propio banco</td>
                  <td className="p-4 sm:p-5 text-center bg-[#00F2FE]/10 border-x border-[#00F2FE]/30 text-[#00FF88] font-bold">
                    ✅ Todos los bancos de Chile
                  </td>
                </tr>

                <tr className="hover:bg-[#141422]/50 transition">
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    Privacidad sin entregar claves de banco
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#00FF88]">✅ Privado</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">⚠️ Centralizado</td>
                  <td className="p-4 sm:p-5 text-center bg-[#00F2FE]/10 border-x border-[#00F2FE]/30 text-[#00FF88] font-bold">
                    ✅ Zero-Trust + Supabase
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL CALL TO ACTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 border-t border-[#302840]/80">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#0F0F1A] via-[#0B0F19] to-[#05070E] border border-[#00F2FE]/30 shadow-[0_0_50px_rgba(0,242,254,0.15)] panel-rim overflow-hidden">
            
            {/* Background Glow Effect */}
            <div className="absolute top-[-50%] left-[20%] w-[350px] h-[350px] bg-[#00F2FE]/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <span className="text-xs font-mono font-bold text-[#00F2FE] uppercase tracking-widest bg-[#00F2FE]/10 px-3.5 py-1 rounded-full border border-[#00F2FE]/30">
                Comienza en 1 Minuto
              </span>
              
              <h2 className="text-3xl sm:text-5xl font-headline font-black text-white tracking-tight">
                Empieza hoy a tener visibilidad absoluta de tus tarjetas
              </h2>

              <p className="text-xs sm:text-base text-[#A098B0] max-w-xl mx-auto">
                Sin configuraciones interminables ni suscripciones costosas. Accede directamente con tu cuenta de Google o explora el modo demostración.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={onOpenAuth}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_0_25px_rgba(255,45,120,0.35)] transition transform hover:-translate-y-0.5 active:scale-95"
                >
                  <span>Comenzar Gratis con Google</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  onClick={onTryDemo}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#141422] hover:bg-[#1A1A2E] text-white font-headline font-bold text-sm px-7 py-4 rounded-2xl border border-[#302840] hover:border-[#00FFCC]/50 transition"
                >
                  <Sparkles className="w-4 h-4 text-[#00FFCC]" />
                  <span>Probar Demo sin Registro</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#A098B0] pt-4 font-mono font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00FF88]" /> 100% Gratuito en versión Pro
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00FF88]" /> Sin tarjeta de crédito requerida
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00FF88]" /> Listo en 60 segundos
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-[#302840] py-8 text-xs text-[#A098B0] bg-[#05070E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-2">
            <img
              src="/images/wallet_mascot_logo_64x64.png"
              alt="FinanzApp Logo"
              className="w-6 h-6 object-contain"
            />
            <span className="font-headline font-black text-white text-sm">FinanzApp</span>
            <span className="text-[#302840]">|</span>
            <span className="text-[#A098B0]">Control Inteligente de Finanzas y Tarjetas de Crédito</span>
          </div>

          <div className="flex items-center space-x-6 text-[#A098B0]">
            <span className="flex items-center gap-1 text-[#00FF88] font-mono font-bold">
              <Lock className="w-3.5 h-3.5" /> PostgreSQL y Supabase RLS
            </span>
            <span>Hecho para Chile 🇨🇱</span>
            <span className="font-mono">© 2026 FinanzApp</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

import React from 'react';
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
  Target,
  UserCheck
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onTryDemo }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Background Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FinanzApp <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">Pro</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onTryDemo}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              Probar Demo Interactivo
            </button>
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20 text-center flex-1 flex flex-col justify-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 px-3.5 py-1.5 rounded-full text-sky-300 text-xs font-semibold mb-6 mx-auto backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Lector Inteligente de Cartolas Bancarias & Tarjetas de Crédito</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
          Toma el control real de tus gastos y <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">asocia los pagos de tus tarjetas</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Lee estados de cuenta bancarios (CSV, Excel o copia de PDF), categoriza compras en cuotas automáticamente y calcula tu <strong>Monto Real Utilizado</strong> sin planillas complejas.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-sky-500/25 transition transform hover:-translate-y-0.5"
          >
            <span>Comenzar Gratis con Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-2xl border border-slate-700 transition"
          >
            <PieChart className="w-4 h-4 text-sky-400" />
            <span>Ver Modo Demo (Sin Registro)</span>
          </button>
        </div>

        {/* Feature Highlights Bar */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-white">Lectura de Cartolas</p>
            <p className="text-[11px] text-slate-400">CSV, Excel y Copia de PDF Bancario (Chile)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <CreditCard className="w-5 h-5 text-sky-400 mb-2" />
            <p className="text-xs font-bold text-white">Asociación de Pagos TC</p>
            <p className="text-[11px] text-slate-400">Asocia abonos y calcula saldo neto real</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Layers className="w-5 h-5 text-indigo-400 mb-2" />
            <p className="text-xs font-bold text-white">Cuotas & Períodos</p>
            <p className="text-[11px] text-slate-400">Reconoce cuotas y asigna a Mes-Periodo</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-xs font-bold text-white">Seguridad & Nube</p>
            <p className="text-[11px] text-slate-400">Datos privados con cifrado en Supabase</p>
          </div>
        </div>

      </section>

      {/* Feature Deep-Dive Section */}
      <section className="relative z-10 bg-slate-900/50 border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Todo lo que necesitas para entender adónde va tu dinero
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Diseñado especialmente para comprender estados de cuenta de Tarjetas de Crédito y Cuentas Bancarias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Carga Universal de Cartolas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sube archivos bancarios o pega el texto directamente desde PDFs de BancoChile, BCI, Santander, Scotiabank, BancoEstado, Falabella, Ripley y más.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Reglas e Hitos de Presupuesto</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Define palabras clave para auto-categorizar consumos recurrentes (Jumbo, Uber, Netflix) y establece topes mensuales con alertas de color.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Monto Real Utilizado Calculado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Si gastas $100.000 y realizas abonos posteriores a tu tarjeta, la app calcula exactamente el saldo neto restante consumido real.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 FinanzApp - Control Inteligente de Cartolas Bancarias & Tarjetas de Crédito</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Cifrado Supabase</span>
            <span>v1.0 Pro</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

import React, { useState } from 'react';
import { X, LogIn, UserPlus, ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/supabaseService';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google.');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la autenticación. Verifique sus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070E]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141422] rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] max-w-md w-full border border-[#302840] panel-rim overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0E0E18] border-b border-[#302840] p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#00FFCC]/10 text-[#00FFCC] rounded-2xl border border-[#00FFCC]/30 shadow-[0_0_15px_rgba(0,255,204,0.15)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-white tracking-tight">
                {mode === 'login' ? 'Iniciar Sesión en FinanzAPP' : 'Crear Cuenta en FinanzAPP'}
              </h3>
              <p className="text-xs text-[#A098B0] font-sans mt-0.5">
                Respalda tus cartolas en la nube de forma segura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A098B0] hover:text-white p-2 rounded-xl hover:bg-[#1C1C2E] border border-transparent hover:border-[#302840] transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-sans flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#0A0A12] hover:bg-[#181828] text-[#E8E0F0] font-headline font-bold text-xs rounded-xl border border-[#302840] hover:border-[#00FFCC]/40 shadow-sm transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-[#302840] w-full" />
            <span className="bg-[#141422] px-3 text-[10px] font-mono uppercase tracking-widest text-[#A098B0] absolute">
              o con correo
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-headline font-semibold text-[#A098B0] mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A098B0] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#0A0A12] border border-[#302840] rounded-xl text-white placeholder-[#A098B0]/40 font-sans focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-headline font-semibold text-[#A098B0] mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A098B0] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#0A0A12] border border-[#302840] rounded-xl text-white placeholder-[#A098B0]/40 font-sans focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-[#A098B0] hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,45,120,0.35)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isLoading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
            </button>
          </form>

          {/* Switch mode */}
          <div className="text-center text-xs text-[#A098B0] pt-4 border-t border-[#302840]/70">
            {mode === 'login' ? (
              <p>
                ¿No tienes cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-headline font-bold text-[#00FFCC] hover:underline ml-1"
                >
                  Registrarse gratis
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="font-headline font-bold text-[#00FFCC] hover:underline ml-1"
                >
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

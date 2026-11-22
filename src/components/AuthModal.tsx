import React, { useState } from 'react';
import { X, LogIn, UserPlus, ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles, MailCheck, ArrowRight } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, recordLegalConsent } from '../services/supabaseService';
import { LegalTab } from '../types';
import { LEGAL_TERMS_VERSION, LEGAL_PRIVACY_VERSION, PENDING_LEGAL_CONSENT_KEY } from '../constants/legal';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, onOpenLegal }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'email_confirmation_sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalHighlight, setLegalHighlight] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Friendly Spanish error mapper for Supabase Auth errors
  const mapSupabaseError = (err: any): string => {
    const raw = (err?.message || err?.error_description || String(err || '')).toLowerCase();

    if (raw.includes('email not confirmed')) {
      return 'Tu correo aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.';
    }
    if (raw.includes('user already registered') || raw.includes('already exists')) {
      return 'Ya existe una cuenta registrada con este correo. Por favor inicia sesión.';
    }
    if (raw.includes('password should be at least 6 characters') || raw.includes('at least 6 characters')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (raw.includes('invalid login credentials') || raw.includes('invalid credentials')) {
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    }
    if (raw.includes('rate limit') || raw.includes('too many requests')) {
      return 'Demasiados intentos. Por favor espera unos momentos antes de reintentar.';
    }
    if (raw.includes('network') || raw.includes('failed to fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    return err?.message || 'Error en la autenticación. Verifique sus datos.';
  };

  const handleGoogleLogin = async () => {
    if (mode === 'signup' && !acceptedLegal) {
      setLegalHighlight(true);
      setErrorMsg('Debes confirmar que eres mayor de 18 años y aceptar los Términos y la Política de Privacidad para registrarte.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLegalHighlight(false);

    if (mode === 'signup' && acceptedLegal) {
      try {
        sessionStorage.setItem(
          PENDING_LEGAL_CONSENT_KEY,
          JSON.stringify({
            termsVersion: LEGAL_TERMS_VERSION,
            privacyVersion: LEGAL_PRIVACY_VERSION,
            acceptedAt: new Date().toISOString(),
            source: 'google_oauth'
          })
        );
      } catch {
        // Fallback: ConsentGateModal will capture consent post-login if sessionStorage is unavailable
      }
    }

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(mapSupabaseError(err));
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Frontend validation: minimum 6 characters for password
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'signup' && !acceptedLegal) {
      setLegalHighlight(true);
      setErrorMsg('Debes confirmar que eres mayor de 18 años y aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLegalHighlight(false);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onSuccess();
        onClose();
      } else {
        const nowIso = new Date().toISOString();
        const consentMeta = {
          terms_version: LEGAL_TERMS_VERSION,
          privacy_version: LEGAL_PRIVACY_VERSION,
          terms_accepted_at: nowIso,
          is_adult_confirmed: true
        };
        const data = await signUpWithEmail(email, password, consentMeta);

        if (data?.session && data.user) {
          await recordLegalConsent({
            userId: data.user.id,
            email: data.user.email || email,
            termsVersion: LEGAL_TERMS_VERSION,
            privacyVersion: LEGAL_PRIVACY_VERSION,
            acceptedAt: nowIso,
            source: 'email_signup'
          });
        }

        // When email confirmation is enabled, Supabase creates the user but returns session = null
        if (data?.user && !data.session) {
          setMode('email_confirmation_sent');
          setPassword('');
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(mapSupabaseError(err));
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
              {mode === 'email_confirmation_sent' ? (
                <MailCheck className="w-5 h-5 text-[#00FFCC]" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-white tracking-tight">
                {mode === 'login'
                  ? 'Iniciar Sesión en FinanzAPP'
                  : mode === 'signup'
                  ? 'Crear Cuenta en FinanzAPP'
                  : 'Confirmación de Correo'}
              </h3>
              <p className="text-xs text-[#A098B0] font-sans mt-0.5">
                {mode === 'email_confirmation_sent'
                  ? 'Un paso más para activar tu cuenta'
                  : 'Respalda tus cartolas en la nube de forma segura'}
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
          
          {/* Email Confirmation Screen (Issue #61) */}
          {mode === 'email_confirmation_sent' ? (
            <div className="space-y-5 text-center py-2 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#00FFCC]/10 border border-[#00FFCC]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,204,0.2)]">
                <MailCheck className="w-8 h-8 text-[#00FFCC]" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-headline font-black text-white tracking-tight">
                  ¡Casi listo! Revisa tu correo
                </h4>
                <p className="text-xs text-[#A098B0] leading-relaxed max-w-sm mx-auto">
                  Te enviamos un enlace de activación a{' '}
                  <strong className="text-[#00FFCC] font-mono break-all font-semibold">
                    {email}
                  </strong>
                  . Ábrelo para confirmar tu cuenta y comenzar a usar FinanzAPP (revisa también la carpeta de spam).
                </p>
              </div>

              <div className="p-3.5 bg-[#0A0A12] border border-[#302840] rounded-2xl text-[11px] text-[#A098B0] text-left space-y-1">
                <div className="flex items-center gap-2 text-white font-headline font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFE04A]" />
                  <span>¿Qué sigue luego de confirmar?</span>
                </div>
                <p className="text-[#A098B0] text-[11px] pl-5">
                  Una vez que hagas clic en el enlace del correo, tu cuenta quedará habilitada inmediatamente para iniciar sesión.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="w-full py-3 bg-[#00FFCC] hover:bg-[#00e6b8] text-black font-headline font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)] transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Volver al inicio de sesión</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-sans flex items-center gap-2.5 animate-fadeIn">
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
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
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
                  {mode === 'signup' && (
                    <p className="text-[10px] text-[#A098B0] font-sans mt-1">
                      La contraseña debe contener al menos 6 caracteres.
                    </p>
                  )}
                </div>

                {mode === 'signup' && (
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl bg-[#0A0A12] border transition cursor-pointer select-none ${
                      legalHighlight
                        ? 'border-rose-500 ring-1 ring-rose-500/40'
                        : 'border-[#302840] hover:border-[#00FFCC]/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={acceptedLegal}
                      onChange={(e) => {
                        setAcceptedLegal(e.target.checked);
                        if (e.target.checked) {
                          setLegalHighlight(false);
                          setErrorMsg(null);
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-[#302840] bg-[#141422] text-[#00FFCC] focus:ring-[#00FFCC] focus:ring-offset-0 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-[#E8E0F0] leading-relaxed font-sans">
                      Declaro ser <strong>mayor de 18 años</strong> y acepto los{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenLegal?.('terms');
                        }}
                        className="text-[#00FFCC] font-semibold hover:underline"
                      >
                        Términos y Condiciones
                      </button>{' '}
                      y la{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenLegal?.('privacy');
                        }}
                        className="text-[#00FFCC] font-semibold hover:underline"
                      >
                        Política de Privacidad
                      </button>
                      .
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (mode === 'signup' && !acceptedLegal)}
                  className="w-full py-3 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white font-headline font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,45,120,0.35)] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isLoading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                </button>
              </form>

              {/* Switch mode & compact legal links */}
              <div className="text-center text-xs text-[#A098B0] pt-4 border-t border-[#302840]/70 space-y-2.5">
                {mode === 'login' ? (
                  <p>
                    ¿No tienes cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg(null);
                        setLegalHighlight(false);
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
                        setLegalHighlight(false);
                      }}
                      className="font-headline font-bold text-[#00FFCC] hover:underline ml-1"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                )}

                {onOpenLegal && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#A098B0]/80 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="hover:text-[#00FFCC] transition hover:underline"
                    >
                      Términos
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="hover:text-[#00FFCC] transition hover:underline"
                    >
                      Privacidad
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => onOpenLegal('contact')}
                      className="hover:text-[#00FFCC] transition hover:underline"
                    >
                      Reclamos
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

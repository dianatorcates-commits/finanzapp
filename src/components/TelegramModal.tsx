import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Bot,
  HelpCircle,
  FileText
} from 'lucide-react';
import { TelegramProfile, Account } from '../types';
import { generateTelegramLinkToken, unlinkTelegramProfile, getTelegramProfile } from '../services/supabaseService';

interface TelegramModalProps {
  currentUser: any;
  accounts: Account[];
  onClose: () => void;
  onProfileUpdated?: (profile: TelegramProfile | null) => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  currentUser,
  accounts,
  onClose,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<TelegramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Configurable Bot Username (reads from env or local storage, fallback to FinanzAppGastosBot)
  const defaultBotName = (import.meta.env.VITE_TELEGRAM_BOT_NAME as string) || 'FinanzAppGastosBot';
  const [botUsername, setBotUsername] = useState<string>(() => {
    return localStorage.getItem('finanzapp_telegram_bot_name') || defaultBotName;
  });

  const handleBotNameChange = (val: string) => {
    const clean = val.replace(/^@/, '').trim();
    setBotUsername(clean);
    localStorage.setItem('finanzapp_telegram_bot_name', clean);
  };

  // 1. Fetch initial profile
  const fetchProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getTelegramProfile(currentUser.id);
      setProfile(data);
      if (onProfileUpdated) onProfileUpdated(data);
    } catch (err) {
      console.error('Error cargando perfil de Telegram:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  // 2. Calculate remaining time for active link token
  useEffect(() => {
    if (!profile?.link_token || !profile?.token_expires_at) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const expires = new Date(profile.token_expires_at!).getTime();
      const now = Date.now();
      const diffSec = Math.floor((expires - now) / 1000);
      if (diffSec <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(diffSec);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [profile?.link_token, profile?.token_expires_at]);

  // 3. Auto-polling: Check every 3s if user has completed handshake in Telegram
  useEffect(() => {
    if (profile?.telegram_chat_id || !profile?.link_token) return;

    const pollInterval = setInterval(async () => {
      if (!currentUser?.id) return;
      const updated = await getTelegramProfile(currentUser.id);
      if (updated?.telegram_chat_id) {
        setProfile(updated);
        if (onProfileUpdated) onProfileUpdated(updated);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [profile?.telegram_chat_id, profile?.link_token, currentUser?.id]);

  // 4. Generate Link Token
  const handleGenerateLink = async () => {
    if (!currentUser?.id) return;
    setIsGenerating(true);
    try {
      const { token, expiresAt } = await generateTelegramLinkToken(currentUser.id);
      const updated: TelegramProfile = {
        ...(profile || { id: '', user_id: currentUser.id }),
        link_token: token,
        token_expires_at: expiresAt,
        telegram_chat_id: profile?.telegram_chat_id || null
      };
      setProfile(updated);

      // Open Telegram directly in a new window/tab
      const url = `https://t.me/${botUsername}?start=${token}`;
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Error generando token de enlace:', err);
      alert('Error al generar el token de vinculación. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Unlink Telegram
  const handleUnlink = async () => {
    if (!currentUser?.id) return;
    setIsUnlinking(true);
    try {
      await unlinkTelegramProfile(currentUser.id);
      const updated = await getTelegramProfile(currentUser.id);
      setProfile(updated);
      setShowUnlinkConfirm(false);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      console.error('Error al desvincular Telegram:', err);
      alert('No se pudo desvincular. Intenta de nuevo.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    }
  };

  const isLinked = Boolean(profile?.telegram_chat_id);
  const hasActiveToken = Boolean(profile?.link_token && timeLeft && timeLeft > 0);
  const linkUrl = hasActiveToken ? `https://t.me/${botUsername}?start=${profile?.link_token}` : '';

  const sampleAccountName = accounts[0]?.name || 'Corriente Scotiabank';
  const templateSample = `Tipo: Compra
Cuenta: ${sampleAccountName}
Monto: 14000
Categoria: Alimentación y Gastronomía
Subcategoria: Supermercado
Descripcion: Compras en el Jumbo
Fecha: Hoy`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Integración con Telegram
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300">
                  Multiusuario
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Registra tus movimientos en segundos enviando una plantilla de texto directa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Loading State */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <p className="text-xs">Verificando estado de vinculación...</p>
            </div>
          ) : isLinked ? (
            /* ==========================================
               ESTADO: VINCULADO
               ========================================== */
            <div className="space-y-5">
              
              {/* Linked Status Card */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h3 className="text-sm font-bold text-emerald-300">Cuenta de Telegram Vinculada</h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {profile?.first_name ? <span>Nombre: <b className="text-white">{profile.first_name}</b> </span> : null}
                      {profile?.username ? <span>(@{profile.username}) </span> : null}
                      <span className="text-slate-400 text-[11px] block sm:inline mt-0.5 sm:mt-0">
                        • Chat ID: <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">{profile?.telegram_chat_id}</code>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Unlink Action */}
                {!showUnlinkConfirm ? (
                  <button
                    onClick={() => setShowUnlinkConfirm(true)}
                    className="self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Desvincular</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={handleUnlink}
                      disabled={isUnlinking}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {isUnlinking ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowUnlinkConfirm(false)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Bot Info & Fast Commands */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-slate-200">Comandos Rápidos Disponibles en Telegram</span>
                  </div>
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition"
                  >
                    <span>Abrir Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                    <code className="text-sky-400 font-bold">/plantilla</code>
                    <p className="text-[11px] text-slate-400 mt-0.5">Mensaje para copiar</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                    <code className="text-sky-400 font-bold">/cuentas</code>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tus cuentas activas</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                    <code className="text-sky-400 font-bold">/categorias</code>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tus categorías</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                    <code className="text-sky-400 font-bold">/ayuda</code>
                    <p className="text-[11px] text-slate-400 mt-0.5">Guía de formato</p>
                  </div>
                </div>
              </div>

              {/* Plantilla Sample with Copy button */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Formato de Plantilla para Enviar:</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(templateSample, false)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition px-2 py-1 bg-slate-800 rounded-md border border-slate-700"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Plantilla</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                  {templateSample}
                </pre>
                <p className="text-[11px] text-slate-400">
                  💡 <i>Nota:</i> Puedes enviar <code className="text-slate-300 font-mono">Fecha: Hoy</code> o una fecha específica en formato <code className="text-slate-300 font-mono">YYYY-MM-DD</code>.
                </p>
              </div>

            </div>
          ) : (
            /* ==========================================
               ESTADO: NO VINCULADO
               ========================================== */
            <div className="space-y-5">
              
              {/* How it works Banner */}
              <div className="bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>¿Cómo funciona el Bot de FinanzApp?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Podrás enviar mensajes a nuestro bot en Telegram con una plantilla simple (cuenta, monto, categoría y detalle). El bot validará que la cuenta y categorías pertenezcan a tu usuario y registrará el movimiento al instante en tu FinanzApp.
                </p>
              </div>

              {/* Steps Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pasos para vincular tu cuenta:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-center font-bold leading-5 text-[11px]">
                      1
                    </span>
                    <p className="font-semibold text-slate-200">Genera tu enlace</p>
                    <p className="text-[11px] text-slate-400">Crea un token único de vinculación con 15 min de vigencia.</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-center font-bold leading-5 text-[11px]">
                      2
                    </span>
                    <p className="font-semibold text-slate-200">Abre Telegram</p>
                    <p className="text-[11px] text-slate-400">Se abrirá el bot directamente con tu código de acceso.</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-center font-bold leading-5 text-[11px]">
                      3
                    </span>
                    <p className="font-semibold text-slate-200">Presiona INICIAR</p>
                    <p className="text-[11px] text-slate-400">Telegram confirmará el enlace y podrás empezar a registrar.</p>
                  </div>
                </div>
              </div>

              {/* Bot Username Configuration */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Usuario del Bot:</span>
                  <span className="font-mono text-sky-300 font-semibold">@{botUsername}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => handleBotNameChange(e.target.value)}
                    placeholder="Nombre del bot en Telegram"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono w-40"
                  />
                </div>
              </div>

              {/* Active Token Handshake Display or Generate Button */}
              {hasActiveToken ? (
                <div className="bg-sky-950/30 border border-sky-500/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold text-white">Esperando confirmación en Telegram...</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {Math.floor(timeLeft! / 60)}:{(timeLeft! % 60).toString().padStart(2, '0')} min restantes
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Abre el enlace a continuación y pulsa <b>INICIAR</b> en Telegram para completar la vinculación:
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 text-xs"
                    >
                      <Send className="w-4 h-4 -rotate-12" />
                      <span>Abrir Bot en Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>

                    <button
                      onClick={() => copyToClipboard(linkUrl, true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2.5 rounded-xl border border-slate-700 text-xs font-medium transition"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Enlace</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center pt-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                    Detectando confirmación automáticamente en tiempo real...
                  </p>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 text-xs disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 -rotate-12" />
                    )}
                    <span>Vincular Telegram</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Sin IA ni procesamiento difuso. 100% determinístico.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

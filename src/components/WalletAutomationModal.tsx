import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  X,
  Zap,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Download,
  Send,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Landmark,
  Sparkles
} from 'lucide-react';
import { getOrCreateWebhookToken, regenerateWebhookToken } from '../services/supabaseService';

interface WalletAutomationModalProps {
  currentUser: any;
  onClose: () => void;
}

export const WalletAutomationModal: React.FC<WalletAutomationModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'macrodroid' | 'tester'>('setup');

  // Interactive Tester State
  const [testNotificationText, setTestNotificationText] = useState<string>(
    'Compra aprobada por $14.500 en Jumbo con tu tarjeta terminada en 4892'
  );
  const [testNotificationTitle, setTestNotificationTitle] = useState<string>('Google Wallet');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Compute personal webhook URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finanzapp-ochre-delta.vercel.app';
  const webhookUrl = `${origin}/api/wallet-webhook?token=${token}`;

  useEffect(() => {
    async function loadToken() {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const fetchedToken = await getOrCreateWebhookToken(currentUser.id);
        setToken(fetchedToken);
      } catch (err) {
        console.error('Error cargando webhook token:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadToken();
  }, [currentUser]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {}
  };

  const handleCopyBody = async () => {
    const jsonBody = JSON.stringify(
      {
        title: '[not_title]',
        text: '[not_body]',
      },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(jsonBody);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2500);
    } catch {}
  };

  const handleCopyCurl = async () => {
    const curlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Google Wallet", "text": "Compra aprobada por $14.500 en Jumbo con tu tarjeta terminada en 4892"}'`;
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2500);
    } catch {}
  };

  const handleRegenerate = async () => {
    if (!currentUser?.id) return;
    setIsRegenerating(true);
    try {
      const newToken = await regenerateWebhookToken(currentUser.id);
      setToken(newToken);
      setShowRegenerateConfirm(false);
    } catch (err) {
      console.error('Error regenerando token:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRunTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsTesting(true);
    setTestResponse(null);

    try {
      const res = await fetch(`/api/wallet-webhook?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testNotificationTitle,
          text: testNotificationText,
        }),
      });

      const data = await res.json();
      setTestResponse({
        status: res.status,
        ok: res.ok,
        data,
      });
    } catch (err: any) {
      setTestResponse({
        status: 500,
        ok: false,
        data: { error: err.message || 'Error de conexión con el webhook.' },
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadMacroDroidInstructions = () => {
    const instructions = `=====================================================
GUÍA DE CONFIGURACIÓN MACRODROID - FINANZAPP WEBHOOK
=====================================================

Objetivo: Capturar automáticamente compras de Google Wallet o notificaciones bancarias en Chile y registrarlas al instante en FinanzApp.

1. DISPARADOR (TRIGGER):
   • Tipo: Notificación -> Notificación recibida
   • Seleccionar aplicaciones:
     - Google Wallet
     - Banco Santander Chile
     - Banco de Chile
     - Banco Falabella / CMR
     - BCI
     - BancoEstado
     - Mercado Pago
     - Tenpo / Mach
   • Contenido de texto: Dejar en blanco o "Cualquiera"

2. ACCIONES (ACTIONS):
   • Tipo: Conectividad -> Solicitud HTTP (HTTP Request)
   • Método: POST
   • URL del servidor:
     ${webhookUrl}
   • Tipo de contenido (Content-Type): application/json
   • Cuerpo del contenido (Body):
     {
       "title": "[not_title]",
       "text": "[not_body]"
     }

3. RESTRICCIONES (OPCIONAL):
   • Evitar duplicados si tu banco envía más de una notificación por el mismo pago.

Tu URL personal:
${webhookUrl}
`;
    const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FinanzApp_MacroDroid_Config.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Automatización Android / Google Wallet
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Webhook
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Registra compras en tiempo real al pagar con tu teléfono o recibir notificaciones bancarias.
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'setup'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Mi Webhook Personal
          </button>
          <button
            onClick={() => setActiveTab('macrodroid')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'macrodroid'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Configuración MacroDroid
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'tester'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Simulador de Pruebas
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* TAB 1: SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              {/* How it works Banner */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  <span>¿Cómo Funciona el Flujo Automático?</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">
                        1
                      </span>
                      Pago con Wallet
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Pagas con Google Wallet en el POS o tu banco envía una notificación de compra a Android.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                        2
                      </span>
                      MacroDroid / HTTP
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      MacroDroid captura el texto de la notificación y envía una solicitud HTTP POST a tu URL personal.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                        3
                      </span>
                      Procesamiento
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      FinanzApp extrae el monto, comercio y tarjeta, calcula el período contable y te notifica por Telegram.
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook URL Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tu URL de Webhook Personal
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Método: <strong className="text-emerald-400">POST</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={isLoading ? 'Generando credencial de acceso...' : webhookUrl}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-28 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500 shadow-inner"
                  />
                  <button
                    onClick={handleCopyUrl}
                    disabled={isLoading || !token}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Esta URL contiene tu clave de autenticación única vinculada a tu cuenta de FinanzApp. No la compartas.
                </p>
              </div>

              {/* Regenerate Token Section */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">¿Deseas revocar o cambiar tu clave?</h4>
                  <p className="text-[11px] text-slate-500">
                    Al regenerar el token, las macros antiguas dejarán de funcionar hasta que actualices la URL.
                  </p>
                </div>

                {showRegenerateConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      {isRegenerating ? 'Regenerando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setShowRegenerateConfirm(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegenerateConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition self-start sm:self-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerar Clave</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MACRODROID SETUP GUIDE */}
          {activeTab === 'macrodroid' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Configuración Paso a Paso en MacroDroid</h3>
                  <p className="text-xs text-slate-400">
                    MacroDroid es una aplicación gratuita para Android disponible en Google Play Store.
                  </p>
                </div>

                <button
                  onClick={handleDownloadMacroDroidInstructions}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 font-semibold border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Guía (.txt)</span>
                </button>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                    1
                  </span>
                  Configurar el Disparador (Trigger)
                </span>
                <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc">
                  <li>En MacroDroid, pulsa en <strong>Añadir Macro</strong>.</li>
                  <li>Toca en el botón rojo (+) de <strong>Disparadores</strong> ➔ <strong>Eventos del dispositivo</strong> ➔ <strong>Notificación</strong>.</li>
                  <li>Selecciona <strong>Notificación recibida</strong> ➔ <strong>Seleccionar aplicaciones</strong>.</li>
                  <li>
                    Marca las apps desde las que recibes avisos de compra:
                    <strong className="text-white"> Google Wallet</strong>,{' '}
                    <strong className="text-white">Santander</strong>,{' '}
                    <strong className="text-white">Banco de Chile</strong>,{' '}
                    <strong className="text-white">CMR Falabella</strong>,{' '}
                    <strong className="text-white">BCI</strong>,{' '}
                    <strong className="text-white">Mercado Pago</strong>, etc.
                  </li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  Configurar la Acción (Action: Solicitud HTTP)
                </span>
                <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc">
                  <li>Toca en el botón azul (+) de <strong>Acciones</strong> ➔ <strong>Conectividad</strong> ➔ <strong>Solicitud HTTP</strong>.</li>
                  <li>Método de solicitud: <strong className="text-emerald-400">POST</strong>.</li>
                  <li>URL del servidor: Pega tu URL de Webhook:</li>
                </ul>

                <div className="relative pl-6">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[11px] font-mono text-sky-300"
                  />
                </div>

                <ul className="text-xs text-slate-300 space-y-1 pl-6 list-disc">
                  <li>Tipo de contenido: <strong className="text-white">application/json</strong>.</li>
                  <li>Cuerpo del contenido (Body): Pega el siguiente JSON exacto con las variables de MacroDroid:</li>
                </ul>

                <div className="relative pl-6">
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`{
  "title": "[not_title]",
  "text": "[not_body]"
}`}
                  </pre>
                  <button
                    onClick={handleCopyBody}
                    className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-semibold border border-slate-700 transition flex items-center gap-1"
                  >
                    {copiedBody ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBody ? 'Copiado' : 'Copiar JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    3
                  </span>
                  Guardar y Activar
                </span>
                <p className="text-xs text-slate-300 pl-6">
                  Guarda la macro con el nombre <strong className="text-white">"FinanzApp Webhook"</strong> y asegúrate de que MacroDroid tenga permisos de acceso a notificaciones en tu Android. ¡Listo! Cada compra que hagas se registrará automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Simulador de Notificaciones</h3>
                  <p className="text-xs text-slate-400">
                    Prueba el webhook en vivo enviando una notificación simulada para verificar el parseador y la inserción.
                  </p>
                </div>

                <button
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'cURL Copiado' : 'Copiar cURL'}</span>
                </button>
              </div>

              <form onSubmit={handleRunTester} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Título de la Notificación (App / Emisor)
                  </label>
                  <input
                    type="text"
                    required
                    value={testNotificationTitle}
                    onChange={(e) => setTestNotificationTitle(e.target.value)}
                    placeholder="Ej. Google Wallet, Santander, BCI..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Texto o Cuerpo de la Notificación *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={testNotificationText}
                    onChange={(e) => setTestNotificationText(e.target.value)}
                    placeholder="Ej. Compra aprobada por $14.500 en Jumbo con tu tarjeta terminada en 4892"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('Compra aprobada por $4.500 en Starbucks con tu tarjeta terminada en 4892')
                      }
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    >
                      Ejemplo Starbucks
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('Santander Informa: Compra aprobada por $28.990 en COPEC con tu TC Santander')
                      }
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    >
                      Ejemplo Santander
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isTesting || !token}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Enviando...' : 'Enviar Prueba al Webhook'}</span>
                  </button>
                </div>
              </form>

              {/* Test Response Preview */}
              {testResponse && (
                <div
                  className={`p-4 rounded-2xl border transition ${
                    testResponse.ok
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {testResponse.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span
                      className={`text-xs font-bold ${
                        testResponse.ok ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      Respuesta HTTP {testResponse.status} -{' '}
                      {testResponse.ok ? 'Procesado Exitosamente' : 'Error en Webhook'}
                    </span>
                  </div>

                  <pre className="p-3 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                    {JSON.stringify(testResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Conexión segura cifrada TLS / HTTPS y tokens multiusuario aislados.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

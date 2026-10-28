import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  Check,
  Sparkles,
  HelpCircle,
  Calendar,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { parseCSVFile, parseExcelFile, parseRawText, analyzeCartolaDuplicates } from '../utils/parser';
import { calculateTransactionPeriod } from '../utils/dateUtils';
import { formatCLP } from './MetricCards';

interface ImportModalProps {
  accounts: Account[];
  initialAccountId?: string;
  existingTransactions?: Transaction[];
  onClose: () => void;
  onImport: (newTransactions: Transaction[]) => Promise<void> | void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  accounts,
  initialAccountId,
  existingTransactions = [],
  onClose,
  onImport
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
      return initialAccountId;
    }
    return accounts[0]?.id || '';
  });
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [rawText, setRawText] = useState<string>('');
  const [rawImportedTxs, setRawImportedTxs] = useState<Transaction[]>([]);
  const [parsedPreview, setParsedPreview] = useState<Transaction[]>([]);
  const [omittedExactCount, setOmittedExactCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
  const [bulkPeriodInput, setBulkPeriodInput] = useState<string>('');

  const targetAccount = accounts.find((a) => a.id === selectedAccountId);

  const processIncomingTransactions = (incoming: Transaction[], accountId: string, closingDay?: number) => {
    const fixed = incoming.map((t) => ({
      ...t,
      accountId,
      period: t.period || calculateTransactionPeriod(t.date, closingDay)
    }));
    setRawImportedTxs(fixed);
    const analysis = analyzeCartolaDuplicates(fixed, existingTransactions, accountId);
    setOmittedExactCount(analysis.omittedExactCount);
    setParsedPreview(analysis.filteredTxs);
  };

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    const newTarget = accounts.find((a) => a.id === newAccountId);
    if (newTarget && rawImportedTxs.length > 0) {
      const updatedRaw = rawImportedTxs.map((tx) => ({
        ...tx,
        accountId: newAccountId,
        period: calculateTransactionPeriod(tx.date, newTarget.closingDay),
        transactionType:
          tx.transactionType === 'pago_tc' && newTarget.type !== 'credit_card'
            ? 'ingreso_venta'
            : tx.transactionType === 'ingreso_venta' && newTarget.type === 'credit_card'
            ? 'pago_tc'
            : tx.transactionType
      }));
      processIncomingTransactions(updatedRaw, newAccountId, newTarget.closingDay);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAccountId || !targetAccount) return;

    setIsProcessing(true);
    setFileName(file.name);

    try {
      let txs: Transaction[] = [];
      if (file.name.endsWith('.csv')) {
        txs = await parseCSVFile(file, selectedAccountId, targetAccount.type);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        txs = await parseExcelFile(file, selectedAccountId, targetAccount.type);
      } else {
        // Fallback text read
        const text = await file.text();
        txs = parseRawText(text, selectedAccountId, targetAccount.type);
      }
      processIncomingTransactions(txs, selectedAccountId, targetAccount.closingDay);
    } catch (err) {
      alert('Error al leer el archivo. Revisa el formato e intenta de nuevo.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = () => {
    if (!rawText.trim() || !selectedAccountId || !targetAccount) return;
    const txs = parseRawText(rawText, selectedAccountId, targetAccount.type);
    processIncomingTransactions(txs, selectedAccountId, targetAccount.closingDay);
  };

  const handleApplyBulkPeriod = () => {
    if (!bulkPeriodInput.trim()) return;
    const formatted = bulkPeriodInput.trim();
    setParsedPreview((prev) =>
      prev.map((tx) => ({
        ...tx,
        period: formatted
      }))
    );
  };

  const handleUpdatePreviewRow = (id: string, updates: Partial<Transaction>) => {
    setParsedPreview((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const handleDismissDuplicate = (id: string) => {
    setParsedPreview((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              isPotentialDuplicate: false,
              duplicateOfDescription: undefined,
              duplicateOfId: undefined
            }
          : tx
      )
    );
  };

  const handleDeletePreviewRow = (id: string) => {
    setParsedPreview((prev) => prev.filter((tx) => tx.id !== id));
  };

  const handleAcceptAllDuplicates = () => {
    setParsedPreview((prev) =>
      prev.map((tx) => ({
        ...tx,
        isPotentialDuplicate: false,
        duplicateOfDescription: undefined,
        duplicateOfId: undefined
      }))
    );
  };

  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0 || !selectedAccountId || isImporting) return;
    setIsImporting(true);
    try {
      const finalTransactions = parsedPreview.map((tx) => ({
        ...tx,
        accountId: selectedAccountId,
        period: tx.period || calculateTransactionPeriod(tx.date, targetAccount?.closingDay)
      }));
      await onImport(finalTransactions);
      onClose();
    } catch (err) {
      console.error('Error durante la importación:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A12]/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-[#111118] text-[#E8E0F0] rounded-2xl shadow-2xl max-w-3xl w-full border border-[#302840] panel-rim overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#141422] p-4 sm:p-5 border-b border-[#302840] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-sm">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#E8E0F0] flex items-center gap-2">
                <span>Cargar Estado de Cuenta o Cartola</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  Cartola
                </span>
              </h3>
              <p className="text-xs text-[#A098B0]">
                Importación masiva de CSV, Excel o texto copiado de PDF bancario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A098B0] hover:text-white p-1.5 rounded-xl hover:bg-[#1C1C2E] transition border border-transparent hover:border-[#302840]"
            aria-label="Cerrar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Picker & Format Guide Toggle */}
        <div className="p-4 bg-[#0E0E18] border-b border-[#302840] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-2/3">
            <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1">
              Cuenta o Tarjeta Destino
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#E8E0F0] font-headline font-semibold focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-[#0F0F1A] text-[#E8E0F0]">
                  {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
                  {acc.closingDay ? ` [Corte: día ${acc.closingDay}]` : ''}
                </option>
              ))}
            </select>
            {targetAccount?.closingDay && (
              <p className="text-[11px] text-[#00FFCC] bg-[#00FFCC]/10 px-3 py-1.5 rounded-xl border border-[#00FFCC]/25 mt-2 flex items-center gap-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5 text-[#00FFCC] flex-shrink-0" />
                <span>
                  Ciclo de Facturación: Corte el día <b className="font-mono text-white">{targetAccount.closingDay}</b>. Las compras posteriores se imputan automáticamente al mes siguiente.
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="flex items-center gap-1.5 text-xs text-[#FFE04A] bg-[#FFE04A]/10 hover:bg-[#FFE04A]/20 px-3 py-2 rounded-xl border border-[#FFE04A]/30 font-headline font-semibold transition self-end sm:self-auto"
          >
            <HelpCircle className="w-4 h-4 text-[#FFE04A]" />
            <span>{showFormatGuide ? 'Ocultar Guía' : 'Ver Formato Recomendado'}</span>
          </button>
        </div>

        {/* Format Guide Drawer */}
        {showFormatGuide && (
          <div className="p-4 bg-[#141422] border-b border-[#302840] space-y-3 text-xs text-[#A098B0] animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-headline font-bold text-[#E8E0F0] flex items-center gap-1.5">
                <span>📋 Formato Base de Cartola Recomendado</span>
              </h4>
              <span className="text-[10px] font-mono text-[#00FFCC] bg-[#00FFCC]/10 border border-[#00FFCC]/30 px-2 py-0.5 rounded-full font-bold">
                Detección Inteligente de Columnas
              </span>
            </div>
            <p className="text-[#A098B0] leading-relaxed">
              FinanzApp reconoce automáticamente los encabezados de los principales bancos de Chile. Tu archivo CSV o Excel debe contener al menos las siguientes columnas:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                <span className="font-bold text-[#00FFCC] block">📅 1. Fecha (Obligatorio)</span>
                <span className="text-[#A098B0] text-[10px]">Fecha, F.Transacción, Fecha Operación</span>
                <span className="text-emerald-400 font-bold block mt-1">Ej: 15/09/2026, 2026-09-15</span>
              </div>
              <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                <span className="font-bold text-[#00FFCC] block">📝 2. Descripción (Obligatorio)</span>
                <span className="text-[#A098B0] text-[10px]">Descripción, Detalle, Glosa, Comercio</span>
                <span className="text-white font-semibold block mt-1 truncate">SUPERMERCADO JUMBO</span>
              </div>
              <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                <span className="font-bold text-[#00FFCC] block">💰 3. Monto / Cargo (Obligatorio)</span>
                <span className="text-[#A098B0] text-[10px]">Monto, Valor, Cargo, Abono, Importe</span>
                <span className="text-[#FFE04A] font-bold block mt-1">Ej: 45.900, -50.000</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
              <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                <span className="font-bold text-[#E8E0F0] block">🔢 4. Cuotas (Opcional)</span>
                <span className="text-[#A098B0] text-[10px]">Cuotas, Nro Cuota (ej: 02/06)</span>
              </div>
              <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                <span className="font-bold text-[#E8E0F0] block">🗓️ 5. Mes-Período (Opcional)</span>
                <span className="text-[#A098B0] text-[10px]">Mes-Periodo, Período, Ciclo (ej: 2026-03)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#302840] bg-[#141422] px-4 pt-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-headline font-bold border-b-2 transition ${
              activeTab === 'file'
                ? 'border-[#FF2D78] text-[#FF2D78]'
                : 'border-transparent text-[#A098B0] hover:text-[#E8E0F0]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Subir Archivo (CSV / Excel)</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-headline font-bold border-b-2 transition ${
              activeTab === 'text'
                ? 'border-[#FF2D78] text-[#FF2D78]'
                : 'border-transparent text-[#A098B0] hover:text-[#E8E0F0]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pegar Texto de PDF / Cartola</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-[#00FFCC]/40 hover:border-[#00FFCC] rounded-2xl p-8 text-center bg-[#141422]/60 hover:bg-[#141422] transition cursor-pointer relative group">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="p-3 bg-[#00FFCC]/10 text-[#00FFCC] w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-[#00FFCC]/20 group-hover:scale-105 transition">
                <Upload className="w-6 h-6 text-[#00FFCC]" />
              </div>
              <p className="text-xs font-headline font-bold text-white">
                Arrastra tu cartola aquí o haz clic para examinar computador
              </p>
              <p className="text-[11px] text-[#A098B0] mt-1 font-sans">
                Soporta CSV de bancos chilenos, planillas Excel (.xlsx, .xls) o texto simple (.txt)
              </p>
              {isProcessing && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-[#00FFCC]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando cartola con IA de FinanzApp...</span>
                </div>
              )}
              {fileName && !isProcessing && (
                <p className="mt-3 text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full inline-block border border-emerald-500/30">
                  📄 {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-headline font-semibold text-[#A098B0]">
                Pega aquí las líneas copiadas del PDF o portal bancario:
              </label>
              <textarea
                rows={5}
                placeholder="Ejemplo:&#10;15/09/2026 UBER TRIPS SANTIAGO 8.500&#10;16/09/2026 SUPERMERCADO JUMBO 45.900&#10;18/09/2026 PAGO TC SANTANDER -50.000"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-[#0A0A12] text-white placeholder-[#A098B0]/40 border border-[#302840] rounded-xl focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC]"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="w-full bg-[#1C1C2E] hover:bg-[#25253C] text-[#00FFCC] border border-[#00FFCC]/30 hover:border-[#00FFCC] font-headline font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm"
              >
                Interpretar Texto Bancario
              </button>
            </div>
          )}

          {/* Parsed Preview Table with Period & Date Edit */}
          {parsedPreview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#302840] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#141422] p-3 rounded-xl border border-[#302840]">
                <h4 className="text-xs font-headline font-bold text-[#E8E0F0] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00FFCC]" />
                  <span>Transacciones a Importar ({parsedPreview.length})</span>
                </h4>

                {/* Bulk Period Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#A098B0] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>Período Masivo:</span>
                  </span>
                  <input
                    type="month"
                    value={bulkPeriodInput}
                    onChange={(e) => setBulkPeriodInput(e.target.value)}
                    className="text-xs py-1 px-2 bg-[#0A0A12] text-[#00FFCC] border border-[#302840] rounded-lg focus:outline-none font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkPeriod}
                    disabled={!bulkPeriodInput}
                    className="text-xs font-headline font-bold bg-[#00FFCC]/15 hover:bg-[#00FFCC]/25 border border-[#00FFCC]/30 text-[#00FFCC] disabled:opacity-40 px-2.5 py-1 rounded-lg transition"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Omitted Exact Duplicates Notification */}
              {omittedExactCount > 0 && (
                <div className="bg-[#00FFCC]/10 border border-[#00FFCC]/25 text-[#00FFCC] text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00FFCC] flex-shrink-0" />
                  <span>
                    Se omitieron automáticamente <b className="font-mono text-white">{omittedExactCount}</b> transacciones duplicadas exactas (misma fecha y monto ya registrados previamente).
                  </span>
                </div>
              )}

              {/* Potential Duplicates Warning Banner */}
              {parsedPreview.some((t) => t.isPotentialDuplicate) && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      <b className="font-mono text-white">{parsedPreview.filter((t) => t.isPotentialDuplicate).length}</b> transacciones con <b className="text-amber-200">posible duplicidad</b> (coinciden en monto en los últimos 7 días).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAcceptAllDuplicates}
                    className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-headline font-bold px-3 py-1 rounded-lg transition whitespace-nowrap"
                  >
                    Aceptar todas
                  </button>
                </div>
              )}

              {/* Preview Table */}
              <div className="max-h-56 overflow-y-auto border border-[#302840] rounded-xl bg-[#0A0A12] scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-left text-xs text-[#E8E0F0]">
                  <thead className="bg-[#141422] text-[10px] font-mono font-bold text-[#A098B0] uppercase sticky top-0 z-10 border-b border-[#302840]">
                    <tr>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5">Mes-Período</th>
                      <th className="px-3 py-2.5">Descripción</th>
                      <th className="px-3 py-2.5">Categoría</th>
                      <th className="px-3 py-2.5 text-right">Monto</th>
                      <th className="px-3 py-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#302840]/60">
                    {parsedPreview.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-[#141422]/60 transition ${
                          tx.isPotentialDuplicate ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                        }`}
                      >
                        {/* Editable Date */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="date"
                            value={tx.date}
                            onChange={(e) => handleUpdatePreviewRow(tx.id, { date: e.target.value })}
                            className="text-[11px] font-mono py-0.5 px-1.5 bg-[#141422] text-white border border-[#302840] rounded focus:outline-none focus:border-[#00FFCC]"
                          />
                        </td>

                        {/* Editable Period (YYYY-MM) */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="month"
                            value={tx.period || tx.date.slice(0, 7)}
                            onChange={(e) => handleUpdatePreviewRow(tx.id, { period: e.target.value })}
                            className="text-[11px] font-mono py-0.5 px-1.5 bg-[#00FFCC]/10 border border-[#00FFCC]/30 text-[#00FFCC] font-bold rounded focus:outline-none"
                            title="Mes de imputación en el presupuesto"
                          />
                        </td>

                        <td className="px-3 py-2 font-medium max-w-[200px]">
                          <div className="truncate text-white" title={tx.description}>
                            {tx.description}
                            {tx.installments && (
                              <span className="ml-1 text-[10px] text-[#FFE04A] bg-[#FFE04A]/10 px-1 py-0.2 rounded border border-[#FFE04A]/30 font-mono">
                                C.{tx.installments.current}/{tx.installments.total}
                              </span>
                            )}
                          </div>
                          {tx.isPotentialDuplicate && (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400 inline" /> Posible Duplicidad
                              </span>
                              {tx.duplicateOfDescription && (
                                <span className="text-[10px] text-amber-400/80 truncate max-w-[150px]" title={`Coincide con: ${tx.duplicateOfDescription}`}>
                                  ({tx.duplicateOfDescription})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <span className="bg-[#1C1C2E] border border-[#302840] px-2 py-0.5 rounded text-[10px] text-[#A098B0] font-medium">
                            {tx.category}
                          </span>
                        </td>

                        <td
                          className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${
                            tx.transactionType === 'pago_tc' || tx.amount < 0
                              ? 'text-emerald-400'
                              : 'text-[#FFE04A]'
                          }`}
                        >
                          {tx.transactionType === 'pago_tc' ? `- ${formatCLP(tx.amount)}` : formatCLP(tx.amount)}
                        </td>

                        {/* Row Actions */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {tx.isPotentialDuplicate && (
                              <button
                                type="button"
                                onClick={() => handleDismissDuplicate(tx.id)}
                                className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/40 transition flex items-center gap-1"
                                title="Aceptar esta transacción como válida"
                              >
                                <Check className="w-3 h-3 text-emerald-400" /> Aceptar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePreviewRow(tx.id)}
                              className="text-[#A098B0] hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition"
                              title="Eliminar de la importación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0E0E18] p-4 border-t border-[#302840] flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 bg-[#1A1A28] hover:bg-[#242436] disabled:opacity-50 text-[#A098B0] hover:text-white text-xs font-headline font-semibold rounded-xl border border-[#302840] transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0 || isImporting}
            className={`px-5 py-2.5 text-xs font-headline font-bold rounded-xl transition flex items-center gap-2 shadow-lg ${
              parsedPreview.length > 0 && !isImporting
                ? 'bg-gradient-to-r from-[#FF2D78] to-[#f43f5e] hover:from-[#ff1a6c] hover:to-[#e11d48] text-white cursor-pointer glow-primary transform active:scale-95'
                : 'bg-[#1C1C2E] text-[#A098B0]/40 border border-[#302840] cursor-not-allowed'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando en la nube...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar e Importar ({parsedPreview.length})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

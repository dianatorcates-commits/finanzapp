import React, { useState } from 'react';
import { X, Upload, FileText, FileSpreadsheet, Check, Sparkles } from 'lucide-react';
import { Account, Transaction } from '../types';
import { parseCSVFile, parseExcelFile, parseRawText } from '../utils/parser';
import { formatCLP } from './MetricCards';

interface ImportModalProps {
  accounts: Account[];
  onClose: () => void;
  onImport: (newTransactions: Transaction[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  accounts,
  onClose,
  onImport
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [rawText, setRawText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const targetAccount = accounts.find((a) => a.id === selectedAccountId);

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
      setParsedPreview(txs);
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
    setParsedPreview(txs);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImport(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cargar Estado de Cuenta o Cartola</h3>
              <p className="text-xs text-slate-400">Importación de CSV, Excel o Texto copiado de PDF bancario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Picker */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Cuenta o Tarjeta Destino
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium text-slate-800"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'file'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Subir Archivo (CSV / Excel)</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'text'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pegar Texto de PDF / Cartola</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-sky-50/50 transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-sky-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Arrastra tu cartola o haz clic para seleccionar</p>
              <p className="text-[11px] text-slate-400 mt-1">Soporta CSV, Excel (.xlsx, .xls) o texto simple</p>
              {fileName && (
                <p className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                  📄 {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Pega aquí las líneas copiadas del PDF o sitio web de tu banco:
              </label>
              <textarea
                rows={6}
                placeholder="Ejemplo:&#10;15/09/2026 UBER TRIPS SANTIAGO 8.500&#10;16/09/2026 SUPERMERCADO JUMBO 45.900&#10;18/09/2026 PAGO TC SANTANDER -50.000"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition"
              >
                Interpretar Texto Bancario
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Vista Previa de Transacciones Detectadas ({parsedPreview.length})</span>
                </h4>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-semibold text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-[11px] font-mono">{tx.date}</td>
                        <td className="px-3 py-2 font-medium truncate max-w-[180px]">{tx.description}</td>
                        <td className="px-3 py-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600 font-medium">
                            {tx.category}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-bold ${
                            tx.transactionType === 'pago_tc' || tx.amount < 0
                              ? 'text-emerald-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {tx.transactionType === 'pago_tc' ? `- ${formatCLP(tx.amount)}` : formatCLP(tx.amount)}
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
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm ${
              parsedPreview.length > 0
                ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Importar ({parsedPreview.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};

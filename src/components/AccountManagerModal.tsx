import React, { useState } from 'react';
import { X, CreditCard, Landmark, Plus, Trash2, Edit2, Calendar, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatBillingCycle } from '../utils/dateUtils';

interface AccountManagerModalProps {
  accounts: Account[];
  onClose: () => void;
  onAddAccount: (newAcc: Account) => void;
  onUpdateAccount?: (updatedAcc: Account) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  accounts,
  onClose,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  // Form State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<AccountType>('credit_card');
  const [accountNumber, setAccountNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingAccountId(null);
    setName('');
    setBank('');
    setType('credit_card');
    setAccountNumber('');
    setCreditLimit('');
    setClosingDay('');
    setDueDay('');
    setErrorMessage(null);
  };

  const startEdit = (acc: Account) => {
    setEditingAccountId(acc.id);
    setName(acc.name);
    setBank(acc.bank);
    setType(acc.type);
    setAccountNumber(acc.accountNumber || '');
    setCreditLimit(acc.creditLimit ? acc.creditLimit.toString() : '');
    setClosingDay(acc.closingDay ? acc.closingDay.toString() : '');
    setDueDay(acc.dueDay ? acc.dueDay.toString() : '');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !bank.trim()) {
      setErrorMessage('Por favor ingresa el nombre descriptivo y el banco.');
      return;
    }

    // Validar días de corte y pago si fueron provistos
    let parsedClosingDay: number | undefined = undefined;
    if (closingDay.trim()) {
      const parsed = parseInt(closingDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setErrorMessage('El día de corte debe ser un número entre 1 y 31.');
        return;
      }
      parsedClosingDay = parsed;
    }

    let parsedDueDay: number | undefined = undefined;
    if (dueDay.trim()) {
      const parsed = parseInt(dueDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setErrorMessage('El día de pago/vencimiento debe ser un número entre 1 y 31.');
        return;
      }
      parsedDueDay = parsed;
    }

    if (editingAccountId) {
      // Modo Edición
      const updatedAcc: Account = {
        id: editingAccountId,
        name: name.trim(),
        bank: bank.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        currency: 'CLP',
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        color: type === 'credit_card' ? '#e11d48' : '#0284c7',
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };

      if (onUpdateAccount) {
        onUpdateAccount(updatedAcc);
      }
    } else {
      // Modo Creación
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        name: name.trim(),
        bank: bank.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        currency: 'CLP',
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        color: type === 'credit_card' ? '#e11d48' : '#0284c7',
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };

      onAddAccount(newAcc);
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gestionar Cuentas y Tarjetas</h3>
              <p className="text-xs text-slate-400">Configura cuentas, cupos y ciclos de facturación personalizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-6">
          
          {/* Current Accounts List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cuentas Registradas ({accounts.length})
            </h4>
            <div className="space-y-2">
              {accounts.map((acc) => {
                const cycleLabel = formatBillingCycle(acc.closingDay, acc.dueDay);
                const isSelected = editingAccountId === acc.id;

                return (
                  <div
                    key={acc.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                        {acc.type === 'credit_card' ? (
                          <CreditCard className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Landmark className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-800">{acc.name}</p>
                          {cycleLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                              <Calendar className="w-2.5 h-2.5" />
                              {cycleLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {acc.bank} •{' '}
                          {acc.type === 'credit_card'
                            ? 'Tarjeta de Crédito'
                            : acc.type === 'checking'
                            ? 'Cuenta Corriente'
                            : acc.type === 'savings'
                            ? 'Cuenta de Ahorro'
                            : 'Cuenta Vista / RUT'}
                          {acc.creditLimit
                            ? ` • Cupo: $${new Intl.NumberFormat('es-CL').format(acc.creditLimit)}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(acc)}
                        className={`p-1.5 rounded-lg transition ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
                        }`}
                        title="Editar cuenta y ciclo de facturación"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {accounts.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la cuenta "${acc.name}" y todos sus movimientos asociados?`)) {
                              onDeleteAccount(acc.id);
                              if (editingAccountId === acc.id) resetForm();
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Account Form */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                {editingAccountId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-600" />
                    <span>Editar Cuenta / Tarjeta</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-sky-600" />
                    <span>Agregar Nueva Cuenta o Tarjeta</span>
                  </>
                )}
              </h4>

              {editingAccountId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Descriptivo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TC Mastercard Falabella"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Banco / Emisor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Banco Estado, BCI, Scotiabank"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Cuenta</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                  >
                    <option value="credit_card">💳 Tarjeta de Crédito (TC)</option>
                    <option value="checking">🏦 Cuenta Corriente</option>
                    <option value="sight">🏦 Cuenta Vista / RUT</option>
                    <option value="savings">🐖 Cuenta de Ahorro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° Cuenta / Tarjeta (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: **** 1234"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              {type === 'credit_card' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cupo Total Aprobado (CLP)</label>
                  <input
                    type="number"
                    placeholder="Ej: 2000000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              )}

              {/* Ciclo de Facturación (Día de Corte & Día de Pago) */}
              <div className="border border-sky-200 bg-sky-50/50 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Ciclo de Facturación Mensual</span>
                </div>

                {type === 'credit_card' ? (
                  <p className="text-[11px] text-sky-700 leading-relaxed bg-white/70 p-2 rounded-lg border border-sky-100 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Indica el día de corte para que los gastos posteriores al cierre se asignen a la facturación del mes siguiente.
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Opcional: Si tu cuenta tiene un día de corte para cartolas mensuales, puedes indicarlo aquí.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Día de corte / facturación (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 24 (Por defecto fin de mes)"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-full text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Compras después de este día pasan al mes siguiente.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Día de pago / vencimiento (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 5 (Opcional)"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Fecha límite de pago de la facturación.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 ${
                    editingAccountId
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAccountId ? 'Guardar Cambios de Cuenta' : 'Guardar Nueva Cuenta'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};

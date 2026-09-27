import React, { useState } from 'react';
import { X, CreditCard, Landmark, Plus, Trash2 } from 'lucide-react';
import { Account, AccountType } from '../types';

interface AccountManagerModalProps {
  accounts: Account[];
  onClose: () => void;
  onAddAccount: (newAcc: Account) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  accounts,
  onClose,
  onAddAccount,
  onDeleteAccount
}) => {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<AccountType>('credit_card');
  const [accountNumber, setAccountNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bank.trim()) return;

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      bank: bank.trim(),
      type,
      accountNumber: accountNumber.trim() || undefined,
      currency: 'CLP',
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      color: type === 'credit_card' ? '#e11d48' : '#0284c7'
    };

    onAddAccount(newAcc);
    setName('');
    setBank('');
    setAccountNumber('');
    setCreditLimit('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gestionar Cuentas & Tarjetas</h3>
              <p className="text-xs text-slate-400">Agrega tarjetas de crédito, cuentas corrientes o vista</p>
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
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                      {acc.type === 'credit_card' ? <CreditCard className="w-4 h-4 text-rose-500" /> : <Landmark className="w-4 h-4 text-sky-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{acc.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {acc.bank} • {acc.type === 'credit_card' ? 'Tarjeta de Crédito' : acc.type === 'checking' ? 'Cuenta Corriente' : 'Cuenta Vista/RUT'}
                      </p>
                    </div>
                  </div>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Eliminar cuenta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Account Form */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Plus className="w-4 h-4 text-sky-600" />
              <span>Agregar Nueva Cuenta o Tarjeta</span>
            </h4>

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

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm"
              >
                Guardar Nueva Cuenta
              </button>
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

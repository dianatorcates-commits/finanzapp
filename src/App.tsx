import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Account, Transaction, ComputedTransaction, FilterState, CategoryMapping, AutoCategoryRule, CategoryBudget } from './types';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS } from './utils/demoData';
import { DEFAULT_CATEGORY_MAPPINGS, DEFAULT_AUTO_RULES, getParentCategory, autoCategorize } from './utils/categorizer';
import { computeTransactions, autoAllocatePayments, addPaymentAllocation, removePaymentAllocation } from './utils/paymentAllocation';
import { supabase } from './utils/supabaseClient';
import {
  fetchUserData,
  syncLocalDataToCloud,
  signOutUser,
  deleteCloudAccount,
  deleteCloudTransaction,
  deleteCloudTransactionsBatch,
  saveCloudCategory,
  deleteCloudCategory,
  deleteCloudRule,
  deleteCloudBudget
} from './services/supabaseService';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { Filters } from './components/Filters';
import { ChartsDashboard } from './components/ChartsDashboard';
import { TransactionTable } from './components/TransactionTable';
import { PaymentModal } from './components/PaymentModal';
import { ImportModal } from './components/ImportModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { BudgetAndRulesModal } from './components/BudgetAndRulesModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { PieChart, ListFilter, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_ACCOUNTS = 'finanzapp_accounts_v1';
const STORAGE_KEY_TRANSACTIONS = 'finanzapp_transactions_v1';
const STORAGE_KEY_CATEGORY_MAPPINGS = 'finanzapp_category_mappings_v1';
const STORAGE_KEY_AUTO_RULES = 'finanzapp_auto_rules_v1';
const STORAGE_KEY_BUDGETS = 'finanzapp_budgets_v1';

export function App() {
  // 1. State for Accounts
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // 2. State for Category & Subcategory Mappings
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORY_MAPPINGS);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORY_MAPPINGS;
  });

  // 3. State for Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // 4. State for Auto-Categorization Rules
  const [autoRules, setAutoRules] = useState<AutoCategoryRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_RULES);
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_RULES;
  });

  // 5. State for Category Budgets
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
    return saved
      ? JSON.parse(saved)
      : [
          { id: 'b-1', categoryName: 'Alimentación & Gastronomía', monthlyLimit: 350000 },
          { id: 'b-2', categoryName: 'Transporte & Movilidad', monthlyLimit: 120000 },
          { id: 'b-3', categoryName: 'Compras & Estilo de Vida', monthlyLimit: 200000 }
        ];
  });

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Save to localStorage with user-isolated keys
  useEffect(() => {
    const key = currentUser?.id ? `${STORAGE_KEY_ACCOUNTS}_${currentUser.id}` : STORAGE_KEY_ACCOUNTS;
    localStorage.setItem(key, JSON.stringify(accounts));
  }, [accounts, currentUser]);

  useEffect(() => {
    const key = currentUser?.id ? `${STORAGE_KEY_TRANSACTIONS}_${currentUser.id}` : STORAGE_KEY_TRANSACTIONS;
    localStorage.setItem(key, JSON.stringify(transactions));
  }, [transactions, currentUser]);

  useEffect(() => {
    const key = currentUser?.id ? `${STORAGE_KEY_CATEGORY_MAPPINGS}_${currentUser.id}` : STORAGE_KEY_CATEGORY_MAPPINGS;
    localStorage.setItem(key, JSON.stringify(categoryMappings));
  }, [categoryMappings, currentUser]);

  useEffect(() => {
    const key = currentUser?.id ? `${STORAGE_KEY_AUTO_RULES}_${currentUser.id}` : STORAGE_KEY_AUTO_RULES;
    localStorage.setItem(key, JSON.stringify(autoRules));
  }, [autoRules, currentUser]);

  useEffect(() => {
    const key = currentUser?.id ? `${STORAGE_KEY_BUDGETS}_${currentUser.id}` : STORAGE_KEY_BUDGETS;
    localStorage.setItem(key, JSON.stringify(budgets));
  }, [budgets, currentUser]);

  // Auto-sync with Supabase Cloud whenever state changes for logged in user (only when cloud data has finished loading)
  useEffect(() => {
    if (currentUser?.id && !isCloudLoading) {
      syncLocalDataToCloud(currentUser.id, {
        accounts,
        categoryMappings,
        autoRules,
        budgets,
        transactions
      });
    }
  }, [currentUser, isCloudLoading, accounts, categoryMappings, autoRules, budgets, transactions]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    month: 'ALL',
    accountId: 'ALL',
    accountType: 'ALL',
    transactionType: 'ALL',
    categories: [],
    subcategories: [],
    searchQuery: '',
    onlyPendingTC: false
  });

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<ComputedTransaction | null>(null);

  // Load cloud data from Supabase if user is logged in
  const loadCloudData = async (userId: string) => {
    setIsCloudLoading(true);
    try {
      const data = await fetchUserData(userId);
      const cloudSyncedKey = `finanzapp_cloud_synced_${userId}`;
      const isCloudSynced = localStorage.getItem(cloudSyncedKey);

      if (isCloudSynced || data.accounts.length > 0 || data.transactions.length > 0) {
        setAccounts(data.accounts);
        setCategoryMappings(data.categoryMappings.length > 0 ? data.categoryMappings : DEFAULT_CATEGORY_MAPPINGS);
        setAutoRules(data.autoRules.length > 0 ? data.autoRules : DEFAULT_AUTO_RULES);
        setBudgets(data.budgets);
        setTransactions(data.transactions);
        localStorage.setItem(cloudSyncedKey, 'true');
      } else {
        // First time ever logged in for this brand new user: initialize clean account & empty transactions
        const initialUserAccounts = INITIAL_ACCOUNTS;
        const initialUserCategories = categoryMappings.length > 0 ? categoryMappings : DEFAULT_CATEGORY_MAPPINGS;
        const initialUserRules = autoRules.length > 0 ? autoRules : DEFAULT_AUTO_RULES;
        const initialUserBudgets = [
          { id: 'b-1', categoryName: 'Alimentación & Gastronomía', monthlyLimit: 350000 },
          { id: 'b-2', categoryName: 'Transporte & Movilidad', monthlyLimit: 120000 },
          { id: 'b-3', categoryName: 'Compras & Estilo de Vida', monthlyLimit: 200000 }
        ];
        const initialUserTransactions: Transaction[] = []; // CLEAN START FOR NEW USERS!

        setAccounts(initialUserAccounts);
        setCategoryMappings(initialUserCategories);
        setAutoRules(initialUserRules);
        setBudgets(initialUserBudgets);
        setTransactions(initialUserTransactions);

        await syncLocalDataToCloud(userId, {
          accounts: initialUserAccounts,
          categoryMappings: initialUserCategories,
          autoRules: initialUserRules,
          budgets: initialUserBudgets,
          transactions: initialUserTransactions
        });
        localStorage.setItem(cloudSyncedKey, 'true');
      }
    } catch (err) {
      console.error('Error al cargar/sincronizar datos desde Supabase:', err);
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        setViewMode('app');
        loadCloudData(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        setViewMode('app');
        loadCloudData(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setViewMode('landing');
    // Clear user local storage keys so old state doesn't persist
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_CATEGORY_MAPPINGS);
    localStorage.removeItem(STORAGE_KEY_AUTO_RULES);
    localStorage.removeItem(STORAGE_KEY_BUDGETS);

    // Reset state to original demo state
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategoryMappings(DEFAULT_CATEGORY_MAPPINGS);
    setAutoRules(DEFAULT_AUTO_RULES);
    setBudgets([
      { id: 'b-1', categoryName: 'Alimentación & Gastronomía', monthlyLimit: 350000 },
      { id: 'b-2', categoryName: 'Transporte & Movilidad', monthlyLimit: 120000 },
      { id: 'b-3', categoryName: 'Compras & Estilo de Vida', monthlyLimit: 200000 }
    ]);
  };

  // Normalize transactions dynamically to guarantee parent category & subcategory resolution
  const normalizedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      const subcategory = tx.subcategory || tx.category || 'Otros Gastos';
      const category = getParentCategory(subcategory, categoryMappings);
      return {
        ...tx,
        category,
        subcategory
      };
    });
  }, [transactions, categoryMappings]);

  // Compute transactions with payment allocations
  const computedTransactions = useMemo(() => {
    return computeTransactions(normalizedTransactions);
  }, [normalizedTransactions]);

  // Extract available months/periods for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    computedTransactions.forEach((tx) => {
      const p = tx.period || (tx.date ? tx.date.substring(0, 7) : '');
      if (p) months.add(p);
    });
    return Array.from(months).sort().reverse();
  }, [computedTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return computedTransactions.filter((tx) => {
      // Month / Period Filter
      const txPeriod = tx.period || (tx.date ? tx.date.substring(0, 7) : '');
      if (filters.month !== 'ALL' && txPeriod !== filters.month) return false;

      // Account Filter
      if (filters.accountId !== 'ALL' && tx.accountId !== filters.accountId) return false;

      // Account Type Filter
      if (filters.accountType !== 'ALL') {
        const acc = accounts.find((a) => a.id === tx.accountId);
        if (acc?.type !== filters.accountType) return false;
      }

      // Transaction Type Filter
      if (filters.transactionType !== 'ALL' && tx.transactionType !== filters.transactionType) return false;

      // General Category Multi-Select Filter (Checks both direct category and resolved parent category)
      if (filters.categories && filters.categories.length > 0) {
        const parentCat = getParentCategory(tx.subcategory || tx.category, categoryMappings);
        const matchesCat = filters.categories.includes(tx.category) || filters.categories.includes(parentCat);
        if (!matchesCat) {
          return false;
        }
      }

      // Subcategories Multi-Select Filter
      if (filters.subcategories && filters.subcategories.length > 0) {
        const effectiveSub = tx.subcategory || tx.category;
        if (!filters.subcategories.includes(effectiveSub)) {
          return false;
        }
      }

      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchRaw = tx.rawDescription.toLowerCase().includes(q);
        const matchCategory = (tx.category || '').toLowerCase().includes(q);
        const matchSubcategory = (tx.subcategory || '').toLowerCase().includes(q);
        if (!matchDesc && !matchRaw && !matchCategory && !matchSubcategory) return false;
      }

      // Only Pending TC
      if (filters.onlyPendingTC) {
        const acc = accounts.find((a) => a.id === tx.accountId);
        if (acc?.type !== 'credit_card') return false;
        if (tx.transactionType === 'pago_tc' || tx.netAmount <= 0) return false;
      }

      return true;
    });
  }, [computedTransactions, filters, accounts, categoryMappings]);

  // Handlers
  const handleAutoAllocate = () => {
    const updated = autoAllocatePayments(
      transactions,
      filters.accountId === 'ALL' ? undefined : filters.accountId
    );
    setTransactions(updated);
  };

  const handleResetDemo = () => {
    if (window.confirm('¿Restablecer todos los datos a la cartola de ejemplo original?')) {
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCategoryMappings(DEFAULT_CATEGORY_MAPPINGS);
    }
  };

  const handleImportTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleAddAccount = (newAcc: Account) => {
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleDeleteAccount = async (accId: string) => {
    if (currentUser) {
      await deleteCloudAccount(currentUser.id, accId);
    }
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    setTransactions((prev) => prev.filter((t) => t.accountId !== accId));
  };

  // Category & Subcategory Handlers
  const handleAddCategory = async (categoryName: string) => {
    const newCat: CategoryMapping = {
      id: `cat-${Date.now()}`,
      name: categoryName,
      subcategories: []
    };
    if (currentUser) {
      await saveCloudCategory(currentUser.id, newCat);
    }
    setCategoryMappings((prev) => [...prev, newCat]);
  };

  const handleAddSubcategory = async (parentCategoryName: string, subcategoryName: string) => {
    let targetCat: CategoryMapping | null = null;
    setCategoryMappings((prev) =>
      prev.map((cat) => {
        if (cat.name === parentCategoryName) {
          if (!cat.subcategories.includes(subcategoryName)) {
            targetCat = {
              ...cat,
              subcategories: [...cat.subcategories, subcategoryName]
            };
            return targetCat;
          }
        }
        return cat;
      })
    );

    if (currentUser) {
      const existing = categoryMappings.find((c) => c.name === parentCategoryName);
      if (existing) {
        const updatedPayload: CategoryMapping = {
          ...existing,
          subcategories: existing.subcategories.includes(subcategoryName)
            ? existing.subcategories
            : [...existing.subcategories, subcategoryName]
        };
        await saveCloudCategory(currentUser.id, updatedPayload);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (currentUser) {
      await deleteCloudCategory(currentUser.id, categoryId);
    }
    setCategoryMappings((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const handleDeleteSubcategory = async (parentCategoryName: string, subcategoryName: string) => {
    setCategoryMappings((prev) =>
      prev.map((cat) => {
        if (cat.name === parentCategoryName) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter((s) => s !== subcategoryName)
          };
        }
        return cat;
      })
    );

    if (currentUser) {
      const existing = categoryMappings.find((c) => c.name === parentCategoryName);
      if (existing) {
        const updatedPayload: CategoryMapping = {
          ...existing,
          subcategories: existing.subcategories.filter((s) => s !== subcategoryName)
        };
        await saveCloudCategory(currentUser.id, updatedPayload);
      }
    }
  };

  // Auto Rules & Budgets Handlers
  const handleAddAutoRule = (newRule: AutoCategoryRule) => {
    setAutoRules((prev) => [newRule, ...prev]);
  };

  const handleDeleteAutoRule = async (ruleId: string) => {
    if (currentUser) {
      await deleteCloudRule(currentUser.id, ruleId);
    }
    setAutoRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleApplyRulesToExisting = () => {
    setTransactions((prev) =>
      prev.map((tx) => {
        const isIncomeOrPayment =
          tx.transactionType === 'ingreso_venta' ||
          tx.transactionType === 'transferencia_recibida' ||
          tx.transactionType === 'pago_tc';

        const effectiveRawAmount = isIncomeOrPayment ? -Math.abs(tx.amount) : Math.abs(tx.amount);

        const res = autoCategorize(
          tx.description,
          effectiveRawAmount,
          undefined,
          categoryMappings,
          autoRules,
          tx.transactionType
        );

        return {
          ...tx,
          category: res.category,
          subcategory: res.subcategory,
          transactionType: res.transactionType
        };
      })
    );
  };

  const handleSaveBudget = (categoryName: string, monthlyLimit: number) => {
    setBudgets((prev) => {
      const exists = prev.find((b) => b.categoryName === categoryName);
      if (exists) {
        return prev.map((b) => (b.categoryName === categoryName ? { ...b, monthlyLimit } : b));
      }
      return [...prev, { id: `b-${Date.now()}`, categoryName, monthlyLimit }];
    });
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (currentUser) {
      await deleteCloudBudget(currentUser.id, budgetId);
    }
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const handleDeleteTransaction = async (id: string) => {
    if (currentUser) {
      await deleteCloudTransaction(currentUser.id, id);
    }
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const handleDeleteTransactionsBatch = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    if (currentUser) {
      await deleteCloudTransactionsBatch(currentUser.id, ids);
    }
    setTransactions((prev) => prev.filter((tx) => !ids.includes(tx.id)));
  };

  const handleAddManualTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleAddAllocation = (purchaseId: string, paymentId: string, amount: number) => {
    setTransactions((prev) => addPaymentAllocation(prev, purchaseId, paymentId, amount));
  };

  const handleRemoveAllocation = (purchaseId: string, allocationId: string) => {
    setTransactions((prev) => removePaymentAllocation(prev, purchaseId, allocationId));
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredTransactions.map((tx) => {
      const acc = accounts.find((a) => a.id === tx.accountId);
      return {
        'ID Transacción': tx.id,
        'Fecha': tx.date,
        'Período Asignado': tx.period || tx.date.substring(0, 7),
        'Cuenta / Tarjeta': acc?.name || 'N/A',
        'Tipo Cuenta': acc?.type || 'N/A',
        'Descripción': tx.description,
        'Categoría General': tx.category,
        'Subcategoría': tx.subcategory || tx.category,
        'Tipo Transacción': tx.transactionType,
        'Monto Cuota / Facturado': tx.amount,
        'Monto Total Compra': tx.originalTotalAmount || tx.amount,
        'Abonos / Pagos Asociados': tx.totalAllocated,
        'Monto Real Utilizado': tx.netAmount,
        'Estado Pago': tx.isFullyPaid ? 'Pagado Total' : tx.totalAllocated > 0 ? 'Pagado Parcial' : 'Pendiente'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
    XLSX.writeFile(workbook, `FinanzApp_Cartola_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 1. Render Landing Page if user is logged out and in landing viewMode
  if (!currentUser && viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onTryDemo={() => setViewMode('app')}
        />

        {/* Auth Modal */}
        {isAuthModalOpen && (
          <AuthModal
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => setIsAuthModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header / Navbar */}
      <Header
        accounts={accounts}
        activeAccountId={filters.accountId}
        currentUser={currentUser}
        onSelectAccount={(id) => setFilters((prev) => ({ ...prev, accountId: id }))}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onAutoAllocate={handleAutoAllocate}
        onResetDemo={handleResetDemo}
        onExport={handleExportExcel}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Metric Cards Summary */}
        <MetricCards
          computedTransactions={computedTransactions}
          accounts={accounts}
          activeAccountId={filters.accountId}
        />

        {/* View Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 mb-6 bg-white rounded-xl p-1 shadow-sm border">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Resumen & Gráficos</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'transactions'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Transacciones & Asociación de Pagos</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-500 pr-3 gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Monto Real Utilizado Calculado</span>
          </div>
        </div>

        {/* Filters */}
        <Filters
          filters={filters}
          accounts={accounts}
          categoryMappings={categoryMappings}
          availableMonths={availableMonths}
          onChange={setFilters}
          onReset={() =>
            setFilters({
              month: 'ALL',
              accountId: 'ALL',
              accountType: 'ALL',
              transactionType: 'ALL',
              categories: [],
              subcategories: [],
              searchQuery: '',
              onlyPendingTC: false
            })
          }
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' ? (
          <ChartsDashboard
            computedTransactions={filteredTransactions}
            accounts={accounts}
            budgets={budgets}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          />
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            accounts={accounts}
            categoryMappings={categoryMappings}
            onOpenPaymentModal={(p) => setSelectedPurchaseForPayment(p)}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteTransactionsBatch={handleDeleteTransactionsBatch}
            onAddTransaction={handleAddManualTransaction}
          />
        )}

      </main>

      {/* Payment Association Modal */}
      {selectedPurchaseForPayment && (
        <PaymentModal
          purchase={selectedPurchaseForPayment}
          allTransactions={computedTransactions}
          account={accounts.find((a) => a.id === selectedPurchaseForPayment.accountId)}
          onClose={() => setSelectedPurchaseForPayment(null)}
          onAddAllocation={handleAddAllocation}
          onRemoveAllocation={handleRemoveAllocation}
        />
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <ImportModal
          accounts={accounts}
          initialAccountId={filters.accountId !== 'ALL' ? filters.accountId : accounts[0]?.id}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportTransactions}
        />
      )}

      {/* Account Manager Modal */}
      {isAccountModalOpen && (
        <AccountManagerModal
          accounts={accounts}
          onClose={() => setIsAccountModalOpen(false)}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Category & Subcategory Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          categoryMappings={categoryMappings}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
          onAddSubcategory={handleAddSubcategory}
          onDeleteCategory={handleDeleteCategory}
          onDeleteSubcategory={handleDeleteSubcategory}
        />
      )}

      {/* Budget & Auto-Rules Manager Modal */}
      {isBudgetModalOpen && (
        <BudgetAndRulesModal
          categoryMappings={categoryMappings}
          autoRules={autoRules}
          budgets={budgets}
          onClose={() => setIsBudgetModalOpen(false)}
          onAddRule={handleAddAutoRule}
          onDeleteRule={handleDeleteAutoRule}
          onApplyRulesToExisting={handleApplyRulesToExisting}
          onSaveBudget={handleSaveBudget}
          onDeleteBudget={handleDeleteBudget}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2026 FinanzApp - Control Inteligente de Cartolas Bancarias & Tarjetas de Crédito</p>
        </div>
      </footer>

    </div>
  );
}

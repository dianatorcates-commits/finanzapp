import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Account,
  Transaction,
  ComputedTransaction,
  FilterState,
  CategoryMapping,
  AutoCategoryRule,
  CategoryBudget,
  TelegramProfile,
  SavingsGoal
} from './types';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, DEMO_ACCOUNTS, DEMO_TRANSACTIONS } from './utils/demoData';
import { DEFAULT_CATEGORY_MAPPINGS, DEFAULT_AUTO_RULES, getParentCategory, autoCategorize, applyAutoRulesToTransaction } from './utils/categorizer';
import { computeTransactions, autoAllocatePayments, addPaymentAllocation, removePaymentAllocation, isPaymentOrIncomeTransaction } from './utils/paymentAllocation';
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
  deleteCloudBudget,
  getTelegramProfile,
  saveCloudAccount,
  updateAccountTransactionsPeriod,
  fetchSavingsGoals,
  saveSavingsGoalsToCloud,
  saveSavingsGoalToCloud,
  deleteSavingsGoalFromCloud
} from './services/supabaseService';
import { calculateTransactionPeriod } from './utils/dateUtils';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MetricCards } from './components/MetricCards';
import { Filters } from './components/Filters';
import { ChartsDashboard } from './components/ChartsDashboard';
import { TransactionTable } from './components/TransactionTable';
import { PaymentModal } from './components/PaymentModal';
import { ImportModal } from './components/ImportModal';
import { AccountsManagementView } from './components/AccountsManagementView';
import { CategoryManagementView } from './components/CategoryManagementView';
import { BudgetAndGoalsView } from './components/BudgetAndGoalsView';
import { BudgetAndRulesModal } from './components/BudgetAndRulesModal';
import { TelegramModal } from './components/TelegramModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';

const STORAGE_KEY_ACCOUNTS = 'finanzapp_accounts_v1';
const STORAGE_KEY_TRANSACTIONS = 'finanzapp_transactions_v1';
const STORAGE_KEY_CATEGORY_MAPPINGS = 'finanzapp_category_mappings_v1';
const STORAGE_KEY_AUTO_RULES = 'finanzapp_auto_rules_v1';
const STORAGE_KEY_BUDGETS = 'finanzapp_budgets_v1';
const STORAGE_KEY_SAVINGS_GOALS = 'finanzapp_savings_goals_v1';

export function App() {
  // 1. State for Accounts: always initialize strictly with clean demo accounts (never read generic or private localStorage on startup)
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  // 2. State for Category & Subcategory Mappings
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>(DEFAULT_CATEGORY_MAPPINGS);

  // 3. State for Transactions: always initialize strictly with clean demo transactions (never read generic or private localStorage on startup)
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // 4. State for Auto-Categorization Rules
  const [autoRules, setAutoRules] = useState<AutoCategoryRule[]>(DEFAULT_AUTO_RULES);

  // 5. State for Category Budgets
  const [budgets, setBudgets] = useState<CategoryBudget[]>([
    { id: 'b-1', categoryName: 'Alimentación y Gastronomía', monthlyLimit: 350000 },
    { id: 'b-2', categoryName: 'Transporte y Movilidad', monthlyLimit: 120000 },
    { id: 'b-3', categoryName: 'Compras y Estilo de Vida', monthlyLimit: 200000 }
  ]);

  // 6. State for Savings Goals: strictly empty array by default
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Security: Clean up legacy un-isolated keys from localStorage on startup to prevent contamination
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
      localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEY_CATEGORY_MAPPINGS);
      localStorage.removeItem(STORAGE_KEY_AUTO_RULES);
      localStorage.removeItem(STORAGE_KEY_BUDGETS);
      localStorage.removeItem(STORAGE_KEY_SAVINGS_GOALS);
      localStorage.removeItem(`${STORAGE_KEY_SAVINGS_GOALS}_demo`);
    } catch (e) {
      console.warn('Error purging legacy un-isolated keys', e);
    }
  }, []);

  // Save to localStorage ONLY when currentUser is authenticated, strictly isolated by user ID
  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(`${STORAGE_KEY_ACCOUNTS}_${currentUser.id}`, JSON.stringify(accounts));
  }, [accounts, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(`${STORAGE_KEY_TRANSACTIONS}_${currentUser.id}`, JSON.stringify(transactions));
  }, [transactions, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(`${STORAGE_KEY_CATEGORY_MAPPINGS}_${currentUser.id}`, JSON.stringify(categoryMappings));
  }, [categoryMappings, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(`${STORAGE_KEY_AUTO_RULES}_${currentUser.id}`, JSON.stringify(autoRules));
  }, [autoRules, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(`${STORAGE_KEY_BUDGETS}_${currentUser.id}`, JSON.stringify(budgets));
  }, [budgets, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_SAVINGS_GOALS}_${currentUser.id}`, JSON.stringify(savingsGoals));
    } catch {}
  }, [savingsGoals, currentUser?.id]);

  // Auto-sync with Supabase Cloud whenever state changes for logged in user (only when cloud data has finished loading)
  useEffect(() => {
    if (currentUser?.id && !isCloudLoading) {
      syncLocalDataToCloud(currentUser.id, {
        accounts,
        categoryMappings,
        autoRules,
        budgets,
        transactions,
        savingsGoals
      });
    }
  }, [currentUser?.id, isCloudLoading, accounts, categoryMappings, autoRules, budgets, transactions, savingsGoals]);

  // Active view tab & Mobile Sidebar drawer state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'budgets' | 'accounts'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramProfile, setTelegramProfile] = useState<TelegramProfile | null>(null);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<ComputedTransaction | null>(null);

  // Load cloud data from Supabase if user is logged in
  const loadCloudData = async (userId: string) => {
    setIsCloudLoading(true);
    try {
      // 1. Immediately hydrate from user-isolated local cache if available (prevents empty flash)
      const userCachedAccounts = localStorage.getItem(`${STORAGE_KEY_ACCOUNTS}_${userId}`);
      const userCachedTx = localStorage.getItem(`${STORAGE_KEY_TRANSACTIONS}_${userId}`);
      const userCachedCategories = localStorage.getItem(`${STORAGE_KEY_CATEGORY_MAPPINGS}_${userId}`);
      const userCachedRules = localStorage.getItem(`${STORAGE_KEY_AUTO_RULES}_${userId}`);
      const userCachedBudgets = localStorage.getItem(`${STORAGE_KEY_BUDGETS}_${userId}`);
      const userCachedGoals = localStorage.getItem(`${STORAGE_KEY_SAVINGS_GOALS}_${userId}`);

      if (userCachedAccounts) {
        try { setAccounts(JSON.parse(userCachedAccounts)); } catch {}
      }
      if (userCachedTx) {
        try { setTransactions(JSON.parse(userCachedTx)); } catch {}
      }
      if (userCachedCategories) {
        try { setCategoryMappings(JSON.parse(userCachedCategories)); } catch {}
      }
      if (userCachedRules) {
        try { setAutoRules(JSON.parse(userCachedRules)); } catch {}
      }
      if (userCachedBudgets) {
        try { setBudgets(JSON.parse(userCachedBudgets)); } catch {}
      }
      if (userCachedGoals) {
        try {
          const parsed = JSON.parse(userCachedGoals);
          const cleaned = Array.isArray(parsed)
            ? parsed.filter((g: any) => g.id !== 'goal-1' && g.id !== 'goal-2' && g.id !== 'goal-3')
            : [];
          setSavingsGoals(cleaned);
        } catch {}
      }

      // 2. Fetch fresh data from Supabase Cloud
      const data = await fetchUserData(userId);
      const cloudSyncedKey = `finanzapp_cloud_synced_${userId}`;
      const isCloudSynced = localStorage.getItem(cloudSyncedKey);

      // Hydrate savings goals strictly from Supabase
      const cloudGoals = data.savingsGoals || [];
      setSavingsGoals(cloudGoals);
      localStorage.setItem(`${STORAGE_KEY_SAVINGS_GOALS}_${userId}`, JSON.stringify(cloudGoals));

      if (isCloudSynced || data.accounts.length > 0 || data.transactions.length > 0) {
        setAccounts(data.accounts);
        setCategoryMappings(data.categoryMappings.length > 0 ? data.categoryMappings : DEFAULT_CATEGORY_MAPPINGS);
        setAutoRules(data.autoRules.length > 0 ? data.autoRules : DEFAULT_AUTO_RULES);
        setBudgets(data.budgets);
        setTransactions(data.transactions);
        localStorage.setItem(cloudSyncedKey, 'true');
        // Persist strictly to user-isolated keys
        localStorage.setItem(`${STORAGE_KEY_ACCOUNTS}_${userId}`, JSON.stringify(data.accounts));
        localStorage.setItem(`${STORAGE_KEY_TRANSACTIONS}_${userId}`, JSON.stringify(data.transactions));
      } else {
        // First time ever logged in for this brand new user: initialize clean account & empty transactions
        const initialUserAccounts = INITIAL_ACCOUNTS;
        const initialUserCategories = DEFAULT_CATEGORY_MAPPINGS;
        const initialUserRules = DEFAULT_AUTO_RULES;
        const initialUserBudgets = [
          { id: 'b-1', categoryName: 'Alimentación y Gastronomía', monthlyLimit: 350000 },
          { id: 'b-2', categoryName: 'Transporte y Movilidad', monthlyLimit: 120000 },
          { id: 'b-3', categoryName: 'Compras y Estilo de Vida', monthlyLimit: 200000 }
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
        localStorage.setItem(`${STORAGE_KEY_ACCOUNTS}_${userId}`, JSON.stringify(initialUserAccounts));
        localStorage.setItem(`${STORAGE_KEY_TRANSACTIONS}_${userId}`, JSON.stringify(initialUserTransactions));
      }

      // Also load Telegram Profile
      getTelegramProfile(userId).then((prof) => setTelegramProfile(prof)).catch(() => {});
    } catch (err) {
      console.error('Error al cargar/sincronizar datos desde Supabase:', err);
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Realtime subscription for incoming Telegram transactions & profile link updates
  useEffect(() => {
    if (!currentUser?.id) return;

    // Listen to new transactions inserted via Telegram Webhook
    const txChannel = supabase
      .channel(`realtime-tx-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newDbTx: any = payload.new;
          if (!newDbTx) return;

          setTransactions((prev) => {
            if (prev.some((t) => t.id === newDbTx.id)) return prev;

            let parsedAllocations: any[] = [];
            if (newDbTx.allocations) {
              if (Array.isArray(newDbTx.allocations)) {
                parsedAllocations = newDbTx.allocations;
              } else if (typeof newDbTx.allocations === 'string') {
                try {
                  parsedAllocations = JSON.parse(newDbTx.allocations);
                } catch {
                  parsedAllocations = [];
                }
              }
            }

            const mappedTx: Transaction = {
              id: newDbTx.id,
              accountId: newDbTx.account_id,
              date: newDbTx.date,
              period: newDbTx.period || newDbTx.date.substring(0, 7),
              description: newDbTx.description,
              rawDescription: newDbTx.raw_description || newDbTx.description,
              amount: parseFloat(newDbTx.amount),
              originalTotalAmount: newDbTx.original_total_amount ? parseFloat(newDbTx.original_total_amount) : undefined,
              transactionType: newDbTx.transaction_type,
              category: newDbTx.category,
              subcategory: newDbTx.subcategory,
              installments: newDbTx.installment_current && newDbTx.installment_total ? {
                current: newDbTx.installment_current,
                total: newDbTx.installment_total
              } : undefined,
              allocations: parsedAllocations
            };
            return [mappedTx, ...prev];
          });
        }
      )
      .subscribe();

    // Listen to telegram profile handshake updates
    const profileChannel = supabase
      .channel(`realtime-telegram-profile-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telegram_profiles',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newProf: any = payload.new;
          if (newProf) {
            setTelegramProfile(newProf);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [currentUser?.id]);

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
      } else {
        // User logged out or session expired: reset state immediately to clean demo data
        setAccounts(INITIAL_ACCOUNTS);
        setTransactions(INITIAL_TRANSACTIONS);
        setCategoryMappings(DEFAULT_CATEGORY_MAPPINGS);
        setAutoRules(DEFAULT_AUTO_RULES);
        setBudgets([
          { id: 'b-1', categoryName: 'Alimentación y Gastronomía', monthlyLimit: 350000 },
          { id: 'b-2', categoryName: 'Transporte y Movilidad', monthlyLimit: 120000 },
          { id: 'b-3', categoryName: 'Compras y Estilo de Vida', monthlyLimit: 200000 }
        ]);
        setSavingsGoals([]);
        setTelegramProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const signingOutUserId = currentUser?.id;

    // 1. Immediately reset React state to clean demo data before any re-render or async operations
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategoryMappings(DEFAULT_CATEGORY_MAPPINGS);
    setAutoRules(DEFAULT_AUTO_RULES);
    setBudgets([
      { id: 'b-1', categoryName: 'Alimentación y Gastronomía', monthlyLimit: 350000 },
      { id: 'b-2', categoryName: 'Transporte y Movilidad', monthlyLimit: 120000 },
      { id: 'b-3', categoryName: 'Compras y Estilo de Vida', monthlyLimit: 200000 }
    ]);
    setSavingsGoals([]);
    setCurrentUser(null);
    setTelegramProfile(null);
    setViewMode('landing');

    // 2. Comprehensive cleanup of user-specific and generic cache keys from localStorage
    try {
      if (signingOutUserId) {
        localStorage.removeItem(`${STORAGE_KEY_ACCOUNTS}_${signingOutUserId}`);
        localStorage.removeItem(`${STORAGE_KEY_TRANSACTIONS}_${signingOutUserId}`);
        localStorage.removeItem(`${STORAGE_KEY_CATEGORY_MAPPINGS}_${signingOutUserId}`);
        localStorage.removeItem(`${STORAGE_KEY_AUTO_RULES}_${signingOutUserId}`);
        localStorage.removeItem(`${STORAGE_KEY_BUDGETS}_${signingOutUserId}`);
        localStorage.removeItem(`${STORAGE_KEY_SAVINGS_GOALS}_${signingOutUserId}`);
        localStorage.removeItem(`finanzapp_cloud_synced_${signingOutUserId}`);
      }

      // Purge generic legacy keys
      localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
      localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEY_CATEGORY_MAPPINGS);
      localStorage.removeItem(STORAGE_KEY_AUTO_RULES);
      localStorage.removeItem(STORAGE_KEY_BUDGETS);
      localStorage.removeItem(STORAGE_KEY_SAVINGS_GOALS);
      localStorage.removeItem(`${STORAGE_KEY_SAVINGS_GOALS}_demo`);

      // Collect and remove any localStorage keys containing finanzapp transactions or accounts
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('finanzapp_') || key.includes('transactions') || key.includes('accounts'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing localStorage on signOut', e);
    }

    // 3. Complete Supabase signOut
    await signOutUser();
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

      // Only Pending TC (Credit Card purchases with pending unpaid balance)
      if (filters.onlyPendingTC) {
        const acc = accounts.find((a) => a.id === tx.accountId);
        if (acc?.type !== 'credit_card') return false;
        if (isPaymentOrIncomeTransaction(tx) || tx.netAmount <= 0) return false;
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

  const handleAddAccount = async (newAcc: Account) => {
    if (currentUser) {
      await saveCloudAccount(currentUser.id, newAcc);
    }
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleUpdateAccount = async (updatedAcc: Account) => {
    const oldAcc = accounts.find((a) => a.id === updatedAcc.id);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));

    if (currentUser) {
      await saveCloudAccount(currentUser.id, updatedAcc);
    }

    // Si el día de corte cambió, recalcular los períodos de las transacciones de esta cuenta
    if (oldAcc?.closingDay !== updatedAcc.closingDay) {
      const changedTxs: { id: string; period: string }[] = [];
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.accountId === updatedAcc.id) {
            const newPeriod = calculateTransactionPeriod(tx.date, updatedAcc.closingDay);
            if (newPeriod !== tx.period) {
              changedTxs.push({ id: tx.id, period: newPeriod });
              return { ...tx, period: newPeriod };
            }
          }
          return tx;
        })
      );

      if (currentUser && changedTxs.length > 0) {
        await updateAccountTransactionsPeriod(currentUser.id, changedTxs);
      }
    }
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

  const handleEditCategory = async (categoryId: string, oldName: string, newName: string) => {
    let updatedCat: CategoryMapping | null = null;
    setCategoryMappings((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          updatedCat = { ...c, name: newName };
          return updatedCat;
        }
        return c;
      })
    );

    // Update transactions that had this category
    setTransactions((prev) =>
      prev.map((t) => (t.category === oldName ? { ...t, category: newName } : t))
    );

    // Update autoRules and budgets
    setAutoRules((prev) =>
      prev.map((r) => (r.category === oldName ? { ...r, category: newName } : r))
    );
    setBudgets((prev) =>
      prev.map((b) => (b.categoryName === oldName ? { ...b, categoryName: newName } : b))
    );

    if (currentUser && updatedCat) {
      await saveCloudCategory(currentUser.id, updatedCat);
    }
  };

  const handleEditSubcategory = async (parentCategoryName: string, oldSubName: string, newSubName: string) => {
    let updatedCat: CategoryMapping | null = null;
    setCategoryMappings((prev) =>
      prev.map((c) => {
        if (c.name === parentCategoryName) {
          updatedCat = {
            ...c,
            subcategories: c.subcategories.map((s) => (s === oldSubName ? newSubName : s))
          };
          return updatedCat;
        }
        return c;
      })
    );

    // Update transactions that had this subcategory
    setTransactions((prev) =>
      prev.map((t) =>
        t.category === parentCategoryName && t.subcategory === oldSubName
          ? { ...t, subcategory: newSubName }
          : t
      )
    );

    if (currentUser && updatedCat) {
      await saveCloudCategory(currentUser.id, updatedCat);
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
        const matched = applyAutoRulesToTransaction(tx, categoryMappings, autoRules);
        if (matched) {
          return {
            ...tx,
            category: matched.category,
            subcategory: matched.subcategory,
            transactionType: matched.transactionType
          };
        }
        // If no rule matches, preserve the transaction's existing category and subcategory
        return tx;
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

  // Savings Goals Handlers
  const handleAddSavingsGoal = async (newGoal: Omit<SavingsGoal, 'id'>) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`
    };
    setSavingsGoals((prev) => [goal, ...prev]);
    if (currentUser) {
      await saveSavingsGoalToCloud(currentUser.id, goal);
    }
  };

  const handleUpdateSavingsGoal = async (updatedGoal: SavingsGoal) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    if (currentUser) {
      await saveSavingsGoalToCloud(currentUser.id, updatedGoal);
    }
  };

  const handleDeleteSavingsGoal = async (goalId: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (currentUser) {
      await deleteSavingsGoalFromCloud(currentUser.id, goalId);
    }
  };

  const handleContributeToGoal = async (goalId: string, amount: number) => {
    let goalToSave: SavingsGoal | null = null;
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = { ...g, currentAmount: g.currentAmount + amount };
          goalToSave = updated;
          return updated;
        }
        return g;
      })
    );
    if (currentUser && goalToSave) {
      await saveSavingsGoalToCloud(currentUser.id, goalToSave);
    }
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
      const isPaymentOrIncome = isPaymentOrIncomeTransaction(tx);
      const effectiveNetAmount = isPaymentOrIncome ? 0 : tx.netAmount;
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
        'Monto Real Utilizado': effectiveNetAmount,
        'Estado Pago': isPaymentOrIncome
          ? 'Abono / Ingreso'
          : tx.isFullyPaid
          ? 'Pagado Total'
          : tx.totalAllocated > 0
          ? 'Pagado Parcial'
          : 'Pendiente'
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        isTelegramLinked={Boolean(telegramProfile?.telegram_chat_id)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAccountModal={() => setActiveTab('accounts')}
        onOpenCategoryModal={() => setActiveTab('categories')}
        onOpenBudgetModal={() => setActiveTab('budgets')}
        onOpenTelegramModal={() => (currentUser ? setIsTelegramModalOpen(true) : setIsAuthModalOpen(true))}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onAutoAllocate={handleAutoAllocate}
        onResetDemo={handleResetDemo}
        onExport={handleExportExcel}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Demo Mode Notice Banner */}
        {!currentUser && viewMode === 'app' && (
          <aside
            aria-label="Aviso de Modo Demostración"
            className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white text-xs sm:text-sm font-medium px-4 py-2 shadow-md flex items-center justify-between gap-3 relative z-40 border-b border-amber-600/40"
          >
            <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <span className="text-base select-none">ℹ️</span>
                <span className="leading-snug">
                  <strong className="font-bold">Modo Demostración:</strong> Estás explorando datos simulados. Para guardar tus propios movimientos, inicia sesión con Google.
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1 rounded-lg text-xs shadow-sm transition transform hover:scale-105"
                >
                  Iniciar Sesión con Google
                </button>
                <button
                  onClick={() => setViewMode('landing')}
                  className="text-amber-100 hover:text-white underline text-xs transition"
                >
                  Volver a la Portada
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Minimalist TopBar */}
        <TopBar
          accounts={accounts}
          activeAccountId={filters.accountId}
          onSelectAccount={(id) => setFilters((prev) => ({ ...prev, accountId: id }))}
          selectedMonth={filters.month}
          availableMonths={availableMonths}
          onSelectMonth={(m) => setFilters((prev) => ({ ...prev, month: m }))}
          currentUser={currentUser}
          isCloudLoading={isCloudLoading}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable Main Workspace */}
        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
          <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 flex-1">
            
            {/* 1 & 2. Metric Cards & Filters (Only in Dashboard & Transactions) */}
            {activeTab !== 'categories' && activeTab !== 'budgets' && activeTab !== 'accounts' && (
              <>
                <MetricCards
                  computedTransactions={filteredTransactions}
                  accounts={accounts}
                  activeAccountId={filters.accountId}
                />

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
              </>
            )}

            {/* 3. Active Tab Content (Dashboard, Transactions, Categories, Budgets, or Accounts) */}
            {activeTab === 'dashboard' ? (
              <ChartsDashboard
                computedTransactions={filteredTransactions}
                accounts={accounts}
                budgets={budgets}
                onOpenBudgetModal={() => setActiveTab('budgets')}
              />
            ) : activeTab === 'transactions' ? (
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
            ) : activeTab === 'categories' ? (
              <CategoryManagementView
                categoryMappings={categoryMappings}
                onAddCategory={handleAddCategory}
                onAddSubcategory={handleAddSubcategory}
                onDeleteCategory={handleDeleteCategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onEditCategory={handleEditCategory}
                onEditSubcategory={handleEditSubcategory}
              />
            ) : activeTab === 'budgets' ? (
              <BudgetAndGoalsView
                budgets={budgets}
                computedTransactions={filteredTransactions}
                selectedMonth={filters.month}
                categoryMappings={categoryMappings}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
                savingsGoals={savingsGoals}
                onAddSavingsGoal={handleAddSavingsGoal}
                onUpdateSavingsGoal={handleUpdateSavingsGoal}
                onDeleteSavingsGoal={handleDeleteSavingsGoal}
                onContributeToGoal={handleContributeToGoal}
              />
            ) : (
              <AccountsManagementView
                accounts={accounts}
                transactions={transactions}
                onAddAccount={handleAddAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

          </main>

          {/* Footer */}
          <footer className="w-full text-center text-xs text-slate-500 py-6 border-t border-slate-800">
            <p>© 2026 FinanzApp - Control Inteligente de Cartolas Bancarias y Tarjetas de Crédito</p>
          </footer>
        </div>
      </div>

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

      {/* Telegram Integration Modal */}
      {isTelegramModalOpen && (
        <TelegramModal
          currentUser={currentUser}
          accounts={accounts}
          onClose={() => setIsTelegramModalOpen(false)}
          onProfileUpdated={(prof) => setTelegramProfile(prof)}
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
    </div>
  );
}

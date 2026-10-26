import { supabase } from '../utils/supabaseClient';
import { Account, Transaction, CategoryMapping, AutoCategoryRule, CategoryBudget, PaymentAllocation, TelegramProfile, SavingsGoal, Credit, DashboardConfig } from '../types';

// ==========================================
// 1. AUTHENTICATION SERVICES
// ==========================================

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ==========================================
// 2. DATABASE CLOUD SYNC SERVICES
// ==========================================

export async function fetchUserData(userId: string) {
  try {
    // 1. Fetch Accounts
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    // 2. Fetch Category Mappings
    const { data: categoriesData } = await supabase
      .from('category_mappings')
      .select('*')
      .eq('user_id', userId);

    // 3. Fetch Auto Rules
    const { data: rulesData } = await supabase
      .from('auto_rules')
      .select('*')
      .eq('user_id', userId);

    // 4. Fetch Budgets
    const { data: budgetsData } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('user_id', userId);

    // 5. Fetch Transactions
    const { data: txsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // 6. Fetch Savings Goals
    const { data: goalsData } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 7. Fetch Credits
    const { data: creditsData } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Format DB transactions to local types
    const accounts: Account[] = (accountsData || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      bank: a.bank,
      currency: a.currency || 'CLP',
      creditLimit: a.credit_limit !== null && a.credit_limit !== undefined ? Number(a.credit_limit) : undefined,
      initialBalance: a.initial_balance !== null && a.initial_balance !== undefined ? Number(a.initial_balance) : undefined,
      accountNumber: a.account_number || undefined,
      color: a.color,
      closingDay: a.closing_day ? parseInt(a.closing_day, 10) : undefined,
      dueDay: a.due_day ? parseInt(a.due_day, 10) : undefined
    }));

    const categoryMappings: CategoryMapping[] = (categoriesData || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      subcategories: c.subcategories || []
    }));

    const autoRules: AutoCategoryRule[] = (rulesData || []).map((r: any) => ({
      id: r.id,
      pattern: r.pattern,
      category: r.category,
      subcategory: r.subcategory,
      transactionType: r.transaction_type || r.transactionType || undefined
    }));

    const budgets: CategoryBudget[] = (budgetsData || []).map((b: any) => {
      const rawName = b.category_name || '';
      let name = rawName;
      let categoryName = rawName;
      let categories: string[] = Array.isArray(b.categories) ? b.categories : [];
      let subcategories: string[] = Array.isArray(b.subcategories) ? b.subcategories : [];

      // Fallback para registros legacy que tenían un objeto JSON en category_name
      if (typeof rawName === 'string' && rawName.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawName);
          name = parsed.name || parsed.categoryName || rawName;
          categoryName = name;
          if (categories.length === 0 && Array.isArray(parsed.categories)) categories = parsed.categories;
          if (subcategories.length === 0 && Array.isArray(parsed.subcategories)) subcategories = parsed.subcategories;
        } catch {
          // ignore
        }
      }

      // Si ambos arreglos vienen vacíos en un registro antiguo, usa [rawName] como fallback
      if (categories.length === 0 && subcategories.length === 0 && rawName) {
        categories = [rawName];
      }

      return {
        id: b.id,
        name,
        categoryName,
        monthlyLimit: parseFloat(b.monthly_limit),
        categories,
        subcategories
      };
    });

    const transactions: Transaction[] = (txsData || []).map((t: any) => {
      let parsedAllocations: PaymentAllocation[] = [];
      if (t.allocations) {
        if (Array.isArray(t.allocations)) {
          parsedAllocations = t.allocations;
        } else if (typeof t.allocations === 'string') {
          try {
            parsedAllocations = JSON.parse(t.allocations);
          } catch {
            parsedAllocations = [];
          }
        }
      }

      return {
        id: t.id,
        accountId: t.account_id,
        date: t.date,
        period: t.period,
        description: t.description,
        rawDescription: t.raw_description || t.description,
        amount: parseFloat(t.amount),
        originalTotalAmount: t.original_total_amount ? parseFloat(t.original_total_amount) : undefined,
        transactionType: t.transaction_type,
        category: t.category,
        subcategory: t.subcategory,
        installments: (t.installment_current && t.installment_total) ? {
          current: t.installment_current,
          total: t.installment_total
        } : undefined,
        allocations: parsedAllocations,
        notes: t.notes || undefined,
        isPotentialDuplicate: t.is_potential_duplicate ? Boolean(t.is_potential_duplicate) : undefined,
        duplicateOfDescription: t.duplicate_of_description || undefined,
        duplicateOfId: t.duplicate_of_id || undefined
      };
    });

    const savingsGoals: SavingsGoal[] = (goalsData || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: parseFloat(g.target_amount) || 0,
      currentAmount: parseFloat(g.current_amount) || 0,
      targetDate: g.target_date || undefined,
      categoryIcon: g.category_icon || '🎯'
    }));

    const credits: Credit[] = (creditsData || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      bank: c.bank,
      totalAmount: parseFloat(c.total_amount) || 0,
      totalInstallments: parseInt(c.total_installments, 10) || 0,
      paidInstallments: parseInt(c.paid_installments, 10) || 0,
      installmentAmount: parseFloat(c.installment_amount) || 0,
      isShared: Boolean(c.is_shared),
      mySharePercentage: c.my_share_percentage ? parseFloat(c.my_share_percentage) : undefined,
      myShareAmount: parseFloat(c.my_share_amount) || 0,
      paymentDay: c.payment_day ? parseInt(c.payment_day, 10) : undefined,
      startDate: c.start_date || undefined,
      lastPaidPeriod: c.last_paid_period || undefined,
      accountId: c.account_id || undefined
    }));

    return {
      accounts,
      categoryMappings,
      autoRules,
      budgets,
      transactions,
      savingsGoals,
      credits
    };
  } catch (error) {
    console.error('Error fetching cloud data:', error);
    throw error;
  }
}

// Sync local data to Supabase when user logs in or adds new items
export async function syncLocalDataToCloud(
  userId: string,
  localState: {
    accounts: Account[];
    categoryMappings: CategoryMapping[];
    autoRules: AutoCategoryRule[];
    budgets: CategoryBudget[];
    transactions: Transaction[];
    savingsGoals?: SavingsGoal[];
    credits?: Credit[];
  }
) {
  try {
    // 1. Upsert Accounts
    if (localState.accounts.length > 0) {
      const accountsPayload = localState.accounts.map((a) => ({
        id: a.id,
        user_id: userId,
        name: a.name,
        type: a.type,
        bank: a.bank,
        currency: a.currency || 'CLP',
        credit_limit: a.type === 'credit_card' ? (a.creditLimit ?? null) : null,
        initial_balance: a.type !== 'credit_card' ? (a.initialBalance ?? null) : null,
        account_number: a.accountNumber ?? null,
        closing_day: a.closingDay || null,
        due_day: a.dueDay || null
      }));
      const { error: accErr } = await supabase.from('accounts').upsert(accountsPayload, { onConflict: 'id' });
      if (accErr) {
        console.warn('Initial upsert for accounts failed, retrying with fallback columns:', accErr);
        const fallbackPayload = localState.accounts.map((a) => ({
          id: a.id,
          user_id: userId,
          name: a.name,
          type: a.type,
          bank: a.bank,
          currency: a.currency || 'CLP',
          credit_limit: a.type === 'credit_card' ? (a.creditLimit ?? null) : (a.initialBalance ?? null),
          closing_day: a.closingDay || null,
          due_day: a.dueDay || null
        }));
        const { error: fallbackErr } = await supabase.from('accounts').upsert(fallbackPayload, { onConflict: 'id' });
        if (fallbackErr) console.error('Error syncing accounts to cloud (fallback):', fallbackErr);
      }
    }

    // 2. Upsert Categories
    if (localState.categoryMappings.length > 0) {
      const categoriesPayload = localState.categoryMappings.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        subcategories: c.subcategories
      }));
      const { error: catErr } = await supabase.from('category_mappings').upsert(categoriesPayload, { onConflict: 'id' });
      if (catErr) console.error('Error syncing categories to cloud:', catErr);
    }

    // 3. Upsert Auto Rules (with transaction_type and graceful fallback)
    if (localState.autoRules.length > 0) {
      const rulesPayload = localState.autoRules.map((r) => ({
        id: r.id,
        user_id: userId,
        pattern: r.pattern,
        category: r.category,
        subcategory: r.subcategory,
        transaction_type: r.transactionType || null
      }));
      const { error: ruleErr } = await supabase.from('auto_rules').upsert(rulesPayload, { onConflict: 'id' });
      if (ruleErr) {
        // Fallback without transaction_type if column is not yet provisioned in Supabase
        const fallbackPayload = localState.autoRules.map((r) => ({
          id: r.id,
          user_id: userId,
          pattern: r.pattern,
          category: r.category,
          subcategory: r.subcategory
        }));
        const { error: fallbackErr } = await supabase.from('auto_rules').upsert(fallbackPayload, { onConflict: 'id' });
        if (fallbackErr) console.error('Error syncing auto_rules to cloud:', fallbackErr);
      }
    }

    // 4. Upsert Budgets
    if (localState.budgets.length > 0) {
      const budgetsPayload = localState.budgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_name: b.name || b.categoryName,
        monthly_limit: b.monthlyLimit,
        categories: b.categories || [],
        subcategories: b.subcategories || []
      }));
      const { error: bdgErr } = await supabase.from('category_budgets').upsert(budgetsPayload, { onConflict: 'id' });
      if (bdgErr) console.error('Error syncing budgets to cloud:', bdgErr);
    }

    // 5. Upsert Transactions
    if (localState.transactions.length > 0) {
      const txsPayload = localState.transactions.map((t) => ({
        id: t.id,
        user_id: userId,
        account_id: t.accountId,
        date: t.date,
        period: t.period,
        description: t.description,
        raw_description: t.rawDescription,
        amount: t.amount,
        original_total_amount: t.originalTotalAmount,
        transaction_type: t.transactionType,
        category: t.category,
        subcategory: t.subcategory,
        installment_current: t.installments?.current,
        installment_total: t.installments?.total,
        allocations: t.allocations || [],
        notes: t.notes || null,
        is_potential_duplicate: t.isPotentialDuplicate || false,
        duplicate_of_description: t.duplicateOfDescription || null,
        duplicate_of_id: t.duplicateOfId || null
      }));
      const { error: txErr } = await supabase.from('transactions').upsert(txsPayload, { onConflict: 'id' });
      if (txErr) {
        console.error('Error syncing transactions with allocations to cloud:', txErr);
        // Fallback without allocations if column is missing in Supabase schema
        const fallbackPayload = txsPayload.map(({ allocations, ...rest }) => rest);
        const { error: fallbackErr } = await supabase.from('transactions').upsert(fallbackPayload, { onConflict: 'id' });
        if (fallbackErr) console.error('Fallback transaction sync error:', fallbackErr);
      }
    }

    // 6. Upsert Savings Goals
    if (localState.savingsGoals && localState.savingsGoals.length > 0) {
      const goalsPayload = localState.savingsGoals.map((g) => ({
        id: g.id,
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate || null,
        category_icon: g.categoryIcon || '🎯'
      }));
      const { error: goalErr } = await supabase.from('savings_goals').upsert(goalsPayload, { onConflict: 'id' });
      if (goalErr) console.error('Error syncing savings goals to cloud:', goalErr);
    }

    // 7. Upsert Credits
    if (localState.credits && localState.credits.length > 0) {
      const creditsPayload = localState.credits.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        type: c.type,
        bank: c.bank,
        total_amount: c.totalAmount,
        total_installments: c.totalInstallments,
        paid_installments: c.paidInstallments,
        installment_amount: c.installmentAmount,
        is_shared: c.isShared || false,
        my_share_percentage: c.mySharePercentage || null,
        my_share_amount: c.myShareAmount,
        payment_day: c.paymentDay || null,
        start_date: c.startDate || null,
        last_paid_period: c.lastPaidPeriod || null,
        account_id: c.accountId || null
      }));
      const { error: credErr } = await supabase.from('credits').upsert(creditsPayload, { onConflict: 'id' });
      if (credErr) console.error('Error syncing credits to cloud:', credErr);
    }

    return true;
  } catch (err) {
    console.error('Error syncing local data to Supabase cloud:', err);
    return false;
  }
}

export async function saveCloudAccount(userId: string, account: Account) {
  try {
    const payload: any = {
      id: account.id,
      user_id: userId,
      name: account.name,
      type: account.type,
      bank: account.bank,
      currency: account.currency || 'CLP',
      credit_limit: account.type === 'credit_card' ? (account.creditLimit ?? null) : null,
      initial_balance: account.type !== 'credit_card' ? (account.initialBalance ?? null) : null,
      account_number: account.accountNumber ?? null,
      color: account.color,
      closing_day: account.closingDay || null,
      due_day: account.dueDay || null
    };
    const { error } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Initial saveCloudAccount failed, retrying fallback without extra columns:', error);
      delete payload.initial_balance;
      delete payload.account_number;
      const { error: fallbackError } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
      if (fallbackError) console.error('Error saving account to cloud (fallback):', fallbackError);
    }
  } catch (err) {
    console.error('Unexpected error saving account to cloud:', err);
  }
}

export async function updateAccountTransactionsPeriod(
  userId: string,
  updatedTxs: { id: string; period: string }[]
) {
  if (!updatedTxs || updatedTxs.length === 0) return;
  try {
    // Upsert or update period for these transactions
    for (const tx of updatedTxs) {
      await supabase
        .from('transactions')
        .update({ period: tx.period })
        .eq('id', tx.id)
        .eq('user_id', userId);
    }
  } catch (err) {
    console.error('Error updating transactions period in cloud:', err);
  }
}

export async function deleteCloudAccount(userId: string, accountId: string) {
  const { error: txErr } = await supabase.from('transactions').delete().eq('account_id', accountId).eq('user_id', userId);
  if (txErr) console.error('Error deleting account transactions from cloud:', txErr);

  const { error } = await supabase.from('accounts').delete().eq('id', accountId).eq('user_id', userId);
  if (error) console.error('Error deleting account from cloud:', error);
}

export async function saveCloudTransaction(userId: string, tx: Transaction) {
  try {
    const payload: any = {
      id: tx.id,
      user_id: userId,
      account_id: tx.accountId,
      date: tx.date,
      period: tx.period,
      description: tx.description,
      raw_description: tx.rawDescription || tx.description || null,
      amount: tx.amount,
      original_total_amount: tx.originalTotalAmount || null,
      transaction_type: tx.transactionType || null,
      category: tx.category || null,
      subcategory: tx.subcategory || null,
      installment_current: tx.installments?.current || null,
      installment_total: tx.installments?.total || null,
      allocations: tx.allocations || [],
      notes: tx.notes || null,
      is_potential_duplicate: tx.isPotentialDuplicate || false,
      duplicate_of_description: tx.duplicateOfDescription || null,
      duplicate_of_id: tx.duplicateOfId || null
    };
    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Initial saveCloudTransaction failed, retrying without allocations:', error);
      delete payload.allocations;
      const { error: fallbackErr } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
      if (fallbackErr) console.error('Fallback saveCloudTransaction error:', fallbackErr);
    }
  } catch (err) {
    console.error('Unexpected error saving transaction to cloud:', err);
  }
}

export async function deleteCloudTransaction(userId: string, txId: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', txId).eq('user_id', userId);
  if (error) console.error('Error deleting transaction from cloud:', error);
}

export async function deleteCloudTransactionsBatch(userId: string, txIds: string[]) {
  if (!txIds || txIds.length === 0) return;
  const CHUNK_SIZE = 100;
  for (let i = 0; i < txIds.length; i += CHUNK_SIZE) {
    const chunk = txIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('transactions').delete().in('id', chunk).eq('user_id', userId);
    if (error) console.error('Error batch deleting transactions chunk from cloud:', error);
  }
}

export async function saveCloudCategory(userId: string, category: CategoryMapping) {
  try {
    const payload = {
      id: category.id,
      user_id: userId,
      name: category.name,
      subcategories: category.subcategories
    };
    const { error } = await supabase.from('category_mappings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error saving category to cloud:', error);
      const { error: fallbackErr } = await supabase.from('category_mappings').upsert(payload);
      if (fallbackErr) console.error('Fallback save category error:', fallbackErr);
    }
  } catch (err) {
    console.error('Unexpected error saving category to cloud:', err);
  }
}

export async function deleteCloudCategory(userId: string, categoryId: string) {
  const { error } = await supabase.from('category_mappings').delete().eq('id', categoryId).eq('user_id', userId);
  if (error) console.error('Error deleting category from cloud:', error);
}

export async function saveCloudRule(userId: string, rule: AutoCategoryRule) {
  try {
    const payload: any = {
      id: rule.id,
      user_id: userId,
      pattern: rule.pattern,
      category: rule.category,
      subcategory: rule.subcategory,
      transaction_type: rule.transactionType || null
    };
    const { error } = await supabase.from('auto_rules').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Initial saveCloudRule failed, retrying without transaction_type:', error);
      delete payload.transaction_type;
      const { error: fallbackErr } = await supabase.from('auto_rules').upsert(payload, { onConflict: 'id' });
      if (fallbackErr) console.error('Fallback save auto_rule error:', fallbackErr);
    }
  } catch (err) {
    console.error('Unexpected error saving rule to cloud:', err);
  }
}

export async function deleteCloudRule(userId: string, ruleId: string) {
  const { error } = await supabase.from('auto_rules').delete().eq('id', ruleId).eq('user_id', userId);
  if (error) console.error('Error deleting auto_rule from cloud:', error);
}

export async function saveCloudBudget(userId: string, budget: CategoryBudget) {
  try {
    const payload = {
      id: budget.id,
      user_id: userId,
      category_name: budget.name || budget.categoryName,
      monthly_limit: budget.monthlyLimit,
      categories: budget.categories || [],
      subcategories: budget.subcategories || []
    };
    const { error } = await supabase.from('category_budgets').upsert(payload, { onConflict: 'id' });
    if (error) console.error('Error saving budget to cloud:', error);
  } catch (err) {
    console.error('Unexpected error saving budget to cloud:', err);
  }
}

export async function deleteCloudBudget(userId: string, budgetId: string) {
  const { error } = await supabase.from('category_budgets').delete().eq('id', budgetId).eq('user_id', userId);
  if (error) console.error('Error deleting budget from cloud:', error);
}

// ==========================================
// 2.1 SAVINGS GOALS SERVICES (METAS DE AHORRO)
// ==========================================

export async function fetchSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings goals from cloud:', error);
      return [];
    }

    return (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: parseFloat(g.target_amount) || 0,
      currentAmount: parseFloat(g.current_amount) || 0,
      targetDate: g.target_date || undefined,
      categoryIcon: g.category_icon || '🎯'
    }));
  } catch (err) {
    console.error('Unexpected error fetching savings goals:', err);
    return [];
  }
}

export async function saveSavingsGoalsToCloud(userId: string, goals: SavingsGoal[]): Promise<void> {
  if (!goals || goals.length === 0) return;
  try {
    const payload = goals.map((g) => ({
      id: g.id,
      user_id: userId,
      name: g.name,
      target_amount: g.targetAmount,
      current_amount: g.currentAmount,
      target_date: g.targetDate || null,
      category_icon: g.categoryIcon || '🎯'
    }));

    const { error } = await supabase
      .from('savings_goals')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving savings goals to cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error saving savings goals to cloud:', err);
  }
}

export async function saveSavingsGoalToCloud(userId: string, goal: SavingsGoal): Promise<void> {
  try {
    const payload = {
      id: goal.id,
      user_id: userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      target_date: goal.targetDate || null,
      category_icon: goal.categoryIcon || '🎯'
    };

    const { error } = await supabase
      .from('savings_goals')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving single savings goal to cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error saving single savings goal to cloud:', err);
  }
}

export async function deleteSavingsGoalFromCloud(userId: string, goalId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting savings goal from cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error deleting savings goal from cloud:', err);
  }
}

// ==========================================
// 2.2 CREDITS SERVICES (CRÉDITOS Y PRÉSTAMOS)
// ==========================================

export async function fetchCredits(userId: string): Promise<Credit[]> {
  try {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credits from cloud:', error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      bank: c.bank,
      totalAmount: parseFloat(c.total_amount) || 0,
      totalInstallments: parseInt(c.total_installments, 10) || 0,
      paidInstallments: parseInt(c.paid_installments, 10) || 0,
      installmentAmount: parseFloat(c.installment_amount) || 0,
      isShared: Boolean(c.is_shared),
      mySharePercentage: c.my_share_percentage ? parseFloat(c.my_share_percentage) : undefined,
      myShareAmount: parseFloat(c.my_share_amount) || 0,
      paymentDay: c.payment_day ? parseInt(c.payment_day, 10) : undefined,
      startDate: c.start_date || undefined,
      lastPaidPeriod: c.last_paid_period || undefined,
      accountId: c.account_id || undefined
    }));
  } catch (err) {
    console.error('Unexpected error fetching credits:', err);
    return [];
  }
}

export async function saveCreditsToCloud(userId: string, credits: Credit[]): Promise<void> {
  if (!credits || credits.length === 0) return;
  try {
    const payload = credits.map((c) => ({
      id: c.id,
      user_id: userId,
      name: c.name,
      type: c.type,
      bank: c.bank,
      total_amount: c.totalAmount,
      total_installments: c.totalInstallments,
      paid_installments: c.paidInstallments,
      installment_amount: c.installmentAmount,
      is_shared: c.isShared || false,
      my_share_percentage: c.mySharePercentage || null,
      my_share_amount: c.myShareAmount,
      payment_day: c.paymentDay || null,
      start_date: c.startDate || null,
      last_paid_period: c.lastPaidPeriod || null,
      account_id: c.accountId || null
    }));

    const { error } = await supabase
      .from('credits')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving credits to cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error saving credits to cloud:', err);
  }
}

export async function saveCreditToCloud(userId: string, credit: Credit): Promise<void> {
  try {
    const payload = {
      id: credit.id,
      user_id: userId,
      name: credit.name,
      type: credit.type,
      bank: credit.bank,
      total_amount: credit.totalAmount,
      total_installments: credit.totalInstallments,
      paid_installments: credit.paidInstallments,
      installment_amount: credit.installmentAmount,
      is_shared: credit.isShared || false,
      my_share_percentage: credit.mySharePercentage || null,
      my_share_amount: credit.myShareAmount,
      payment_day: credit.paymentDay || null,
      start_date: credit.startDate || null,
      last_paid_period: credit.lastPaidPeriod || null,
      account_id: credit.accountId || null
    };

    const { error } = await supabase
      .from('credits')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving single credit to cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error saving single credit to cloud:', err);
  }
}

export async function deleteCreditFromCloud(userId: string, creditId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('credits')
      .delete()
      .eq('id', creditId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting credit from cloud:', error);
    }
  } catch (err) {
    console.error('Unexpected error deleting credit from cloud:', err);
  }
}

// ==========================================
// 3. TELEGRAM INTEGRATION SERVICES
// ==========================================

export async function getTelegramProfile(userId: string): Promise<TelegramProfile | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching telegram profile:', error);
      return null;
    }
    return data as TelegramProfile | null;
  } catch (err) {
    console.error('Unexpected error fetching telegram profile:', err);
    return null;
  }
}

export async function generateTelegramLinkToken(userId: string): Promise<{ token: string; expiresAt: string }> {
  // Generate random 16-character alphanumeric token
  const token = (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)).toUpperCase();
  // 15 minutes expiration
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Check if profile exists for user
  const { data: existing, error: fetchErr } = await supabase
    .from('telegram_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    console.warn('Notice checking telegram profile:', fetchErr);
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('telegram_profiles')
      .update({
        link_token: token,
        token_expires_at: expiresAt,
      })
      .eq('user_id', userId);

    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabase
      .from('telegram_profiles')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        link_token: token,
        token_expires_at: expiresAt,
      });

    if (insertErr) throw insertErr;
  }

  return { token, expiresAt };
}

export async function unlinkTelegramProfile(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('telegram_profiles')
    .update({
      telegram_chat_id: null,
      first_name: null,
      username: null,
      link_token: null,
      token_expires_at: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error unlinking telegram profile:', error);
    throw error;
  }
  return true;
}

// ==========================================
// 4. ANDROID / WALLET WEBHOOK SERVICES
// ==========================================

export async function getOrCreateWebhookToken(userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('telegram_profiles')
      .select('id, webhook_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile?.webhook_token) {
      return profile.webhook_token;
    }

    const newToken = `fnz_${(Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10))}`;

    if (profile) {
      const { error } = await supabase
        .from('telegram_profiles')
        .update({ webhook_token: newToken })
        .eq('user_id', userId);
      if (error) console.error('Error updating webhook token:', error);
    } else {
      const { error } = await supabase
        .from('telegram_profiles')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          webhook_token: newToken
        });
      if (error) console.error('Error inserting profile with webhook token:', error);
    }

    return newToken;
  } catch (err) {
    console.error('Unexpected error getting/creating webhook token:', err);
    throw err;
  }
}

export async function regenerateWebhookToken(userId: string): Promise<string> {
  const newToken = `fnz_${(Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10))}`;
  try {
    const { data: profile } = await supabase
      .from('telegram_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      const { error } = await supabase
        .from('telegram_profiles')
        .update({ webhook_token: newToken })
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('telegram_profiles')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          webhook_token: newToken
        });
      if (error) throw error;
    }

    return newToken;
  } catch (err) {
    console.error('Unexpected error regenerating webhook token:', err);
    throw err;
  }
}

// ==========================================
// 4. USER SETTINGS & DASHBOARD CONFIG
// ==========================================

export async function fetchDashboardConfig(userId: string): Promise<DashboardConfig | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('dashboard_config')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Table might not exist yet if user hasn't run the SQL migration
      return null;
    }
    return data?.dashboard_config as DashboardConfig | null;
  } catch {
    return null;
  }
}

export async function saveDashboardConfigToCloud(userId: string, config: DashboardConfig): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        dashboard_config: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Notice saving dashboard config to cloud (user_settings):', error.message);
    }
  } catch (err) {
    console.warn('Notice saving dashboard config to cloud:', err);
  }
}




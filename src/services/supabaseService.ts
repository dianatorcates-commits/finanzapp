import { supabase } from '../utils/supabaseClient';
import { Account, Transaction, CategoryMapping, AutoCategoryRule, CategoryBudget } from '../types';

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

    // Format DB transactions to local types
    const accounts: Account[] = (accountsData || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      bank: a.bank,
      currency: a.currency || 'CLP',
      creditLimit: a.credit_limit,
      color: a.color
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
      subcategory: r.subcategory
    }));

    const budgets: CategoryBudget[] = (budgetsData || []).map((b: any) => ({
      id: b.id,
      categoryName: b.category_name,
      monthlyLimit: parseFloat(b.monthly_limit)
    }));

    const transactions: Transaction[] = (txsData || []).map((t: any) => ({
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
      allocations: []
    }));

    return {
      accounts,
      categoryMappings,
      autoRules,
      budgets,
      transactions
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
        credit_limit: a.creditLimit
      }));
      await supabase.from('accounts').upsert(accountsPayload, { onConflict: 'id' });
    }

    // 2. Upsert Categories
    if (localState.categoryMappings.length > 0) {
      const categoriesPayload = localState.categoryMappings.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        subcategories: c.subcategories
      }));
      await supabase.from('category_mappings').upsert(categoriesPayload, { onConflict: 'id' });
    }

    // 3. Upsert Auto Rules
    if (localState.autoRules.length > 0) {
      const rulesPayload = localState.autoRules.map((r) => ({
        id: r.id,
        user_id: userId,
        pattern: r.pattern,
        category: r.category,
        subcategory: r.subcategory
      }));
      await supabase.from('auto_rules').upsert(rulesPayload, { onConflict: 'id' });
    }

    // 4. Upsert Budgets
    if (localState.budgets.length > 0) {
      const budgetsPayload = localState.budgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_name: b.categoryName,
        monthly_limit: b.monthlyLimit
      }));
      await supabase.from('category_budgets').upsert(budgetsPayload, { onConflict: 'id' });
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
        installment_total: t.installments?.total
      }));
      await supabase.from('transactions').upsert(txsPayload, { onConflict: 'id' });
    }

    return true;
  } catch (err) {
    console.error('Error syncing local data to Supabase cloud:', err);
    return false;
  }
}

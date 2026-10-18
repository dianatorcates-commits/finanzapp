import { supabase } from '../utils/supabaseClient';
import { Account, Transaction, CategoryMapping, AutoCategoryRule, CategoryBudget, PaymentAllocation, TelegramProfile } from '../types';

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
      subcategory: r.subcategory
    }));

    const budgets: CategoryBudget[] = (budgetsData || []).map((b: any) => ({
      id: b.id,
      categoryName: b.category_name,
      monthlyLimit: parseFloat(b.monthly_limit)
    }));

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
        allocations: parsedAllocations
      };
    });

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
        credit_limit: a.creditLimit,
        closing_day: a.closingDay || null,
        due_day: a.dueDay || null
      }));
      const { error: accErr } = await supabase.from('accounts').upsert(accountsPayload, { onConflict: 'id' });
      if (accErr) console.error('Error syncing accounts to cloud:', accErr);
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

    // 3. Upsert Auto Rules
    if (localState.autoRules.length > 0) {
      const rulesPayload = localState.autoRules.map((r) => ({
        id: r.id,
        user_id: userId,
        pattern: r.pattern,
        category: r.category,
        subcategory: r.subcategory
      }));
      const { error: ruleErr } = await supabase.from('auto_rules').upsert(rulesPayload, { onConflict: 'id' });
      if (ruleErr) console.error('Error syncing auto_rules to cloud:', ruleErr);
    }

    // 4. Upsert Budgets
    if (localState.budgets.length > 0) {
      const budgetsPayload = localState.budgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_name: b.categoryName,
        monthly_limit: b.monthlyLimit
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
        allocations: t.allocations || []
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

    return true;
  } catch (err) {
    console.error('Error syncing local data to Supabase cloud:', err);
    return false;
  }
}

export async function saveCloudAccount(userId: string, account: Account) {
  try {
    const payload = {
      id: account.id,
      user_id: userId,
      name: account.name,
      type: account.type,
      bank: account.bank,
      currency: account.currency || 'CLP',
      credit_limit: account.creditLimit,
      color: account.color,
      closing_day: account.closingDay || null,
      due_day: account.dueDay || null
    };
    const { error } = await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
    if (error) console.error('Error saving account to cloud:', error);
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

export async function deleteCloudRule(userId: string, ruleId: string) {
  const { error } = await supabase.from('auto_rules').delete().eq('id', ruleId).eq('user_id', userId);
  if (error) console.error('Error deleting auto_rule from cloud:', error);
}

export async function deleteCloudBudget(userId: string, budgetId: string) {
  const { error } = await supabase.from('category_budgets').delete().eq('id', budgetId).eq('user_id', userId);
  if (error) console.error('Error deleting budget from cloud:', error);
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



import { createContext, useReducer, useEffect, useContext, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { showToast } from '../utils/toast';


export const CATEGORIES = {
  KADAI: ['Potato', 'Oil', 'Mixture', 'Stock', 'Ice Cream', 'Gas', 'Labor', 'Shop Rent', 'EB', 'Covers'],
  VEEDU: ['Food', 'Bike Fuel', 'House Rent', 'Electricity', 'Water', 'Others'],
  INCOME: ['Daily Sales', 'Other Income'],
  SPECIAL: ['Friday Poojai']
};

const TR = {
  en: {
    dashboard: "Dashboard", analytics: "Analytics", history: "History", settings: "Settings",
    dailySales: "Daily Sales / Income", expenseTitle: "Log Expense",
    financialHealth: "Financial Health", income: "Total Income", expenses: "Total Expenses",
    save: "Save", add: "Add", exportJson: "Backup Data (JSON)", restoreJson: "Restore Data (JSON)",
    generatePdf: "PDF Statement", language: "Language", categoryBudgets: "Category Limits",
    search: "Search...", deleteSelected: "Delete Selected",
    kadaiMode: "Shop Mode", veeduMode: "Home Mode", rentDue: "Rent Due Date", todaysProfit: "Today's Profit",
    noData: "No data available", profitLoss: "Net Profit / Loss",
    todayIsRentDay: "🔔 Today is Rent Day!", addNow: "Add Now", houseRentAmountStr: "House Rent Amount", shopRentAmountStr: "Shop Rent Amount", setRentDateStr: "Set Rent Date",

    Potato: "Potato", Oil: "Oil", Mixture: "Mixture", Stock: "Stock",
    Gas: "Gas", Labor: "Labor", "Shop Rent": "Shop Rent", EB: "EB", Covers: "Covers",
    Food: "Food", "Bike Fuel": "Bike Fuel", "House Rent": "House Rent", Electricity: "Electricity",
    Water: "Water", Others: "Others", "Daily Sales": "Daily Sales", "Other Income": "Other Income",
    "Friday Poojai": "Friday Poojai"
  },
  ta: {
    dashboard: "முகப்பு", analytics: "ரிப்போர்ட்", history: "வரலாறு", settings: "அமைப்புகள்",
    dailySales: "தினசரி விற்பனை", expenseTitle: "செலவு பதிவு",
    financialHealth: "நிதி நிலைமை", income: "வருமானம்", expenses: "மொத்த செலவுகள்",
    save: "சேமி", add: "சேர்", exportJson: "Backup Data (JSON)", restoreJson: "Restore Data (JSON)",
    generatePdf: "PDF அறிக்கை", language: "மொழி", categoryBudgets: "பட்ஜெட் லிமிட்",
    search: "தேடு...", deleteSelected: "நீக்கு",
    kadaiMode: "கடை", veeduMode: "வீடு", rentDue: "வாடகை தேதி", todaysProfit: "இன்றைய லாபம்",
    noData: "தரவு இல்லை", profitLoss: "நிகர லாபம் / நஷ்டம்",
    todayIsRentDay: "🔔 இன்று வாடகை நாள்!", addNow: "பதிவு செய்", houseRentAmountStr: "வீட்டு வாடகை", shopRentAmountStr: "கடை வாடகை", setRentDateStr: "செட் வாடகை தேதி",

    Potato: "உருளைக்கிழங்கு", Oil: "எண்ணெய்", Mixture: "மிக்ஸர் பொருட்கள்", Stock: "கடை சரக்கு",
    Gas: "கேஸ்", Labor: "கூலி", "Shop Rent": "கடை வாடகை", EB: "மின்சாரம்", Covers: "கவர்கள்",
    Food: "உணவு", "Bike Fuel": "பெட்ரோல்", "House Rent": "வீட்டு வாடகை", Electricity: "மின்சாரம்",
    Water: "குடிநீர்", Others: "இதர செலவுகள்", "Daily Sales": "தினசரி விற்பனை", "Other Income": "மற்ற வருமானம்",
    "Friday Poojai": "வெள்ளிக்கிழமை பூஜை", "Ice Cream": "ஐஸ்கிரீம்"
  }
};

const ExpenseContext = createContext();

// Synchronous Hydration Engine: Native and Instantaneous (No useEffect delay)
const savedMirror = JSON.parse(localStorage.getItem('expense_mirror') || 'null');

const DEFAULT_BILLS = [
  { id: 'bill_house_rent', name: 'House Rent', amount: 0, dueDay: 1, category: 'House Rent' },
  { id: 'bill_shop_rent', name: 'Shop Rent', amount: 0, dueDay: 1, category: 'Shop Rent' },
  { id: 'bill_water', name: 'Water Bill', amount: 0, dueDay: 5, category: 'Water' },
  { id: 'bill_eb', name: 'EB Bill', amount: 0, dueDay: 10, category: 'EB' },
];

const initialState = {
  transactions: savedMirror?.transactions || [],
  appMode: savedMirror?.appMode || 'kadai',
  rentDueDate: savedMirror?.rentDueDate || 1,
  houseRentAmount: savedMirror?.houseRentAmount || 0,
  shopRentAmount: savedMirror?.shopRentAmount || 0,
  categoryBudgets: savedMirror?.categoryBudgets ?? {},
  language: savedMirror?.language || 'ta',
  bills: savedMirror?.bills || DEFAULT_BILLS,
  savingsTarget: savedMirror?.savingsTarget || 0,
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_FULL_STATE': return { ...state, ...action.payload };
    case 'ADD_TRANSACTION': return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION': return {
      ...state,
      transactions: state.transactions.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t)
    };
    case 'DELETE_TRANSACTION': return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'BULK_DELETE': return { ...state, transactions: state.transactions.filter(t => !action.payload.includes(t.id)) };
    case 'SET_MODE': return { ...state, appMode: action.payload };
    case 'SET_RENT_DATE': return { ...state, rentDueDate: action.payload };
    case 'SET_HOUSE_RENT_AMOUNT': return { ...state, houseRentAmount: action.payload };
    case 'SET_SHOP_RENT_AMOUNT': return { ...state, shopRentAmount: action.payload };
    case 'SET_CATEGORY_BUDGET': return {
      ...state,
      categoryBudgets: { ...state.categoryBudgets, [action.payload.category]: action.payload.limit }
    };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'SET_BILLS': return { ...state, bills: action.payload };
    case 'SET_SAVINGS_TARGET': return { ...state, savingsTarget: action.payload };
    default: return state;
  }
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(amount);
}

export function ExpenseProvider({ children, propSession }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const [session, setSession] = useState(propSession || null);
  const [isAuthLoading, setIsAuthLoading] = useState(!propSession);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncComplete, setIsSyncComplete] = useState(false);
  const [dbSetupRequired, setDbSetupRequired] = useState(false);
  const [dbConnectionError, setDbConnectionError] = useState(false);

  // ── stateRef: always holds the latest state without being a dep ───────────
  // This lets useCallback functions read current state without stale closures,
  // and without adding `state` as a dependency (which would re-create on every dispatch).
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // 1. LocalSave Mechanism: Synchronously mirror any state mutation
  useEffect(() => {
    localStorage.setItem('expense_mirror', JSON.stringify(state));
  }, [state]);

  // 2. Auth Gatekeeper Core Logic
  useEffect(() => {
    if (propSession) {
      setSession(propSession);
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (isMounted) {
        if (!error && session) setSession(session);
        setIsAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (isMounted) setSession(activeSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [propSession]);

  const userId = session?.user?.id;

  // 3. Background Sync & Smart Deep-Merge
  useEffect(() => {
    if (!userId) return;

    const fetchCloudData = async () => {
      setIsSyncing(true);
      try {
        const [salesRes, expensesRes, settingsRes] = await Promise.all([
          supabase.from('sales').select('*').eq('user_id', userId),
          supabase.from('expenses').select('*').eq('user_id', userId),
          supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
        ]);

        if (salesRes.error || expensesRes.error || settingsRes.error) {
          setDbConnectionError(true);
          setIsSyncing(false);
          return;
        }

        let cloudTransactions = [];
        if (salesRes.data) cloudTransactions = [...cloudTransactions, ...salesRes.data.map(s => ({ ...s, type: 'income', category: s.category || 'Daily Sales', desc: s.description || '' }))];
        if (expensesRes.data) cloudTransactions = [...cloudTransactions, ...expensesRes.data.map(e => ({ ...e, type: 'expense', desc: e.description || '' }))];

        // ☁️ CLOUD IS THE ABSOLUTE SOURCE OF TRUTH
        const cloudIds = new Set(cloudTransactions.map(t => t.id));
        const finalTransactions = [...cloudTransactions];
        const unsyncedLocals = [];

        for (const lt of stateRef.current.transactions) {
          const isNewOfflineEntry = !cloudIds.has(lt.id) && !isNaN(Number(lt.id));
          if (isNewOfflineEntry) {
            unsyncedLocals.push(lt);
            finalTransactions.push(lt);
          }
        }

        if (unsyncedLocals.length > 0) {
          const newSales = unsyncedLocals
            .filter(t => t.type === 'income')
            .map(({ amount, date, desc }) => ({ user_id: userId, amount, date, description: desc || '' }));
          const newExpenses = unsyncedLocals
            .filter(t => t.type === 'expense')
            .map(({ amount, category, date, desc }) => ({ user_id: userId, amount, category, date, description: desc || '' }));

          if (newSales.length > 0) supabase.from('sales').insert(newSales);
          if (newExpenses.length > 0) supabase.from('expenses').insert(newExpenses);
        }

        let payload = { transactions: finalTransactions };

        if (settingsRes.data) {
          payload.appMode = settingsRes.data.appMode || 'kadai';
          payload.rentDueDate = settingsRes.data.rentDueDate || 1;
          payload.houseRentAmount = settingsRes.data.houseRentAmount || 0;
          payload.shopRentAmount = settingsRes.data.shopRentAmount || 0;
          payload.language = settingsRes.data.language || 'ta';
          payload.categoryBudgets = settingsRes.data.categoryBudgets || initialState.categoryBudgets;
          payload.bills = settingsRes.data.bills || initialState.bills;
          payload.savingsTarget = settingsRes.data.savingsTarget || initialState.savingsTarget;
        }

        dispatch({ type: 'SET_FULL_STATE', payload });
        setDbSetupRequired(false);
        setDbConnectionError(false);
        setIsSyncComplete(true);
      } catch (e) {
        console.error('Cloud sync failed:', e);
        setDbConnectionError(true);
      }
      setIsSyncing(false);
    };

    fetchCloudData();
    // eslint-disable-next-line
  }, [userId]);

  // ── OPTIMIZATION: syncSettings uses stateRef to avoid stale closure
  //    and does NOT need `state` in its dep array.
  const syncSettings = useCallback(async (updates) => {
    if (!userId || dbSetupRequired || dbConnectionError) return;
    setIsSyncing(true);
    try {
      const s = stateRef.current;
      const currentSettings = {
        appMode: s.appMode, rentDueDate: s.rentDueDate,
        houseRentAmount: s.houseRentAmount, shopRentAmount: s.shopRentAmount,
        language: s.language, categoryBudgets: s.categoryBudgets,
        bills: s.bills, savingsTarget: s.savingsTarget,
        ...updates
      };
      await supabase.from('user_settings').upsert(currentSettings);
    } catch (e) { console.error('Settings sync failed:', e); }
    setIsSyncing(false);
  }, [userId, dbSetupRequired, dbConnectionError]);

  // ── OPTIMIZATION: validateSyncAndAmount is stable unless isSyncComplete changes
  const validateSyncAndAmount = useCallback((amount) => {
    if (!isSyncComplete) {
      showToast('Still syncing with cloud. Please wait a moment.', 'warning');
      return false;
    }
    if (!amount || amount <= 0) {
      showToast('Amount must be greater than ₹0.', 'error');
      return false;
    }
    if (amount > 10_000_000) {
      showToast('Amount cannot exceed ₹1,00,00,000.', 'error');
      return false;
    }
    return true;
  }, [isSyncComplete]);

  // ── OPTIMIZATION: All CRUD functions wrapped in useCallback ──────────────

  const addSale = useCallback(async (tx) => {
    if (!validateSyncAndAmount(tx.amount)) return;
    if (!userId) { showToast('Please log in to continue.', 'error'); return; }

    setIsSyncing(true);
    try {
      const cloudSale = {
        user_id: userId,
        amount: tx.amount,
        date: tx.date,
        description: tx.desc || ''
      };

      const { data, error } = await supabase
        .from('sales')
        .insert([cloudSale])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        dispatch({ type: 'ADD_TRANSACTION', payload: { ...data[0], type: 'income', desc: data[0].description } });
        showToast('Income saved successfully!', 'success');
      } else {
        showToast('Data may not have saved correctly. Please refresh.', 'warning');
      }
    } catch (e) {
      console.error('Sales insert failed:', e.message);
      showToast(
        !navigator.onLine ? 'You appear to be offline. Reconnect and try again.' : `Save failed: ${e.message}`,
        'error'
      );
    }
    setIsSyncing(false);
  }, [userId, validateSyncAndAmount]);

  const addExpense = useCallback(async (tx) => {
    if (!validateSyncAndAmount(tx.amount)) return;
    if (!userId) { showToast('Please log in to continue.', 'error'); return; }

    setIsSyncing(true);
    try {
      const cloudExpense = {
        user_id: userId,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        description: tx.desc || ''
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([cloudExpense])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        dispatch({ type: 'ADD_TRANSACTION', payload: { ...data[0], type: 'expense', desc: data[0].description } });
        showToast('Expense saved successfully!', 'success');
      } else {
        showToast('Data may not have saved correctly. Please refresh.', 'warning');
      }
    } catch (e) {
      console.error('Expense insert failed:', e.message);
      showToast(
        !navigator.onLine ? 'You appear to be offline. Reconnect and try again.' : `Save failed: ${e.message}`,
        'error'
      );
    }
    setIsSyncing(false);
  }, [userId, validateSyncAndAmount]);

  const deleteTransaction = useCallback(async (id, type) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    if (!userId) return;

    setIsSyncing(true);
    try {
      const table = type === 'income' ? 'sales' : 'expenses';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Delete failed:', err.message);
      showToast('Delete failed. Please try again.', 'error');
    }
    setIsSyncing(false);
  }, [userId]);

  const editTransaction = useCallback(async (id, type, updatedTx) => {
    if (!userId) return;

    const localUpdate = {
      id,
      amount: updatedTx.amount,
      category: updatedTx.category,
      date: updatedTx.date,
      desc: updatedTx.desc || '',
      type
    };
    dispatch({ type: 'UPDATE_TRANSACTION', payload: localUpdate });

    setIsSyncing(true);
    try {
      const table = type === 'income' ? 'sales' : 'expenses';
      const cloudUpdate = {
        user_id: userId,
        amount: updatedTx.amount,
        date: updatedTx.date,
        description: updatedTx.desc || ''
      };
      if (type === 'expense') cloudUpdate.category = updatedTx.category;

      const { error } = await supabase
        .from(table)
        .update(cloudUpdate)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Edit failed:', err.message);
      showToast('Edit failed. Please try again.', 'error');
    }
    setIsSyncing(false);
  }, [userId]);

  const bulkDelete = useCallback(async (idsByType) => {
    if (!isSyncComplete) { showToast('Still syncing. Please wait.', 'warning'); return; }
    if (dbSetupRequired || dbConnectionError) return;
    dispatch({ type: 'BULK_DELETE', payload: [...(idsByType.income || []), ...(idsByType.expense || [])] });
    setIsSyncing(true);
    if (idsByType.income?.length) await supabase.from('sales').delete().in('id', idsByType.income).eq('user_id', userId);
    if (idsByType.expense?.length) await supabase.from('expenses').delete().in('id', idsByType.expense).eq('user_id', userId);
    setIsSyncing(false);
  }, [userId, isSyncComplete, dbSetupRequired, dbConnectionError]);

  // ── OPTIMIZATION: Setter functions wrapped in useCallback ────────────────

  const setAppMode = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
    syncSettings({ appMode: mode });
  }, [syncSettings]);

  const setRentDueDate = useCallback((date) => {
    const d = parseInt(date) || 1;
    dispatch({ type: 'SET_RENT_DATE', payload: d });
    syncSettings({ rentDueDate: d });
  }, [syncSettings]);

  const setHouseRentAmount = useCallback((amt) => {
    const a = parseFloat(amt) || 0;
    dispatch({ type: 'SET_HOUSE_RENT_AMOUNT', payload: a });
    syncSettings({ houseRentAmount: a });
  }, [syncSettings]);

  const setShopRentAmount = useCallback((amt) => {
    const a = parseFloat(amt) || 0;
    dispatch({ type: 'SET_SHOP_RENT_AMOUNT', payload: a });
    syncSettings({ shopRentAmount: a });
  }, [syncSettings]);

  const setLanguage = useCallback((lang) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
    syncSettings({ language: lang });
  }, [syncSettings]);

  const setBills = useCallback((updatedBills) => {
    dispatch({ type: 'SET_BILLS', payload: updatedBills });
    syncSettings({ bills: updatedBills });
  }, [syncSettings]);

  const setSavingsTarget = useCallback((target) => {
    const a = parseFloat(target) || 0;
    dispatch({ type: 'SET_SAVINGS_TARGET', payload: a });
    syncSettings({ savingsTarget: a });
  }, [syncSettings]);

  const setCategoryBudget = useCallback((category, limit) => {
    const updated = { ...stateRef.current.categoryBudgets, [category]: limit };
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { category, limit } });
    syncSettings({ categoryBudgets: updated });
  }, [syncSettings]);

  // ── OPTIMIZATION: Translation helpers are stable per language change ──────

  const t = useCallback((key) => TR[state.language][key] || key, [state.language]);
  const tc = useCallback((cat) => TR[state.language][cat] || cat, [state.language]);

  // ── OPTIMIZATION: Memoize the full context value object ───────────────────
  // Children only re-render when a value they actually use changes.
  const contextValue = useMemo(() => ({
    transactions: state.transactions, appMode: state.appMode, rentDueDate: state.rentDueDate,
    houseRentAmount: state.houseRentAmount, shopRentAmount: state.shopRentAmount,
    categoryBudgets: state.categoryBudgets, language: state.language,
    bills: state.bills, setBills,
    savingsTarget: state.savingsTarget, setSavingsTarget,
    isSyncing, session, isAuthLoading, isSyncComplete, dbSetupRequired, dbConnectionError,
    setAppMode, setRentDueDate, setHouseRentAmount, setShopRentAmount,
    addSale, addExpense, editTransaction, deleteTransaction, bulkDelete,
    setLanguage, setCategoryBudget, t, tc
  }), [
    state.transactions, state.appMode, state.rentDueDate, state.houseRentAmount,
    state.shopRentAmount, state.categoryBudgets, state.language, state.bills,
    state.savingsTarget,
    isSyncing, session, isAuthLoading, isSyncComplete, dbSetupRequired, dbConnectionError,
    setAppMode, setRentDueDate, setHouseRentAmount, setShopRentAmount,
    addSale, addExpense, editTransaction, deleteTransaction, bulkDelete,
    setLanguage, setCategoryBudget, setBills, setSavingsTarget, t, tc
  ]);

  return (
    <ExpenseContext.Provider value={contextValue}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpense = () => useContext(ExpenseContext);

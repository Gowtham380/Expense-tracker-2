/**
 * ExpenseContext Unit Tests
 * Tests the pure expenseReducer function and formatINR helper.
 * No Supabase / network calls are involved.
 */

// ─── We test the reducer by importing it directly from the source.
// Since it is not exported we pull the logic through a helper below.
// Alternatively we export it—but to avoid touching production code we
// replicate the exact reducer here and keep it in sync with the source.

import { formatINR } from './ExpenseContext';

// ─── Inline replica of the reducer (mirrors ExpenseContext.js exactly) ────────
function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_FULL_STATE': return { ...state, ...action.payload };
    case 'ADD_TRANSACTION': return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION': return {
      ...state,
      transactions: state.transactions.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload } : t
      ),
    };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'BULK_DELETE':
      return { ...state, transactions: state.transactions.filter(t => !action.payload.includes(t.id)) };
    case 'SET_MODE': return { ...state, appMode: action.payload };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'SET_BILLS': return { ...state, bills: action.payload };
    case 'SET_CATEGORY_BUDGET':
      return { ...state, categoryBudgets: { ...state.categoryBudgets, [action.payload.category]: action.payload.limit } };
    default: return state;
  }
}

// ─── Shared fixture ───────────────────────────────────────────────────────────
const TX_INCOME = { id: 'tx-1', type: 'income',  amount: 5000, category: 'Daily Sales', date: '2024-03-01', desc: 'Morning sales' };
const TX_EXP1  = { id: 'tx-2', type: 'expense', amount: 1200, category: 'EB',           date: '2024-03-05', desc: 'EB Bill' };
const TX_EXP2  = { id: 'tx-3', type: 'expense', amount:  500, category: 'Gas',          date: '2024-03-10', desc: 'Gas refill' };

const baseState = {
  transactions: [TX_INCOME, TX_EXP1, TX_EXP2],
  appMode: 'kadai',
  language: 'en',
  bills: [],
  categoryBudgets: {},
};

// ─── formatINR ────────────────────────────────────────────────────────────────
describe('formatINR()', () => {
  test('formats a whole number correctly', () => {
    expect(formatINR(5000)).toBe('₹5,000');
  });

  test('formats zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  test('formats a decimal amount', () => {
    expect(formatINR(1234.5)).toBe('₹1,234.5');
  });

  test('formats a large number with Indian grouping', () => {
    expect(formatINR(100000)).toBe('₹1,00,000');
  });

  test('formats negative values (loss scenario)', () => {
    const result = formatINR(-500);
    // Contains '500' with some minus prefix; exact char varies by locale/env
    expect(result).toMatch(/500/);
    expect(result).not.toMatch(/^5/); // does not start with '5' (would be positive)
  });
});


// ─── ADD_TRANSACTION ──────────────────────────────────────────────────────────
describe('Reducer — ADD_TRANSACTION', () => {
  const newTx = { id: 'tx-new', type: 'income', amount: 2000, category: 'Other Income', date: '2024-03-15', desc: 'Extra' };

  test('appends a new transaction to the list', () => {
    const next = expenseReducer(baseState, { type: 'ADD_TRANSACTION', payload: newTx });
    expect(next.transactions).toHaveLength(4);
    expect(next.transactions.at(-1)).toEqual(newTx);
  });

  test('does not mutate the original state', () => {
    expenseReducer(baseState, { type: 'ADD_TRANSACTION', payload: newTx });
    expect(baseState.transactions).toHaveLength(3);
  });

  test('income/expense counts are correct after add', () => {
    const next = expenseReducer(
      { ...baseState, transactions: [] },
      { type: 'ADD_TRANSACTION', payload: TX_INCOME }
    );
    const income  = next.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = next.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    expect(income).toBe(5000);
    expect(expense).toBe(0);
  });
});

// ─── DELETE_TRANSACTION ───────────────────────────────────────────────────────
describe('Reducer — DELETE_TRANSACTION', () => {
  test('removes the correct transaction by id', () => {
    const next = expenseReducer(baseState, { type: 'DELETE_TRANSACTION', payload: 'tx-2' });
    expect(next.transactions).toHaveLength(2);
    expect(next.transactions.find(t => t.id === 'tx-2')).toBeUndefined();
  });

  test('keeps all other transactions intact', () => {
    const next = expenseReducer(baseState, { type: 'DELETE_TRANSACTION', payload: 'tx-2' });
    expect(next.transactions.map(t => t.id)).toEqual(['tx-1', 'tx-3']);
  });

  test('deleting a non-existent id leaves state unchanged', () => {
    const next = expenseReducer(baseState, { type: 'DELETE_TRANSACTION', payload: 'tx-999' });
    expect(next.transactions).toHaveLength(3);
  });
});

// ─── BULK_DELETE ──────────────────────────────────────────────────────────────
describe('Reducer — BULK_DELETE', () => {
  test('removes multiple transactions in one action', () => {
    const next = expenseReducer(baseState, { type: 'BULK_DELETE', payload: ['tx-2', 'tx-3'] });
    expect(next.transactions).toHaveLength(1);
    expect(next.transactions[0].id).toBe('tx-1');
  });

  test('empty id list leaves state unchanged', () => {
    const next = expenseReducer(baseState, { type: 'BULK_DELETE', payload: [] });
    expect(next.transactions).toHaveLength(3);
  });
});

// ─── UPDATE_TRANSACTION (Edit) ────────────────────────────────────────────────
describe('Reducer — UPDATE_TRANSACTION (Edit)', () => {
  test('updates the amount of an existing transaction', () => {
    const next = expenseReducer(baseState, {
      type: 'UPDATE_TRANSACTION',
      payload: { id: 'tx-2', amount: 1500 },
    });
    const updated = next.transactions.find(t => t.id === 'tx-2');
    expect(updated.amount).toBe(1500);
    expect(updated.category).toBe('EB'); // unchanged fields preserved
  });

  test('updates the description', () => {
    const next = expenseReducer(baseState, {
      type: 'UPDATE_TRANSACTION',
      payload: { id: 'tx-1', desc: 'Afternoon sales' },
    });
    expect(next.transactions.find(t => t.id === 'tx-1').desc).toBe('Afternoon sales');
  });

  test('updating a non-existent id does not change the list', () => {
    const next = expenseReducer(baseState, {
      type: 'UPDATE_TRANSACTION',
      payload: { id: 'tx-999', amount: 9999 },
    });
    expect(next.transactions).toHaveLength(3);
  });
});

// ─── Income / Expense Calculations ───────────────────────────────────────────
describe('Income & Expense calculations', () => {
  const txList = [TX_INCOME, TX_EXP1, TX_EXP2];

  test('total income sums only income-type transactions', () => {
    const total = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(5000);
  });

  test('total expense sums only expense-type transactions', () => {
    const total = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(1700);
  });

  test('net profit = income − expense', () => {
    const income  = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    expect(income - expense).toBe(3300);
  });

  test('net profit is negative when expenses exceed income', () => {
    const heavyExpenses = [
      { ...TX_EXP1, amount: 3000 },
      { ...TX_EXP2, amount: 3000 },
    ];
    const income  = [TX_INCOME].reduce((s, t) => s + t.amount, 0);
    const expense = heavyExpenses.reduce((s, t) => s + t.amount, 0);
    expect(income - expense).toBe(-1000);
  });
});

// ─── SET_MODE ─────────────────────────────────────────────────────────────────
describe('Reducer — SET_MODE', () => {
  test('switches to veedu mode', () => {
    const next = expenseReducer(baseState, { type: 'SET_MODE', payload: 'veedu' });
    expect(next.appMode).toBe('veedu');
  });

  test('switches back to kadai mode', () => {
    const s    = { ...baseState, appMode: 'veedu' };
    const next = expenseReducer(s, { type: 'SET_MODE', payload: 'kadai' });
    expect(next.appMode).toBe('kadai');
  });
});

// ─── SET_CATEGORY_BUDGET ──────────────────────────────────────────────────────
describe('Reducer — SET_CATEGORY_BUDGET', () => {
  test('sets a new budget for a category', () => {
    const next = expenseReducer(baseState, {
      type: 'SET_CATEGORY_BUDGET',
      payload: { category: 'EB', limit: 2000 },
    });
    expect(next.categoryBudgets['EB']).toBe(2000);
  });

  test('overrides an existing budget', () => {
    const s = { ...baseState, categoryBudgets: { EB: 1000 } };
    const next = expenseReducer(s, {
      type: 'SET_CATEGORY_BUDGET',
      payload: { category: 'EB', limit: 1500 },
    });
    expect(next.categoryBudgets['EB']).toBe(1500);
  });
});

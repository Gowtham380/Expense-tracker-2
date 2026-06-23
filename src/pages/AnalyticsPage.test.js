import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsPage from './AnalyticsPage';
import '@testing-library/jest-dom';
import { subMonths, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// ─── Mock Recharts so container issues in JSDOM are bypassed ──────────────────
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 400 }} data-testid="responsive-container">
        {children}
      </div>
    ),
  };
});

// ─── Mock Supabase ────────────────────────────────────────────────────────────
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: { 
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }), 
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) 
    },
    from: jest.fn(() => ({ 
      select: jest.fn().mockReturnThis(), 
      eq: jest.fn().mockResolvedValue({ data: [], error: null }) 
    })),
  },
}));

// Define prefix variables to bypass Jest module factory hoisting restrictions
const mockNow = new Date();
const mockCurrentMonthStr = format(mockNow, 'yyyy-MM');
const mockLastMonthStr = format(subMonths(mockNow, 1), 'yyyy-MM');

const mockTransactions = [
  { id: 'tx-1', type: 'income',  amount: 5000, category: 'Daily Sales', date: `${mockCurrentMonthStr}-05T08:00:00Z`, desc: 'Morning sales' },
  { id: 'tx-2', type: 'expense', amount: 1200, category: 'EB',           date: `${mockCurrentMonthStr}-10T10:00:00Z`, desc: 'EB Bill' },
  { id: 'tx-3', type: 'expense', amount:  500, category: 'Gas',          date: `${mockLastMonthStr}-15T12:00:00Z`, desc: 'Gas refill' },
  { id: 'tx-4', type: 'income',  amount: 3000, category: 'Other Income', date: `${mockLastMonthStr}-20T14:00:00Z`, desc: 'Catering job' },
];

jest.mock('../context/ExpenseContext', () => ({
  ...jest.requireActual('../context/ExpenseContext'),
  useExpense: () => ({
    transactions: mockTransactions,
    language:   'en',
    themeMode:  'light',
    t:  (key) => {
      const { TRANSLATIONS } = require('../utils/localization');
      return TRANSLATIONS.en[key] || key;
    },
    tc: (cat) => {
      const { TRANSLATIONS } = require('../utils/localization');
      return TRANSLATIONS.en[cat] || cat;
    },
    formatINR: (val) => `₹${val.toLocaleString('en-IN')}`,
  }),
}));

const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

describe('AnalyticsPage — Rendering & Core Filter Elements', () => {
  test('renders page title and search bar', () => {
    render(<AnalyticsPage />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('collapsible filter drawer starts hidden and toggles correctly', () => {
    render(<AnalyticsPage />);
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    
    // Toggle the filter panel open
    fireEvent.click(screen.getByLabelText('Toggle Filters'));
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});

describe('AnalyticsPage — Filter Logic', () => {
  test('filtering by search restricts data and affects financial summaries', () => {
    render(<AnalyticsPage />);
    const searchInput = screen.getByPlaceholderText('Search...');

    // Filter by note/desc: "EB"
    fireEvent.change(searchInput, { target: { value: 'EB' } });

    // Financial Status total income should be 0, expenses should be ₹1,200, Net should be -₹1,200
    expect(screen.getAllByText('₹1,200')[0]).toBeInTheDocument(); // expense
    expect(screen.getByText('-₹1,200')).toBeInTheDocument(); // net

    // Comparison view (This Month vs Last Month) should also update for search 'EB'
    // Income this month should be 0 (no 'EB' income), Expense should be ₹1,200.
    // Last month income/expense should be 0 (no 'EB' last month).
    const incomeThisMonthText = screen.getAllByText('Income')[1].closest('.p-4').querySelector('.text-xl');
    expect(incomeThisMonthText).toHaveTextContent('₹0');
  });

  test('clearing filters resets state', () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByLabelText('Toggle Filters'));
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Gas' } });
    
    // Clear filters button should exist and reset search input
    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    
    expect(searchInput.value).toBe('');
  });
});

describe('AnalyticsPage — 7-Point Filter Dispatcher', () => {
  test('presets apply calendar-perfect date boundaries', () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByLabelText('Toggle Filters'));

    const fromInput = screen.getByTitle('From');
    const toInput = screen.getByTitle('To');

    // Click "This Month"
    fireEvent.click(screen.getByText('This Month'));
    expect(fromInput.value).toBe(getLocalDateString(startOfMonth(new Date())));
    expect(toInput.value).toBe(getLocalDateString(endOfMonth(new Date())));

    // Click "Last Month"
    fireEvent.click(screen.getByText('Last Month'));
    expect(fromInput.value).toBe(getLocalDateString(startOfMonth(subMonths(new Date(), 1))));
    expect(toInput.value).toBe(getLocalDateString(endOfMonth(subMonths(new Date(), 1))));

    // Click "Current Year"
    fireEvent.click(screen.getByText('Current Year'));
    expect(fromInput.value).toBe(getLocalDateString(startOfYear(new Date())));
    expect(toInput.value).toBe(getLocalDateString(endOfYear(new Date())));
  });

  test('clicking "All" type filter resets dates and type state', () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByLabelText('Toggle Filters'));

    const fromInput = screen.getByTitle('From');
    const toInput = screen.getByTitle('To');
    const searchInput = screen.getByPlaceholderText('Search...');

    // Make some custom selections
    fireEvent.change(searchInput, { target: { value: 'Gas' } });
    fireEvent.click(screen.getByText('This Month'));

    // Verify search and preset are updated
    expect(searchInput.value).toBe('Gas');
    expect(fromInput.value).toBe(getLocalDateString(startOfMonth(new Date())));

    // Click "All" type filter button to trigger reset strategy
    fireEvent.click(screen.getByText('All'));

    // Dates should reset to earliest transaction to today, search cleared
    const sorted = [...mockTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    expect(searchInput.value).toBe('');
    expect(fromInput.value).toBe(getLocalDateString(sorted[0].date));
    expect(toInput.value).toBe(getLocalDateString(new Date()));
  });
});

import { useState, useEffect, useCallback } from "react";

// Types
export type UserRole = "manager" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  recordedBy: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  month: string; // YYYY-MM
}

// Demo data
const DEMO_USERS: User[] = [
  { id: "1", name: "Loise Guchu", email: "manager@dailybite.co.ke", role: "manager" },
  { id: "2", name: "James Mwangi", email: "staff@dailybite.co.ke", role: "staff" },
];

const INCOME_CATEGORIES = ["Food Sales", "Beverage Sales", "Catering", "Other Income"];
const EXPENSE_CATEGORIES = ["Ingredients", "Utilities", "Wages", "Rent", "Equipment", "Marketing", "Transport", "Other"];

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function generateDemoTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  const days = 30;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Income
    txns.push({
      id: `inc-${i}`,
      type: "income",
      category: INCOME_CATEGORIES[Math.floor(Math.random() * 2)],
      amount: Math.round(3000 + Math.random() * 7000),
      description: `Daily sales - ${dateStr}`,
      date: dateStr,
      recordedBy: "James Mwangi",
    });

    // Expenses
    if (i % 2 === 0) {
      txns.push({
        id: `exp-${i}`,
        type: "expense",
        category: EXPENSE_CATEGORIES[Math.floor(Math.random() * 4)],
        amount: Math.round(500 + Math.random() * 4000),
        description: `Purchase - ${dateStr}`,
        date: dateStr,
        recordedBy: "James Mwangi",
      });
    }
  }
  return txns;
}

function generateDemoBudgets(): Budget[] {
  return EXPENSE_CATEGORIES.slice(0, 6).map((cat, i) => ({
    id: `bud-${i}`,
    category: cat,
    allocated: [80000, 15000, 120000, 50000, 20000, 10000][i],
    spent: [62000, 12400, 110000, 50000, 8500, 7200][i],
    month: currentMonth,
  }));
}

// Hook for localStorage-backed state
function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useLocalState<User | null>("bms-user", null);

  const login = useCallback((email: string, _password: string): User | null => {
    const found = DEMO_USERS.find((u) => u.email === email);
    if (found) {
      setUser(found);
      return found;
    }
    return null;
  }, [setUser]);

  const logout = useCallback(() => setUser(null), [setUser]);

  return { user, login, logout };
}

// Transactions hook
export function useTransactions() {
  const [transactions, setTransactions] = useLocalState<Transaction[]>("bms-transactions", generateDemoTransactions());

  const addTransaction = useCallback((txn: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...txn, id: `txn-${Date.now()}` }, ...prev]);
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  return { transactions, addTransaction, deleteTransaction };
}

// Budgets hook
export function useBudgets() {
  const [budgets, setBudgets] = useLocalState<Budget[]>("bms-budgets", generateDemoBudgets());

  const addBudget = useCallback((b: Omit<Budget, "id">) => {
    setBudgets((prev) => [{ ...b, id: `bud-${Date.now()}` }, ...prev]);
  }, [setBudgets]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [setBudgets]);

  return { budgets, addBudget, updateBudget };
}

export { INCOME_CATEGORIES, EXPENSE_CATEGORIES };

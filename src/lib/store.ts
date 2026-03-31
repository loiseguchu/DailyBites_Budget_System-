import { useState, useEffect, useCallback } from "react";

// Types
export type UserRole = "manager" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
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
  receipt?: string; // receipt note/reference
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  month: string; // YYYY-MM
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  budgetEnabled: boolean;
  budgetAmount?: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

// Default admin/manager accounts
const DEFAULT_USERS: User[] = [
  { id: "1", name: "Loise Guchu", email: "manager@dailybite.co.ke", password: "admin123", role: "manager" },
  { id: "2", name: "Peter Kamau", email: "admin@dailybite.co.ke", password: "admin123", role: "manager" },
  { id: "3", name: "James Mwangi", email: "james@dailybite.co.ke", password: "staff123", role: "staff" },
  { id: "4", name: "Mary Wanjiku", email: "mary@dailybite.co.ke", password: "staff123", role: "staff" },
];

const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Food Sales", type: "income", budgetEnabled: false },
  { id: "cat-2", name: "Beverage Sales", type: "income", budgetEnabled: false },
  { id: "cat-3", name: "Catering", type: "income", budgetEnabled: false },
  { id: "cat-4", name: "Other Income", type: "income", budgetEnabled: false },
];

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: "cat-5", name: "Ingredients", type: "expense", budgetEnabled: true },
  { id: "cat-6", name: "Utilities", type: "expense", budgetEnabled: true },
  { id: "cat-7", name: "Wages", type: "expense", budgetEnabled: true },
  { id: "cat-8", name: "Rent", type: "expense", budgetEnabled: true },
  { id: "cat-9", name: "Equipment", type: "expense", budgetEnabled: true },
  { id: "cat-10", name: "Marketing", type: "expense", budgetEnabled: true },
  { id: "cat-11", name: "Transport", type: "expense", budgetEnabled: false },
  { id: "cat-12", name: "Other", type: "expense", budgetEnabled: true },
];

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function generateDemoTransactions(): Transaction[] {
  const INCOME_CATS = ["Food Sales", "Beverage Sales"];
  const EXPENSE_CATS = ["Ingredients", "Utilities", "Wages", "Rent"];
  const txns: Transaction[] = [];
  const staffNames = ["James Mwangi", "Mary Wanjiku"];
  const days = 30;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const staffName = staffNames[i % staffNames.length];

    txns.push({
      id: `inc-${i}`,
      type: "income",
      category: INCOME_CATS[Math.floor(Math.random() * 2)],
      amount: Math.round(3000 + Math.random() * 7000),
      description: `Daily sales - ${dateStr}`,
      date: dateStr,
      recordedBy: staffName,
    });

    if (i % 2 === 0) {
      txns.push({
        id: `exp-${i}`,
        type: "expense",
        category: EXPENSE_CATS[Math.floor(Math.random() * 4)],
        amount: Math.round(500 + Math.random() * 4000),
        description: `Purchase - ${dateStr}`,
        date: dateStr,
        recordedBy: staffName,
      });
    }
  }
  return txns;
}

function generateDemoBudgets(): Budget[] {
  const cats = ["Ingredients", "Utilities", "Wages", "Rent", "Equipment", "Marketing"];
  return cats.map((cat, i) => ({
    id: `bud-${i}`,
    category: cat,
    allocated: [80000, 15000, 120000, 50000, 20000, 10000][i],
    spent: [62000, 12400, 110000, 50000, 8500, 7200][i],
    month: currentMonth,
    enabled: true,
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

// Users/accounts hook
export function useUsers() {
  const [users, setUsers] = useLocalState<User[]>("bms-users", DEFAULT_USERS);

  const addUser = useCallback((u: Omit<User, "id">) => {
    setUsers((prev) => [...prev, { ...u, id: `user-${Date.now()}` }]);
  }, [setUsers]);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, [setUsers]);

  return { users, addUser, deleteUser };
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useLocalState<User | null>("bms-user", null);
  const { users } = useUsers();

  const login = useCallback((email: string, password: string): User | null => {
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      return found;
    }
    return null;
  }, [users, setUser]);

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

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, [setBudgets]);

  return { budgets, addBudget, updateBudget, deleteBudget };
}

// Categories hook
export function useCategories() {
  const [categories, setCategories] = useLocalState<Category[]>(
    "bms-categories",
    [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]
  );

  const addCategory = useCallback((c: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...c, id: `cat-${Date.now()}` }]);
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, [setCategories]);

  const toggleBudget = useCallback((id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, budgetEnabled: !c.budgetEnabled } : c)));
  }, [setCategories]);

  const incomeCategories = categories.filter((c) => c.type === "income").map((c) => c.name);
  const expenseCategories = categories.filter((c) => c.type === "expense").map((c) => c.name);

  return { categories, addCategory, deleteCategory, toggleBudget, incomeCategories, expenseCategories };
}

// Audit trail hook
export function useAuditTrail() {
  const [entries, setEntries] = useLocalState<AuditEntry[]>("bms-audit", []);

  const addEntry = useCallback((action: string, performedBy: string, details: string) => {
    setEntries((prev) => [
      { id: `audit-${Date.now()}`, action, performedBy, details, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, [setEntries]);

  return { entries, addEntry };
}

// Keep backward compat exports
export const INCOME_CATEGORIES = ["Food Sales", "Beverage Sales", "Catering", "Other Income"];
export const EXPENSE_CATEGORIES = ["Ingredients", "Utilities", "Wages", "Rent", "Equipment", "Marketing", "Transport", "Other"];

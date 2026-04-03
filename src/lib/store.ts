import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  recordedBy: string;
  receipt?: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  month: string;
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  budgetEnabled: boolean;
  budgetAmount?: number | null;
  staffVisible: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

// Users hook
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setUsers(data); })
      .catch(console.error);
  }, []);

  const addUser = useCallback(async (u: Omit<User, "id">) => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u)
      });
      if (res.ok) {
        const newU = await res.json();
        setUsers((prev) => [newU, ...prev]);
      }
    } catch(e) { console.error(e); }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch(e) { console.error(e) }
  }, []);

  return { users, addUser, deleteUser };
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("bms-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("bms-user", JSON.stringify(user));
    else localStorage.removeItem("bms-user");
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return { user, login, logout };
}

// Transactions hook
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/transactions`)
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setTransactions(data);
      })
      .catch(console.error);
  }, []);

  const addTransaction = useCallback(async (txn: Omit<Transaction, "id">) => {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txn)
      });
      if (res.ok) {
        const newTxn = await res.json();
        setTransactions((prev) => [newTxn, ...prev]);
        window.dispatchEvent(new CustomEvent('bms_sync_budgets'));
      }
    } catch(e) { console.error(e); }
  }, []);

  const updateTransaction = useCallback(async (id: string, txn: Partial<Transaction>) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txn)
      });
      if (res.ok) {
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...txn } : t)));
        window.dispatchEvent(new CustomEvent('bms_sync_budgets'));
      }
    } catch(e) { console.error(e); }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        window.dispatchEvent(new CustomEvent('bms_sync_budgets'));
      }
    } catch(e) { console.error(e) }
  }, []);

  return { transactions, addTransaction, updateTransaction, deleteTransaction };
}

// Budgets hook
export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const fetchBudgets = useCallback(() => {
    fetch(`${API_URL}/budgets`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setBudgets(data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchBudgets();
    const listener = () => fetchBudgets();
    window.addEventListener('bms_sync_budgets', listener);
    return () => window.removeEventListener('bms_sync_budgets', listener);
  }, [fetchBudgets]);

  const addBudget = useCallback(async (b: Omit<Budget, "id">) => {
    try {
      const res = await fetch(`${API_URL}/budgets`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(b)
      });
      if(res.ok) {
        const newB = await res.json();
        setBudgets((prev) => [newB, ...prev]);
      }
    } catch(e) { console.error(e); }
  }, []);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    try {
      const res = await fetch(`${API_URL}/budgets/${id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(updates)
      });
      if(res.ok) {
        setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
      }
    } catch(e) { console.error(e); }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/budgets/${id}`, { method: "DELETE" });
      if(res.ok) {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
    } catch(e) { console.error(e) }
  }, []);

  return { budgets, addBudget, updateBudget, deleteBudget };
}

// Categories hook
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  const addCategory = useCallback(async (c: Omit<Category, "id">) => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c)
      });
      if(res.ok) {
        const newC = await res.json();
        setCategories((prev) => [...prev, newC]);
        window.dispatchEvent(new CustomEvent('bms_sync_budgets'));
      }
    } catch(e) { console.error(e); }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
      if(res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch(e) { console.error(e); }
  }, []);

  const toggleBudget = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/categories/${id}/toggle`, { method: "PUT" });
      if(res.ok) {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, budgetEnabled: !c.budgetEnabled } : c)));
      }
    } catch(e) { console.error(e); }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if(res.ok) {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        window.dispatchEvent(new CustomEvent('bms_sync_budgets'));
      }
    } catch(e) { console.error(e); }
  }, []);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return { categories, addCategory, updateCategory, deleteCategory, toggleBudget, incomeCategories, expenseCategories };
}

// Audit trail hook
export function useAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/audit`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setEntries(data); })
      .catch(console.error);
  }, []);

  const addEntry = useCallback(async (action: string, performedBy: string, details: string) => {
    try {
      const res = await fetch(`${API_URL}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, performedBy, details })
      });
      if(res.ok) {
        const newE = await res.json();
        setEntries((prev) => [newE, ...prev]);
      }
    } catch(e) { console.error(e); }
  }, []);

  return { entries, addEntry };
}

export const INCOME_CATEGORIES = ["Food Sales", "Beverage Sales", "Catering", "Other Income"];
export const EXPENSE_CATEGORIES = ["Ingredients", "Utilities", "Wages", "Rent", "Equipment", "Marketing", "Transport", "Other"];

import { useAuth, useTransactions, useBudgets } from "@/lib/store";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Transactions from "./Transactions";
import Budgets from "./Budgets";
import Reports from "./Reports";
import StaffManagement from "./StaffManagement";
import AppSidebar from "@/components/AppSidebar";
import MobileNav from "@/components/MobileNav";

export default function Index() {
  const { user, login, logout } = useAuth();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { budgets, addBudget, updateBudget } = useBudgets();

  if (!user) return <Login onLogin={login} />;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col">
        <MobileNav user={user} onLogout={logout} />
        <main className="flex-1 p-4 md:p-8 max-w-6xl">
          <DashboardContent
            user={user}
            transactions={transactions}
            budgets={budgets}
            addTransaction={addTransaction}
            deleteTransaction={deleteTransaction}
            addBudget={addBudget}
            updateBudget={updateBudget}
          />
        </main>
      </div>
    </div>
  );
}

function DashboardContent({
  user,
  transactions,
  budgets,
  addTransaction,
  deleteTransaction,
  addBudget,
  updateBudget,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  transactions: ReturnType<typeof useTransactions>["transactions"];
  budgets: ReturnType<typeof useBudgets>["budgets"];
  addTransaction: ReturnType<typeof useTransactions>["addTransaction"];
  deleteTransaction: ReturnType<typeof useTransactions>["deleteTransaction"];
  addBudget: ReturnType<typeof useBudgets>["addBudget"];
  updateBudget: ReturnType<typeof useBudgets>["updateBudget"];
}) {
  const path = window.location.pathname;

  if (path === "/transactions") {
    return <Transactions user={user} transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />;
  }
  if (path === "/budgets" && user.role === "manager") {
    return <Budgets budgets={budgets} onAdd={addBudget} onUpdate={updateBudget} />;
  }
  if (path === "/reports" && user.role === "manager") {
    return <Reports transactions={transactions} budgets={budgets} />;
  }
  if (path === "/staff" && user.role === "manager") {
    return <StaffManagement currentUser={user} />;
  }
  return <Dashboard user={user} transactions={transactions} budgets={budgets} />;
}

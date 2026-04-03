import { useAuth, useTransactions, useBudgets, useCategories, useAuditTrail } from "@/lib/store";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Transactions from "./Transactions";
import Budgets from "./Budgets";
import Reports from "./Reports";
import StaffManagement from "./StaffManagement";
import CategoryManagement from "./CategoryManagement";
import AuditTrail from "./AuditTrail";
import AppSidebar from "@/components/AppSidebar";
import MobileNav from "@/components/MobileNav";

export default function Index() {
  const { user, login, logout } = useAuth();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories, addCategory, updateCategory, deleteCategory, toggleBudget } = useCategories();
  const { entries: auditEntries, addEntry: addAuditEntry } = useAuditTrail();

  if (!user) return <Login onLogin={login} />;

  const audit = (action: string, details: string) => addAuditEntry(action, user.name, details);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col">
        <MobileNav user={user} onLogout={logout} />
        <main className="flex-1 p-4 md:p-8 max-w-6xl">
          <Content
            user={user}
            transactions={transactions}
            budgets={budgets}
            categories={categories}
            auditEntries={auditEntries}
            addTransaction={addTransaction}
            deleteTransaction={deleteTransaction}
            addBudget={addBudget}
            updateBudget={updateBudget}
            deleteBudget={deleteBudget}
            addCategory={addCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
            toggleBudget={toggleBudget}
            audit={audit}
          />
        </main>
      </div>
    </div>
  );
}

function Content(props: any) {
  const { user } = props;
  const path = window.location.pathname;

  if (path === "/transactions") {
    return <Transactions user={user} transactions={props.transactions} onAdd={props.addTransaction} onUpdate={props.updateTransaction} onDelete={props.deleteTransaction} onAudit={props.audit} />;
  }
  if (path === "/budgets" && user.role === "admin") {
    return <Budgets budgets={props.budgets} onAdd={props.addBudget} onUpdate={props.updateBudget} onDelete={props.deleteBudget} onAudit={props.audit} />;
  }
  if (path === "/reports" && user.role === "admin") {
    return <Reports transactions={props.transactions} budgets={props.budgets} />;
  }
  if (path === "/staff" && user.role === "admin") {
    return <StaffManagement currentUser={user} onAudit={props.audit} />;
  }
  if (path === "/categories" && user.role === "admin") {
    return <CategoryManagement categories={props.categories} onAdd={props.addCategory} onUpdate={props.updateCategory} onDelete={props.deleteCategory} onToggleBudget={props.toggleBudget} onAudit={props.audit} />;
  }
  if (path === "/audit" && user.role === "admin") {
    return <AuditTrail entries={props.auditEntries} />;
  }
  return <Dashboard user={user} transactions={props.transactions} budgets={props.budgets} />;
}

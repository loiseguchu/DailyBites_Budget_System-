import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowLeftRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import { type Transaction, type Budget, type User } from "@/lib/store";
import { motion } from "framer-motion";

interface Props {
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
}

const PIE_COLORS = [
  "hsl(25, 65%, 28%)",
  "hsl(38, 90%, 55%)",
  "hsl(142, 60%, 40%)",
  "hsl(200, 60%, 50%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 50%, 55%)",
];

export default function Dashboard({ user, transactions, budgets }: Props) {
  const isManager = user.role === "manager";

  // Staff only sees their own transactions
  const visibleTransactions = useMemo(() => {
    if (isManager) return transactions;
    return transactions.filter((t) => t.recordedBy === user.name);
  }, [transactions, user, isManager]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = visibleTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const txnCount = thisMonth.length;

    return { income, expenses, net: income - expenses, totalBudget, totalSpent, txnCount };
  }, [visibleTransactions, budgets]);

  const chartData = useMemo(() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
      const dayTxns = visibleTransactions.filter((t) => t.date === dateStr);
      last7.push({
        day: dayLabel,
        income: dayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: dayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return last7;
  }, [visibleTransactions]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    visibleTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [visibleTransactions]);

  const fmt = (n: number) => `KES ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm">
          {isManager ? "Here's your financial overview for this month." : "Here's a summary of your recorded transactions."}
        </p>
      </div>

      {/* Stat cards — managers see full financials, staff sees their own transaction count */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isManager ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        {isManager ? (
          <>
            <StatCard title="Total Income" value={fmt(stats.income)} icon={TrendingUp} trend="up" subtitle="+12% from last month" delay={0} />
            <StatCard title="Total Expenses" value={fmt(stats.expenses)} icon={TrendingDown} trend="down" subtitle="Within budget" delay={0.1} />
            <StatCard title="Net Profit" value={fmt(stats.net)} icon={DollarSign} trend={stats.net >= 0 ? "up" : "down"} delay={0.2} />
            <StatCard title="Budget Used" value={`${Math.round((stats.totalSpent / stats.totalBudget) * 100)}%`} icon={Wallet} subtitle={`${fmt(stats.totalSpent)} of ${fmt(stats.totalBudget)}`} delay={0.3} />
          </>
        ) : (
          <>
            <StatCard title="Your Transactions" value={String(stats.txnCount)} icon={ArrowLeftRight} subtitle="This month" delay={0} />
            <StatCard title="Your Recorded Total" value={fmt(stats.income + stats.expenses)} icon={DollarSign} subtitle="Income + Expenses" delay={0.1} />
          </>
        )}
      </div>

      {/* Charts — only for managers */}
      {isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card rounded-xl p-5">
            <h2 className="font-serif text-lg mb-4">Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 89%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(20 10% 48%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(20 10% 48%)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(30 15% 89%)", fontSize: 13 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]} />
                <Bar dataKey="income" fill="hsl(142, 60%, 40%)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="hsl(25, 65%, 28%)" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
            <h2 className="font-serif text-lg mb-4">Expense Breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {expenseBreakdown.slice(0, 5).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">KES {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5">
        <h2 className="font-serif text-lg mb-4">{isManager ? "Recent Transactions" : "Your Recent Transactions"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Category</th>
                {isManager && <th className="pb-3 font-medium">Recorded By</th>}
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.slice(0, 8).map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-muted-foreground">{new Date(t.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</td>
                  <td className="py-3">{t.description}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{t.category}</span></td>
                  {isManager && <td className="py-3 text-muted-foreground">{t.recordedBy}</td>}
                  <td className={`py-3 text-right font-medium ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "-"} KES {t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

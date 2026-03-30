import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Transaction, type Budget } from "@/lib/store";

interface Props {
  transactions: Transaction[];
  budgets: Budget[];
}

export default function Reports({ transactions, budgets }: Props) {
  const [period, setPeriod] = useState<"7" | "14" | "30">("30");

  const trendData = useMemo(() => {
    const days = Number(period);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTxns = transactions.filter((t) => t.date === dateStr);
      data.push({
        date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        income: dayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: dayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return data;
  }, [transactions, period]);

  const budgetComparison = useMemo(() => {
    return budgets.map((b) => ({
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      remaining: Math.max(0, b.allocated - b.spent),
    }));
  }, [budgets]);

  const totalIncome = trendData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = trendData.reduce((s, d) => s + d.expenses, 0);

  const handleExport = () => {
    const rows = [["Date", "Description", "Category", "Type", "Amount (KES)"]];
    transactions.forEach((t) => rows.push([t.date, t.description, t.category, t.type, t.amount.toString()]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dailybite-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Analyze trends and generate financial summaries.</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as "7" | "14" | "30")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: totalIncome, color: "text-success" },
          { label: "Total Expenses", value: totalExpenses, color: "text-foreground" },
          { label: "Net Profit", value: totalIncome - totalExpenses, color: totalIncome - totalExpenses >= 0 ? "text-success" : "text-destructive" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5 text-center">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-serif mt-1 ${item.color}`}>KES {item.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <h2 className="font-serif text-lg mb-4">Income vs Expenses Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 89%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(20 10% 48%)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(20 10% 48%)" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(30 15% 89%)", fontSize: 13 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]} />
            <Line type="monotone" dataKey="income" stroke="hsl(142, 60%, 40%)" strokeWidth={2} dot={false} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="hsl(25, 65%, 28%)" strokeWidth={2} dot={false} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Budget comparison */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
        <h2 className="font-serif text-lg mb-4">Budget vs Actual</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budgetComparison} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 89%)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(20 10% 48%)" />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(20 10% 48%)" width={90} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(30 15% 89%)", fontSize: 13 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]} />
            <Bar dataKey="allocated" fill="hsl(30 15% 89%)" radius={[0, 4, 4, 0]} name="Allocated" />
            <Bar dataKey="spent" fill="hsl(25, 65%, 28%)" radius={[0, 4, 4, 0]} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

import { useMemo, useState, useCallback } from "react";
import { Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Transaction, type Budget } from "@/lib/store";

interface Props {
  transactions: Transaction[];
  budgets: Budget[];
}

type ReportPeriod = "7" | "14" | "30" | "90" | "180" | "365";

export default function Reports({ transactions, budgets }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("30");

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
    return budgets.filter((b) => b.enabled !== false).map((b) => ({
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      remaining: Math.max(0, b.allocated - b.spent),
    }));
  }, [budgets]);

  const totalIncome = trendData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = trendData.reduce((s, d) => s + d.expenses, 0);

  const handleExportCSV = useCallback(() => {
    const rows = [["Date", "Description", "Category", "Type", "Amount (KES)", "Receipt"]];
    transactions.forEach((t) => rows.push([t.date, t.description, t.category, t.type, t.amount.toString(), t.receipt || ""]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dailybite-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }, [transactions]);

  const handleExportPDF = useCallback(() => {
    const periodLabel = period === "7" ? "7 Days" : period === "14" ? "14 Days" : period === "30" ? "30 Days" : period === "90" ? "Quarterly" : period === "180" ? "6 Months" : "Yearly";
    const content = `
DAILY BITE CAFÉ — FINANCIAL REPORT
Period: Last ${periodLabel}
Generated: ${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
${"=".repeat(60)}

SUMMARY
  Total Income:    KES ${totalIncome.toLocaleString()}
  Total Expenses:  KES ${totalExpenses.toLocaleString()}
  Net Profit:      KES ${(totalIncome - totalExpenses).toLocaleString()}

${"=".repeat(60)}
BUDGET COMPARISON
${budgetComparison.map((b) => `  ${b.category.padEnd(20)} Allocated: KES ${b.allocated.toLocaleString().padStart(10)}   Spent: KES ${b.spent.toLocaleString().padStart(10)}`).join("\n")}

${"=".repeat(60)}
TRANSACTION DETAILS
${"Date".padEnd(12)} ${"Description".padEnd(25)} ${"Category".padEnd(15)} ${"Type".padEnd(10)} ${"Amount".padStart(12)}
${"-".repeat(74)}
${transactions.slice(0, 100).map((t) => `${t.date.padEnd(12)} ${t.description.slice(0, 24).padEnd(25)} ${t.category.padEnd(15)} ${t.type.padEnd(10)} KES ${t.amount.toLocaleString().padStart(8)}`).join("\n")}
`;

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dailybite-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
  }, [transactions, budgetComparison, totalIncome, totalExpenses, period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Analyze trends and generate financial summaries.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Monthly (30d)</SelectItem>
              <SelectItem value="90">Quarterly (90d)</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="365">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-2" />PDF Report</Button>
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

import { useState, useMemo } from "react";
import { Plus, AlertTriangle, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { type Budget, useCategories } from "@/lib/store";

interface Props {
  budgets: Budget[];
  onAdd: (b: Omit<Budget, "id">) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
  onDelete: (id: string) => void;
  onAudit?: (action: string, details: string) => void;
}

type BudgetPeriod = "monthly" | "quarterly" | "half-year" | "yearly";

export default function Budgets({ budgets, onAdd, onUpdate, onDelete, onAudit }: Props) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const { expenseCategories } = useCategories();
  const [form, setForm] = useState({ category: "", allocated: "", month: new Date().toISOString().slice(0, 7) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ category: form.category, allocated: Number(form.allocated), spent: 0, month: form.month, enabled: true });
    onAudit?.("Budget Created", `${form.category} - KES ${form.allocated}`);
    setOpen(false);
    setForm({ category: "", allocated: "", month: new Date().toISOString().slice(0, 7) });
  };

  const multiplier = period === "monthly" ? 1 : period === "quarterly" ? 3 : period === "half-year" ? 6 : 12;
  const periodLabel = period === "monthly" ? "Monthly" : period === "quarterly" ? "Quarterly" : period === "half-year" ? "6 Months" : "Yearly";

  const adjustedBudgets = useMemo(() => {
    return budgets.map((b) => ({
      ...b,
      allocatedAdj: b.allocated * multiplier,
      spentAdj: b.spent * multiplier,
    }));
  }, [budgets, multiplier]);

  const enabledBudgets = adjustedBudgets.filter((b) => b.enabled);
  const totalAllocated = enabledBudgets.reduce((s, b) => s + b.allocatedAdj, 0);
  const totalSpent = enabledBudgets.reduce((s, b) => s + b.spentAdj, 0);
  const overallPercent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Budget Management</h1>
          <p className="text-muted-foreground text-sm">Set and track budgets by category and period.</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="half-year">6 Months</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-serif">Create Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => <SelectItem key={c.id || c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Allocated Amount (KES)</Label>
                  <Input type="number" min="1" value={form.allocated} onChange={(e) => setForm({ ...form, allocated: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Start Month</Label>
                  <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full">Create Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg">Overall Budget ({periodLabel})</h2>
          <span className={`text-sm font-medium ${overallPercent > 90 ? "text-destructive" : "text-muted-foreground"}`}>{overallPercent}% used</span>
        </div>
        <Progress value={Math.min(overallPercent, 100)} className="h-3" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>KES {totalSpent.toLocaleString()} spent</span>
          <span>KES {totalAllocated.toLocaleString()} allocated</span>
        </div>
      </motion.div>

      {/* Budget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adjustedBudgets.map((b, i) => {
          const pct = b.allocatedAdj > 0 ? Math.round((b.spentAdj / b.allocatedAdj) * 100) : 0;
          const overBudget = pct > 100;
          const nearBudget = pct > 85 && !overBudget;

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-xl p-5 ${!b.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{b.category}</h3>
                <div className="flex items-center gap-2">
                  {(overBudget || nearBudget) && b.enabled && (
                    <AlertTriangle className={`w-4 h-4 ${overBudget ? "text-destructive" : "text-accent"}`} />
                  )}
                  <button
                    onClick={() => {
                      onUpdate(b.id, { enabled: !b.enabled });
                      onAudit?.("Budget Toggle", `${b.category} ${b.enabled ? "disabled" : "enabled"}`);
                    }}
                    title={b.enabled ? "Disable budget" : "Enable budget"}
                  >
                    {b.enabled ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => { onDelete(b.id); onAudit?.("Budget Deleted", b.category); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {b.enabled && (
                <>
                  <Progress value={Math.min(pct, 100)} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>KES {b.spentAdj.toLocaleString()}</span>
                    <span className={overBudget ? "text-destructive font-medium" : ""}>{pct}%</span>
                    <span>KES {b.allocatedAdj.toLocaleString()}</span>
                  </div>
                </>
              )}
              {!b.enabled && <p className="text-xs text-muted-foreground">Budgeting disabled</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

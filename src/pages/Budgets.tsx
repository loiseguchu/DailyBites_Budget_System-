import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { type Budget, EXPENSE_CATEGORIES } from "@/lib/store";

interface Props {
  budgets: Budget[];
  onAdd: (b: Omit<Budget, "id">) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
}

export default function Budgets({ budgets, onAdd, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", allocated: "", month: new Date().toISOString().slice(0, 7) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ category: form.category, allocated: Number(form.allocated), spent: 0, month: form.month });
    setOpen(false);
    setForm({ category: "", allocated: "", month: new Date().toISOString().slice(0, 7) });
  };

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPercent = Math.round((totalSpent / totalAllocated) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Budget Management</h1>
          <p className="text-muted-foreground text-sm">Set and track monthly budgets by category.</p>
        </div>
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
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allocated Amount (KES)</Label>
                <Input type="number" min="1" value={form.allocated} onChange={(e) => setForm({ ...form, allocated: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Create Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg">Overall Budget</h2>
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
        {budgets.map((b, i) => {
          const pct = Math.round((b.spent / b.allocated) * 100);
          const overBudget = pct > 100;
          const nearBudget = pct > 85 && !overBudget;

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{b.category}</h3>
                {(overBudget || nearBudget) && (
                  <AlertTriangle className={`w-4 h-4 ${overBudget ? "text-destructive" : "text-accent"}`} />
                )}
              </div>
              <Progress value={Math.min(pct, 100)} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>KES {b.spent.toLocaleString()}</span>
                <span className={overBudget ? "text-destructive font-medium" : ""}>{pct}%</span>
                <span>KES {b.allocated.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

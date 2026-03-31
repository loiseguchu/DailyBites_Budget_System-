import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Transaction, type User, useCategories } from "@/lib/store";

interface Props {
  user: User;
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, "id">) => void;
  onDelete: (id: string) => void;
  onAudit?: (action: string, details: string) => void;
}

export default function Transactions({ user, transactions, onAdd, onDelete, onAudit }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const { incomeCategories, expenseCategories } = useCategories();

  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    receipt: "",
  });

  const visibleTransactions = useMemo(() => {
    if (user.role === "manager") return transactions;
    return transactions.filter((t) => t.recordedBy === user.name);
  }, [transactions, user]);

  const filtered = visibleTransactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      date: form.date,
      recordedBy: user.name,
      receipt: form.receipt || undefined,
    });
    onAudit?.("Transaction Added", `${form.type} - ${form.category} - KES ${form.amount} by ${user.name}`);
    setOpen(false);
    setForm({ type: "income", category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0], receipt: "" });
  };

  const handleDelete = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    onDelete(id);
    if (txn) onAudit?.("Transaction Deleted", `${txn.type} - ${txn.category} - KES ${txn.amount}`);
  };

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {user.role === "staff" ? "View and record your transactions." : "View and manage all staff transactions."}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">New Transaction</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense", category: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Receipt / Reference</Label>
                <Textarea
                  value={form.receipt}
                  onChange={(e) => setForm({ ...form, receipt: e.target.value })}
                  placeholder="Receipt number, supplier details, or notes..."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Save Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((t) => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="capitalize">
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                {user.role === "manager" && <th className="px-5 py-3 font-medium">Recorded By</th>}
                <th className="px-5 py-3 font-medium">Receipt</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.slice(0, 50).map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-muted-foreground">{new Date(t.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3">{t.description}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{t.category}</span></td>
                    {user.role === "manager" && <td className="px-5 py-3 text-muted-foreground">{t.recordedBy}</td>}
                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{t.receipt || "—"}</td>
                    <td className={`px-5 py-3 text-right font-medium ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                      {t.type === "income" ? "+" : "-"} KES {t.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      {user.role === "manager" && (
                        <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

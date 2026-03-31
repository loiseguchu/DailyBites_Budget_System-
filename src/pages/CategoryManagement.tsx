import { useState } from "react";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Category } from "@/lib/store";

interface Props {
  categories: Category[];
  onAdd: (c: Omit<Category, "id">) => void;
  onDelete: (id: string) => void;
  onToggleBudget: (id: string) => void;
  onAudit?: (action: string, details: string) => void;
}

export default function CategoryManagement({ categories, onAdd, onDelete, onToggleBudget, onAudit }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "expense" as "income" | "expense" });

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.some((c) => c.name.toLowerCase() === form.name.toLowerCase())) {
      alert("Category already exists!");
      return;
    }
    onAdd({ name: form.name, type: form.type, budgetEnabled: form.type === "expense" });
    onAudit?.("Category Added", `${form.type} - ${form.name}`);
    setOpen(false);
    setForm({ name: "", type: "expense" });
  };

  const handleDelete = (cat: Category) => {
    onDelete(cat.id);
    onAudit?.("Category Deleted", `${cat.type} - ${cat.name}`);
  };

  const handleToggle = (cat: Category) => {
    onToggleBudget(cat.id);
    onAudit?.("Budget Toggle", `${cat.name} budgeting ${cat.budgetEnabled ? "disabled" : "enabled"}`);
  };

  const renderSection = (title: string, items: Category[], icon: string) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
      <h2 className="font-serif text-lg mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary" />
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">No categories yet.</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cat.type === "income" ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground"}`}>
                    {cat.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cat.type === "expense" && (
                    <button
                      onClick={() => handleToggle(cat)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={cat.budgetEnabled ? "Disable budgeting" : "Enable budgeting"}
                    >
                      {cat.budgetEnabled ? (
                        <ToggleRight className="w-5 h-5 text-success" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="hidden sm:inline">{cat.budgetEnabled ? "Budget On" : "Budget Off"}</span>
                    </button>
                  )}
                  <button onClick={() => handleDelete(cat)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Category Management</h1>
          <p className="text-muted-foreground text-sm">Add, remove, and manage transaction categories.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Add New Category</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Delivery Charges" required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {renderSection("Income Categories", incomeCategories, "income")}
      {renderSection("Expense Categories", expenseCategories, "expense")}
    </div>
  );
}

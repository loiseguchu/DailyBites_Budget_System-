import { useState } from "react";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight, Wallet, Shield, Pencil } from "lucide-react";
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
  onUpdate?: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
  onToggleBudget: (id: string) => void;
  onAudit?: (action: string, details: string) => void;
}

export default function CategoryManagement({ categories, onAdd, onUpdate, onDelete, onToggleBudget, onAudit }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense" as "income" | "expense", budgetAmount: "", staffVisible: true });

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isExpense = form.type === "expense";
    if (editingId && onUpdate) {
      onUpdate(editingId, {
        name: form.name,
        type: form.type,
        staffVisible: form.staffVisible,
        budgetAmount: isExpense && form.budgetAmount !== "" ? Number(form.budgetAmount) : null,
      });
      onAudit?.("Category Updated", `${form.type} - ${form.name}`);
    } else {
      if (categories.some((c) => c.name.toLowerCase() === form.name.toLowerCase())) {
        alert("Category already exists!");
        return;
      }
      onAdd({
        name: form.name,
        type: form.type,
        budgetEnabled: isExpense,
        budgetAmount: isExpense && form.budgetAmount !== "" ? Number(form.budgetAmount) : null,
        staffVisible: form.staffVisible,
      });
      onAudit?.("Category Added", `${form.type} - ${form.name}${isExpense && form.budgetAmount ? ` (Budget: KES ${Number(form.budgetAmount).toLocaleString()})` : ""} - Staff Visible: ${form.staffVisible}`);
    }
    setOpen(false);
    setEditingId(null);
    setForm({ name: "", type: "expense", budgetAmount: "", staffVisible: true });
  };

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      type: cat.type,
      budgetAmount: cat.budgetAmount != null ? String(cat.budgetAmount) : "",
      staffVisible: cat.staffVisible,
    });
    setOpen(true);
  };

  const handleDelete = (cat: Category) => {
    onDelete(cat.id);
    onAudit?.("Category Deleted", `${cat.type} - ${cat.name}`);
  };



  const renderSection = (title: string, items: Category[], colorAccent: string) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`glass-card rounded-xl p-5 border-l-4 ${colorAccent}`}>
      <h2 className="font-serif text-lg mb-4 flex items-center gap-2">
        <Tag className={`w-5 h-5 ${colorAccent.includes("success") ? "text-success" : "text-accent"}`} />
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
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.type === "income" ? "bg-success/15 text-success" : "bg-accent/15 text-accent-foreground"}`}>
                    {cat.type}
                  </span>
                  {cat.budgetAmount && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      KES {cat.budgetAmount.toLocaleString()}
                    </span>
                  )}
                  {!cat.staffVisible && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Manager Only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">

                  <button onClick={() => handleEditClick(cat)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                    <Pencil className="w-4 h-4" />
                  </button>
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
            <Button onClick={() => { setEditingId(null); setForm({ name: "", type: "expense", budgetAmount: "", staffVisible: true }); }} className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-4 h-4 mr-2" />Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit Category" : "Add New Category"}</DialogTitle></DialogHeader>
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
              <div className="flex items-center justify-between border border-border rounded-lg p-3">
                <div className="space-y-0.5">
                  <Label>Visible to Staff</Label>
                  <p className="text-xs text-muted-foreground">Turn off if this category is manager-only (e.g. Rent, Salary).</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, staffVisible: !form.staffVisible })} className="text-muted-foreground hover:text-foreground">
                  {form.staffVisible ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              {form.type === "expense" && (
                <div className="space-y-2">
                  <Label>Monthly Budget Amount (KES)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.budgetAmount}
                    onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
                    placeholder="e.g. 50000"
                  />
                  <p className="text-xs text-muted-foreground">Optional — set a monthly budget limit for this category.</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">{editingId ? "Save Changes" : "Add Category"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {renderSection("Income Categories", incomeCategories, "border-l-success")}
      {renderSection("Expense Categories", expenseCategories, "border-l-accent")}
    </div>
  );
}

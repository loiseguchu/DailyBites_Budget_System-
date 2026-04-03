import { useState } from "react";
import { Trash2, UserPlus, Users, Mail, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type User, useUsers } from "@/lib/store";

interface Props {
  currentUser: User;
  onAudit?: (action: string, details: string) => void;
}

export default function StaffManagement({ currentUser, onAudit }: Props) {
  const { users, addUser, deleteUser } = useUsers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const staffUsers = users.filter((u) => u.role === "staff");
  const managerUsers = users.filter((u) => u.role === "admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some((u) => u.email === form.email)) {
      alert("A user with this email already exists.");
      return;
    }
    addUser({ name: form.name, email: form.email, password: form.password, role: "staff" });
    onAudit?.("Staff Added", `${form.name} (${form.email}) by ${currentUser.name}`);
    setOpen(false);
    setForm({ name: "", email: "", password: "" });
  };

  const handleDelete = (u: User) => {
    deleteUser(u.id);
    onAudit?.("Staff Removed", `${u.name} (${u.email}) by ${currentUser.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif">Staff Management</h1>
          <p className="text-muted-foreground text-sm">Add and manage staff accounts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Add New Staff Member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. john@dailybite.co.ke" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" required minLength={6} />
              </div>
              <Button type="submit" className="w-full">Add Staff Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Managers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg">Managers / Admins</h2>
          <span className="text-xs text-muted-foreground ml-auto">{managerUsers.length} admin(s)</span>
        </div>
        <div className="space-y-3">
          {managerUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">{u.role}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staff */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-lg">Staff Members</h2>
          <span className="text-xs text-muted-foreground ml-auto">{staffUsers.length} member(s)</span>
        </div>
        {staffUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No staff members yet. Click "Add Staff" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {staffUsers.map((u) => (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

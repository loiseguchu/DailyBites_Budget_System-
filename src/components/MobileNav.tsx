import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, FileBarChart, Coffee, Menu, X, LogOut, Users, Tag, Shield } from "lucide-react";
import { type User } from "@/lib/store";
import { useState } from "react";

interface Props {
  user: User;
  onLogout: () => void;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, managerOnly: false },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, managerOnly: false },
  { to: "/budgets", label: "Budgets", icon: Wallet, managerOnly: true },
  { to: "/reports", label: "Reports", icon: FileBarChart, managerOnly: true },
  { to: "/categories", label: "Categories", icon: Tag, managerOnly: true },
  { to: "/staff", label: "Staff", icon: Users, managerOnly: true },
  { to: "/audit", label: "Audit Trail", icon: Shield, managerOnly: true },
];

export default function MobileNav({ user, onLogout }: Props) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-accent" />
          <span className="font-serif text-lg">Daily Bite</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="border-b border-border bg-card px-4 pb-4 space-y-1">
          {navItems
            .filter((item) => !item.managerOnly || user.role === "manager")
            .map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-muted w-full"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

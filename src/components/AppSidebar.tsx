import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, FileBarChart, LogOut, Coffee, Users, Tag, Shield, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { type User } from "@/lib/store";

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

export default function AppSidebar({ user, onLogout }: Props) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Coffee className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-serif text-lg leading-tight text-sidebar-foreground">Daily Bite</h1>
          <p className="text-xs text-sidebar-foreground/60">Budget Manager</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {navItems
          .filter((item) => !item.managerOnly || user.role === "admin")
          .map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex flex-1 items-center justify-center py-2 rounded-lg bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-border transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onLogout}
            className="flex-[4] flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

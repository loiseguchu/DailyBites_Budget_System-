import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, FileBarChart, LogOut, Coffee } from "lucide-react";
import { type User } from "@/lib/store";

interface Props {
  user: User;
  onLogout: () => void;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/reports", label: "Reports", icon: FileBarChart },
];

export default function AppSidebar({ user, onLogout }: Props) {
  const location = useLocation();

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
          .filter((item) => !(item.to === "/budgets" && user.role === "staff") && !(item.to === "/reports" && user.role === "staff"))
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
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

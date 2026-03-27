import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  CalendarRange, 
  Wallet, 
  Clock, 
  Target, 
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useApplyBranding } from "@/hooks/use-branding";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "manager", "employee"] },
  { path: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr", "manager"] },
  { path: "/attendance", label: "Attendance", icon: CalendarDays, roles: ["admin", "hr", "manager", "employee"] },
  { path: "/leaves", label: "Leaves", icon: CalendarRange, roles: ["admin", "hr", "manager", "employee"] },
  { path: "/payroll", label: "Payroll", icon: Wallet, roles: ["admin", "hr", "employee"] },
  { path: "/timesheets", label: "Timesheets", icon: Clock, roles: ["admin", "hr", "manager", "employee"] },
  { path: "/performance", label: "Performance", icon: Target, roles: ["admin", "hr", "manager", "employee"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const branding = useApplyBranding(); // Re-use hook to get branding data here if needed

  const visibleItems = menuItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <div className="w-64 h-screen bg-card border-r border-border/50 flex flex-col justify-between sticky top-0 shrink-0 shadow-lg shadow-black/5 z-20">
      <div>
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          {branding?.logoUrl ? (
             <img src={branding.logoUrl} alt="Logo" className="h-8 max-w-[150px] object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {branding?.companyName || "HRMS"}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
            Main Menu
          </p>
          <nav className="space-y-1.5">
            {visibleItems.map((item) => {
              const isActive = location === item.path || location.startsWith(`${item.path}/`);
              return (
                <Link key={item.path} href={item.path} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        {user?.role === "admin" && (
          <Link href="/settings/branding" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium mb-2",
            location === "/settings/branding" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}>
            <Settings className="w-5 h-5 transition-transform group-hover:rotate-45" />
            Branding Settings
          </Link>
        )}
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  );
}

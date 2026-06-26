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
  Sparkles,
  FileText,
  Megaphone,
  CalendarHeart,
  Fingerprint,
  Shield,
  X,
  Settings2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useApplyBranding } from "@/hooks/use-branding";

const menuItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/employees",
    label: "Employees",
    icon: Users,
    roles: ["admin", "hr", "manager"],
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: CalendarDays,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/leaves",
    label: "Leaves",
    icon: CalendarRange,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/payroll",
    label: "Payroll",
    icon: Wallet,
    roles: ["admin", "hr", "employee"],
  },
  {
    path: "/timesheets",
    label: "Timesheets",
    icon: Clock,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/performance",
    label: "Performance",
    icon: Target,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/holidays",
    label: "Holidays",
    icon: CalendarHeart,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/announcements",
    label: "Announcements",
    icon: Megaphone,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/policies",
    label: "Policies",
    icon: Shield,
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    path: "/leave-rules",
    label: "Attendance Rules",
    icon: Settings2,
    roles: ["admin", "hr"],
  },
  {
    path: "/roles",
    label: "Roles & Permissions",
    icon: Shield,
    roles: ["admin"],
  },
  {
    path: "/audit-logs",
    label: "Audit Logs",
    icon: FileText,
    roles: ["admin", "hr"],
  },
  {
    path: "/export-import",
    label: "Export / Import",
    icon: FileText,
    roles: ["admin", "hr"],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const branding = useApplyBranding();

  const visibleItems = menuItems.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  const handleNav = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-64 h-screen glass-sidebar flex flex-col justify-between shrink-0 z-20">
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/30">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="h-7 max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {branding?.companyName || "HRMS"}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto max-h-[calc(100vh-180px)]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3 px-3">
            Menu
          </p>
          <nav className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive =
                location === item.path || location.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={handleNav}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-[18px] h-[18px] transition-transform group-hover:scale-110 shrink-0",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-primary",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-border/30">
        {(user?.role === "admin" || user?.role === "hr") && (
          <>
            <Link
              href="/settings/biometrics"
              onClick={handleNav}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-sm font-medium mb-0.5",
                location === "/settings/biometrics"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <Fingerprint className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />
              Biometrics
            </Link>
            <Link
              href="/settings/branding"
              onClick={handleNav}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-sm font-medium mb-0.5",
                location === "/settings/branding"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <Settings className="w-[18px] h-[18px] transition-transform group-hover:rotate-45" />
              Branding
            </Link>
          </>
        )}
        <button
          onClick={() => {
            logout();
            handleNav();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive group"
        >
          <LogOut className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  );
}

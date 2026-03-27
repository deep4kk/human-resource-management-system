import { Bell, Moon, Sun, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export function Header() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 flex items-center">
        <div className="relative w-96 group">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search employees, leaves, payroll..." 
            className="w-full h-11 pl-10 pr-4 bg-secondary/50 border border-transparent rounded-2xl focus:outline-none focus:border-primary/30 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105 active:scale-95"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="relative w-11 h-11 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105 active:scale-95">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
        </button>

        <div className="h-8 w-[1px] bg-border mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-foreground leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-accent p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-primary">{user?.name?.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

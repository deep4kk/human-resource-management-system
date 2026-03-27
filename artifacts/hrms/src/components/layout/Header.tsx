import { Bell, Moon, Sun, Search, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
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
    <header className="h-14 md:h-16 glass-header px-4 md:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-xl hover:bg-secondary text-muted-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block w-full max-w-xs lg:max-w-sm group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full h-9 pl-9 pr-4 glass-input rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center glass-btn bg-secondary/50 hover:bg-secondary text-foreground"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center glass-btn bg-secondary/50 hover:bg-secondary text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-border/50 mx-1 hidden md:block"></div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-foreground leading-none">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent p-[2px] shadow-md">
            <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xs text-primary">{user?.name?.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

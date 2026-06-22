import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@hrms/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        authLogin(data.token, data.user);
        setLocation("/dashboard");
      },
      onError: (err) => {
        setErrorMsg("Invalid credentials. Please try the demo accounts.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please enter email and password");
      return;
    }
    login({ data: { email, password } });
  };

  const setDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image injected via Vite public path */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Background"
          className="w-full h-full object-cover opacity-40 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-background/90 backdrop-blur-sm"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10"
      >
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 glass bg-white/80 dark:bg-card/80">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">
              Toyo Kambocha
            </span>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-8">
            Enter your credentials to access the portal.
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Work Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="name@toyokambocha.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Demo Accounts (Click to fill)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDemo("admin@toyokambocha.com", "admin123")}
                className="py-2 px-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium border border-border/50 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => setDemo("hr@toyokambocha.com", "hr123")}
                className="py-2 px-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium border border-border/50 transition-colors"
              >
                HR Mgr
              </button>
              <button
                onClick={() => setDemo("emp@toyokambocha.com", "emp123")}
                className="py-2 px-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium border border-border/50 transition-colors"
              >
                Employee
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Branding/Hero */}
        <div className="hidden lg:flex w-1/2 relative bg-primary items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent/80 mix-blend-multiply"></div>

          {/* Abstract floating elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          ></motion.div>
          <motion.div
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-20 w-40 h-40 bg-accent/30 rounded-full blur-3xl"
          ></motion.div>

          <div className="relative z-10 p-12 text-center text-primary-foreground">
            <h2 className="text-4xl font-display font-bold mb-6">
              Empower Your Workforce
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-md mx-auto">
              A comprehensive HR management suite designed to streamline your
              operations, nurture talent, and build a thriving company culture.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

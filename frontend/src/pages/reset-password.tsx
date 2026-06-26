import { useState, useEffect } from "react";
import { Lock, Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="glass p-8 rounded-3xl border border-white/20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
          <p className="text-muted-foreground mb-4">This password reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="text-primary hover:underline text-sm">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="glass p-8 rounded-3xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl">HRMS</span>
          </div>

          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
              <p className="text-muted-foreground mb-4">Your password has been changed successfully.</p>
              <Link href="/login" className="text-primary hover:underline text-sm">Sign in with new password</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold mb-2">Set New Password</h1>
              <p className="text-muted-foreground mb-6 text-sm">Enter your new password.</p>

              {error && <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border rounded-xl focus:border-primary outline-none transition-all" placeholder="New password" required minLength={8} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border rounded-xl focus:border-primary outline-none transition-all" placeholder="Confirm password" required minLength={8} />
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

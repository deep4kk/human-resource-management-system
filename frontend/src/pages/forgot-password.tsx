import { useState } from "react";
import { Mail, ArrowLeft, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

          {sent ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-4">If an account exists for {email}, we've sent a password reset link.</p>
              <Link href="/login" className="text-primary hover:underline text-sm">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold mb-2">Forgot Password</h1>
              <p className="text-muted-foreground mb-6 text-sm">Enter your email and we'll send you a reset link.</p>

              {error && <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border rounded-xl focus:border-primary outline-none transition-all" placeholder="your@email.com" required />
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to login</Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

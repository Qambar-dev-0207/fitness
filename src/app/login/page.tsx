"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Mail, Lock, Activity } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/protocol";
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: "var(--bg-page)", color: "var(--fg-page)" }}>
      <div className="organic-noise" />
      <div className="liquid-bg opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-12 space-y-10 relative z-10"
      >
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <span className="font-display text-4xl italic tracking-tighter" style={{ color: "var(--fg-page)" }}>SVORA</span>
          </Link>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.5em] text-gold-leaf">Welcome Back</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-gold-leaf"
                style={{ color: "var(--fg-muted)" }}
                size={18}
              />
              <input
                type="email" placeholder="Email Address" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-mono theme-input"
              />
            </div>
            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-gold-leaf"
                style={{ color: "var(--fg-muted)" }}
                size={18}
              />
              <input
                type="password" placeholder="Secure Password" required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm font-mono theme-input"
              />
            </div>
          </div>

          {error && (
            <p className="text-deep-red text-[10px] font-mono uppercase text-center">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-5 rounded-full bg-white text-void font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-gold-leaf transition-all duration-700 shadow-2xl flex items-center justify-center gap-4 group"
          >
            {loading
              ? <Activity size={14} className="animate-spin" />
              : <>Sign In <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
            }
          </button>
        </form>

        <p className="text-[10px] font-mono uppercase tracking-widest text-center" style={{ color: "var(--fg-muted)" }}>
          New here?{" "}
          <Link href="/register" className="text-gold-leaf/60 hover:text-gold-leaf transition-colors ml-2 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

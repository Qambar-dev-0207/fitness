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
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-onyx text-mercury flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="organic-noise" />
      <div className="liquid-bg opacity-20" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-12 space-y-10 relative z-10"
      >
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <span className="font-display text-4xl italic tracking-tighter text-white">ÉLAN</span>
          </Link>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.5em] text-gold-leaf">Verify Identity</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-leaf transition-colors" size={18} />
              <input 
                type="email" placeholder="Email Address" required
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-gold-leaf/50 transition-all text-sm font-mono"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-leaf transition-colors" size={18} />
              <input 
                type="password" placeholder="Secure Password" required
                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-gold-leaf/50 transition-all text-sm font-mono"
              />
            </div>
          </div>

          {error && <p className="text-deep-red text-[10px] font-mono uppercase text-center">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 rounded-full bg-white text-void font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-gold-leaf transition-all duration-700 shadow-2xl flex items-center justify-center gap-4 group"
          >
            {loading ? <Activity size={14} className="animate-spin" /> : <>Authorize Access <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <p className="text-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
          New to the Society? <Link href="/register" className="text-gold-leaf/60 hover:text-gold-leaf transition-colors ml-2 underline underline-offset-4">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}

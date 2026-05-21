"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Activity, Flame, ChevronRight, X, Info, Award } from "lucide-react";

export const JournalSection = () => {
  const [activeTab, setActiveTab] = useState<"calories" | "scan">("calories");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch("/api/journal/log");
    const data = await res.json();
    if (Array.isArray(data)) setLogs(data);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "current") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "before") setBeforeImg(reader.result as string);
        else setCurrentImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const logCalories = async () => {
    if (!calories) return;
    const res = await fetch("/api/journal/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "calorie", cal: calories, pro: protein }),
    });
    if (res.ok) {
      fetchLogs();
      setCalories("");
      setProtein("");
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeImage: beforeImg, currentImage: currentImg })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex gap-8 border-b border-[var(--border-card)] pb-4">
        <button 
          onClick={() => setActiveTab("calories")}
          className={`text-xl font-serif italic transition-colors ${activeTab === "calories" ? "text-gold-leaf" : "text-[var(--fg-muted)] hover:text-[var(--fg-page)]"}`}
        >
          Calorie Tracker
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`text-xl font-serif italic transition-colors ${activeTab === "scan" ? "text-gold-leaf" : "text-[var(--fg-muted)] hover:text-[var(--fg-page)]"}`}
        >
          Progress Photos
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "calories" ? (
          <motion.div 
            key="calories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-2 gap-12"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Calories</label>
                  <input 
                    type="number" value={calories} onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl p-4 text-[var(--fg-page)] text-2xl font-mono outline-none focus:border-gold-leaf/30"
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Protein (g)</label>
                  <input 
                    type="number" value={protein} onChange={(e) => setProtein(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl p-4 text-[var(--fg-page)] text-2xl font-mono outline-none focus:border-gold-leaf/30"
                    placeholder="000"
                  />
                </div>
              </div>
              <button onClick={logCalories} className="w-full py-4 rounded-full bg-[var(--fg-page)] text-[var(--bg-page)] font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-gold-leaf transition-all">
                Synchronize Log
              </button>
            </div>

            <div className="glass-card p-8 h-[350px] overflow-y-auto">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)] mb-6 border-b border-[var(--border-card)] pb-4">Today's Log</h4>
              <div className="space-y-4">
                {logs.length === 0 && <p className="text-[10px] font-mono uppercase text-[var(--fg-submuted)] text-center py-12">Nothing logged yet</p>}
                {logs.filter(l => l.type === "calorie").map((log, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-[var(--border-card)]">
                    <span className="text-[9px] font-mono text-[var(--fg-muted)]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <div className="text-right">
                      <div className="text-[var(--fg-page)] font-mono text-lg">{log.cal} kcal</div>
                      <div className="text-gold-leaf/60 text-[9px] font-mono uppercase">{log.pro}g Protein</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Before Photo</span>
                <label className="block w-full aspect-[3/4] glass-card relative cursor-pointer group">
                  {beforeImg ? <img src={beforeImg} className="w-full h-full object-cover opacity-40 grayscale" /> : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <Upload size={24} className="text-[var(--fg-submuted)] group-hover:text-gold-leaf transition-colors" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Upload Photo</span>
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleImage(e, "before")} className="hidden" accept="image/*" />
                </label>
              </div>
              <div className="space-y-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Current Photo</span>
                <label className="block w-full aspect-[3/4] glass-card relative cursor-pointer group">
                  {currentImg ? <img src={currentImg} className="w-full h-full object-cover opacity-40 grayscale" /> : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <Upload size={24} className="text-[var(--fg-submuted)] group-hover:text-gold-leaf transition-colors" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Upload Photo</span>
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleImage(e, "current")} className="hidden" accept="image/*" />
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={runAnalysis} disabled={!beforeImg || !currentImg || analyzing}
                className="px-16 py-6 rounded-full bg-gold-leaf text-void font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-[var(--fg-page)] transition-all disabled:opacity-20 flex items-center gap-4"
              >
                {analyzing ? "Analyzing..." : "Compare My Progress"}
                {analyzing && <Activity size={14} className="animate-spin" />}
              </button>
            </div>

            {analysis && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-12 glass-card border-gold-leaf/20 bg-gold-leaf/5 space-y-10">
                <div className="flex justify-between items-center border-b border-[var(--border-card)] pb-6">
                  <h3 className="text-3xl font-serif italic text-[var(--fg-page)] tracking-tighter">Your Progress Report</h3>
                  <Award size={20} className="text-gold-leaf" />
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Muscle Change</span>
                      <div className="text-5xl font-serif italic text-[var(--fg-page)]">{analysis.muscleMassChange}</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Fat Change</span>
                      <div className="text-5xl font-serif italic text-[var(--fg-page)]">{analysis.bodyFatChange}</div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)]">Posture Check</span>
                      <p className="text-sm font-light text-[var(--fg-muted)] leading-relaxed italic font-serif">&quot;{analysis.postureAnalysis}&quot;</p>
                    </div>
                    <div className="space-y-2 p-6 rounded-3xl bg-gold-leaf/5 border border-gold-leaf/10">
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-gold-leaf">Training Tip</span>
                      <p className="text-sm font-light text-[var(--fg-page)] leading-relaxed mt-2 italic font-serif">&quot;{analysis.routineAdjustments}&quot;</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

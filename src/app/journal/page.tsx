"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ChevronRight, Activity, Flame, ScanLine, Upload } from "lucide-react";
import Link from "next/link";

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState<"calories" | "scan">("calories");
  
  // Calorie State
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [logs, setLogs] = useState<{cal: string, pro: string, time: string}[]>([]);

  // Scan State
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-body", {
        method: "POST",
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

  const logCalories = () => {
    if (!calories) return;
    setLogs(prev => [...prev, { cal: calories, pro: protein, time: new Date().toLocaleTimeString() }]);
    setCalories("");
    setProtein("");
  };

  return (
    <div className="min-h-screen bg-jet-black text-soft-peach pb-32">
      <nav className="fixed top-0 w-full z-40 bg-jet-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <Link href="/protocol" className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60 hover:text-gold-leaf transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Protocol
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500">Somatic Journal</span>
      </nav>

      <div className="pt-32 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="flex gap-8 mb-12 border-b border-white/5 pb-4">
          <button 
            onClick={() => setActiveTab("calories")}
            className={`text-2xl font-serif italic transition-colors ${activeTab === "calories" ? "text-gold-leaf" : "text-white/40 hover:text-white"}`}
          >
            Metabolic Log
          </button>
          <button 
            onClick={() => setActiveTab("scan")}
            className={`text-2xl font-serif italic transition-colors ${activeTab === "scan" ? "text-gold-leaf" : "text-white/40 hover:text-white"}`}
          >
            Body Scan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "calories" ? (
            <motion.div 
              key="calories"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="space-y-12"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Calories</label>
                    <input 
                      type="number" 
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-2xl font-mono focus:border-gold-leaf outline-none transition-colors"
                      placeholder="0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Protein (g)</label>
                    <input 
                      type="number" 
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-2xl font-mono focus:border-gold-leaf outline-none transition-colors"
                      placeholder="000"
                    />
                  </div>
                  <button 
                    onClick={logCalories}
                    className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-gold-leaf transition-colors"
                  >
                    Log Entry
                  </button>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 h-[400px] overflow-y-auto">
                  <h3 className="text-xl font-serif italic text-white mb-6">Daily Intake</h3>
                  <div className="space-y-4">
                    {logs.length === 0 && <p className="text-white/20 text-sm">No entries today.</p>}
                    {logs.map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border-b border-white/5">
                        <span className="text-[10px] font-mono text-white/40">{log.time}</span>
                        <div className="text-right">
                          <div className="text-white font-mono">{log.cal} kcal</div>
                          <div className="text-gold-leaf text-xs">{log.pro}g Protein</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="space-y-12"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Before Image */}
                <div className="space-y-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Baseline Scan</div>
                  <label className="block w-full aspect-[3/4] bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden relative cursor-pointer group hover:border-white/30 transition-colors">
                    {beforeImg ? (
                      <img src={beforeImg} className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Upload size={32} className="text-white/20 group-hover:text-gold-leaf transition-colors" />
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Upload Baseline</span>
                      </div>
                    )}
                    <input type="file" onChange={(e) => handleImage(e, "before")} className="hidden" accept="image/*" />
                  </label>
                </div>

                {/* Current Image */}
                <div className="space-y-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Current Scan</div>
                  <label className="block w-full aspect-[3/4] bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden relative cursor-pointer group hover:border-white/30 transition-colors">
                    {currentImg ? (
                      <img src={currentImg} className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Upload size={32} className="text-white/20 group-hover:text-gold-leaf transition-colors" />
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Upload Current</span>
                      </div>
                    )}
                    <input type="file" onChange={(e) => handleImage(e, "current")} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={runAnalysis}
                  disabled={!beforeImg || !currentImg || analyzing}
                  className="px-12 py-5 rounded-full bg-gold-leaf text-black font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-4"
                >
                  {analyzing ? "Synthesizing..." : "Initiate Biometric Comparison"}
                  {analyzing && <Activity size={14} className="animate-spin" />}
                </button>
              </div>

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="p-12 border border-gold-leaf/20 bg-gold-leaf/5 rounded-[3rem] space-y-8"
                >
                  <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <h3 className="text-3xl font-serif italic text-white">Analysis Complete.</h3>
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf">Verified</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Muscle Delta</div>
                        <div className="text-4xl font-serif italic text-white">{analysis.muscleMassChange}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Adipose Shift</div>
                        <div className="text-4xl font-serif italic text-white">{analysis.bodyFatChange}</div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Structural Note</div>
                        <p className="text-white/80 leading-relaxed text-sm">{analysis.postureAnalysis}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf/80">Protocol Adjustment</div>
                        <p className="text-white/80 leading-relaxed text-sm">{analysis.routineAdjustments}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

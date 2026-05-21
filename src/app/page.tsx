"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Play, Globe, Activity, Heart, Shield, Asterisk, Plus, Minus, Command, Zap } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { DecryptedText } from "@/components/DecryptedText";

// --- ANIMATION CONFIG ---
const easeUltra = [0.85, 0, 0.15, 1] as any;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1.5, ease: easeUltra } 
  }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- COMPONENTS ---

const SectionTitle = ({ title, sub }: { title: string; sub: string }) => (
  <motion.div variants={fadeUp} className="mb-20 space-y-4">
    <div className="flex items-center gap-4">
       <span className="w-12 h-[1px] bg-gold-leaf" />
       <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf">{sub}</span>
    </div>
    <h2 className="text-6xl md:text-8xl font-serif italic text-white tracking-tighter leading-none">{title}</h2>
  </motion.div>
);

export default function EnhancedLanding() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Kinetic Parallax
  const heroY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [0, 10]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-void text-mercury selection:bg-gold-leaf selection:text-void overflow-hidden">
      
      {/* --- LAYERED ATMOSPHERE --- */}
      <div className="fixed inset-0 blueprint-grid opacity-30 z-0 pointer-events-none" />
      <div className="light-leak top-[-20%] left-[-10%] opacity-30" />
      <div className="light-leak bottom-[-20%] right-[-10%] opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_60%)]" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none z-10 mix-blend-overlay" />

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-8 md:px-14 flex justify-between items-center mix-blend-difference pointer-events-none">
        <Link href="/" className="group flex flex-col pointer-events-auto">
          <span className="font-serif text-4xl italic tracking-tighter text-white hover:text-gold-leaf transition-colors duration-500">SVORA</span>
          <div className="h-[1px] w-0 bg-gold-leaf group-hover:w-full transition-all duration-700" />
        </Link>
        
        <div className="hidden lg:flex gap-16 pointer-events-auto items-center">
          {["Philosophy", "Method"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/60 hover:text-gold-leaf transition-colors duration-500 relative group overflow-hidden">
              <span className="inline-block transition-transform duration-500 group-hover:-translate-y-full">{item}</span>
              <span className="absolute top-0 left-0 inline-block transition-transform duration-500 translate-y-full group-hover:translate-y-0 text-gold-leaf">{item}</span>
            </Link>
          ))}
          <Link href="/uplink" className="btn-kinetic bg-white text-black hover:text-white hover:bg-void transition-colors">
             Initialize
          </Link>
        </div>
      </nav>

      {/* --- HERO: THE BLUEPRINT --- */}
      <section className="relative h-screen flex flex-col justify-center px-8 md:px-20 lg:px-40 overflow-hidden">
        <motion.div 
          style={{ y: heroY, rotateX, opacity }} 
          className="relative z-20 perspective-[2000px]"
        >
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">
            
            {/* HUD Header */}
            <motion.div variants={fadeUp} className="flex items-center gap-6 mb-8 border-l-2 border-gold-leaf pl-6 py-2">
               <Zap size={16} className="text-gold-leaf animate-pulse" />
               <div className="flex flex-col">
                 <span className="text-[10px] font-mono uppercase tracking-[0.6em] text-[var(--fg-page)]/80">AI Personal Training</span>
                 <span className="text-[9px] font-mono uppercase tracking-widest text-gold-leaf/60">Powered by AI // v.2.6</span>
               </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 className="text-[13vw] font-serif leading-[0.8] tracking-tighter text-reveal-mask relative mix-blend-difference">
              <span className="block text-[var(--fg-page)]">Elevate</span>
              <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-gold-leaf via-[var(--fg-page)] to-gold-leaf pr-10 ml-[0.5em]">Reality.</span>
            </motion.h1>

            {/* Sub-content & CTA */}
            <div className="grid lg:grid-cols-12 gap-24 items-end mt-12">
              <motion.div variants={fadeUp} className="lg:col-span-5 space-y-12">
                <div className="relative">
                   <p className="text-xl md:text-2xl font-light leading-relaxed text-[var(--fg-muted)] font-serif italic border-l border-[var(--border-card)] pl-6">
                     A plan built for you — <br />
                     <span className="text-[var(--fg-page)]">not everyone else.</span>
                   </p>
                   {/* Luxury Badge */}
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 1, duration: 1 }}
                     className="absolute -right-12 top-0 hidden xl:block"
                   >
                      <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-gold-leaf/20 bg-gold-leaf/5 backdrop-blur-md">
                         <Asterisk size={10} className="text-gold-leaf animate-spin-slow" />
                         <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-gold-leaf">Somatic Excellence</span>
                      </div>
                   </motion.div>
                </div>
                <div className="flex gap-8 items-center">
                   <Link href="/uplink" className="btn-kinetic px-12 py-6 bg-[var(--fg-page)] text-[var(--bg-page)] font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-[var(--bg-page)]/90 hover:shadow-[0_0_50px_rgba(212,175,55,0.2)] transition-all duration-700">
                     Build My Plan
                   </Link>
                   <button className="flex items-center gap-4 group px-6 py-3 rounded-full hover:bg-[var(--fg-page)]/5 transition-colors">
                      <div className="w-10 h-10 rounded-full border border-[var(--border-card)] flex items-center justify-center group-hover:border-gold-leaf transition-colors duration-500 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gold-leaf opacity-0 group-hover:opacity-10 transition-opacity" />
                         <Play size={12} fill="currentColor" className="ml-0.5 text-[var(--fg-muted)] group-hover:text-gold-leaf" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] group-hover:text-[var(--fg-page)] transition-colors">How It Works</span>
                   </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating HUD Sidebar - ENHANCED VISIBILITY */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[28vw] h-[60vh] hud-panel p-12 hidden lg:flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity duration-700 group/hud">
           {/* Top Metric */}
           <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--border-card)] pb-4">
                <span className="text-[9px] font-mono text-gold-leaf uppercase tracking-[0.4em]">Live Stats</span>
                <div className="w-2 h-2 bg-emerald-glow rounded-full animate-ping" />
              </div>
              
              <div className="flex gap-[2px] h-12 items-end">
                 {[...Array(24)].map((_, i) => (
                   <motion.div 
                     key={i}
                     animate={{ height: ["20%", `${((Math.sin(i * 0.5) + 1) / 2) * 80 + 20}%`, "20%"] }}
                     transition={{ duration: ((Math.cos(i * 0.5) + 1) / 2) * 1.5 + 0.5, repeat: Infinity, ease: "easeInOut" }}
                     className="w-1 bg-[var(--fg-submuted)] group-hover/hud:bg-gold-leaf/60 transition-colors duration-500 rounded-t-sm"
                   />
                 ))}
              </div>
           </div>

           {/* Middle Graphic */}
           <div className="relative aspect-square border border-[var(--border-card)] rounded-full flex items-center justify-center">
              <div className="absolute inset-0 border border-dashed border-[var(--border-input)] rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 border border-[var(--border-card)] rounded-full" />
              <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--fg-muted)] animate-pulse">Analyzing</div>
           </div>

           {/* Bottom Data */}
           <div className="space-y-2">
              <span className="text-[9px] font-mono text-gold-leaf uppercase tracking-[0.4em]">Body Type</span>
              <div className="text-5xl font-serif italic text-[var(--fg-page)]/90 uppercase tracking-tighter mix-blend-overlay">Athletic</div>
              <div className="h-[1px] w-full bg-[var(--border-card)] mt-4 relative overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gold-leaf/50 w-1/2 blur-sm"
                />
              </div>
           </div>
        </div>
      </section>

      {/* --- FEATURES: THE BENTO GRID --- */}
      <section id="method" className="py-48 px-8 md:px-20 relative z-20 bg-[var(--bg-page)] border-t border-[var(--border-card)]">
        <SectionTitle title="How It Works." sub="The process" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Card 1: AI Engine */}
           <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
             className="bento-luxe md:col-span-2 group"
           >
              <div className="absolute top-10 right-10 opacity-40 group-hover:opacity-100 transition-opacity">
                 <Activity className="text-gold-leaf" size={40} strokeWidth={1} />
              </div>
              <div className="space-y-8 max-w-xl relative z-10">
                 <h3 className="text-4xl font-serif italic text-[var(--fg-page)]">AI-Powered Plans.</h3>
                 <p className="text-[var(--fg-muted)] leading-relaxed font-light text-lg">
                    Our AI studies your body type, lifestyle, and goals to build a workout plan that actually fits your life — and updates as you improve.
                 </p>
                 <div className="pt-4 flex gap-4">
                    {["Personal", "Smart", "Adaptive"].map(tag => (
                      <span key={tag} className="text-[9px] font-mono uppercase tracking-widest px-4 py-2 border border-[var(--border-input)] rounded-full text-[var(--fg-muted)] bg-[var(--bg-input)]">{tag}</span>
                    ))}
                 </div>
              </div>
              {/* Subtle Grid BG */}
              <div className="absolute inset-0 blueprint-grid opacity-10 pointer-events-none" />
           </motion.div>

           {/* Card 2: Form Check */}
           <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
             className="bento-luxe group flex flex-col justify-between"
           >
              <Shield className="text-[var(--fg-muted)] group-hover:text-gold-leaf transition-colors duration-500" size={32} strokeWidth={1} />
              <div className="space-y-4">
                 <h3 className="text-3xl font-serif italic text-[var(--fg-page)]">Form Guide.</h3>
                 <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                    Watch exercise videos and see exactly how to perform each movement with proper form.
                 </p>
              </div>
           </motion.div>

           {/* Card 3: Nutrition */}
           <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
             className="bento-luxe group flex flex-col justify-between"
           >
              <Heart className="text-[var(--fg-muted)] group-hover:text-gold-leaf transition-colors duration-500" size={32} strokeWidth={1} />
              <div className="space-y-4">
                 <h3 className="text-3xl font-serif italic text-[var(--fg-page)]">Nutrition.</h3>
                 <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                    Simple nutrition guides to fuel your workouts and speed up your recovery.
                 </p>
              </div>
           </motion.div>

           {/* Card 4: Long Card */}
           <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
             className="bento-luxe md:col-span-2 group flex flex-col md:flex-row gap-12 items-center border border-[var(--border-input)] hover:border-gold-leaf/30"
           >
              <div className="md:w-1/2 space-y-6">
                 <h3 className="text-4xl font-serif italic text-[var(--fg-page)]">Track Your Progress.</h3>
                 <p className="text-[var(--fg-muted)] leading-relaxed font-light">
                    Every session matters. We track your workouts so you always know you're moving forward — not spinning your wheels.
                 </p>
                 <Link href="/uplink" className="inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-gold-leaf hover:gap-6 transition-all">
                    Start Now <ArrowUpRight size={14} />
                 </Link>
              </div>
              <div className="md:w-1/2 w-full h-48 border-t border-b border-[var(--border-card)] bg-[var(--bg-input)] relative overflow-hidden backdrop-blur-md">
                 <div className="absolute inset-0 blueprint-grid opacity-30" />
                 <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full h-full flex items-end justify-between gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 95].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1, ease: easeUltra }}
                          className="w-full bg-[var(--fg-submuted)] hover:bg-gold-leaf transition-colors duration-300 rounded-t-sm"
                        />
                      ))}
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* --- EXERCISE VISUALS: SOMATIC PROFILES --- */}
      <section className="py-24 space-y-48 relative z-20">
        
        {/* Female Profile: ARCHITECTURAL FLOW */}
        <div className="grid lg:grid-cols-2 gap-24 items-center px-8 md:px-20 lg:px-40">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="relative aspect-[4/5] bg-[var(--bg-page)] border border-[var(--border-card)] overflow-hidden group"
          >
            {/* Image Layer */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-40 group-hover:scale-105 transition-transform duration-[3s] ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/20 to-transparent opacity-90" />
            
            {/* Biometric Scanner Line */}
            <motion.div 
              animate={{ top: ["-10%", "110%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-gold-leaf/40 blur-[2px] z-30 pointer-events-none"
            />
            <motion.div 
              animate={{ top: ["-10%", "110%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[1px] bg-[var(--fg-page)]/60 z-30 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.5)]"
            />

            {/* Floating HUD: Top Left */}
            <div className="absolute top-10 left-10 z-40 space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-[var(--fg-muted)]">Neural Link: ACTIVE</span>
               </div>
               <div className="w-48 h-[1px] bg-[var(--border-card)] relative overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-[var(--fg-page)]/40 w-1/4"
                  />
               </div>
            </div>

            {/* Circular Pulse Graphic */}
            <div className="absolute bottom-10 right-10 z-40 opacity-40">
               <svg width="80" height="80" viewBox="0 0 100 100" className="rotate-[-90deg]">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--fg-muted)]" />
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill="none" stroke="currentColor" strokeWidth="1" 
                    strokeDasharray="283"
                    animate={{ strokeDashoffset: [283, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="text-gold-leaf" 
                  />
                  <text x="50" y="55" textAnchor="middle" className="text-[10px] font-mono fill-[var(--fg-page)]/60 uppercase tracking-tighter" transform="rotate(90 50 50)">VRTX</text>
               </svg>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="space-y-10"
          >
            <div className="flex items-center gap-4">
               <span className="w-12 h-[1px] bg-gold-leaf/40" />
               <span className="text-[10px] font-mono uppercase tracking-[0.6em] text-gold-leaf/80">Training Profile // 01</span>
            </div>
            <h2 className="text-7xl font-serif italic text-[var(--fg-page)] leading-[0.9] tracking-tighter">
               <DecryptedText text="Kinetic" /> <br /> 
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-leaf to-[var(--fg-page)]/40">In Motion.</span>
            </h2>
            <p className="text-lg text-[var(--fg-muted)] leading-relaxed font-light max-w-md border-l border-[var(--border-card)] pl-8 italic">
               &quot;Your best body starts with a plan built around you.&quot; <br />
               <span className="text-[var(--fg-page)]/30 not-italic text-sm mt-4 block">
                  Personalized workouts designed around how you naturally move and what your body responds to.
               </span>
            </p>
            <div className="pt-10 flex gap-12">
               <div className="space-y-1">
                  <div className="text-[8px] font-mono text-gold-leaf uppercase tracking-widest">Accuracy</div>
                  <div className="text-2xl font-serif text-[var(--fg-page)] italic">99.2%</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[8px] font-mono text-gold-leaf uppercase tracking-widest">Recovery</div>
                  <div className="text-2xl font-serif text-[var(--fg-page)] italic">Adaptive</div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Male Profile */}
        <div className="grid lg:grid-cols-2 gap-20 items-center px-8 md:px-20 lg:px-40">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:order-2 relative aspect-[4/5] bg-[var(--bg-page)] border border-[var(--border-card)] overflow-hidden group"
          >
            {/* Image Placeholder with Cyber-Zen Styling */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-60 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 border-[20px] border-[var(--bg-page)]/40 backdrop-blur-[2px] m-8 pointer-events-none" />
            
            {/* Amber Gold Rim Lighting Simulation */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gold-leaf/40 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
            
            {/* Technical HUD Overlays */}
            <div className="absolute bottom-12 right-12 text-right space-y-2 font-mono text-[9px] uppercase tracking-widest text-[var(--fg-muted)]">
              <div>Force Output: Optimal</div>
              <div className="text-gold-leaf">Metabolic Load: High</div>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:order-1 space-y-8 lg:text-right flex flex-col lg:items-end"
          >
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf">Profile // Beta</span>
               <span className="w-12 h-[1px] bg-gold-leaf" />
            </div>
            <h2 className="text-6xl font-serif italic text-[var(--fg-page)] leading-tight">Built for <br /> Strength.</h2>
            <p className="text-[var(--fg-muted)] leading-relaxed font-light text-lg max-w-md">
              Science-backed muscle-building strategies for men — focused on getting stronger, building size, and recovering properly.
            </p>
            <div className="pt-8 grid grid-cols-2 gap-8 border-t border-[var(--border-card)] w-full">
              <div>
                <div className="text-[9px] font-mono text-gold-leaf uppercase tracking-widest mb-1">Focus</div>
                <div className="text-xl font-serif text-[var(--fg-page)] italic">Hypertrophy</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-gold-leaf uppercase tracking-widest mb-1">Method</div>
                <div className="text-xl font-serif text-[var(--fg-page)] italic">Heavy Duty</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-24 px-8 md:px-20 border-t border-[var(--border-card)] bg-[var(--bg-page)] relative z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:items-center">
          <div className="space-y-6">
             <span className="font-serif text-4xl italic tracking-tighter text-[var(--fg-page)]">SVORA</span>
             <p className="text-[9px] font-mono text-[var(--fg-muted)] uppercase tracking-[0.4em] leading-loose">
                Personalized Fitness. <br />
                Est. 2026.
             </p>
          </div>
          
          <div className="flex gap-20">
             {["Instagram", "Twitter"].map(link => (
               <a key={link} href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--fg-muted)] hover:text-gold-leaf transition-colors relative group">
                 {link}
                 <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold-leaf transition-all duration-300 group-hover:w-full" />
               </a>
             ))}
             <Link href="/journal" className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--fg-muted)] hover:text-gold-leaf transition-colors relative group">
                Journal
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold-leaf transition-all duration-300 group-hover:w-full" />
             </Link>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--fg-submuted)] italic">
             Your journey starts today.
          </div>
        </div>
      </footer>
    </div>
  );
}

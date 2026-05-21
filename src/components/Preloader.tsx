"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export const Preloader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate initial load time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } }}
          className="fixed inset-0 z-[9999] bg-[var(--bg-page)] flex items-center justify-center p-12 overflow-hidden"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="overflow-hidden">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="font-serif text-6xl md:text-8xl italic text-[var(--fg-page)] tracking-tighter"
              >
                SVORA
              </motion.h1>
            </div>
            
            <div className="w-24 h-[1px] bg-[var(--fg-submuted)] relative overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gold-leaf w-1/2"
              />
            </div>
            
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[9px] uppercase tracking-[0.4em] text-[var(--fg-muted)]"
            >
              Somatic Club
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

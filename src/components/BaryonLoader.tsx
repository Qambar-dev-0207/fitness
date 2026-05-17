"use client";

import { motion } from "framer-motion";

export const BaryonLoader = () => {
  return (
    <div className="flex gap-1.5 items-center justify-center h-full min-h-[1em]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-current rounded-sm"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

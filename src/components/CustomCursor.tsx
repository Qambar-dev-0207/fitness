"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const CustomCursor = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorText, setCursorText] = useState("");
  
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Cinematic Spring Physics
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const interactive = target.closest("button, a, input, [data-cursor='hover'], .group");
      const textTrigger = target.getAttribute("data-cursor-text");

      setIsHovered(!!interactive);
      setCursorText(textTrigger || "");
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleHover);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleHover);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Primary Dot - Inverted */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 0 : 1, // Disappears on hover to let the ring take over
        }}
      />

      {/* Outer Ring / Label Container */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] flex items-center justify-center border border-white/20 mix-blend-difference bg-white/5 backdrop-blur-sm"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: cursorText ? 80 : (isHovered ? 60 : 20),
          height: cursorText ? 80 : (isHovered ? 60 : 20),
          opacity: 1,
          scale: isClicking ? 0.9 : 1,
          backgroundColor: cursorText ? "rgba(255, 255, 255, 1)" : (isHovered ? "rgba(255, 255, 255, 0.1)" : "transparent"),
          borderColor: isHovered ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.2)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Text Label inside Cursor */}
        <motion.span 
          className="text-[10px] font-bold uppercase tracking-widest text-black"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: cursorText ? 1 : 0, scale: cursorText ? 1 : 0.5 }}
        >
          {cursorText}
        </motion.span>
      </motion.div>
    </>
  );
};

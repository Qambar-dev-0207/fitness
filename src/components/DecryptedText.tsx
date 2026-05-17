"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const glyphs = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "+", "=",
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト"
];

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
}

export const DecryptedText = ({ 
  text, 
  speed = 50, 
  maxIterations = 10, 
  className,
  revealDirection = "start",
  useOriginalCharsOnly = false,
}: DecryptedTextProps) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  // Function to scramble text
  const scramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
      }

      iteration += 1 / 2;
    }, speed);
  };

  return (
    <span 
      className={`inline-block whitespace-nowrap ${className}`}
      onMouseEnter={scramble}
    >
      {displayText}
    </span>
  );
};

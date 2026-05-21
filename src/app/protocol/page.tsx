"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ChevronDown, Play, Zap, X, ShieldCheck, Activity, Award, Plus, Check, LogOut, User as UserIcon, LayoutDashboard, BookOpen } from "lucide-react";
import Link from "next/link";
import { JournalSection } from "@/components/JournalSection";

// --- ANIMATION CONFIG ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } }
};

// Helper to calculate angle between three points
const calculateAngle = (a: any, b: any, c: any) => {
  if (!a || !b || !c) return 0;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

// --- SPEECH UTILITIES ---
const speakFeedback = (text: string) => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15;
    window.speechSynthesis.speak(utterance);
  }
};

// --- EXERCISE CONFIGS ---
interface ExerciseConfig {
  name: string;
  match: string[];
  joints: {
    left: [number, number, number];
    right: [number, number, number];
  };
  startAngle: number;
  peakAngle: number;
  angleType: "flexion" | "extension";
  checkPosture: (lm: any, side: "left" | "right") => { valid: boolean; feedback: string };
}

const EXERCISE_CONFIGS: ExerciseConfig[] = [
  {
    name: "Squats",
    match: ["squat", "lunge", "leg", "bulgarian", "step up", "thruster"],
    joints: {
      left: [23, 25, 27],
      right: [24, 26, 28]
    },
    startAngle: 165,
    peakAngle: 95,
    angleType: "flexion",
    checkPosture: (lm: any, side: "left" | "right") => {
      const shoulder = side === "left" ? lm[11] : lm[12];
      const hip = side === "left" ? lm[23] : lm[24];
      const knee = side === "left" ? lm[25] : lm[26];
      const torsoAngle = calculateAngle(shoulder, hip, knee);
      if (torsoAngle < 80) {
        return { valid: false, feedback: "Keep chest up, back straight" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Bicep Curls",
    match: ["curl"],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 155,
    peakAngle: 55,
    angleType: "flexion",
    checkPosture: (lm: any, side: "left" | "right") => {
      const shoulder = side === "left" ? lm[11] : lm[12];
      const hip = side === "left" ? lm[23] : lm[24];
      const elbow = side === "left" ? lm[13] : lm[14];
      const armDrift = calculateAngle(hip, shoulder, elbow);
      if (armDrift > 35) {
        return { valid: false, feedback: "Keep elbow locked at your side" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Push-ups / Chest Press",
    match: ["push", "bench", "press", "dip"],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 155,
    peakAngle: 85,
    angleType: "flexion",
    checkPosture: (lm: any, side: "left" | "right") => {
      const shoulder = side === "left" ? lm[11] : lm[12];
      const hip = side === "left" ? lm[23] : lm[24];
      const knee = side === "left" ? lm[25] : lm[26];
      const bodyLine = calculateAngle(shoulder, hip, knee);
      if (bodyLine < 155) {
        return { valid: false, feedback: "Keep body in a straight line, core tight" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Overhead Press",
    match: ["overhead", "shoulder press", "military press"],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 80,
    peakAngle: 155,
    angleType: "extension",
    checkPosture: (lm: any, side: "left" | "right") => {
      const shoulder = side === "left" ? lm[11] : lm[12];
      const hip = side === "left" ? lm[23] : lm[24];
      const knee = side === "left" ? lm[25] : lm[26];
      const hipAngle = calculateAngle(shoulder, hip, knee);
      if (hipAngle < 150) {
        return { valid: false, feedback: "Don't arch your back, brace your core" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Deadlift / Hinge",
    match: ["deadlift", "hinge", "swing", "good morning"],
    joints: {
      left: [11, 23, 25],
      right: [12, 24, 26]
    },
    startAngle: 110,
    peakAngle: 170,
    angleType: "extension",
    checkPosture: (lm: any, side: "left" | "right") => {
      const hip = side === "left" ? lm[23] : lm[24];
      const knee = side === "left" ? lm[25] : lm[26];
      const ankle = side === "left" ? lm[27] : lm[28];
      const kneeAngle = calculateAngle(hip, knee, ankle);
      if (kneeAngle < 120) {
        return { valid: false, feedback: "Hinge at hips, don't squat the deadlift" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Pull-ups / Rows",
    match: ["pullup", "chinup", "lat pull", "row"],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 160,
    peakAngle: 75,
    angleType: "flexion",
    checkPosture: () => {
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Lateral Raises",
    match: ["lateral", "front raise"],
    joints: {
      left: [23, 11, 13],
      right: [24, 12, 14]
    },
    startAngle: 25,
    peakAngle: 85,
    angleType: "extension",
    checkPosture: (lm: any, side: "left" | "right") => {
      const hip = side === "left" ? lm[23] : lm[24];
      const shoulder = side === "left" ? lm[11] : lm[12];
      const elbow = side === "left" ? lm[13] : lm[14];
      const raiseAngle = calculateAngle(hip, shoulder, elbow);
      if (raiseAngle > 110) {
        return { valid: false, feedback: "Stop at shoulder height (90 deg)" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Tricep Extension / Pushdowns",
    match: ["extension", "pushdown", "skullcrusher", "kickback"],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 80,
    peakAngle: 155,
    angleType: "extension",
    checkPosture: (lm: any, side: "left" | "right") => {
      const shoulder = side === "left" ? lm[11] : lm[12];
      const hip = side === "left" ? lm[23] : lm[24];
      const elbow = side === "left" ? lm[13] : lm[14];
      const armDrift = calculateAngle(hip, shoulder, elbow);
      if (armDrift > 35) {
        return { valid: false, feedback: "Keep upper arms still" };
      }
      return { valid: true, feedback: "" };
    }
  },
  {
    name: "Crunches / Leg Raises",
    match: ["crunch", "situp", "raise", "leg raise"],
    joints: {
      left: [11, 23, 25],
      right: [12, 24, 26]
    },
    startAngle: 150,
    peakAngle: 95,
    angleType: "flexion",
    checkPosture: () => {
      return { valid: true, feedback: "" };
    }
  }
];

const getExerciseConfig = (name: string): ExerciseConfig => {
  const normalized = name.toLowerCase();
  for (const config of EXERCISE_CONFIGS) {
    if (config.match.some(keyword => normalized.includes(keyword))) {
      return config;
    }
  }
  // Dynamic fallback heuristics
  if (normalized.includes("leg") || normalized.includes("knee") || normalized.includes("glute") || normalized.includes("calf") || normalized.includes("split") || normalized.includes("lung")) {
    return EXERCISE_CONFIGS[0]; // Squat config
  }
  if (normalized.includes("press") || normalized.includes("push") || normalized.includes("bench") || normalized.includes("dip")) {
    return EXERCISE_CONFIGS[2]; // Press/Push config
  }
  if (normalized.includes("curl") || normalized.includes("bicep")) {
    return EXERCISE_CONFIGS[1]; // Bicep Curl config
  }
  if (normalized.includes("raise") || normalized.includes("fly") || normalized.includes("lateral")) {
    return EXERCISE_CONFIGS[6]; // Lateral raise config
  }
  if (normalized.includes("dead") || normalized.includes("hinge") || normalized.includes("kb") || normalized.includes("swing")) {
    return EXERCISE_CONFIGS[4]; // Deadlift config
  }
  if (normalized.includes("pull") || normalized.includes("row") || normalized.includes("chin") || normalized.includes("lat")) {
    return EXERCISE_CONFIGS[5]; // Pull-up / Row config
  }
  // General fallback
  return {
    name: "General Exercise",
    match: [],
    joints: {
      left: [11, 13, 15],
      right: [12, 14, 16]
    },
    startAngle: 155,
    peakAngle: 80,
    angleType: "flexion",
    checkPosture: () => ({ valid: true, feedback: "" })
  };
};

// --- REAL ML POSTURE CORRECTOR COMPONENT ---
const PostureCorrector = ({ exercise, onComplete, onClose }: { exercise: any, onComplete: () => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  const angleHistoryRef = useRef<number[]>([]);
  const lastSpokenRef = useRef<number>(0);
  
  // Logic state refs to avoid stale closures in onResults
  const stateRef = useRef({
    repState: "START" as "START" | "GOING" | "PEAK" | "RETURNING",
    isResting: false,
    repCount: 0,
    setCount: 0,
    exerciseName: exercise.name.toLowerCase(),
    lastRepTime: 0,
    consecutivePostureFails: 0,
  });

  const [uiFeedback, setFeedback] = useState("Getting ready...");
  const [uiRepCount, setUiRepCount] = useState(0);
  const [uiSetCount, setUiSetCount] = useState(0);
  const [isRestingState, setIsRestingState] = useState(false);
  const [restSeconds, setRestSeconds] = useState(45);

  const targetReps = parseInt(String(exercise.reps)) || 10;
  const targetSets = parseInt(String(exercise.sets)) || 3;

  const speakThrottled = (text: string, throttleMs = 3500) => {
    const now = Date.now();
    if (now - lastSpokenRef.current > throttleMs) {
      speakFeedback(text);
      lastSpokenRef.current = now;
    }
  };

  const getSmoothedAngle = (angle: number) => {
    angleHistoryRef.current.push(angle);
    if (angleHistoryRef.current.length > 5) {
      angleHistoryRef.current.shift();
    }
    const sum = angleHistoryRef.current.reduce((a, b) => a + b, 0);
    return sum / angleHistoryRef.current.length;
  };

  // Sync refs with props/state
  useEffect(() => {
    stateRef.current.exerciseName = exercise.name.toLowerCase();
  }, [exercise]);

  useEffect(() => {
    stateRef.current.isResting = isRestingState;
  }, [isRestingState]);

  // Handle rest countdown
  useEffect(() => {
    if (!isRestingState) return;
    
    setRestSeconds(45);
    speakFeedback("Set complete. Take a 45 second break.");

    const interval = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRestingState(false);
          speakFeedback("Break over. Start your next set!");
          return 0;
        }
        if (prev <= 4 && prev > 1) {
          speakFeedback(String(prev - 1));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestingState]);

  useEffect(() => {
    const initML = async () => {
      if (typeof window === "undefined" || poseRef.current) return;

      try {
        const mpPose = await import("@mediapipe/pose");
        const mpCamera = await import("@mediapipe/camera_utils");
        const mpDrawing = await import("@mediapipe/drawing_utils");

        const poseInstance = new mpPose.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
        });

        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseInstance.onResults((results: any) => {
          const canvasElement = canvasRef.current;
          const videoElement = videoRef.current;
          if (!canvasElement || !videoElement) return;
          
          const canvasCtx = canvasElement.getContext("2d");
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          if (results.poseLandmarks) {
            const lm = results.poseLandmarks;
            const exName = stateRef.current.exerciseName;

            // 1. Resolve exercise config based on name
            const config = getExerciseConfig(exName);

            // 2. Resolve active side based on visibility
            const leftVisibility = (lm[11]?.visibility || 0) + (lm[13]?.visibility || 0) + (lm[15]?.visibility || 0);
            const rightVisibility = (lm[12]?.visibility || 0) + (lm[14]?.visibility || 0) + (lm[16]?.visibility || 0);
            const side: "left" | "right" = leftVisibility > rightVisibility ? "left" : "right";

            // 3. Compute and smooth angle
            const jointIndices = config.joints[side];
            const rawAngle = calculateAngle(lm[jointIndices[0]], lm[jointIndices[1]], lm[jointIndices[2]]);
            const smoothedAngle = getSmoothedAngle(rawAngle);

            // 4. Check posture
            const postureCheck = config.checkPosture(lm, side);
            let isPostureCorrect = true;
            let postureFeedback = "";

            if (!postureCheck.valid) {
              stateRef.current.consecutivePostureFails += 1;
              if (stateRef.current.consecutivePostureFails > 8) {
                isPostureCorrect = false;
                postureFeedback = postureCheck.feedback;
              }
            } else {
              stateRef.current.consecutivePostureFails = 0;
            }

            // ALWAYS Draw skeleton with posture-aware coloring
            const jointsColor = isPostureCorrect ? "#D4AF37" : "#EF4444";
            mpDrawing.drawConnectors(canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, { color: jointsColor, lineWidth: 2 });
            mpDrawing.drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#FFFFFF", lineWidth: 1, radius: 2 });

            // Draw angle overlay at the middle joint
            const midJointIdx = jointIndices[1];
            const midJoint = lm[midJointIdx];
            if (midJoint && (midJoint.visibility || 0) > 0.5) {
              const px = midJoint.x * canvasElement.width;
              const py = midJoint.y * canvasElement.height;
              canvasCtx.font = "bold 22px monospace";
              canvasCtx.fillStyle = jointsColor;
              canvasCtx.fillText(`${Math.round(smoothedAngle)}°`, px + 15, py + 5);
            }

            // Handle rest mode
            if (stateRef.current.isResting) {
              setFeedback("Resting...");
              canvasCtx.restore();
              return;
            }

            // 5. State Machine for rep counting & range of motion (ROM) feedback
            let currentFeedback = isPostureCorrect ? "Form Correct" : `⚠️ ${postureFeedback}`;
            
            const startThresh = config.startAngle;
            const peakThresh = config.peakAngle;
            const now = Date.now();

            if (config.angleType === "flexion") {
              // E.g. Squat: Starts straight (165), flexes to small (95)
              if (stateRef.current.repState === "START") {
                if (smoothedAngle < startThresh - 15) {
                  stateRef.current.repState = "GOING";
                }
              } else if (stateRef.current.repState === "GOING") {
                if (smoothedAngle < peakThresh) {
                  stateRef.current.repState = "PEAK";
                } else if (smoothedAngle > startThresh - 5) {
                  stateRef.current.repState = "START";
                  speakThrottled("Go deeper for a full rep!");
                }
              } else if (stateRef.current.repState === "PEAK") {
                if (smoothedAngle > peakThresh + 15) {
                  stateRef.current.repState = "RETURNING";
                }
              } else if (stateRef.current.repState === "RETURNING") {
                if (smoothedAngle > startThresh - 10) {
                  if (now - stateRef.current.lastRepTime > 800) {
                    stateRef.current.repCount += 1;
                    stateRef.current.lastRepTime = now;
                    setUiRepCount(stateRef.current.repCount);
                    speakFeedback(String(stateRef.current.repCount));
                  }
                  stateRef.current.repState = "START";
                }
              }
            } else {
              // E.g. Overhead Press / Lateral Raises: Starts small/bent (80), extends to straight/large (150)
              if (stateRef.current.repState === "START") {
                if (smoothedAngle > startThresh + 15) {
                  stateRef.current.repState = "GOING";
                }
              } else if (stateRef.current.repState === "GOING") {
                if (smoothedAngle > peakThresh) {
                  stateRef.current.repState = "PEAK";
                } else if (smoothedAngle < startThresh + 5) {
                  stateRef.current.repState = "START";
                  speakThrottled("Extend fully!");
                }
              } else if (stateRef.current.repState === "PEAK") {
                if (smoothedAngle < peakThresh - 15) {
                  stateRef.current.repState = "RETURNING";
                }
              } else if (stateRef.current.repState === "RETURNING") {
                if (smoothedAngle < startThresh + 10) {
                  if (now - stateRef.current.lastRepTime > 800) {
                    stateRef.current.repCount += 1;
                    stateRef.current.lastRepTime = now;
                    setUiRepCount(stateRef.current.repCount);
                    speakFeedback(String(stateRef.current.repCount));
                  }
                  stateRef.current.repState = "START";
                }
              }
            }

            // If posture is wrong, speak it immediately but throttled
            if (!isPostureCorrect) {
              currentFeedback = `⚠️ ${postureFeedback}`;
              speakThrottled(`Fix form: ${postureFeedback}`);
            } else if (stateRef.current.repState === "PEAK") {
              currentFeedback = "Peak reached! Return to start.";
            } else if (stateRef.current.repState === "GOING" || stateRef.current.repState === "RETURNING") {
              currentFeedback = "Movement detected...";
            } else {
              currentFeedback = "Form Correct";
            }

            setFeedback(currentFeedback);

            // Handle set completion
            if (stateRef.current.repCount >= targetReps) {
              const nextSet = stateRef.current.setCount + 1;
              if (nextSet >= targetSets) {
                setFeedback("Session Complete");
                speakFeedback("Excellent work! Session complete.");
                setTimeout(onComplete, 2000);
              } else {
                stateRef.current.setCount = nextSet;
                stateRef.current.repCount = 0;
                setUiSetCount(nextSet);
                setUiRepCount(0);
                setIsRestingState(true);
              }
            }
          } else {
            setFeedback("Step into frame...");
          }
          canvasCtx.restore();
        });

        poseRef.current = poseInstance;

        if (videoRef.current) {
          const camera = new mpCamera.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && poseRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280, height: 720,
          });
          cameraRef.current = camera;
          camera.start();
        }
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
        setFeedback("Camera connection failed");
      }
    };

    initML();
    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();
      poseRef.current = null;
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-[var(--bg-page)]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-12"
    >
      <div className="max-w-6xl w-full aspect-video bg-void border border-[var(--border-card)] rounded-[3rem] overflow-hidden relative shadow-[var(--shadow-card)]">
        <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover grayscale ${isRestingState ? "opacity-10" : "opacity-40"}`} playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" width={1280} height={720} />
        <div className="absolute inset-0 pointer-events-none p-8 md:p-16 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${isRestingState ? "bg-[var(--fg-muted)]" : "bg-gold-leaf animate-pulse shadow-[0_0_15px_#D4AF37]"}`} />
                   <span className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.5em]">{isRestingState ? "Rest Time" : "Tracking Active"}</span>
                </div>
                <h4 className="text-4xl md:text-6xl font-serif italic text-[var(--fg-page)] tracking-tighter">{exercise.name}</h4>
             </div>
             <div className="flex items-start gap-12">
                <div className="text-center space-y-1">
                   <div className="text-[9px] font-mono text-[var(--fg-muted)] uppercase tracking-widest">Set</div>
                   <div className="text-5xl font-serif italic text-gold-leaf">{uiSetCount + 1}<span className="text-[var(--fg-submuted)] text-xl">/{targetSets}</span></div>
                </div>
                <div className="text-center space-y-1">
                   <div className="text-[9px] font-mono text-[var(--fg-muted)] uppercase tracking-widest">Reps</div>
                   <div className="text-5xl font-serif italic text-[var(--fg-page)]">{uiRepCount}<span className="text-[var(--fg-submuted)] text-xl">/{targetReps}</span></div>
                </div>
             </div>
          </div>
          <AnimatePresence mode="wait">
            {isRestingState ? (
              <motion.div key="rest" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-gold-leaf/5 backdrop-blur-md pointer-events-auto">
                 <div className="text-center space-y-6">
                    <Zap size={48} className="mx-auto text-gold-leaf animate-bounce" />
                    <h2 className="text-6xl font-serif italic text-[var(--fg-page)]">Rest Time</h2>
                    <div className="text-8xl font-mono text-gold-leaf">{restSeconds}s</div>
                    <div className="text-xs uppercase tracking-[0.3em] text-[var(--fg-muted)]">Take a deep breath. Hydrate.</div>
                    <button onClick={() => { setIsRestingState(false); speakFeedback("Get ready!"); }} className="px-12 py-5 rounded-full bg-gold-leaf text-void font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-[var(--fg-page)] hover:text-void transition-all shadow-xl">Skip Rest</button>
                 </div>
              </motion.div>
            ) : (
              <div className="flex justify-between items-end">
                <div className="p-6 glass-card border-gold-leaf/20 bg-gold-leaf/5 backdrop-blur-xl">
                  <div className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.4em] mb-2">Live Feedback</div>
                  <div className="text-3xl font-serif italic text-[var(--fg-page)] tracking-tight">{uiFeedback}</div>
                </div>
                <div className="text-right max-w-xs space-y-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf/60">Form Tip</div>
                    <p className="text-sm italic font-serif text-[var(--fg-muted)] leading-relaxed">{exercise.notes}</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-12 flex gap-8">
         <button onClick={onClose} className="px-16 py-6 rounded-full bg-[var(--fg-page)] text-[var(--bg-page)] font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-gold-leaf hover:text-void transition-all border border-transparent hover:border-gold-leaf/20">End Session</button>
      </div>
    </motion.div>
  );
};

export default function ProtocolPage() {
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "journal">("dashboard");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [aiCoachTarget, setAiCoachTarget] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        if (userData.error) {
          window.location.href = "/login";
          return;
        }
        setUser(userData);

        const data = localStorage.getItem("svora_protocol");
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && !parsed.error) {
            setPlan(parsed);
          } else {
            setPlan(null);
          }
        } else {
          // If not in localStorage, try fetching from the DB
          const routineRes = await fetch("/api/get-routine");
          if (routineRes.ok) {
            const { routine } = await routineRes.json();
            if (routine) {
              setPlan(routine);
              localStorage.setItem("svora_protocol", JSON.stringify(routine));
            } else {
              setPlan(null);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const markComplete = (id: string) => {
    if (!completedExercises.includes(id)) {
      setCompletedExercises(prev => [...prev, id]);
    }
    setAiCoachTarget(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border border-[var(--border-card)] border-t-gold-leaf rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-[0.5em]">Loading your plan...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--fg-page)] pb-32">
      <nav className="fixed top-0 w-full z-40 bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--border-card)] px-6 md:px-14 py-4 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex flex-col pointer-events-auto">
            <span className="font-serif text-3xl italic tracking-tighter text-[var(--fg-page)]">SVORA</span>
          </Link>
          <div className="hidden md:flex gap-8">
            <button 
              onClick={() => setView("dashboard")}
              className={`text-[9px] font-mono uppercase tracking-[0.4em] flex items-center gap-2 transition-colors ${view === "dashboard" ? "text-gold-leaf" : "text-[var(--fg-muted)] hover:text-[var(--fg-page)]"}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button
              onClick={() => setView("journal")}
              className={`text-[9px] font-mono uppercase tracking-[0.4em] flex items-center gap-2 transition-colors ${view === "journal" ? "text-gold-leaf" : "text-[var(--fg-muted)] hover:text-[var(--fg-page)]"}`}
            >
              <BookOpen size={14} /> My Journal
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 border-r border-[var(--border-card)] pr-8">
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest text-gold-leaf">{user.name}</div>
              <div className="text-[8px] font-mono uppercase tracking-widest text-[var(--fg-submuted)]">{user.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center border border-gold-leaf/20">
              <UserIcon size={18} className="text-gold-leaf" />
            </div>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--fg-muted)] hover:text-deep-red transition-colors flex items-center gap-2">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {aiCoachTarget && (
          <PostureCorrector 
            exercise={aiCoachTarget.ex} 
            onComplete={() => markComplete(aiCoachTarget.id)} 
            onClose={() => setAiCoachTarget(null)} 
          />
        )}
      </AnimatePresence>

      <div className="pt-32 px-6 md:px-14 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-24">
              {plan ? (
                <>
                  <div className="space-y-12">
                    <motion.div variants={fadeUp} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-[1px] bg-gold-leaf" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf">Your Profile</span>
                      </div>
                      <h1 className="text-6xl md:text-9xl font-serif italic leading-[0.85] text-[var(--fg-page)] tracking-tighter">Your <br /> Plan.</h1>
                    </motion.div>

                    <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-12 pt-12 border-t border-[var(--border-card)]">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--fg-muted)]">Goal</span>
                        <div className="text-2xl font-serif italic text-[var(--fg-page)] tracking-tight">{plan?.planTitle || "Performance Tier"}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--fg-muted)]">Timeline</span>
                        <div className="text-2xl font-serif italic text-[var(--fg-page)] tracking-tight">{plan?.biometricProjections?.timeline || "Standard Horizon"}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--fg-muted)]">Body Type</span>
                        <div className="text-2xl font-serif italic text-[var(--fg-page)] tracking-tight">{plan?.detectedBodyType || "Mesomorph"}</div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-12">
                    <div className="flex items-end justify-between border-b border-[var(--border-card)] pb-8">
                      <div className="space-y-2">
                         <span className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.5em]">Your Week</span>
                         <h2 className="text-4xl md:text-7xl font-serif italic text-[var(--fg-page)] tracking-tighter leading-none">Weekly Schedule.</h2>
                      </div>
                    </div>

                    <div className="grid gap-8">
                      {plan?.weeklyStructure?.map((day: any, idx: number) => (
                        <motion.div key={idx} className={`border rounded-[3rem] overflow-hidden transition-all duration-700 ${expandedDay === idx ? "border-gold-leaf/40 bg-[var(--fg-page)]/[0.03]" : "border-[var(--border-card)] bg-transparent"}`}>
                          <button onClick={() => setExpandedDay(expandedDay === idx ? null : idx)} className="w-full flex items-center justify-between p-10 md:p-14 text-left group">
                            <div className="space-y-3">
                              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-gold-leaf">Day 0{idx + 1}</span>
                              <h3 className="text-4xl md:text-5xl font-serif italic text-[var(--fg-page)] group-hover:text-gold-leaf transition-colors duration-500">{day.day}</h3>
                            </div>
                            <div className="flex items-center gap-12">
                              <span className="text-[10px] font-mono uppercase tracking-widest hidden lg:block opacity-30">{day.focus}</span>
                              <div className={`w-14 h-14 rounded-full border border-[var(--border-card)] flex items-center justify-center transition-all duration-700 ${expandedDay === idx ? "rotate-180 bg-gold-leaf/10 border-gold-leaf/30" : ""}`}>
                                <ChevronDown size={24} className={expandedDay === idx ? "text-gold-leaf" : "text-[var(--fg-muted)]"} />
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {expandedDay === idx && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-10 md:px-14 pb-14 space-y-6">
                                  {day?.exercises?.map((ex: any, eIdx: number) => {
                                    const id = `${idx}-${eIdx}`;
                                    const isDone = completedExercises.includes(id);
                                    return (
                                      <div key={eIdx} className="group/ex flex items-center justify-between p-8 rounded-[2rem] bg-[var(--fg-page)]/[0.02] border border-transparent hover:border-[var(--border-card)] transition-all">
                                        <div className="flex items-center gap-8">
                                          <button onClick={() => toggleExercise(id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isDone ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_#10B981]" : "border-[var(--border-card)]"}`}>
                                            {isDone && <Check size={16} className="text-black" />}
                                          </button>
                                          <div>
                                            <h4 className={`text-2xl font-serif italic ${isDone ? "opacity-30 line-through" : "text-[var(--fg-page)]"}`}>{ex.name}</h4>
                                            <div className="flex gap-6 text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mt-2">
                                              <span className="flex items-center gap-2"><Plus size={10} /> {ex.sets} Sets</span>
                                              <span className="flex items-center gap-2"><Plus size={10} /> {ex.reps} Reps</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover/ex:opacity-100 transition-all">
                                          <button onClick={() => setAiCoachTarget({ ex, id })} className="px-6 py-3 rounded-full bg-gold-leaf/5 hover:bg-gold-leaf text-gold-leaf hover:text-void transition-all flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-gold-leaf/20">
                                            <Camera size={16} /> Live Coach
                                          </button>
                                          <button onClick={() => setSelectedExercise(ex)} className="w-12 h-12 rounded-full border border-[var(--border-card)] flex items-center justify-center hover:bg-[var(--fg-page)] hover:text-[var(--bg-page)] transition-all">
                                            <Play size={18} fill="currentColor" className="ml-1" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center">
                   <h2 className="text-5xl font-serif italic text-[var(--fg-submuted)]">No Plan Yet.</h2>
                   <Link href="/uplink" className="btn-kinetic bg-[var(--fg-page)] text-[var(--bg-page)] hover:text-gold-leaf px-16 py-6">
                      Build Your Plan
                   </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="journal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <JournalSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[var(--bg-page)]/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setSelectedExercise(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="max-w-5xl w-full bg-void border border-[var(--border-card)] rounded-[3rem] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="aspect-video w-full bg-black">
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selectedExercise.videoQuery || selectedExercise.name + " proper form demo")}&autoplay=1&mute=0&rel=0&modestbranding=1`} allowFullScreen className="w-full h-full opacity-80"></iframe>
              </div>
              <div className="p-10 bg-[var(--bg-card)] flex justify-between items-center">
                <h3 className="text-3xl font-serif italic text-[var(--fg-page)]">{selectedExercise.name}</h3>
                <button onClick={() => setSelectedExercise(null)} className="px-10 py-5 rounded-full border border-[var(--border-card)] text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[var(--fg-page)] hover:text-[var(--bg-page)] transition-all">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

// --- REAL ML POSTURE CORRECTOR COMPONENT ---
const PostureCorrector = ({ exercise, onComplete, onClose }: { exercise: any, onComplete: () => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  
  // Logic state refs to avoid stale closures in onResults
  const stateRef = useRef({
    movementDir: "up" as "up" | "down",
    isResting: false,
    repCount: 0,
    setCount: 0,
    exerciseName: exercise.name.toLowerCase()
  });

  const [uiFeedback, setFeedback] = useState("Aligning Neural Link...");
  const [uiRepCount, setUiRepCount] = useState(0);
  const [uiSetCount, setUiSetCount] = useState(0);
  const [isRestingState, setIsRestingState] = useState(false);

  const targetReps = parseInt(String(exercise.reps)) || 10;
  const targetSets = parseInt(String(exercise.sets)) || 3;

  // Sync refs with props/state
  useEffect(() => {
    stateRef.current.exerciseName = exercise.name.toLowerCase();
  }, [exercise]);

  useEffect(() => {
    stateRef.current.isResting = isRestingState;
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
            // ALWAYS Draw skeleton so user knows it's working
            mpDrawing.drawConnectors(canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, { color: "#D4AF37", lineWidth: 2 });
            mpDrawing.drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#FFFFFF", lineWidth: 1, radius: 2 });

            // Logic starts here
            if (stateRef.current.isResting) {
              setFeedback("Resting...");
              canvasCtx.restore();
              return;
            }

            const lm = results.poseLandmarks;
            const exName = stateRef.current.exerciseName;
            let currentFeedback = "Somatic Sync Active";

            const runLogic = (angle: number, downThreshold: number, upThreshold: number, msg: string) => {
              if (angle < downThreshold && stateRef.current.movementDir === "up") {
                stateRef.current.movementDir = "down";
                currentFeedback = msg;
              }
              if (angle > upThreshold && stateRef.current.movementDir === "down") {
                stateRef.current.movementDir = "up";
                stateRef.current.repCount += 1;
                setUiRepCount(stateRef.current.repCount);
                currentFeedback = "Rep Captured";
              }
            };

            const runLogicInverted = (angle: number, upThreshold: number, downThreshold: number, msg: string) => {
              if (angle > upThreshold && stateRef.current.movementDir === "down") {
                stateRef.current.movementDir = "up";
                currentFeedback = msg;
              }
              if (angle < downThreshold && stateRef.current.movementDir === "up") {
                stateRef.current.movementDir = "down";
                stateRef.current.repCount += 1;
                setUiRepCount(stateRef.current.repCount);
                currentFeedback = "Rep Captured";
              }
            };

            // Detect Exercise Type
            if (exName.includes("squat") || exName.includes("lunge") || exName.includes("bulgarian")) {
              runLogic(calculateAngle(lm[23], lm[25], lm[27]), 100, 160, "Great Depth");
            } 
            else if (exName.includes("curl") || exName.includes("row") || exName.includes("pullup") || exName.includes("chinup")) {
              runLogic(calculateAngle(lm[11], lm[13], lm[15]), 70, 150, "Full Contraction");
            }
            else if (exName.includes("push") || exName.includes("bench") || exName.includes("press") || exName.includes("dip")) {
              runLogic(calculateAngle(lm[11], lm[13], lm[15]), 95, 160, "Touch Target");
            }
            else if (exName.includes("deadlift") || exName.includes("hinge") || exName.includes("swing")) {
              runLogicInverted(calculateAngle(lm[11], lm[23], lm[25]), 170, 130, "Lockout Confirmed");
            }
            else if (exName.includes("lateral") || exName.includes("front")) {
              runLogicInverted(calculateAngle(lm[23], lm[11], lm[13]), 80, 30, "Parallel Peak");
            }
            else if (exName.includes("extension") || exName.includes("skullcrusher")) {
              runLogicInverted(calculateAngle(lm[11], lm[13], lm[15]), 160, 70, "Full Extension");
            }
            else if (exName.includes("leg raise") || exName.includes("situp") || exName.includes("crunch")) {
              runLogic(calculateAngle(lm[11], lm[23], lm[25]), 90, 150, "Core Engaged");
            }
            else {
              // General movement detection if no specific exercise matched
              const noseY = lm[0].y;
              if (noseY < 0.4 && stateRef.current.movementDir === "down") {
                stateRef.current.movementDir = "up";
                stateRef.current.repCount += 1;
                setUiRepCount(stateRef.current.repCount);
                currentFeedback = "Rep Captured";
              } else if (noseY > 0.6 && stateRef.current.movementDir === "up") {
                stateRef.current.movementDir = "down";
                currentFeedback = "Descending...";
              }
            }

            setFeedback(currentFeedback);

            // Handle set completion
            if (stateRef.current.repCount >= targetReps) {
              const nextSet = stateRef.current.setCount + 1;
              if (nextSet >= targetSets) {
                setFeedback("Session Complete");
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
            setFeedback("Searching for Human Form...");
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
        setFeedback("Neural Link Failure");
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
      className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-12"
    >
      <div className="max-w-6xl w-full aspect-video bg-void border border-white/10 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,1)]">
        <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover grayscale ${isRestingState ? "opacity-10" : "opacity-40"}`} playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" width={1280} height={720} />
        <div className="absolute inset-0 pointer-events-none p-8 md:p-16 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${isRestingState ? "bg-white/20" : "bg-gold-leaf animate-pulse shadow-[0_0_15px_#D4AF37]"}`} />
                   <span className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.5em]">{isRestingState ? "Rest Cycle" : "Neural Link: Active"}</span>
                </div>
                <h4 className="text-4xl md:text-6xl font-serif italic text-white tracking-tighter">{exercise.name}</h4>
             </div>
             <div className="flex items-start gap-12">
                <div className="text-center space-y-1">
                   <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Set</div>
                   <div className="text-5xl font-serif italic text-gold-leaf">{uiSetCount + 1}<span className="text-white/20 text-xl">/{targetSets}</span></div>
                </div>
                <div className="text-center space-y-1">
                   <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Reps</div>
                   <div className="text-5xl font-serif italic text-white">{uiRepCount}<span className="text-white/20 text-xl">/{targetReps}</span></div>
                </div>
             </div>
          </div>
          <AnimatePresence mode="wait">
            {isRestingState ? (
              <motion.div key="rest" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-gold-leaf/5 backdrop-blur-md pointer-events-auto">
                 <div className="text-center space-y-8">
                    <Zap size={48} className="mx-auto text-gold-leaf animate-bounce" />
                    <h2 className="text-6xl font-serif italic text-white">Recovery Mode</h2>
                    <button onClick={() => setIsRestingState(false)} className="px-12 py-5 rounded-full bg-gold-leaf text-void font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-white transition-all shadow-xl">Start Next Set</button>
                 </div>
              </motion.div>
            ) : (
              <div className="flex justify-between items-end">
                <div className="p-6 glass-card border-gold-leaf/20 bg-gold-leaf/5 backdrop-blur-xl">
                  <div className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.4em] mb-2">Live AI Feedback</div>
                  <div className="text-3xl font-serif italic text-white tracking-tight">{uiFeedback}</div>
                </div>
                <div className="text-right max-w-xs space-y-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf/60">Technical Note</div>
                    <p className="text-sm italic font-serif text-white/70 leading-relaxed">{exercise.notes}</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-12 flex gap-8">
         <button onClick={onClose} className="px-16 py-6 rounded-full bg-white text-black font-bold uppercase tracking-[0.4em] text-[10px] hover:bg-black hover:text-white transition-all border border-transparent hover:border-white/20">Abort Session</button>
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
            const dbRoutine = await routineRes.json();
            setPlan(dbRoutine);
            localStorage.setItem("svora_protocol", JSON.stringify(dbRoutine));
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
      <div className="min-h-screen flex items-center justify-center bg-jet-black">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border border-white/10 border-t-gold-leaf rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em]">Decrypting Protocol...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-jet-black text-soft-peach pb-32">
      <nav className="fixed top-0 w-full z-40 bg-jet-black/80 backdrop-blur-md border-b border-white/5 px-6 md:px-14 py-4 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex flex-col pointer-events-auto">
            <span className="font-serif text-3xl italic tracking-tighter text-white">SVORA</span>
          </Link>
          <div className="hidden md:flex gap-8">
            <button 
              onClick={() => setView("dashboard")}
              className={`text-[9px] font-mono uppercase tracking-[0.4em] flex items-center gap-2 transition-colors ${view === "dashboard" ? "text-gold-leaf" : "text-white/30 hover:text-white"}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button 
              onClick={() => setView("journal")}
              className={`text-[9px] font-mono uppercase tracking-[0.4em] flex items-center gap-2 transition-colors ${view === "journal" ? "text-gold-leaf" : "text-white/30 hover:text-white"}`}
            >
              <BookOpen size={14} /> Somatic Journal
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 border-r border-white/10 pr-8">
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest text-gold-leaf">{user.name}</div>
              <div className="text-[8px] font-mono uppercase tracking-widest text-white/20">{user.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center border border-gold-leaf/20">
              <UserIcon size={18} className="text-gold-leaf" />
            </div>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30 hover:text-deep-red transition-colors flex items-center gap-2">
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
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold-leaf">Private Dossier</span>
                      </div>
                      <h1 className="text-6xl md:text-9xl font-serif italic leading-[0.85] text-white tracking-tighter">Somatic <br /> Architecture.</h1>
                    </motion.div>

                    <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-12 pt-12 border-t border-white/5">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Target Goal</span>
                        <div className="text-2xl font-serif italic text-white tracking-tight">{plan?.planTitle || "Performance Tier"}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Timeline Horizon</span>
                        <div className="text-2xl font-serif italic text-white tracking-tight">{plan?.biometricProjections?.timeline || "Standard Horizon"}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Morphotype</span>
                        <div className="text-2xl font-serif italic text-white tracking-tight">{plan?.detectedBodyType || "Mesomorph"}</div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-12">
                    <div className="flex items-end justify-between border-b border-white/5 pb-8">
                      <div className="space-y-2">
                         <span className="text-[10px] font-mono text-gold-leaf uppercase tracking-[0.5em]">The Cycle</span>
                         <h2 className="text-4xl md:text-7xl font-serif italic text-white tracking-tighter leading-none">Weekly Protocol.</h2>
                      </div>
                    </div>

                    <div className="grid gap-8">
                      {plan?.weeklyStructure?.map((day: any, idx: number) => (
                        <motion.div key={idx} className={`border rounded-[3rem] overflow-hidden transition-all duration-700 ${expandedDay === idx ? "border-gold-leaf/40 bg-white/[0.03]" : "border-white/5 bg-transparent"}`}>
                          <button onClick={() => setExpandedDay(expandedDay === idx ? null : idx)} className="w-full flex items-center justify-between p-10 md:p-14 text-left group">
                            <div className="space-y-3">
                              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-gold-leaf">Sequence 0{idx + 1}</span>
                              <h3 className="text-4xl md:text-5xl font-serif italic text-white group-hover:text-gold-leaf transition-colors duration-500">{day.day}</h3>
                            </div>
                            <div className="flex items-center gap-12">
                              <span className="text-[10px] font-mono uppercase tracking-widest hidden lg:block opacity-30">{day.focus}</span>
                              <div className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-700 ${expandedDay === idx ? "rotate-180 bg-gold-leaf/10 border-gold-leaf/30" : ""}`}>
                                <ChevronDown size={24} className={expandedDay === idx ? "text-gold-leaf" : "text-white/40"} />
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
                                      <div key={eIdx} className="group/ex flex items-center justify-between p-8 rounded-[2rem] bg-white/[0.02] border border-transparent hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-8">
                                          <button onClick={() => toggleExercise(id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isDone ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_#10B981]" : "border-white/20"}`}>
                                            {isDone && <Check size={16} className="text-black" />}
                                          </button>
                                          <div>
                                            <h4 className={`text-2xl font-serif italic ${isDone ? "opacity-30 line-through" : "text-white"}`}>{ex.name}</h4>
                                            <div className="flex gap-6 text-[10px] font-mono uppercase tracking-widest text-white/30 mt-2">
                                              <span className="flex items-center gap-2"><Plus size={10} /> {ex.sets} Sets</span>
                                              <span className="flex items-center gap-2"><Plus size={10} /> {ex.reps} Reps</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover/ex:opacity-100 transition-all">
                                          <button onClick={() => setAiCoachTarget({ ex, id })} className="px-6 py-3 rounded-full bg-gold-leaf/5 hover:bg-gold-leaf text-gold-leaf hover:text-black transition-all flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-gold-leaf/20">
                                            <Camera size={16} /> Neural Scan
                                          </button>
                                          <button onClick={() => setSelectedExercise(ex)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
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
                   <h2 className="text-5xl font-serif italic text-white/20">Protocol Undefined.</h2>
                   <Link href="/uplink" className="btn-kinetic bg-white text-void hover:text-gold-leaf px-16 py-6">
                      Generate Blueprint
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setSelectedExercise(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="max-w-5xl w-full bg-void border border-white/10 rounded-[3rem] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="aspect-video w-full bg-black">
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selectedExercise.videoQuery || selectedExercise.name + " proper form demo")}&autoplay=1&mute=0&rel=0&modestbranding=1`} allowFullScreen className="w-full h-full opacity-80"></iframe>
              </div>
              <div className="p-10 bg-onyx/50 flex justify-between items-center">
                <h3 className="text-3xl font-serif italic text-white">{selectedExercise.name}</h3>
                <button onClick={() => setSelectedExercise(null)} className="px-10 py-5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

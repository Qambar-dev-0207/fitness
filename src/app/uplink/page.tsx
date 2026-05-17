"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, ChevronRight, Scale, User, Target, MapPin, Clock, Check, Info } from "lucide-react";
import Link from "next/link";

const steps = [
  { id: "metrics", title: "Metrics", icon: Scale },
  { id: "body", title: "Body Type", icon: User },
  { id: "goal", title: "Goal", icon: Target },
  { id: "place", title: "Gym/Home", icon: MapPin },
  { id: "routine", title: "Schedule", icon: Clock },
];

const bodyTypeInfo: Record<string, string> = {
  Skinny: "Naturally thin with a fast metabolism. Tends to have a hard time gaining weight or muscle.",
  Athletic: "Naturally muscular and broad. Gains muscle quickly and responds well to any training style.",
  Heavy: "Carries more body fat with a solid, strong frame. Responds well to strength training.",
  Average: "A balanced mix of muscle and fat. Adapts well to almost any workout routine.",
  Lean: "Low body fat with visible muscle. Usually focused on staying toned and maintaining definition."
};

const LoadingIndicator = () => (
  <div className="flex flex-col items-center gap-12 text-center">
    <div className="relative w-32 h-32 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-white/10 rounded-full border-t-gold-leaf"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md"
      >
        <div className="w-2 h-2 bg-gold-leaf rounded-full shadow-[0_0_10px_#D4AF37]" />
      </motion.div>
    </div>
    <div className="space-y-4">
      <h2 className="text-4xl font-serif italic text-white tracking-tight">Building Your Plan</h2>
      <div className="flex justify-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">This takes a few seconds...</span>
      </div>
    </div>
  </div>
);

export default function UplinkPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    bodyType: "",
    goal: "",
    customGoal: "",
    trainingLocation: "",
    fasting: false,
    image: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [hoveredBodyType, setHoveredBodyType] = useState<string | null>(null);

  // Keyboard Navigation: Enter to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const canContinue = !isContinueDisabled();
        if (canContinue) nextStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, formData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result as string,
          bodyType: prev.bodyType || "AI_ANALYSIS_REQUESTED",
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep === steps.length - 1) handleSubmit();
    else setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const updateData = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  const isContinueDisabled = () => {
    if (currentStep === 0) return !formData.weight || !formData.height || !formData.age;
    if (currentStep === 1) return !formData.bodyType && !formData.image;
    if (currentStep === 2) return !formData.goal || (formData.goal === "Custom" && !formData.customGoal);
    if (currentStep === 3) return !formData.trainingLocation;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalGoal = formData.goal === "Custom" ? formData.customGoal : formData.goal;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, goal: finalGoal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      
      localStorage.setItem("svora_protocol", JSON.stringify(data));
      window.location.href = "/protocol";
    } catch (error: any) {
      console.error("Uplink failed:", error);
      alert(error.message || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-onyx p-8">
        <LoadingIndicator />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-16 max-w-4xl w-full text-center">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-8 text-white">Your Stats.</h2>
            <div className="grid md:grid-cols-3 gap-12">
              {["age", "weight", "height"].map((field) => (
                <div key={field} className="space-y-4 group">
                  <label className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30 group-focus-within:text-gold-leaf transition-colors">{field}</label>
                  <input 
                    type="text" 
                    placeholder="00"
                    autoFocus={field === "age"}
                    value={(formData as any)[field]}
                    onChange={(e) => updateData(field, e.target.value)}
                    className="w-full py-6 text-6xl font-serif italic text-center border-b border-white/10 bg-transparent focus:outline-none focus:border-gold-leaf transition-all duration-500 placeholder:text-white/5 text-white"
                  />
                </div>
              ))}
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">Press Enter to continue</p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-16 max-w-5xl w-full text-center relative">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-8 text-white">Body Type.</h2>
            
            <div className="max-w-xl mx-auto mb-12">
              <label className="group relative flex flex-col items-center justify-center p-12 rounded-[3rem] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold-leaf/30 transition-all duration-700 cursor-pointer overflow-hidden aspect-video">
                {formData.image ? (
                  <>
                    <img src={formData.image} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Preview" />
                    <div className="relative z-10 px-6 py-3 rounded-full bg-onyx/80 backdrop-blur border border-white/10 text-[9px] font-mono tracking-[0.3em] uppercase text-gold-leaf">
                      AI will detect your body type
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Camera size={32} className="text-white/40 group-hover:text-gold-leaf transition-colors" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Upload a photo (optional)</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {["Skinny", "Athletic", "Heavy", "Average", "Lean"].map((type) => (
                <button
                  key={type}
                  onMouseEnter={() => setHoveredBodyType(type)}
                  onMouseLeave={() => setHoveredBodyType(null)}
                  onClick={() => updateData("bodyType", type)}
                  className={`py-4 px-2 rounded-full border transition-all duration-500 text-[10px] uppercase tracking-widest relative ${
                    formData.bodyType === type 
                    ? "border-gold-leaf bg-gold-leaf text-onyx font-bold" 
                    : "border-white/10 bg-transparent text-white/40 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Hover Card */}
            <AnimatePresence>
              {hoveredBodyType && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-1/2 -translate-x-1/2 -bottom-24 w-full max-w-sm p-6 glass-card border-gold-leaf/20 bg-gold-leaf/5 backdrop-blur-xl z-50 pointer-events-none"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Info size={14} className="text-gold-leaf" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-leaf">{hoveredBodyType} Type</span>
                  </div>
                  <p className="text-xs text-white/70 italic font-serif leading-relaxed">
                    {bodyTypeInfo[hoveredBodyType]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      case 2:
        return (
          <div className="space-y-16 max-w-6xl w-full text-center">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-8 text-white">What's Your Goal?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: "Hypertrophy", label: "Build Muscle", sub: "Get bigger and stronger" },
                { id: "Lean", label: "Lose Fat", sub: "Burn fat and tone up" },
                { id: "Power", label: "Get Stronger", sub: "Build raw power" },
                { id: "Custom", label: "Custom", sub: "Set your own goal" }
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => updateData("goal", goal.id)}
                  className={`p-10 rounded-[2.5rem] border transition-all duration-700 text-left group relative overflow-hidden ${
                    formData.goal === goal.id 
                    ? "border-gold-leaf bg-gold-leaf/5" 
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="relative z-10 space-y-2">
                    <div className={`text-2xl font-serif italic ${formData.goal === goal.id ? "text-gold-leaf" : "text-white"}`}>{goal.label}</div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/40">{goal.sub}</div>
                  </div>
                  {formData.goal === goal.id && (
                    <div className="absolute top-6 right-6 text-gold-leaf">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {formData.goal === "Custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-w-2xl mx-auto mt-12"
                >
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Describe your goal..."
                    value={formData.customGoal}
                    onChange={(e) => updateData("customGoal", e.target.value)}
                    className="w-full py-6 text-3xl font-serif italic text-center border-b border-gold-leaf/30 bg-transparent focus:outline-none focus:border-gold-leaf transition-all duration-500 placeholder:text-white/10 text-white"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      case 3:
        return (
          <div className="space-y-16 max-w-4xl w-full text-center">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-8 text-white">Where Do You Train?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { id: "Commercial Gym", label: "Full Gym", sub: "All equipment available" },
                { id: "Home Training", label: "At Home", sub: "Dumbbells or bodyweight" }
              ].map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => updateData("trainingLocation", loc.id)}
                  className={`p-16 rounded-[3rem] border transition-all duration-700 text-center group ${
                    formData.trainingLocation === loc.id 
                    ? "border-gold-leaf bg-gold-leaf/10" 
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`text-3xl font-serif italic mb-4 ${formData.trainingLocation === loc.id ? "text-gold-leaf" : "text-white"}`}>{loc.label}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">{loc.sub}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-16 max-w-2xl w-full mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-8 text-white">Eating Schedule.</h2>
            <div className="p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 flex items-center justify-between gap-12">
              <div className="text-left">
                <div className="font-serif text-3xl italic text-white mb-2">Intermittent Fasting</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Skip breakfast, eat within 8 hours</div>
              </div>
              <button 
                onClick={() => updateData("fasting", !formData.fasting)}
                className={`w-16 h-8 rounded-full transition-colors duration-500 relative ${
                  formData.fasting ? "bg-gold-leaf" : "bg-white/10"
                }`}
              >
                <motion.div 
                  animate={{ x: formData.fasting ? 32 : 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-onyx text-mercury p-8 flex flex-col justify-between">
      {/* Header */}
      <nav className="flex justify-between items-center py-6 px-4 md:px-8 border-b border-white/5">
        <Link href="/" className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 hover:text-gold-leaf transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? "w-8 bg-gold-leaf" : "w-2 bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Step 0{currentStep + 1}</div>
      </nav>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex items-center justify-center w-full py-12"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Footer Controls */}
      <div className="flex justify-between items-center px-4 md:px-8 py-6 border-t border-white/5">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`text-[10px] font-mono uppercase tracking-[0.4em] transition-opacity ${currentStep === 0 ? "opacity-0" : "opacity-40 hover:opacity-100 text-white"}`}
        >
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={isContinueDisabled()}
          className="btn-magnetic group disabled:opacity-30 disabled:pointer-events-none px-8 py-4 rounded-full border border-white/10 relative overflow-hidden bg-white"
        >
          <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-4 text-black group-hover:text-white transition-colors">
            {currentStep === steps.length - 1 ? "Get My Plan" : "Continue"}
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-void scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </button>
      </div>
    </div>
  );
}

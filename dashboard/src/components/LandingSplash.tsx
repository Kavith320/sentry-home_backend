'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Radio, Cpu, Activity, CheckCircle2 } from 'lucide-react';

export default function LandingSplash({ onComplete }: { onComplete?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence steps (extended timing for satisfying progress fill)
    const timer1 = setTimeout(() => setStep(1), 1100);
    const timer2 = setTimeout(() => setStep(2), 2300);
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Animated Background Mesh Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

          {/* Pulsing Concentric Radar Rings */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-44 h-44 rounded-full border border-cyan-500/20"
            />
            <motion.div
              animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute w-32 h-32 rounded-full border border-emerald-500/30"
            />

            {/* Glowing Logo Badge */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative p-5 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 text-cyan-400"
            >
              <Shield className="w-12 h-12 text-cyan-400" />
            </motion.div>
          </div>

          {/* Title Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center space-y-2 max-w-md relative z-10"
          >
            <h1 className="text-2xl font-black tracking-wider text-slate-100 uppercase">
              SENTRY <span className="text-cyan-400">HOME</span> SECURITY
            </h1>
            <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
              ESP-NOW & MQTT IoT Sentinel Platform
            </p>
          </motion.div>

          {/* Initialization Progress Bar & Status Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 w-full max-w-xs space-y-3 relative z-10"
          >
            {/* Progress Bar Container */}
            <div className="h-1.5 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: step === 0 ? '30%' : step === 1 ? '70%' : '100%' }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400"
              />
            </div>

            {/* Status Indicator Messages */}
            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-400 h-6">
              {step === 0 && (
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Initializing Gateway Mesh...</span>
                </div>
              )}
              {step === 1 && (
                <div className="flex items-center space-x-2 text-amber-400">
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing MongoDB Telemetry...</span>
                </div>
              )}
              {step >= 2 && (
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Operational • Live Monitoring Active</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

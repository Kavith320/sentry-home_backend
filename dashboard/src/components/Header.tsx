'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Radio, RefreshCw, Send, CheckCircle2, X, Volume2, VolumeX, Trash2, AlertTriangle } from 'lucide-react';
import { simulateTelemetry, purgeAllSystemData } from '@/lib/api';
import { isSoundEnabled, setSoundEnabled, playAlarmSound, playWarningSound } from '@/lib/sound';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ title = 'System Overview' }: { title?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [purgeMsg, setPurgeMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Form states
  const [gwChipId, setGwChipId] = useState('GW_LIVING_ROOM_01');
  const [sensorChipId, setSensorChipId] = useState('SN_FRONT_DOOR_A1');
  const [sensorState, setSensorState] = useState('OPEN');
  const [battery, setBattery] = useState(3.75);
  const [rssi, setRssi] = useState(-68);

  useEffect(() => {
    setMounted(true);
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playWarningSound();
    }
  };

  const handlePurgeAll = async () => {
    setIsPurging(true);
    setPurgeMsg('');
    try {
      await purgeAllSystemData();
      playWarningSound();
      setPurgeMsg('All database records cleared successfully!');
      setTimeout(() => {
        setIsPurgeOpen(false);
        setPurgeMsg('');
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setPurgeMsg(err.message || 'Purge failed');
    } finally {
      setIsPurging(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setStatusMsg('');

    try {
      await simulateTelemetry({
        gatewayChipId: gwChipId,
        sensorChipId,
        sensorState,
        battery: Number(battery),
        rssi: Number(rssi)
      });

      // Play alert chime based on state
      if (['ALARM', 'MOTION_ALERT', 'OPEN'].includes(sensorState)) {
        playAlarmSound();
      } else {
        playWarningSound();
      }

      setStatusMsg('Telemetry injected successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setStatusMsg('');
      }, 1200);
    } catch (err: any) {
      setStatusMsg(err.message || 'Simulation failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-3">
        {/* Sound Alert Toggle */}
        <button
          onClick={toggleSound}
          title={soundOn ? 'Sound Alerts Enabled' : 'Sound Alerts Muted'}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            soundOn
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
          }`}
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundOn ? 'Audio ON' : 'Audio OFF'}</span>
        </button>

        {/* Telemetry Injection Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/10 active:scale-95"
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Inject Telemetry</span>
        </button>

        {/* Purge All Database Data Button */}
        <button
          onClick={() => setIsPurgeOpen(true)}
          title="Clear all database records"
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Purge All Data</span>
        </button>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>API Connected</span>
        </div>
      </div>

      {/* Render Modal via React Portal directly into document.body */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                {/* Backdrop Dismiss Area */}
                <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative z-10 my-auto"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-3 pr-6">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Simulate Telemetry Packet</h3>
                      <p className="text-xs text-slate-400">Inject an ESP-NOW MQTT packet to update live state</p>
                    </div>
                  </div>

                  <form onSubmit={handleSimulate} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Chip ID</label>
                      <input
                        type="text"
                        value={gwChipId}
                        onChange={(e) => setGwChipId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Sensor Chip ID</label>
                      <input
                        type="text"
                        value={sensorChipId}
                        onChange={(e) => setSensorChipId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Sensor State</label>
                        <select
                          value={sensorState}
                          onChange={(e) => setSensorState(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="MOTION_ALERT">MOTION</option>
                          <option value="ALARM">ALARM</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Battery (V)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={battery}
                          onChange={(e) => setBattery(parseFloat(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">RSSI (dBm)</label>
                        <input
                          type="number"
                          value={rssi}
                          onChange={(e) => setRssi(parseInt(e.target.value, 10))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    {statusMsg && (
                      <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{statusMsg}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPublishing}
                        className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                      >
                        {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Publish Payload</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Render Purge Confirmation Modal via React Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isPurgeOpen && (
              <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                <div className="fixed inset-0" onClick={() => setIsPurgeOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative z-10 my-auto"
                >
                  <button
                    onClick={() => setIsPurgeOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-3 pr-6">
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Purge All System Data</h3>
                      <p className="text-xs text-rose-300/80">Irreversible Action: Clear all database records</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans">
                    This action will permanently delete all registered Gateways, Sensor Nodes, and Telemetry Audit Logs from MongoDB and reset the frontend dashboard.
                  </p>

                  {purgeMsg && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{purgeMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPurgeOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePurgeAll}
                      disabled={isPurging}
                      className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-rose-500/20 active:scale-95"
                    >
                      {isPurging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>Yes, Purge Database</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}

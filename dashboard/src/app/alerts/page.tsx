'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { fetchLowBatteryAlerts, fetchStaleDevices, SensorDevice, GatewayDevice } from '@/lib/api';
import { AlertTriangle, BatteryLow, WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AlertsPage() {
  const [lowBatterySensors, setLowBatterySensors] = useState<SensorDevice[]>([]);
  const [staleGateways, setStaleGateways] = useState<GatewayDevice[]>([]);
  const [staleSensors, setStaleSensors] = useState<SensorDevice[]>([]);
  const [threshold, setThreshold] = useState(3.3);
  const [staleMinutes, setStaleMinutes] = useState(30);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const lowBat = await fetchLowBatteryAlerts(threshold);
      const stale = await fetchStaleDevices(staleMinutes);
      setLowBatterySensors(lowBat);
      setStaleGateways(stale.gateways);
      setStaleSensors(stale.sensors);
    } catch (err) {
      console.error('Failed to load health alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [threshold, staleMinutes]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Device Health & Warning Alerts" />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Low Battery Alert Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <BatteryLow className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Low Battery Warning Alerts</h3>
                <p className="text-xs text-slate-400">Sensors below critical operating voltage threshold</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-400">Threshold Voltage:</label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value={3.5}>3.5 V</option>
                <option value={3.3}>3.3 V (Default)</option>
                <option value={3.1}>3.1 V (Critical)</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Sensor Chip ID</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Battery Voltage</th>
                  <th className="px-6 py-3">Routing Gateway</th>
                  <th className="px-6 py-3">Last Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {lowBatterySensors.map((sensor) => (
                  <tr key={sensor._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-amber-400">{sensor.chipId}</td>
                    <td className="px-6 py-4 font-sans">
                      <StatusBadge status={sensor.sensorState} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                        {sensor.battery}V
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{sensor.lastGatewayChipId || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(sensor.lastSeen).toLocaleString()}</td>
                  </tr>
                ))}
                {lowBatterySensors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">
                      All battery levels operating nominally above {threshold}V threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stale Device Detection Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Inactive / Stale Device Monitor</h3>
                <p className="text-xs text-slate-400">Devices without telemetry updates exceeding inactivity window</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-400">Inactivity Window:</label>
              <select
                value={staleMinutes}
                onChange={(e) => setStaleMinutes(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-sans"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Default)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stale Gateways */}
            <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-950/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Stale Gateways ({staleGateways.length})</span>
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {staleGateways.map((gw) => (
                  <div key={gw._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-200 font-bold">{gw.chipId}</span>
                    <span className="text-slate-400">{new Date(gw.lastSeen).toLocaleTimeString()}</span>
                  </div>
                ))}
                {staleGateways.length === 0 && <p className="text-slate-500 text-xs italic p-2">No inactive gateways.</p>}
              </div>
            </div>

            {/* Stale Sensors */}
            <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-950/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>Stale Sensors ({staleSensors.length})</span>
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {staleSensors.map((sn) => (
                  <div key={sn._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-200 font-bold">{sn.chipId}</span>
                    <span className="text-slate-400">{new Date(sn.lastSeen).toLocaleTimeString()}</span>
                  </div>
                ))}
                {staleSensors.length === 0 && <p className="text-slate-500 text-xs italic p-2">No inactive sensors.</p>}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

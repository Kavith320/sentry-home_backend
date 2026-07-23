'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { fetchHomeTopology, GatewayDevice, SensorDevice } from '@/lib/api';
import { Network, Home, Cpu, Radio, ChevronRight, Signal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopologyPage() {
  const [homeIdInput, setHomeIdInput] = useState('HOME_SECURE_ZONE');
  const [activeHomeId, setActiveHomeId] = useState('HOME_SECURE_ZONE');
  const [gateways, setGateways] = useState<GatewayDevice[]>([]);
  const [sensors, setSensors] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTopology = async (hId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHomeTopology(hId);
      setGateways(data.gateways);
      setSensors(data.sensors);
      setActiveHomeId(hId);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch topology');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopology(activeHomeId);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeIdInput.trim()) {
      loadTopology(homeIdInput.trim());
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Home Device Topology Hierarchy" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center space-x-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Home className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Inspect Home Topology</label>
            <input
              type="text"
              value={homeIdInput}
              onChange={(e) => setHomeIdInput(e.target.value)}
              placeholder="Enter Home ID (e.g. HOME_SECURE_ZONE)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            Inspect Topology
          </button>
        </form>

        {/* Tree Topology Diagram */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
            <Network className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Topology Tree for Home: <span className="text-cyan-400 font-mono">{activeHomeId}</span></h3>
              <p className="text-xs text-slate-400 mt-0.5">Central Gateways ➔ Routed ESP-NOW Sensors</p>
            </div>
          </div>

          {error && <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">{error}</div>}

          <div className="mt-8 space-y-8">
            {gateways.map((gw) => {
              const attachedSensors = sensors.filter((s) => s.lastGatewayChipId === gw.chipId);

              return (
                <div key={gw._id} className="border border-slate-800 rounded-2xl p-6 bg-slate-950/60 shadow-lg">
                  {/* Gateway Node */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 font-mono">{gw.chipId}</div>
                        <div className="text-xs text-slate-400 mt-0.5">ESP32 Central Gateway</div>
                      </div>
                    </div>

                    <StatusBadge status={gw.connectionStatus} type="connection" />
                  </div>

                  {/* Attached Sensors Sub-Tree */}
                  <div className="mt-6 pl-6 border-l-2 border-slate-800 space-y-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                      <span>Attached Sensor Nodes ({attachedSensors.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {attachedSensors.map((sn) => (
                        <div key={sn._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Radio className="w-4 h-4 text-emerald-400" />
                              <span className="font-bold text-xs text-cyan-300 font-mono">{sn.chipId}</span>
                            </div>
                            <StatusBadge status={sn.sensorState} />
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>Battery: <strong className="text-slate-200">{sn.battery ? `${sn.battery}V` : '-'}</strong></span>
                            <span className="flex items-center space-x-1">
                              <Signal className="w-3 h-3 text-cyan-400" />
                              <span>{sn.rssi ? `${sn.rssi} dBm` : '-'}</span>
                            </span>
                          </div>
                        </div>
                      ))}

                      {attachedSensors.length === 0 && (
                        <div className="col-span-full p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 text-xs text-slate-500 italic">
                          No sensor nodes routing telemetry through this gateway currently.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {gateways.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-500 font-medium">
                No gateways associated with Home ID &quot;{activeHomeId}&quot;. Use device settings to assign gateways to this home.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

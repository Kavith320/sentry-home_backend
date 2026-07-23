'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { fetchGateways, fetchSensors, updateGatewayStatus, updateSensorState, deleteDeviceByChipId, GatewayDevice, SensorDevice } from '@/lib/api';
import { Cpu, Radio, RefreshCw, Edit3, Power, Signal, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DevicesPage() {
  const [gateways, setGateways] = useState<GatewayDevice[]>([]);
  const [sensors, setSensors] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gateways' | 'sensors'>('gateways');

  const loadData = async () => {
    try {
      const gw = await fetchGateways();
      const sn = await fetchSensors();
      setGateways(gw);
      setSensors(sn);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chipId: string) => {
    if (!window.confirm(`Delete device '${chipId}' and all its telemetry logs?`)) return;
    try {
      await deleteDeviceByChipId(chipId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete device');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleGateway = async (gw: GatewayDevice) => {
    const newStatus = gw.connectionStatus === 'online' ? 'offline' : 'online';
    await updateGatewayStatus(gw.chipId, newStatus, gw.homeId || undefined);
    loadData();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Device Registry Management" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('gateways')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'gateways'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Gateways ({gateways.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'sensors'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Sensor Nodes ({sensors.length})</span>
            </button>
          </div>

          <button onClick={loadData} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:bg-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Gateways Table */}
        {activeTab === 'gateways' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>ESP32 Central Gateways</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Chip ID (Primary Key)</th>
                    <th className="px-6 py-3.5">Connection Status</th>
                    <th className="px-6 py-3.5">Home ID</th>
                    <th className="px-6 py-3.5">Last Communicated</th>
                    <th className="px-6 py-3.5 text-right">Quick Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {gateways.map((gw) => (
                    <tr key={gw._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-cyan-300 hover:text-cyan-200">
                        <Link href={`/devices/${encodeURIComponent(gw.chipId)}`} className="inline-flex items-center space-x-1.5 hover:underline">
                          <span>{gw.chipId}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <StatusBadge status={gw.connectionStatus} type="connection" />
                      </td>
                      <td className="px-6 py-4 text-slate-300">{gw.homeId || <span className="text-slate-500 italic">Unassigned</span>}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(gw.lastSeen).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-sans">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleGateway(gw)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1"
                          >
                            <Power className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Toggle Status</span>
                          </button>
                          <button
                            onClick={() => handleDelete(gw.chipId)}
                            title="Delete gateway and all logs"
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {gateways.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-sans">
                        No gateways registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Sensors Table */}
        {activeTab === 'sensors' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>ESP-NOW Sensor Nodes</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Chip ID (Primary Key)</th>
                    <th className="px-6 py-3.5">State</th>
                    <th className="px-6 py-3.5">Battery</th>
                    <th className="px-6 py-3.5">Signal (RSSI)</th>
                    <th className="px-6 py-3.5">Last Router Gateway</th>
                    <th className="px-6 py-3.5">Last Seen</th>
                    <th className="px-6 py-3.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {sensors.map((sn) => (
                    <tr key={sn._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-cyan-300 hover:text-cyan-200">
                        <Link href={`/devices/${encodeURIComponent(sn.chipId)}`} className="inline-flex items-center space-x-1.5 hover:underline">
                          <span>{sn.chipId}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <StatusBadge status={sn.sensorState} />
                      </td>
                      <td className="px-6 py-4">
                        {sn.battery !== null ? (
                          <span className={`font-bold ${sn.battery <= 3.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {sn.battery}V
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Signal className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{sn.rssi ? `${sn.rssi} dBm` : '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{sn.lastGatewayChipId || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(sn.lastSeen).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-sans">
                        <button
                          onClick={() => handleDelete(sn.chipId)}
                          title="Delete sensor node and all logs"
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors ml-auto flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sensors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-sans">
                        No sensors registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

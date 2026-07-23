'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import DeviceChart from '@/components/DeviceChart';
import {
  fetchGatewayByChipId,
  fetchSensorByChipId,
  fetchTelemetryHistory,
  deleteDeviceByChipId,
  GatewayDevice,
  SensorDevice,
  TelemetryLogItem
} from '@/lib/api';
import { ArrowLeft, Cpu, Radio, Battery, Signal, Clock, Calendar, RefreshCw, Activity, ShieldCheck, Home, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeviceDetailPage({ params }: { params: { chipId: string } }) {
  const chipId = decodeURIComponent(params.chipId);
  const [gateway, setGateway] = useState<GatewayDevice | null>(null);
  const [sensor, setSensor] = useState<SensorDevice | null>(null);
  const [logs, setLogs] = useState<TelemetryLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDeviceDetails = async () => {
    try {
      // 1. Try to fetch as Gateway first
      const gw = await fetchGatewayByChipId(chipId);
      if (gw) {
        setGateway(gw);
        const history = await fetchTelemetryHistory(1, 40, undefined, chipId);
        setLogs(history.data || []);
      } else {
        // 2. Try to fetch as Sensor Node
        const sn = await fetchSensorByChipId(chipId);
        if (sn) {
          setSensor(sn);
          const history = await fetchTelemetryHistory(1, 40, chipId);
          setLogs(history.data || []);
        }
      }
    } catch (err) {
      console.error('Error loading device detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete device '${chipId}' and all its telemetry logs?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDeviceByChipId(chipId);
      window.location.href = '/devices';
    } catch (err: any) {
      alert(err.message || 'Failed to delete device');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadDeviceDetails();
    const interval = setInterval(loadDeviceDetails, 3000);
    return () => clearInterval(interval);
  }, [chipId]);

  const isGateway = !!gateway;
  const isSensor = !!sensor;
  const isFound = isGateway || isSensor;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={`Device Detail: ${chipId}`} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb & Action Controls */}
        <div className="flex items-center justify-between">
          <Link
            href="/devices"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Device Registry</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadDeviceDetails}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isFound && (
              <button
                onClick={handleDeleteDevice}
                disabled={isDeleting}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Remove Device'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Device Characteristics Header Card */}
        {isFound && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${isGateway ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {isGateway ? <Cpu className="w-7 h-7" /> : <Radio className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-extrabold text-slate-100 font-mono">{chipId}</h2>
                    <StatusBadge
                      status={isGateway ? gateway.connectionStatus : sensor!.sensorState}
                      type={isGateway ? 'connection' : 'sensor'}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {isGateway ? 'Central ESP32 MQTT Gateway Node' : 'Low-Power ESP32 / ESP-NOW Sensor Node'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware Characteristics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 font-sans block mb-1">Battery Level</span>
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-100 font-bold text-sm">
                    {isSensor && sensor!.battery !== null ? `${sensor!.battery}V` : 'Line Powered'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 font-sans block mb-1">Signal Strength (RSSI)</span>
                <div className="flex items-center space-x-2">
                  <Signal className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-100 font-bold text-sm">
                    {isSensor && sensor!.rssi ? `${sensor!.rssi} dBm` : 'Direct Link'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 font-sans block mb-1">Home Association</span>
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-100 font-bold text-sm">
                    {isGateway ? gateway!.homeId || 'Unassigned' : 'Linked via Gateway'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 font-sans block mb-1">Last Telemetry</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-100 font-bold text-xs">
                    {new Date(isGateway ? gateway!.lastSeen : sensor!.lastSeen).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Selective Metric Time-Series Graph */}
        {isFound && <DeviceChart logs={logs} />}

        {/* Device-Specific Live Telemetry Stream */}
        {isFound && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Dedicated Live MQTT Log Feed for Device: {chipId}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Sensor Chip ID</th>
                    <th className="px-5 py-3">Gateway Router ID</th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3">Battery</th>
                    <th className="px-5 py-3">RSSI Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold text-cyan-300">{log.sensorChipId}</td>
                      <td className="px-5 py-3.5 text-slate-300">{log.gatewayChipId}</td>
                      <td className="px-5 py-3.5 font-sans">
                        <StatusBadge status={log.sensorState} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{log.battery ? `${log.battery}V` : '-'}</td>
                      <td className="px-5 py-3.5 text-slate-400">{log.rssi ? `${log.rssi} dBm` : '-'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No telemetry logs recorded specifically for this device yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Not Found State */}
        {!isFound && !loading && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">Device Not Found</h3>
            <p className="text-xs text-slate-500">
              No Gateway or Sensor Node with Chip ID &quot;{chipId}&quot; exists in the database registry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

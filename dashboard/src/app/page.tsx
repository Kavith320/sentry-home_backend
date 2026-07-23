'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchDashboardSummary, fetchTelemetryHistory, DashboardSummary, TelemetryLogItem } from '@/lib/api';
import { playAlarmSound, playWarningSound } from '@/lib/sound';
import { Cpu, Radio, AlertTriangle, Activity, WifiOff, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<TelemetryLogItem[]>([]);
  const [lastLogId, setLastLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const sum = await fetchDashboardSummary();
      setSummary(sum);
      const history = await fetchTelemetryHistory(1, 6);
      const logs: TelemetryLogItem[] = history.data || [];
      setRecentLogs(logs);

      if (logs.length > 0) {
        const latest = logs[0];
        if (lastLogId && latest._id !== lastLogId) {
          // New telemetry packet detected
          if (['ALARM', 'MOTION_ALERT', 'OPEN'].includes(latest.sensorState)) {
            playAlarmSound();
          } else {
            playWarningSound();
          }
        }
        setLastLogId(latest._id);
      }
    } catch (err) {
      console.error('Error loading summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="System Overview & Analytics" />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Gateways"
            value={summary ? summary.gateways.total : '-'}
            subtitle={summary ? `${summary.gateways.online} Online • ${summary.gateways.offline} Offline` : 'Loading...'}
            icon={Cpu}
            color="cyan"
          />
          <StatCard
            title="Sensors Active"
            value={summary ? summary.sensors.total : '-'}
            subtitle={summary ? `${summary.gateways.distinctHomesCount} Monitored Homes` : 'Loading...'}
            icon={Radio}
            color="emerald"
          />
          <StatCard
            title="Low Battery Alerts"
            value={summary ? summary.sensors.lowBatteryCount : '-'}
            subtitle={summary ? `Threshold ≤ ${summary.sensors.lowBatteryThreshold}V` : 'Loading...'}
            icon={AlertTriangle}
            color={summary && summary.sensors.lowBatteryCount > 0 ? 'amber' : 'cyan'}
          />
          <StatCard
            title="24h Telemetry Volume"
            value={summary ? summary.telemetry24hCount : '-'}
            subtitle="Packets routed over MQTT"
            icon={Activity}
            color="indigo"
          />
        </div>

        {/* Sensor State Breakdown & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* State Distribution Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Sensor State Breakdown</h3>
              </div>
              <button onClick={loadData} className="text-slate-400 hover:text-slate-200 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {summary?.sensors.statesBreakdown ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(summary.sensors.statesBreakdown).map(([state, count]) => (
                  <div key={state} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                    <StatusBadge status={state} />
                    <div className="text-2xl font-bold text-slate-100 mt-3">{count}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Active Devices</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-500 text-sm">Loading telemetry metrics...</div>
            )}
          </motion.div>

          {/* Quick Health Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Diagnostic Health</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <WifiOff className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-300">Stale Sensors (&gt;30m)</span>
                  </div>
                  <span className="text-sm font-bold text-slate-100">{summary ? summary.sensors.staleCount : 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <Cpu className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-medium text-slate-300">Offline Gateways</span>
                  </div>
                  <span className="text-sm font-bold text-slate-100">{summary ? summary.gateways.offline : 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
              <span>Auto-refresh interval</span>
              <span className="font-mono text-cyan-400">3s</span>
            </div>
          </motion.div>
        </div>

        {/* Live Telemetry Ticker Stream */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Recent Telemetry Stream</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Sensor Chip ID</th>
                  <th className="px-4 py-3">Gateway Chip ID</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Battery</th>
                  <th className="px-4 py-3">Signal (RSSI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-bold text-cyan-300">{log.sensorChipId}</td>
                    <td className="px-4 py-3 text-slate-300">{log.gatewayChipId}</td>
                    <td className="px-4 py-3 font-sans">
                      <StatusBadge status={log.sensorState} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.battery ? `${log.battery}V` : '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{log.rssi ? `${log.rssi} dBm` : '-'}</td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No telemetry packets recorded yet. Use &quot;Inject Telemetry Packet&quot; above to simulate ingestion.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

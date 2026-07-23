'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { fetchTelemetryHistory, TelemetryLogItem } from '@/lib/api';
import { History, ChevronLeft, ChevronRight, Filter, RefreshCw, Signal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const [logs, setLogs] = useState<TelemetryLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sensorFilter, setSensorFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = async (p = page) => {
    setLoading(true);
    try {
      const data = await fetchTelemetryHistory(p, 15, sensorFilter || undefined, gatewayFilter || undefined);
      setLogs(data.data || []);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, [sensorFilter, gatewayFilter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Telemetry Audit History Log" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filters bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Telemetry Query Filters</h3>
              <p className="text-xs text-slate-400">Filter historical telemetry events by hardware Chip IDs</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Filter by Sensor Chip ID..."
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Filter by Gateway Chip ID..."
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button onClick={() => loadHistory(page)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Log Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">Historical Telemetry Log ({totalCount} Total Events)</h3>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page <= 1}
                onClick={() => loadHistory(page - 1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadHistory(page + 1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Log Timestamp</th>
                  <th className="px-6 py-3.5">Gateway Chip ID</th>
                  <th className="px-6 py-3.5">Sensor Chip ID</th>
                  <th className="px-6 py-3.5">Sensor State</th>
                  <th className="px-6 py-3.5">Battery</th>
                  <th className="px-6 py-3.5">Signal (RSSI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-300">{item.gatewayChipId}</td>
                    <td className="px-6 py-4 font-bold text-cyan-300">{item.sensorChipId}</td>
                    <td className="px-6 py-4 font-sans">
                      <StatusBadge status={item.sensorState} />
                    </td>
                    <td className="px-6 py-4 text-slate-300">{item.battery ? `${item.battery}V` : '-'}</td>
                    <td className="px-6 py-4 text-slate-400 flex items-center space-x-1">
                      <Signal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.rssi ? `${item.rssi} dBm` : '-'}</span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-sans">
                      No historical telemetry logs match the current query filter.
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

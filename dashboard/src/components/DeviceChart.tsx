'use client';

import { useState } from 'react';
import { TelemetryLogItem } from '@/lib/api';
import { Battery, Signal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeviceChartProps {
  logs: TelemetryLogItem[];
}

export default function DeviceChart({ logs }: DeviceChartProps) {
  const [metric, setMetric] = useState<'battery' | 'rssi'>('battery');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; time: string } | null>(null);

  // Filter logs with valid numbers for the selected metric
  const chartLogs = [...logs]
    .reverse()
    .filter((l) => (metric === 'battery' ? l.battery !== null : l.rssi !== null));

  if (chartLogs.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Metric Plotter</span>
          </h3>
        </div>
        <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">
          No telemetry metric data recorded yet for {metric === 'battery' ? 'Battery Voltage' : 'Signal Strength (RSSI)'}.
        </div>
      </div>
    );
  }

  // Extract values
  const values = chartLogs.map((l) => (metric === 'battery' ? Number(l.battery) : Number(l.rssi)));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const width = 650;
  const height = 180;
  const padding = 25;

  const points = chartLogs.map((log, index) => {
    const val = metric === 'battery' ? Number(log.battery) : Number(log.rssi);
    const x = padding + (index / Math.max(chartLogs.length - 1, 1)) * (width - padding * 2);
    // Y is inverted in SVG
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    const time = new Date(log.timestamp).toLocaleTimeString();
    return { x, y, val, time };
  });

  const svgPath = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const fillPath = points.length > 0
    ? `${svgPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Metric Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm">Telemetry Time-Series Metric Plotter</h3>
        </div>

        {/* Selective Metric Buttons */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetric('battery')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'battery'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Battery className="w-3.5 h-3.5" />
            <span>Battery Voltage (V)</span>
          </button>

          <button
            onClick={() => setMetric('rssi')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'rssi'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Signal className="w-3.5 h-3.5" />
            <span>Signal Strength (dBm)</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Plot Area */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric === 'battery' ? '#f59e0b' : '#06b6d4'} stopOpacity="0.35" />
              <stop offset="100%" stopColor={metric === 'battery' ? '#f59e0b' : '#06b6d4'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth="1" />

          {/* Area Fill */}
          {fillPath && <path d={fillPath} fill="url(#chartGradient)" />}

          {/* Metric Line */}
          {svgPath && (
            <path
              d={svgPath}
              fill="none"
              stroke={metric === 'battery' ? '#f59e0b' : '#06b6d4'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill={metric === 'battery' ? '#f59e0b' : '#06b6d4'}
                className="transition-all cursor-pointer hover:r-6"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs shadow-xl font-mono pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`
            }}
          >
            <div className="font-bold text-slate-100">{hoveredPoint.val} {metric === 'battery' ? 'V' : 'dBm'}</div>
            <div className="text-[10px] text-slate-400">{hoveredPoint.time}</div>
          </div>
        )}
      </div>

      {/* Axis Min / Max Indicators */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
        <span>Min: {minVal} {metric === 'battery' ? 'V' : 'dBm'}</span>
        <span>Telemetry Points Plotted: {chartLogs.length}</span>
        <span>Max: {maxVal} {metric === 'battery' ? 'V' : 'dBm'}</span>
      </div>
    </motion.div>
  );
}

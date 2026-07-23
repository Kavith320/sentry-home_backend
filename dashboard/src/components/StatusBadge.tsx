'use client';

import { CheckCircle2, AlertOctagon, BellRing, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'connection' | 'sensor';
}

export default function StatusBadge({ status, type = 'sensor' }: StatusBadgeProps) {
  const normalized = status ? status.toUpperCase() : 'UNKNOWN';

  if (type === 'connection') {
    const isOnline = normalized === 'ONLINE';
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </span>
    );
  }

  // Sensor state badges
  if (normalized === 'OPEN' || normalized === 'MOTION_ALERT') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <BellRing className="w-3.5 h-3.5" />
        <span>{normalized}</span>
      </span>
    );
  }

  if (normalized === 'ALARM') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5" />
        <span>ALARM</span>
      </span>
    );
  }

  if (normalized === 'CLOSED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>CLOSED</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      <HelpCircle className="w-3.5 h-3.5" />
      <span>{normalized}</span>
    </span>
  );
}

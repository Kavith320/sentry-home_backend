'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Cpu, AlertTriangle, Network, History, Activity, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Devices', href: '/devices', icon: Cpu },
  { label: 'Health Alerts', href: '/alerts', icon: AlertTriangle },
  { label: 'Home Topology', href: '/topology', icon: Network },
  { label: 'Telemetry Log', href: '/history', icon: History },
  { label: 'System Settings', href: '/settings', icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-lg tracking-tight leading-none">
            SENTRY<span className="text-cyan-400">HOME</span>
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">IoT Security Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 m-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>ESP-NOW Link</span>
          </span>
          <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Active
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Broker: <span className="text-slate-300 font-mono">hivemq:1883</span>
        </div>
      </div>
    </aside>
  );
}

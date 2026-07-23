'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingSplash from '@/components/LandingSplash';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <LandingSplash onComplete={() => setShowSplash(false)} />}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}

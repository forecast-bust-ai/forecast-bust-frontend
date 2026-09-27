'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, Radar, Activity, FlaskConical, History } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Forecast Explorer', href: '/explorer', icon: Compass },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Synoptic Radar', href: '/radar', icon: Radar },
    { name: 'Model Diagnostics', href: '/diagnostics', icon: Activity },
    { name: 'Prediction Lab', href: '/predict', icon: FlaskConical },
    { name: 'Historical Archive', href: '/historical', icon: History },
  ];

  return (
    <nav className="border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/70 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Mic, UserPlus } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isMoc = pathname === '/moc';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070d24]/95 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile View (< md) */}
        <div className="flex md:hidden items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/rotaract-pune-royal.png"
              alt="Rotaract Club of Pune Royal"
              width={140}
              height={44}
              className="h-8 w-auto object-contain drop-shadow"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            {!isMoc ? (
              <Link
                href="/moc"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/40"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>MOC Desk</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </Link>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:flex items-center justify-between h-20 relative">
          
          {/* Left: Event Title */}
          <Link href="/" className="flex items-center gap-2.5 group z-10">
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                11<sup className="text-xs text-amber-400">th</sup> Installation Ceremony
              </span>
              <span className="text-xs font-medium text-slate-300">
                Rotaract Club of Pune Royal • RID 3131
              </span>
            </div>
          </Link>

          {/* Center: Rotary/Rotaract Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="block transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/logos/rotaract-pune-royal.png"
                alt="Rotaract Club of Pune Royal"
                width={170}
                height={55}
                className="h-11 w-auto object-contain drop-shadow"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 z-10">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                !isMoc
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Registration</span>
            </Link>

            <Link
              href="/moc"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isMoc
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Mic className="w-4 h-4 text-pink-400 group-hover:text-white" />
              <span>MOC Desk</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </Link>
          </div>

        </div>

      </div>
    </header>
  );
}

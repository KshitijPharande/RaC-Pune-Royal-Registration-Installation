import React from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import RegistrationForm from '@/components/RegistrationForm';
import { Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-12 w-full flex flex-col items-center">
        
        {/* Hero Section with Floating Shield Logo */}
        <div className="text-center max-w-2xl mb-3 sm:mb-5 flex flex-col items-center">
          
          {/* Floating Hero Shield Logo */}
          <div className="relative w-36 h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 mb-1 flex items-center justify-center animate-float pointer-events-none select-none">
            {/* Ambient subtle glow behind shield */}
            <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-2xl transform scale-80" />
            <Image
              src="/logos/pune-royal-shield.png"
              alt="Rotaract Club of Pune Royal"
              width={240}
              height={240}
              className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] relative z-10 w-auto h-full"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            11<sup className="text-sm sm:text-xl text-amber-400">th</sup> Installation Ceremony
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Rotaract Club of Pune Royal
          </p>

        </div>

        {/* The Registration Card */}
        <div className="w-full">
          <RegistrationForm />
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#040714] py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-semibold">Rotaract Club of Pune Royal</span>
            <span className="text-slate-500">• RID 3131</span>
          </div>
          <div className="text-[11px] text-slate-400">
            🌱 Paperless Registration Initiative
          </div>
        </div>
      </footer>

    </div>
  );
}

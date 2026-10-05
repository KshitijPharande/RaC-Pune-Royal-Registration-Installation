'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import {
  User,
  Phone,
  Building2,
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  Users,
  Briefcase,
} from 'lucide-react';
import { AttendeeCategory, Registration } from '@/types';

export default function RegistrationForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<AttendeeCategory>('rotaractor');
  const [clubName, setClubName] = useState('');
  
  // District Council
  const [isCouncilMember, setIsCouncilMember] = useState<boolean>(false);
  const [councilDesignation, setCouncilDesignation] = useState('');

  // Club BOD (Board of Directors) Position
  const [isBodMember, setIsBodMember] = useState<boolean>(false);
  const [bodDesignation, setBodDesignation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedPass, setSubmittedPass] = useState<Registration | null>(null);

  const handleCategoryChange = (selected: AttendeeCategory) => {
    setCategory(selected);
    if (selected === 'guest') {
      setClubName('N/A');
      setIsCouncilMember(false);
      setCouncilDesignation('');
      setIsBodMember(false);
      setBodDesignation('');
    } else {
      if (clubName === 'N/A') setClubName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (category !== 'guest' && !clubName.trim()) {
      setError('Please enter your Club Name');
      return;
    }

    if (isCouncilMember && !councilDesignation.trim()) {
      setError('Please enter your District Council designation / role');
      return;
    }

    if (category === 'rotaractor' && isBodMember && !bodDesignation.trim()) {
      setError('Please enter your Club BOD designation / role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          category,
          clubName: category === 'guest' ? 'N/A' : clubName.trim(),
          isCouncilMember: category === 'guest' ? false : isCouncilMember,
          councilDesignation: isCouncilMember ? councilDesignation.trim() : undefined,
          isBodMember: category === 'rotaractor' ? isBodMember : false,
          bodDesignation: category === 'rotaractor' && isBodMember ? bodDesignation.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSubmittedPass(data.registration);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d91b5b', '#3b82f6', '#10b981'],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setCategory('rotaractor');
    setClubName('');
    setIsCouncilMember(false);
    setCouncilDesignation('');
    setIsBodMember(false);
    setBodDesignation('');
    setError(null);
    setSubmittedPass(null);
  };

  // If successfully submitted, display the Digital Pass
  if (submittedPass) {
    return (
      <div className="w-full max-w-lg mx-auto py-6 animate-in fade-in duration-300">
        <div className="relative rounded-3xl overflow-hidden p-1 bg-gradient-to-b from-amber-400 via-rose-500 to-blue-600 shadow-2xl">
          <div className="bg-[#0b132b] rounded-[22px] p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Background seal watermarks */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Shield Logo */}
            <div className="mx-auto w-24 h-24 mb-3 relative flex items-center justify-center">
              <Image
                src="/logos/pune-royal-shield.png"
                alt="Pune Royal Shield"
                width={96}
                height={96}
                className="object-contain drop-shadow-md"
              />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Registration Confirmed
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {submittedPass.name}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  submittedPass.category === 'rotaractor'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : submittedPass.category === 'rotarian'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {submittedPass.category}
              </span>

              {submittedPass.isCouncilMember && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Council Member
                </span>
              )}

              {submittedPass.isBodMember && submittedPass.bodDesignation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> BOD
                </span>
              )}
            </div>

            {submittedPass.councilDesignation && (
              <p className="mt-2 text-sm font-semibold text-amber-300">
                ⭐ {submittedPass.councilDesignation}
              </p>
            )}

            {submittedPass.isBodMember && submittedPass.bodDesignation && (
              <p className="mt-1 text-xs font-semibold text-cyan-300">
                💼 Club Role: {submittedPass.bodDesignation}
              </p>
            )}

            {submittedPass.clubName !== 'N/A' && (
              <p className="mt-1.5 text-sm text-slate-300 font-medium">
                {submittedPass.clubName}
              </p>
            )}

            {/* Event Details Card */}
            <div className="mt-6 pt-4 border-t border-white/10 text-left bg-slate-900/60 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Event:</span>
                <span className="text-white font-medium">11th Installation Ceremony</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Host:</span>
                <span className="text-white font-medium">Rotaract Club of Pune Royal</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Attendee Sr. No:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  #{submittedPass.srNo || submittedPass.id}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Your name is now instantly available to the Stage Desk & Anchor. Thank you for supporting our paperless green initiative!
            </p>

            <button
              onClick={handleReset}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Register Another Attendee
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Compact Form Header */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/10">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Attendee Registration
          </h2>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            🌱 Paperless
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm sm:text-base transition-all"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              WhatsApp / Mobile Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm sm:text-base transition-all"
              />
            </div>
          </div>

          {/* Attendee Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              You are attending as <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Rotaractor */}
              <button
                type="button"
                onClick={() => handleCategoryChange('rotaractor')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  category === 'rotaractor'
                    ? 'bg-blue-600/25 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Award className="w-5 h-5 mb-1.5 text-blue-400" />
                <span className="text-xs font-bold">Rotaractor</span>
              </button>

              {/* Rotarian */}
              <button
                type="button"
                onClick={() => handleCategoryChange('rotarian')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  category === 'rotarian'
                    ? 'bg-purple-600/25 border-purple-500 text-purple-300 ring-2 ring-purple-500/50 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Crown className="w-5 h-5 mb-1.5 text-purple-400" />
                <span className="text-xs font-bold">Rotarian</span>
              </button>

              {/* Guest */}
              <button
                type="button"
                onClick={() => handleCategoryChange('guest')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  category === 'guest'
                    ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Users className="w-5 h-5 mb-1.5 text-emerald-400" />
                <span className="text-xs font-bold">Guest</span>
              </button>
            </div>
          </div>

          {/* Club Name (Only for Rotaractors and Rotarians - Clean Typed Input) */}
          {category !== 'guest' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Club Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Type your Club Name (e.g. Rotaract Club of Pune Royal)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm sm:text-base transition-all"
                />
              </div>
            </div>
          )}

          {/* District Council Toggle (Rotaractors / Rotarians) */}
          {category !== 'guest' && (
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">District Council Member?</h3>
                    <p className="text-xs text-slate-400">
                      Do you hold a post in District Council (RID 3131)?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCouncilMember(false);
                      setCouncilDesignation('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isCouncilMember
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCouncilMember(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCouncilMember
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Council Designation field when Yes */}
              {isCouncilMember && (
                <div className="pt-2 border-t border-slate-800/80 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5">
                    District Designation / Role <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={councilDesignation}
                    onChange={(e) => setCouncilDesignation(e.target.value)}
                    placeholder="e.g. District Secretary, ZRR, District Director, etc."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    ✨ Your designation will be announced by the anchor during protocol acknowledgments.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Club BOD (Board of Directors) Position - Specifically for Rotaractors */}
          {category === 'rotaractor' && (
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Club BOD Position?</h3>
                    <p className="text-xs text-slate-400">
                      Do you hold a Board of Directors position in your club?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBodMember(false);
                      setBodDesignation('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isBodMember
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBodMember(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isBodMember
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* BOD Designation field when Yes */}
              {isBodMember && (
                <div className="pt-2 border-t border-slate-800/80 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1.5">
                    Club BOD Designation / Role <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bodDesignation}
                    onChange={(e) => setBodDesignation(e.target.value)}
                    placeholder="e.g. Club President, Club Secretary, Vice President, Treasurer, Director, etc."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <p className="text-[11px] text-cyan-400/80 mt-1">
                    ✨ The MOC will acknowledge your club leadership post during announcements.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Registering & Syncing...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer logo */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center">
          <Image
            src="/logos/rotaract-pune-royal.png"
            alt="Rotaract Club of Pune Royal"
            width={200}
            height={60}
            className="h-10 sm:h-12 w-auto object-contain drop-shadow"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>

      </div>
    </div>
  );
}

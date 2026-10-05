'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Crown,
  Award,
  Users,
  CheckCircle2,
  Circle,
  Download,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  Trash2,
  Clock,
  Sparkles,
  Phone,
  Building2,
  Radio,
  FileSpreadsheet,
  Briefcase,
} from 'lucide-react';
import { Registration, StatsSummary } from '@/types';

export default function MocDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'council' | 'rotarians' | 'rotaractors' | 'guests'>('all');
  const [filterAnnounced, setFilterAnnounced] = useState<'all' | 'pending' | 'announced'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [previousCount, setPreviousCount] = useState<number>(0);

  // Play subtle chime when a new registration comes in
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio not permitted without user interaction
    }
  }, [soundEnabled]);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/registrations', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
        setStats(data.stats);
        setLastUpdated(new Date());

        // Check if new attendees were added
        if (!isInitial && data.registrations.length > previousCount) {
          playChime();
        }
        setPreviousCount(data.registrations.length);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [playChime, previousCount]);

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto polling every 3.5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Toggle announced status
  const handleToggleAnnounced = async (id: string) => {
    // Optimistic UI update
    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, announced: !item.announced } : item
      )
    );

    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (!data.success) {
        // Rollback on failure
        fetchData();
      } else {
        // Refresh stats
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      fetchData();
    }
  };

  // Delete entry (duplicate/test)
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the list?`)) return;
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Protocol buckets
  const protocolCategorized = useMemo(() => {
    const councilRotaractors = registrations.filter(
      (r) => r.category === 'rotaractor' && r.isCouncilMember
    );
    const rotarians = registrations.filter((r) => r.category === 'rotarian');
    const regularRotaractors = registrations.filter(
      (r) => r.category === 'rotaractor' && !r.isCouncilMember
    );
    const guests = registrations.filter((r) => r.category === 'guest');

    return {
      councilRotaractors,
      rotarians,
      regularRotaractors,
      guests,
    };
  }, [registrations]);

  // Filtered lists
  const filterList = (list: Registration[]) => {
    return list.filter((r) => {
      // Announcement filter
      if (filterAnnounced === 'pending' && r.announced) return false;
      if (filterAnnounced === 'announced' && !r.announced) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(query) ||
        r.clubName.toLowerCase().includes(query) ||
        (r.councilDesignation && r.councilDesignation.toLowerCase().includes(query)) ||
        (r.bodDesignation && r.bodDesignation.toLowerCase().includes(query)) ||
        r.phone.includes(query)
      );
    });
  };

  const filteredCouncil = filterList(protocolCategorized.councilRotaractors);
  const filteredRotarians = filterList(protocolCategorized.rotarians);
  const filteredRotaractors = filterList(protocolCategorized.regularRotaractors);
  const filteredGuests = filterList(protocolCategorized.guests);

  const totalFilteredCount =
    filteredCouncil.length +
    filteredRotarians.length +
    filteredRotaractors.length +
    filteredGuests.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / MOC Header */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logos/pune-royal-shield.png"
                alt="Pune Royal Shield"
                width={56}
                height={56}
                className="object-contain max-h-full drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  MOC & Anchor Live Stage Portal
                </h1>
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefresh ? 'bg-emerald-400 opacity-75' : 'bg-slate-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                11th Installation Ceremony • Real-time Protocol Order for Stage Announcements
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Live Auto-Sync every 3.5s"
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>{autoRefresh ? 'Live Sync: ON' : 'Live Sync: PAUSED'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                soundEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Play pleasant chime when someone registers"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Download Excel */}
            <a
              href="/api/export"
              download
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 border border-emerald-400/40 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Download Excel (.xlsx)</span>
            </a>
          </div>

        </div>

        {/* Live sync timestamp */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Protocol Sequence: <strong className="text-amber-400">1. Council Rotaractors</strong> ➔ <strong className="text-purple-300">2. Rotarians</strong> ➔ <strong className="text-blue-300">3. General Rotaractors</strong> ➔ <strong className="text-emerald-300">4. Guests</strong>
          </span>
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <Clock className="w-3 h-3 text-slate-500" />
            Last synced: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-white/10">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Registered</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats?.total ?? 0}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">100%</span>
          </div>
        </div>

        {/* 1. Council Rotaractors */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-1 text-[11px] uppercase font-bold text-amber-300 tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> 1. Council
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {stats?.councilRotaractors ?? 0}
            </span>
            <span className="text-[10px] text-amber-400/80 font-medium">Top Priority</span>
          </div>
        </div>

        {/* 2. Rotarians */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-1 text-[11px] uppercase font-bold text-purple-300 tracking-wider">
            <Crown className="w-3.5 h-3.5 text-purple-400" /> 2. Rotarians
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-300">
              {stats?.rotarians ?? 0}
            </span>
            <span className="text-[10px] text-purple-400/80 font-medium">Visiting</span>
          </div>
        </div>

        {/* 3. Rotaractors */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-1 text-[11px] uppercase font-bold text-blue-300 tracking-wider">
            <Award className="w-3.5 h-3.5 text-blue-400" /> 3. Rotaractors
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-300">
              {stats?.regularRotaractors ?? 0}
            </span>
            <span className="text-[10px] text-blue-400/80 font-medium">Members</span>
          </div>
        </div>

        {/* 4. Guests */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-1 text-[11px] uppercase font-bold text-emerald-300 tracking-wider">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> 4. Guests
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              {stats?.guests ?? 0}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Invitees</span>
          </div>
        </div>

        {/* Announced Progress */}
        <div className="glass-card-interactive p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <span className="text-[11px] uppercase font-bold text-rose-300 tracking-wider">Announced</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-300">
              {stats?.announcedCount ?? 0}
            </span>
            <span className="text-[10px] text-rose-400/80 font-medium">
              Pending: {stats?.pendingCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, club, role, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Protocol ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('council')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'council'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👑 Council ({protocolCategorized.councilRotaractors.length})
          </button>
          <button
            onClick={() => setActiveTab('rotarians')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rotarians'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🎖️ Rotarians ({protocolCategorized.rotarians.length})
          </button>
          <button
            onClick={() => setActiveTab('rotaractors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'rotaractors'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👥 Rotaractors ({protocolCategorized.regularRotaractors.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'guests'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌟 Guests ({protocolCategorized.guests.length})
          </button>
        </div>

        {/* Announced status filter */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto justify-end">
          <button
            onClick={() => setFilterAnnounced('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterAnnounced === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Show All
          </button>
          <button
            onClick={() => setFilterAnnounced('pending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterAnnounced === 'pending'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⏳ Unannounced Only
          </button>
          <button
            onClick={() => setFilterAnnounced('announced')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterAnnounced === 'announced'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✅ Announced
          </button>
        </div>

      </div>

      {/* Main List Sections (Sorted strictly by user's protocol) */}
      <div className="space-y-6">

        {/* SECTION 1: DISTRICT COUNCIL MEMBERS (ROTARACTORS) */}
        {(activeTab === 'all' || activeTab === 'council') && (
          <ProtocolSection
            title="1. District Council Members (Rotaractors)"
            subtitle="Top protocol honor: Announce their name and council designation"
            badge="👑 PRIORITY 1"
            badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/40"
            count={filteredCouncil.length}
            items={filteredCouncil}
            onToggleAnnounced={handleToggleAnnounced}
            onDelete={handleDelete}
            emptyMessage="No District Council Rotaractors registered yet."
          />
        )}

        {/* SECTION 2: ROTARIANS */}
        {(activeTab === 'all' || activeTab === 'rotarians') && (
          <ProtocolSection
            title="2. Visiting & Parent Club Rotarians"
            subtitle="Senior dignitaries from parent Rotary Club and visiting Rotary clubs"
            badge="🎖️ PRIORITY 2"
            badgeColor="bg-purple-500/20 text-purple-300 border-purple-500/40"
            count={filteredRotarians.length}
            items={filteredRotarians}
            onToggleAnnounced={handleToggleAnnounced}
            onDelete={handleDelete}
            emptyMessage="No Rotarians registered yet."
          />
        )}

        {/* SECTION 3: GENERAL ROTARACTORS (Grouped by Club) */}
        {(activeTab === 'all' || activeTab === 'rotaractors') && (
          <ProtocolSection
            title="3. Fellow Rotaractors"
            subtitle="Visiting club members & host club rotaractors"
            badge="👥 PRIORITY 3"
            badgeColor="bg-blue-500/20 text-blue-300 border-blue-500/40"
            count={filteredRotaractors.length}
            items={filteredRotaractors}
            onToggleAnnounced={handleToggleAnnounced}
            onDelete={handleDelete}
            emptyMessage="No general Rotaractors registered yet."
          />
        )}

        {/* SECTION 4: GUESTS */}
        {(activeTab === 'all' || activeTab === 'guests') && (
          <ProtocolSection
            title="4. Guests & Non-Rotarians"
            subtitle="Friends, family members, and invited dignitaries"
            badge="🌟 PRIORITY 4"
            badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            count={filteredGuests.length}
            items={filteredGuests}
            onToggleAnnounced={handleToggleAnnounced}
            onDelete={handleDelete}
            emptyMessage="No guests registered yet."
          />
        )}

        {totalFilteredCount === 0 && !loading && (
          <div className="glass-panel p-12 rounded-3xl text-center border border-white/10 space-y-3">
            <Users className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No attendees match your criteria</h3>
            <p className="text-sm text-slate-400">
              Try adjusting your search terms or filters above.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}

// Subcomponent for each Protocol Section Card
interface ProtocolSectionProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  count: number;
  items: Registration[];
  onToggleAnnounced: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  emptyMessage: string;
}

function ProtocolSection({
  title,
  subtitle,
  badge,
  badgeColor,
  count,
  items,
  onToggleAnnounced,
  onDelete,
  emptyMessage,
}: ProtocolSectionProps) {
  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
              {badge}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">{title}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-xs font-bold px-3 py-1 bg-slate-800/80 rounded-full text-slate-300 self-start sm:self-auto">
          {count} {count === 1 ? 'Attendee' : 'Attendees'}
        </div>
      </div>

      {/* Grid of Attendees */}
      {items.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500 italic">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((attendee, index) => {
            const isAnnounced = attendee.announced;
            return (
              <div
                key={attendee.id}
                className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                  isAnnounced
                    ? 'bg-slate-900/40 border-slate-800/70 opacity-60'
                    : 'bg-slate-900/90 border-slate-700/80 shadow-md hover:border-amber-400/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Index + Name */}
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <h3
                          className={`text-base sm:text-lg font-bold tracking-tight ${
                            isAnnounced ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {attendee.name}
                        </h3>

                        {/* Council Designation if present */}
                        {attendee.councilDesignation && (
                          <div className="inline-flex items-center gap-1 mt-1 mr-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {attendee.councilDesignation}
                          </div>
                        )}

                        {/* Club BOD Designation if present */}
                        {attendee.isBodMember && attendee.bodDesignation && (
                          <div className="inline-flex items-center gap-1 mt-1 mr-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            <Briefcase className="w-3 h-3 text-cyan-400" />
                            BOD: {attendee.bodDesignation}
                          </div>
                        )}

                        {/* Club Name */}
                        {attendee.clubName !== 'N/A' && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{attendee.clubName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Announce Checkbox/Button */}
                    <button
                      onClick={() => onToggleAnnounced(attendee.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
                        isAnnounced
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95'
                      }`}
                      title={isAnnounced ? 'Click to mark as pending' : 'Click when announced by anchor'}
                    >
                      {isAnnounced ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Announced</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>Mark Read</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer with phone, time & delete */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {attendee.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(attendee.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => onDelete(attendee.id, attendee.name)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

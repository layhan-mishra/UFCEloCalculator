import React, { useState, useEffect } from 'react';
import { Search, Trophy, ShieldAlert, Award, ChevronRight, Activity } from 'lucide-react';
import Papa from 'papaparse'; // Assumes you use papaparse for your CSV

// Standard UFC Weight Class List for our filter bar
const WEIGHT_CLASSES = [
  { id: 'all', name: 'Pound for Pound' },
  { id: 'flyweight', name: 'Flyweight (125 lbs)' },
  { id: 'bantamweight', name: 'Bantamweight (135 lbs)' },
  { id: 'featherweight', name: 'Featherweight (145 lbs)' },
  { id: 'lightweight', name: 'Lightweight (155 lbs)' },
  { id: 'welterweight', name: 'Welterweight (170 lbs)' },
  { id: 'middleweight', name: 'Middleweight (185 lbs)' },
  { id: 'lightheavyweight', name: 'Light Heavyweight (205 lbs)' },
  { id: 'heavyweight', name: 'Heavyweight (265 lbs)' },
];

export default function App() {
  const [fighters, setFighters] = useState([]);
  const [filteredFighters, setFilteredFighters] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy Data Loader - Replace the path with your actual public CSV endpoint or state loader
  useEffect(() => {
    // In production, parse your 'data/fighter_elo_ratings.csv'
    // Papa.parse('/data/fighter_elo_ratings.csv', { download: true, header: true, ... })
    const mockData = [
      { name: "Jon Jones", elo: 2150, weight_class: "heavyweight", record: "27-1-0", status: "Champion" },
      { name: "Alex Pereira", elo: 2110, weight_class: "lightheavyweight", record: "12-2-0", status: "Champion" },
      { name: "Tom Aspinall", elo: 2080, weight_class: "heavyweight", record: "15-3-0", status: "Interim Champion" },
      { name: "Islam Makhachev", elo: 2095, weight_class: "lightweight", record: "26-1-0", status: "Champion" },
      { name: "Max Holloway", elo: 1985, weight_class: "lightweight", record: "26-7-0", status: "Contender" },
      { name: "Sean O'Malley", elo: 1950, weight_class: "bantamweight", record: "18-2-0", status: "Contender" },
    ];
    
    // Sort by ELO descending out of the gate
    const sorted = mockData.sort((a, b) => b.elo - a.elo);
    setFighters(sorted);
    setFilteredFighters(sorted);
  }, []);

  // Filter Logic handling search queries and weight class pill selections concurrently
  useEffect(() => {
    let result = fighters;

    if (activeTab !== 'all') {
      result = result.filter(f => f.weight_class === activeTab);
    }

    if (searchQuery.trim() !== '') {
      result = result.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFighters(result);
  }, [activeTab, searchQuery, fighters]);

  return (
    <div className="min-h-screen bg-[#080a0f] bg-radial-gradient text-slate-100 font-sans selection:bg-rose-600 selection:text-white">
      
      {/* PREMIUM HEADER BANNER */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080a0f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-2 rounded-lg shadow-lg shadow-rose-950/40">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-black tracking-wider text-xl uppercase italic bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                OCTAGON<span className="text-rose-500">ELO</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                v2.0 Live
              </span>
            </div>
          </div>

          {/* High-Performance Neon Search Bar */}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              placeholder="Search active fighters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#111622] border border-white/5 rounded-xl text-sm placeholder-slate-500 text-white focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all duration-200"
            />
          </div>

        </div>
      </header>

      {/* MAIN APPLICATION CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* HORIZONTAL WEIGHT CLASS NAVBAR */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-slate-500 block px-1">
            Filter Divisional Brackets
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {WEIGHT_CLASSES.map((wc) => (
              <button
                key={wc.id}
                onClick={() => setActiveTab(wc.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-200 ${
                  activeTab === wc.id
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500 shadow-md shadow-rose-950/50 scale-[1.02]'
                    : 'bg-[#111622] text-slate-400 border-white/5 hover:text-white hover:bg-[#161d2d]'
                }`}
              >
                {wc.name}
              </button>
            ))}
          </div>
        </div>

        {/* DATA CONTAINER & GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT 3 COLUMNS: THE MAIN LEADERBOARD */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Rankings Board
              </h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Showing {filteredFighters.length} competitors
              </span>
            </div>

            {filteredFighters.length === 0 ? (
              <div className="bg-[#111622] border border-dashed border-white/5 rounded-2xl p-12 text-center text-slate-500">
                No fighters found matching your current parameters.
              </div>
            ) : (
              <div className="bg-[#111622]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="divide-y divide-white/5">
                  {filteredFighters.map((fighter, index) => (
                    <div 
                      key={fighter.name}
                      className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      {/* Left: Rank & Name */}
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-sm tracking-wider text-slate-500 w-6 text-center tabular-nums">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-rose-400 transition-colors">
                              {fighter.name}
                            </span>
                            {fighter.status.includes('Champion') && (
                              <span className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30 tracking-wider">
                                👑 {fighter.status}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                            {fighter.weight_class} • <span className="text-slate-500">{fighter.record}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Elo Metric Value */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tabular-nums">
                            {fighter.elo}
                          </span>
                          <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">ELO SCORE</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: SIDEBAR METRICS CARDS */}
          <div className="space-y-4">
            <div className="bg-[#111622] border border-white/5 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-rose-500" />
                Engine Analytics
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Welcome to your fully automated UFC tracking platform. Elo metrics are completely recalculated from scratch every week directly from card outcomes.
              </p>
              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-mono text-slate-500">
                <span>Database Status</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Operational
                </span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
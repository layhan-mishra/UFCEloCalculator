import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Papa from 'papaparse';

export default function App() {
  const [fighters, setFighters] = useState([]);
  const [fighterBios, setFighterBios] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Track visible count incrementally by 15 items
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    async function loadProjectData() {
      try {
        // 1. Fetch profiles from the scraping pipeline
        const bioResponse = await fetch('/data/fighters.json');
        if (bioResponse.ok) {
          const bioData = await bioResponse.json();
          const bioMap = {};
          bioData.forEach(item => {
            if (item.name) bioMap[item.name.toLowerCase().trim()] = item;
          });
          setFighterBios(bioMap);
        }

        // 2. Fetch and parse calculated backend ELO ratings CSV
        const csvResponse = await fetch('/data/fighter_elo_ratings.csv');
        if (!csvResponse.ok) throw new Error("Ratings data file missing");
        
        const csvText = await csvResponse.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            const validFighters = results.data.filter(f => f.name && f.elo !== undefined);
            setFighters(validFighters);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("Data loading failure:", error);
        setIsLoading(false);
      }
    }

    loadProjectData();
  }, []);

  // Reset pagination window when typing a search query to keep results tight
  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery]);

  // Compute filtered items synchronously during the render cycle
  const filteredFighters = fighters.filter(f => {
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      if (!f.name?.toString().toLowerCase().includes(query)) return false;
    }
    return true;
  });

  // Paginate list based on active visible step count
  const displayFighters = filteredFighters.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#E11D48] selection:text-white antialiased">
      
      {/* BRAND HEADER */}
      <header className="border-b border-[#1A1A1A] bg-[#000000]">
        <div className="max-w-5xl mx-auto px-8 h-28 flex items-center justify-between gap-8">
          
          <div className="text-left">
            <h1 className="font-black tracking-tighter text-3xl uppercase italic text-[#FFFFFF]">
              UFC <span className="text-[#E11D48]">ELO</span> RANKINGS
            </h1>
          </div>

          {/* SEARCH SYSTEM */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
            <input
              type="text"
              placeholder="SEARCH ATHLETE REGISTRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#0A0A0A] border border-[#262626] rounded-none text-sm font-mono tracking-wider text-[#FFFFFF] uppercase placeholder-[#525252] focus:outline-none focus:border-[#E11D48] transition-colors"
            />
          </div>

        </div>
      </header>

      {/* CORE LEADERBOARD */}
      <main className="max-w-5xl mx-auto px-8 py-12">
        {isLoading ? (
          <div className="text-left font-mono text-xs text-[#525252] tracking-widest uppercase">
            PARSING ENGINE RECORDS...
          </div>
        ) : displayFighters.length === 0 ? (
          <div className="border border-[#1A1A1A] p-12 text-left font-mono text-xs text-[#525252] tracking-widest uppercase">
            NO ATHLETE RECORDS FOUND MATCHING SELECTION.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* COLUMN LABEL ROW */}
            <div className="grid grid-cols-12 gap-6 px-8 text-[11px] font-mono tracking-widest text-[#525252] uppercase">
              <div className="col-span-2 text-left">RANK</div>
              <div className="col-span-6 text-left">ATHLETE</div>
              <div className="col-span-2 text-left">BOUTS</div>
              <div className="col-span-2 text-left text-[#E11D48]">ELO RATING</div>
            </div>

            {/* SPACED LIST ENTRIES */}
            <div className="space-y-6">
              {displayFighters.map((fighter, index) => {
                const nameKey = fighter.name?.toString().toLowerCase().trim();
                const bio = fighterBios[nameKey] || {};

                return (
                  <div 
                    key={fighter.fighter_id || nameKey || index}
                    className="grid grid-cols-12 gap-6 px-8 py-8 items-center bg-[#050505] border border-[#1A1A1A] hover:border-[#E11D48] transition-colors"
                  >
                    {/* Position Rank - Left Aligned */}
                    <div className="col-span-2 font-mono text-base font-black text-[#525252] tracking-wider text-left tabular-nums">
                      {index + 1}
                    </div>

                    {/* Fighter Core Bio - Heavily Left Aligned */}
                    <div className="col-span-6 text-left">
                      <div className="font-black text-lg text-[#FFFFFF] uppercase tracking-wide">
                        {fighter.name}
                      </div>
                      {(bio.height || bio.reach || bio.stance) && (
                        <div className="text-[11px] font-mono text-[#737373] uppercase tracking-wider mt-2 space-x-1">
                          {bio.height && <span>HEIGHT: {bio.height}</span>} 
                          {bio.reach && <span>• REACH: {bio.reach}</span>} 
                          {bio.stance && <span>• STANCE: {bio.stance}</span>}
                        </div>
                      )}
                    </div>

                    {/* Fight Count Metric - Left Aligned */}
                    <div className="col-span-2 text-left font-mono text-sm font-bold text-[#A3A3A3] tracking-wider uppercase tabular-nums">
                      {fighter.fight_count !== undefined ? `${fighter.fight_count} FIGHTS` : '--'}
                    </div>

                    {/* Calculated Elo - Left Aligned */}
                    <div className="col-span-2 text-left font-mono font-black text-lg text-[#E11D48] tracking-widest tabular-nums">
                      {Math.round(fighter.elo)}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* EXPANSION CONTROL - LOADS 15 MORE AT A TIME */}
            {filteredFighters.length > visibleCount && (
              <div className="pt-6 text-left">
                <button
                  onClick={() => setVisibleCount(prev => prev + 15)}
                  className="px-8 py-4 border border-[#262626] hover:border-[#E11D48] text-xs font-mono font-black tracking-widest text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors bg-[#000000] uppercase"
                >
                  SHOW MORE RANKINGS
                </button>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
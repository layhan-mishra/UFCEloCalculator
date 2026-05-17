import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Papa from 'papaparse';

const WEIGHT_CLASSES = [
  { id: 'all', name: 'POUND FOR POUND' },
  { id: 'heavyweight', name: 'HEAVYWEIGHT' },
  { id: 'lightheavyweight', name: 'LIGHT HEAVYWEIGHT' },
  { id: 'middleweight', name: 'MIDDLEWEIGHT' },
  { id: 'welterweight', name: 'WELTERWEIGHT' },
  { id: 'lightweight', name: 'LIGHTWEIGHT' },
  { id: 'featherweight', name: 'FEATHERWEIGHT' },
  { id: 'bantamweight', name: 'BANTAMWEIGHT' },
  { id: 'flyweight', name: 'FLYWEIGHT' },
];

export default function App() {
  const [fighters, setFighters] = useState([]);
  const [fighterBios, setFighterBios] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // Compute filtered items synchronously during the render cycle to avoid state lag and ESLint warnings
  const filteredFighters = fighters.filter(f => {
    // Apply search filter if query is typed
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      if (!f.name?.toString().toLowerCase().includes(query)) return false;
    }

    // Apply weight class filter if a specific tab is selected
    if (activeTab !== 'all') {
      const nameKey = f.name?.toString().toLowerCase().trim();
      const profileClass = fighterBios[nameKey]?.weight?.toString().toLowerCase().replace(/\s+/g, '');
      const directClass = f.weight_class?.toString().toLowerCase().replace(/\s+/g, '');
      
      const matchesProfile = profileClass && profileClass.includes(activeTab);
      const matchesDirect = directClass && directClass.includes(activeTab);
      
      if (!matchesProfile && !matchesDirect) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#E11D48] selection:text-white">
      
      {/* BRAND HEADER */}
      <header className="border-b border-[#1A1A1A] bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
          
          <div>
            <h1 className="font-black tracking-tighter text-2xl uppercase italic text-[#FFFFFF]">
              UFC <span className="text-[#E11D48]">ELO</span> RANKINGS
            </h1>
          </div>

          {/* SEARCH SYSTEM */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]" />
            <input
              type="text"
              placeholder="SEARCH ATHLETE REGISTRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[#0A0A0A] border border-[#262626] rounded-none text-sm font-mono tracking-wider text-white uppercase placeholder-[#404040] focus:outline-none focus:border-[#E11D48] transition-colors"
            />
          </div>

        </div>
      </header>

      {/* WEIGHT DIVISION NAVIGATION */}
      <nav className="border-b border-[#1A1A1A] bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {WEIGHT_CLASSES.map((wc) => (
            <button
              key={wc.id}
              onClick={() => setActiveTab(wc.id)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-black tracking-widest border transition-colors ${
                activeTab === wc.id
                  ? 'bg-[#E11D48] text-[#FFFFFF] border-[#E11D48]'
                  : 'bg-[#000000] text-[#A3A3A3] border-transparent hover:text-[#FFFFFF]'
              }`}
            >
              {wc.name}
            </button>
          ))}
        </div>
      </nav>

      {/* CORE LEADERBOARD */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center font-mono py-12 text-[#404040] tracking-widest text-xs">
            PARSING ENGINE RECORDS...
          </div>
        ) : filteredFighters.length === 0 ? (
          <div className="border border-[#1A1A1A] p-12 text-center font-mono text-xs text-[#404040] tracking-widest uppercase">
            NO ATHLETE RECORDS FOUND MATCHING SELECTION.
          </div>
        ) : (
          <div className="border border-[#1A1A1A] bg-[#050505]">
            
            {/* GRID DESCRIPTORS */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#1A1A1A] text-[10px] font-mono tracking-widest text-[#404040] uppercase">
              <div className="col-span-1">RNK</div>
              <div className="col-span-6 md:col-span-7">ATHLETE</div>
              <div className="col-span-3 md:col-span-2 text-right">BOUTS</div>
              <div className="col-span-2 text-right text-[#E11D48]">ELO</div>
            </div>

            {/* GENERATED LIST ITEMS */}
            <div className="divide-y divide-[#1A1A1A]">
              {filteredFighters.map((fighter, index) => {
                const nameKey = fighter.name?.toString().toLowerCase().trim();
                const bio = fighterBios[nameKey] || {};

                return (
                  <div 
                    key={fighter.fighter_id || nameKey || index}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#0A0A0A] transition-colors"
                  >
                    {/* Position Rank */}
                    <div className="col-span-1 font-mono text-sm font-bold text-[#404040] tabular-nums">
                      {index + 1}
                    </div>

                    {/* Fighter Core Bio */}
                    <div className="col-span-6 md:col-span-7">
                      <div className="font-bold text-sm text-[#FFFFFF] uppercase tracking-wide">
                        {fighter.name}
                      </div>
                      {bio.height || bio.reach || bio.stance ? (
                        <div className="text-[10px] font-mono text-[#737373] uppercase tracking-wider mt-0.5">
                          {bio.height && `HT: ${bio.height}`} 
                          {bio.reach && ` • REACH: ${bio.reach}`} 
                          {bio.stance && ` • STANCE: ${bio.stance}`}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-[#404040] uppercase tracking-wider mt-0.5">
                          UFC COMPETITOR
                        </div>
                      )}
                    </div>

                    {/* Fight Count Metric */}
                    <div className="col-span-3 md:col-span-2 text-right font-mono text-xs text-[#A3A3A3] tracking-wide tabular-nums">
                      {fighter.fight_count !== undefined ? `${fighter.fight_count} FGT` : '--'}
                    </div>

                    {/* Calculated Elo */}
                    <div className="col-span-2 text-right font-mono font-black text-sm text-[#E11D48] tracking-wider tabular-nums">
                      {Math.round(fighter.elo)}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
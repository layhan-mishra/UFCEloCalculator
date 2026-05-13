import { useState, useEffect } from 'react'
import Papa from 'papaparse' // We'll install this in a second

function App() {
  const [fighters, setFighters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // This fetches the CSV file you just moved into the public folder
    fetch('/fighter_elo_ratings.csv')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { header: true });
        setFighters(results.data);
      });
  }, []);

  const filteredFighters = fighters.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            UFC <span className="text-ufc-red">ELO</span> RANKINGS
          </h1>
          <input 
            type="text"
            placeholder="Search fighter..."
            className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ufc-red w-full md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFighters.slice(0, 100).map((fighter, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-ufc-red transition-colors group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Rank #{index + 1}</span>
                  <h2 className="text-xl font-bold group-hover:text-ufc-red transition-colors">{fighter.name}</h2>
                  <p className="text-slate-400 text-sm">{fighter.fight_count} Pro Fights</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-white">
                    {Math.round(fighter.elo)}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Elo Rating</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
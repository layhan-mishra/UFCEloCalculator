import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function FighterDetail() {
  const { id } = useParams();
  const [historyData, setHistoryData] = useState(null);
  const [fighterName, setFighterName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFighterHistory() {
      try {
        const response = await fetch('/data/fighter_history.json');
        if (!response.ok) throw new Error("History registry missing");
        const data = await response.json();
        
        // Locate matching fighter historical tracking block by ID key
        if (data[id]) {
          setHistoryData(data[id]);
          // Capture name from the first available fight instance record
          if (data[id].length > 0) {
            const firstBout = data[id][0];
            setFighterName(firstBout.fighter_name || id.replace(/-/g, ' ').toUpperCase());
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed loading fighter history node:", error);
        setIsLoading(false);
      }
    }
    loadFighterHistory();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans p-8">
        <div className="max-w-4xl mx-auto font-mono text-xs text-[#525252] tracking-widest uppercase">
          RETRIEVING ATHLETE PROFILE HISTORY...
        </div>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="font-mono text-xs text-[#E11D48] tracking-widest uppercase">
            PROFILE RECORD NODE NOT FOUND.
          </div>
          <Link to="/" className="inline-block text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] underline tracking-widest uppercase">
            RETURN TO LEADERBOARD
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current dynamic stats straight from the latest chronological fight array index
  const latestBout = historyData[historyData.length - 1];
  const currentElo = latestBout.post_elo || 1000;

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#E11D48] selection:text-white antialiased p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* BACK NAVIGATION */}
        <div className="text-left">
          <Link to="/" className="text-xs font-mono font-black text-[#A3A3A3] hover:text-[#E11D48] tracking-widest uppercase transition-colors">
            ← BACK TO LEADERBOARD
          </Link>
        </div>

        {/* HERO VITAL HEAD HEADER */}
        <div className="border-b border-[#1A1A1A] pb-10 text-left space-y-4">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-[#FFFFFF]">
            {fighterName}
          </h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 font-mono">
            <div>
              <div className="text-[10px] text-[#525252] tracking-widest uppercase">CURRENT ELO</div>
              <div className="text-2xl font-black text-[#E11D48] mt-1">{Math.round(currentElo)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#525252] tracking-widest uppercase">TOTAL BOUTS</div>
              <div className="text-2xl font-black text-[#FFFFFF] mt-1">{historyData.length}</div>
            </div>
          </div>
        </div>

        {/* CHRONOLOGICAL BOUT LOGSIC HISTORY */}
        <div className="space-y-6">
          <h2 className="text-xs font-mono font-black tracking-widest text-[#525252] uppercase text-left">
            HISTORICAL PERFORMANCE DATA POINTS
          </h2>

          <div className="space-y-4">
            {/* Reverse loop history array so latest fights sit up top */}
            {[...historyData].reverse().map((bout, idx) => {
              const isWin = bout.result?.toLowerCase() === 'win';
              const isLoss = bout.result?.toLowerCase() === 'loss';
              
              let badgeColor = "text-[#A3A3A3] border-[#262626]";
              if (isWin) badgeColor = "text-[#E11D48] border-[#E11D48]/30 bg-[#E11D48]/5";
              if (isLoss) badgeColor = "text-[#525252] border-[#1A1A1A]";

              return (
                <div 
                  key={idx}
                  className="border border-[#1A1A1A] bg-[#050505] px-8 py-6 grid grid-cols-12 gap-4 items-center"
                >
                  {/* Outcome Check Box */}
                  <div className="col-span-2 text-left">
                    <span className={`inline-block px-3 py-1 border text-xs font-mono font-black tracking-widest uppercase ${badgeColor}`}>
                      {bout.result || "DRAW"}
                    </span>
                  </div>

                  {/* Opponent Segment */}
                  <div className="col-span-5 text-left">
                    <div className="text-[10px] font-mono text-[#525252] tracking-widest uppercase">OPPONENT</div>
                    <div className="font-bold text-base text-[#FFFFFF] uppercase tracking-wide mt-0.5">
                      {bout.opponent_name || "UNKNOWN ATHLETE"}
                    </div>
                  </div>

                  {/* Method / Details */}
                  <div className="col-span-3 text-left">
                    <div className="text-[10px] font-mono text-[#525252] tracking-widest uppercase">METHOD</div>
                    <div className="font-mono text-xs text-[#A3A3A3] uppercase tracking-wide mt-1">
                      {bout.method || "DECISION"}
                    </div>
                  </div>

                  {/* Calculated Resulting ELO Impact */}
                  <div className="col-span-2 text-right font-mono">
                    <div className="text-[10px] text-[#525252] tracking-widest uppercase">POST ELO</div>
                    <div className="text-sm font-black text-[#FFFFFF] mt-0.5 tabular-nums">
                      {bout.post_elo ? Math.round(bout.post_elo) : '--'}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
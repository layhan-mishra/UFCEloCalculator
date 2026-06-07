import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Papa from 'papaparse';
import './App.css';

const ITEMS_PER_PAGE = 15;
const DATA_PATHS = {
  metadata: '/data/fighters.json',
  ratings: '/data/fighter_elo_ratings.csv',
  history: '/data/fighter_history.json',
};

export default function App() {
  const [fighters, setFighters] = useState([]);
  const [fighterBios, setFighterBios] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // View States: null means show the Leaderboard, an ID string (e.g. 'jon-jones') means show that fighter's profile
  const [selectedFighterId, setSelectedFighterId] = useState(null);
  const [historyRegistry, setHistoryRegistry] = useState({});
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Load Leaderboard data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [metadataResponse, ratingsResponse] = await Promise.all([
          fetch(DATA_PATHS.metadata),
          fetch(DATA_PATHS.ratings),
        ]);

        if (!ratingsResponse.ok) {
          throw new Error('Unable to load fighter ratings.');
        }

        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          const bioMap = metadata.reduce((map, item) => {
            if (item.name) {
              map[item.name.toLowerCase().trim()] = item;
            }
            return map;
          }, {});
          setFighterBios(bioMap);
        }

        const csvText = await ratingsResponse.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            const parsed = results.data
              .filter((fighter) => fighter.name)
              .map((fighter) => ({
                ...fighter,
                elo: Number(fighter.elo),
                fight_count:
                  fighter.fight_count !== undefined
                    ? Number(fighter.fight_count)
                    : fighter.fights !== undefined
                    ? Number(fighter.fights)
                    : undefined,
              }))
              .sort((a, b) => b.elo - a.elo);

            setFighters(parsed);
            setIsLoading(false);
          },
          error: (parseError) => {
            throw parseError;
          },
        });
      } catch (loadError) {
        console.error('Loading error:', loadError);
        setError(loadError?.message || 'Failed to load ranking data.');
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Fetch the career histories only when a user selects a fighter profile
  useEffect(() => {
    if (!selectedFighterId) return;

    async function loadHistoryData() {
      // Skip if we already fetched and cached it
      if (historyRegistry[selectedFighterId]) return;

      setIsHistoryLoading(true);
      try {
        const response = await fetch(DATA_PATHS.history);
        if (response.ok) {
          const fullHistory = await response.json();
          setHistoryRegistry(fullHistory);
        }
      } catch (err) {
        console.error('Error parsing fighter history logs:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadHistoryData();
  }, [selectedFighterId, historyRegistry]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFighters = useMemo(
    () =>
      fighters.filter((fighter) => {
        if (!normalizedQuery) return true;
        return fighter.name?.toString().toLowerCase().includes(normalizedQuery);
      }),
    [fighters, normalizedQuery]
  );

  const displayFighters = filteredFighters.slice(0, visibleCount);
  const hasMore = filteredFighters.length > visibleCount;

  // Active Profile Lookup Logic
  const activeHistory = historyRegistry[selectedFighterId] || [];
  const selectedFighterLeaderboardData = fighters.find(
    (f) => (f.fighter_id || f.name?.toLowerCase().trim().replace(/\s+/g, '-')) === selectedFighterId
  );

  return (
    <div className="app-shell">
      <div className="app-container">
        
        {/* LEADERBOARD SUB-VIEW */}
        {!selectedFighterId ? (
          <>
            <header className="app-hero">
              <div className="hero-copy">
                <span className="eyebrow">UFC ELO dashboard</span>
                <h1>Elite fighter rankings built by computers</h1>
                <p>
                  Browse the latest UFC ELO ratings, compare athlete stats, and research the strongest
                  current contenders in the division.
                </p>
              </div>

              <div className="hero-search">
                <div className="search-field">
                  <Search className="search-icon" />
                  <input
                    id="fighter-search"
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search fighters or weight classes"
                    aria-label="Search fighters"
                  />
                </div>
                <p className="search-note">Search by full or partial fighter name.</p>
              </div>
            </header>

            <section className="summary-grid">
              <article className="summary-card">
                <span className="summary-label">Total fighters</span>
                <strong>{fighters.length}</strong>
              </article>
              <article className="summary-card">
                <span className="summary-label">Matching results</span>
                <strong>{filteredFighters.length}</strong>
              </article>
              <article className="summary-card">
                <span className="summary-label">Displayed</span>
                <strong>{displayFighters.length}</strong>
              </article>
            </section>

            <section className="rankings-section">
              {isLoading ? (
                <div className="status-card status-card--neutral">Loading fighter rankings…</div>
              ) : error ? (
                <div className="status-card status-card--error">
                  <h2>Data unavailable</h2>
                  <p>{error}</p>
                </div>
              ) : filteredFighters.length === 0 ? (
                <div className="status-card status-card--neutral">
                  No fighters match your search. Clear the search to view the full leaderboard.
                </div>
              ) : (
                <>
                  <div className="ranking-table">
                    <div className="table-head">
                      <span>Rank</span>
                      <span className="table-athlete">Athlete</span>
                      <span>ELO</span>
                      <span>Fights</span>
                    </div>
                    <div className="table-body">
                      {displayFighters.map((fighter, index) => {
                        const targetId = fighter.fighter_id || fighter.name?.toLowerCase().trim().replace(/\s+/g, '-');
                        const key = fighter.fighter_id || fighter.name || index;
                        const bio = fighterBios[fighter.name?.toLowerCase().trim()] || {};
                        
                        return (
                          <article 
                            key={key} 
                            className="table-row" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedFighterId(targetId)}
                          >
                            <span className="row-rank">{index + 1}</span>
                            <div className="row-athlete">
                              <strong style={{ transition: 'color 0.2s' }}>{fighter.name}</strong>
                              {(bio.height || bio.reach || bio.stance) && (
                                <small>
                                  {bio.stance ? `${bio.stance} · ` : ''}
                                  {bio.height ? `Ht ${bio.height}` : ''}
                                  {bio.height && bio.reach ? ' · ' : ''}
                                  {bio.reach ? `Reach ${bio.reach}` : ''}
                                </small>
                              )}
                            </div>
                            <span className="row-elo">{Number.isFinite(fighter.elo) ? Math.round(fighter.elo) : '—'}</span>
                            <span className="row-fights">
                              {fighter.fight_count !== undefined ? fighter.fight_count : '—'}
                            </span>
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  {hasMore && (
                    <div className="load-more-wrap">
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => setVisibleCount((count) => count + ITEMS_PER_PAGE)}
                      >
                        Load more rankings
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          
          /* INDIVIDUAL PROFILE HISTORY VIEW */
          <div className="rankings-section" style={{ animation: 'fadeIn 0.2s ease-out', marginTop: '2rem' }}>
            
            {/* BACK BUTTON */}
            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <button
                type="button"
                className="button button--ghost"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedFighterId(null)}
              >
                ← Return to Leaderboard
              </button>
            </div>

            {/* PROFILE HERO DETAILS CARD */}
            <header className="app-hero" style={{ padding: '2.5rem', marginBottom: '2rem', borderRadius: '4px' }}>
              <div className="hero-copy" style={{ maxWidth: '100%' }}>
                <span className="eyebrow" style={{ letterSpacing: '0.15em' }}>Athlete Profile Dossier</span>
                <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
                  {selectedFighterLeaderboardData?.name || selectedFighterId.replace(/-/g, ' ').toUpperCase()}
                </h1>
                
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#737373', fontFamily: 'monospace' }}>Current ELO Rating</span>
                    <strong style={{ fontSize: '1.75rem', color: '#E11D48' }}>
                      {selectedFighterLeaderboardData?.elo ? Math.round(selectedFighterLeaderboardData.elo) : '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#737373', fontFamily: 'monospace' }}>Scraped Bouts</span>
                    <strong style={{ fontSize: '1.75rem', color: '#FFFFFF' }}>
                      {selectedFighterLeaderboardData?.fight_count || activeHistory.length || '—'}
                    </strong>
                  </div>
                </div>
              </div>
            </header>

            {/* MATCH HISTORY DATA POINTS */}
            <h2 style={{ fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#525252', marginBottom: '1.5rem', textAlign: 'left' }}>
              Chronological Performance Log
            </h2>

            {isHistoryLoading ? (
              <div className="status-card status-card--neutral">Retrieving profile log points...</div>
            ) : activeHistory.length === 0 ? (
              <div className="status-card status-card--neutral">
                No advanced career tracking records found for this fighter index node.
              </div>
            ) : (
              <div className="ranking-table">
                <div className="table-head" style={{ gridTemplateColumns: '1.5fr 3fr 2.5fr 1.5fr' }}>
                  <span>Outcome</span>
                  <span className="table-athlete">Opponent</span>
                  <span>Method</span>
                  <span style={{ textAlign: 'right' }}>Post ELO</span>
                </div>
                <div className="table-body">
                  {/* Map history reverse chronological so their newest fights display first */}
                  {[...activeHistory].reverse().map((bout, idx) => {
                    const winState = bout.result?.toLowerCase() === 'win';
                    const lossState = bout.result?.toLowerCase() === 'loss';
                    
                    let outcomeStyle = { color: '#A3A3A3', fontWeight: 'bold' };
                    if (winState) outcomeStyle = { color: '#E11D48', fontWeight: 'black' };
                    if (lossState) outcomeStyle = { color: '#525252', fontWeight: 'normal' };

                    return (
                      <div 
                        key={idx} 
                        className="table-row" 
                        style={{ 
                          gridTemplateColumns: '1.5fr 3fr 2.5fr 1.5fr',
                          padding: '1.25rem 1.5rem',
                          borderBottom: '1px solid #1A1A1A'
                        }}
                      >
                        <span style={outcomeStyle}>{bout.result?.toUpperCase() || 'DRAW'}</span>
                        <div className="table-athlete" style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                          {bout.opponent_name || 'Unknown Athlete'}
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#A3A3A3' }}>
                          {bout.method || 'Decision'}
                        </span>
                        <span style={{ textAlign: 'right', fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 'bold' }}>
                          {bout.post_elo ? Math.round(bout.post_elo) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="app-footer">
          <p>Data sourced from local UFC ELO CSV and metadata exports.</p>
        </footer>
      </div>
    </div>
  );
}
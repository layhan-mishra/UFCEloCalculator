import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Papa from 'papaparse';
import './App.css';

const ITEMS_PER_PAGE = 16;
const DATA_PATHS = {
  metadata: '/data/fighters.json',
  ratings: '/data/fighter_elo_ratings.csv',
};

export default function App() {
  const [fighters, setFighters] = useState([]);
  const [fighterBios, setFighterBios] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="app-hero">
          <div className="hero-copy">
            <span className="eyebrow">UFC ELO dashboard</span>
            <h1>Elite fighter rankings built for analysis.</h1>
            <p>
              Browse the latest UFC ELO ratings, compare athlete stats, and surface the strongest
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
                    const key = fighter.fighter_id || fighter.name || index;
                    const bio = fighterBios[fighter.name?.toLowerCase().trim()] || {};
                    return (
                      <article key={key} className="table-row">
                        <span className="row-rank">{index + 1}</span>
                        <div className="row-athlete">
                          <strong>{fighter.name}</strong>
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

        <footer className="app-footer">
          <p>Data currently sourced from local UFC ELO CSV and metadata exports.</p>
        </footer>
      </div>
    </div>
  );
}

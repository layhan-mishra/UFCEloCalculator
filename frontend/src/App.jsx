import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Papa from 'papaparse';

const ITEMS_PER_PAGE = 15;
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
            const validFighters = results.data.filter(
              (fighter) => fighter.name && typeof fighter.elo === 'number'
            );
            setFighters(validFighters);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-600 selection:text-white antialiased">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-slate-500">UFC ELO analytics</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Ranked fighter ratings with live metadata.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Explore the current UFC ELO leaderboard, filter by athlete name, and compare fighter metadata from the latest dataset.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label htmlFor="fighter-search" className="sr-only">
              Search fighters
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                id="fighter-search"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search fighters by name"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-4 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Total fighters</p>
            <p className="mt-4 text-3xl font-semibold text-white">{fighters.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Search results</p>
            <p className="mt-4 text-3xl font-semibold text-white">{filteredFighters.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Visible rankings</p>
            <p className="mt-4 text-3xl font-semibold text-white">{displayFighters.length}</p>
          </div>
        </div>

        <section className="mt-10 space-y-6">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-slate-400">
              Loading ranking data...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-600/30 bg-slate-900 p-10 text-rose-300">
              <p className="font-semibold">Unable to load data</p>
              <p className="mt-2 text-sm text-slate-400">{error}</p>
            </div>
          ) : filteredFighters.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-slate-400">
              No fighters match your search. Try a different name or clear the search field.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-6 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-4 text-xs uppercase tracking-[0.32em] text-slate-500">
                <div className="col-span-2">Rank</div>
                <div className="col-span-6">Athlete</div>
                <div className="col-span-2">Bouts</div>
                <div className="col-span-2 text-right">ELO</div>
              </div>

              <div className="space-y-4">
                {displayFighters.map((fighter, index) => {
                  const nameKey = fighter.name?.toString().toLowerCase().trim();
                  const bio = fighterBios[nameKey] || {};

                  return (
                    <article
                      key={fighter.fighter_id || nameKey || index}
                      className="grid grid-cols-12 gap-6 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 transition hover:border-rose-500/60 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.12)]"
                    >
                      <div className="col-span-2 flex items-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                        {index + 1}
                      </div>
                      <div className="col-span-6">
                        <h2 className="text-base font-semibold text-white">{fighter.name}</h2>
                        {(bio.height || bio.reach || bio.stance) && (
                          <div className="mt-2 text-sm text-slate-500">
                            {bio.height && <span>Height: {bio.height}</span>}
                            {bio.reach && <span className="mx-2">•</span>}
                            {bio.reach && <span>Reach: {bio.reach}</span>}
                            {bio.stance && <span className="mx-2">•</span>}
                            {bio.stance && <span>Stance: {bio.stance}</span>}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                        {fighter.fight_count !== undefined ? `${fighter.fight_count} fights` : 'N/A'}
                      </div>
                      <div className="col-span-2 flex items-center justify-end text-right text-xl font-semibold text-rose-500">
                        {Math.round(fighter.elo)}
                      </div>
                    </article>
                  );
                })}
              </div>

              {hasMore && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + ITEMS_PER_PAGE)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:border-rose-500 hover:bg-slate-800"
                  >
                    Show more rankings
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

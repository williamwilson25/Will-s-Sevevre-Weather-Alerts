import { useEffect, useRef, useState } from 'react';
import type { Location } from '../types';
import { searchLocations } from '../api/weather';
import { detectLocation } from '../api/geolocation';
import { LocateIcon } from './icons';

interface Props {
  onSelect: (location: Location) => void;
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  function handleLocate() {
    setLocateError('');
    setLocating(true);
    detectLocation()
      .then((loc) => {
        onSelect(loc);
        setQuery(`${loc.name}, ${loc.admin1 ?? loc.country}`);
        setOpen(false);
      })
      .catch((err) => {
        setLocateError(err instanceof Error ? err.message : 'Could not get your location.');
      })
      .finally(() => setLocating(false));
  }

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchLocations(query)
        .then((locations) => {
          setResults(locations);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="location-search" ref={containerRef}>
      <div className="location-search-row">
        <input
          type="text"
          value={query}
          placeholder="Add a city, e.g. Dallas, TX"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          aria-label="Search for a location"
        />
        <button
          type="button"
          className="location-locate-btn"
          onClick={handleLocate}
          disabled={locating}
          aria-label="Use my current location"
          title="Use my current location"
        >
          <LocateIcon size={18} className={locating ? 'location-locate-spinning' : ''} />
        </button>
      </div>
      {locateError && <div className="location-search-status location-search-error">{locateError}</div>}
      {loading && <div className="location-search-status">Searching…</div>}
      {open && results.length > 0 && (
        <ul className="location-results">
          {results.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(loc);
                  setQuery(`${loc.name}, ${loc.admin1 ?? loc.country}`);
                  setOpen(false);
                }}
              >
                <span className="location-name">{loc.name}</span>
                <span className="location-meta">
                  {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

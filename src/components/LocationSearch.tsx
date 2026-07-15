import { useEffect, useRef, useState } from 'react';
import type { Location } from '../types';
import { searchLocations } from '../api/weather';

interface Props {
  onSelect: (location: Location) => void;
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      <input
        type="text"
        value={query}
        placeholder="Search city, e.g. Austin, TX"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Search for a location"
      />
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

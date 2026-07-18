import { useEffect, useState } from 'react';
import type { CurrentConditions, Location } from '../types';
import { fetchQuickConditions } from '../api/weather';
import WeatherIcon from './WeatherIcon';
import { MapPinIcon } from './icons';

interface Props {
  locations: Location[];
  activeId: string;
  activeConditions: CurrentConditions;
  onSelect: (id: string) => void;
}

export default function SavedLocationsList({ locations, activeId, activeConditions, onSelect }: Props) {
  const [conditions, setConditions] = useState<Record<string, CurrentConditions>>({});

  useEffect(() => {
    let cancelled = false;
    locations
      .filter((loc) => loc.id !== activeId)
      .forEach((loc) => {
        fetchQuickConditions(loc)
          .then((current) => {
            if (!cancelled) setConditions((prev) => ({ ...prev, [loc.id]: current }));
          })
          .catch(() => {
            // leave it out of the list rather than showing a broken row
          });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.map((l) => l.id).join(','), activeId]);

  if (locations.length < 2) return null;

  return (
    <section className="saved-locations-card">
      <h2>Saved Locations</h2>
      <ul className="saved-locations-list">
        {locations.map((loc) => {
          const current = loc.id === activeId ? activeConditions : conditions[loc.id];
          return (
            <li key={loc.id}>
              <button
                type="button"
                className={`saved-location-row${loc.id === activeId ? ' active' : ''}`}
                onClick={() => onSelect(loc.id)}
              >
                <span className="saved-location-name">
                  <MapPinIcon size={13} />
                  {loc.name}
                  {loc.admin1 ? `, ${loc.admin1}` : ''}
                </span>
                {current ? (
                  <span className="saved-location-temp">
                    {Math.round(current.temperature)}°
                    <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={20} />
                  </span>
                ) : (
                  <span className="saved-location-temp saved-location-loading">···</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

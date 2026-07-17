import { useEffect, useState } from 'react';
import type { Location } from '../types';
import { fetchNwsForecast, type NwsForecastData } from '../api/nwsForecast';
import { ChevronDownIcon, DropletIcon } from './icons';

interface Props {
  location: Location;
}

export default function NwsForecastCard({ location }: Props) {
  const [data, setData] = useState<NwsForecastData | null>(null);
  const [error, setError] = useState('');
  const [expandedNumber, setExpandedNumber] = useState<number | null>(1);

  useEffect(() => {
    let cancelled = false;
    setError('');
    fetchNwsForecast(location)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setExpandedNumber(result.periods[0]?.number ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load NWS forecast');
      });
    return () => {
      cancelled = true;
    };
  }, [location.id]);

  if (error) return null;
  if (!data || data.periods.length === 0) return null;

  return (
    <section className="nws-forecast">
      <h2>Will's Official Forecast</h2>
      <p className="nws-forecast-office">National Weather Service — {data.officeName}</p>
      <ul className="nws-forecast-list">
        {data.periods.slice(0, 14).map((period) => {
          const expanded = expandedNumber === period.number;
          return (
            <li key={period.number} className="nws-forecast-item">
              <button
                type="button"
                className="nws-forecast-row"
                onClick={() => setExpandedNumber(expanded ? null : period.number)}
                aria-expanded={expanded}
              >
                {period.icon && (
                  <img src={period.icon} alt="" className="nws-forecast-icon" width={40} height={40} />
                )}
                <div className="nws-forecast-main">
                  <div className="nws-forecast-name">{period.name}</div>
                  <div className="nws-forecast-short">{period.shortForecast}</div>
                </div>
                <div className="nws-forecast-side">
                  <span className="nws-forecast-temp">
                    {period.temperature}°{period.temperatureUnit}
                  </span>
                  {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation > 0 && (
                    <span className="nws-forecast-pop">
                      <DropletIcon size={11} /> {period.probabilityOfPrecipitation}%
                    </span>
                  )}
                </div>
                <ChevronDownIcon
                  size={16}
                  className={`nws-forecast-chevron${expanded ? ' nws-forecast-chevron-open' : ''}`}
                />
              </button>
              {expanded && (
                <div className="nws-forecast-detail">
                  <p>{period.detailedForecast}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

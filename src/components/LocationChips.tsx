import type { Location } from '../types';

interface Props {
  locations: Location[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function LocationChips({ locations, activeId, onSelect, onRemove }: Props) {
  if (locations.length <= 1) return null;

  return (
    <div className="location-chips" role="tablist" aria-label="Saved locations">
      {locations.map((loc) => {
        const active = loc.id === activeId;
        return (
          <div key={loc.id} className={`location-chip${active ? ' active' : ''}`}>
            <button
              type="button"
              className="location-chip-label"
              onClick={() => onSelect(loc.id)}
              aria-pressed={active}
            >
              {loc.name}
            </button>
            <button
              type="button"
              className="location-chip-remove"
              aria-label={`Remove ${loc.name}`}
              onClick={() => onRemove(loc.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

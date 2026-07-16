const NEWS9_RADAR_URL = 'https://www.news9.com/nextgen-live-radar';

export default function News9Radar() {
  return (
    <div className="news9-radar">
      <div className="radar-map-wrap">
        <iframe
          src={NEWS9_RADAR_URL}
          title="News9 NextGen Live Radar"
          className="news9-iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="radar-caption">
        Live from News9 Oklahoma City. If the map above doesn't load, News9 may not allow it to be
        embedded here —{' '}
        <a href={NEWS9_RADAR_URL} target="_blank" rel="noopener noreferrer">
          open it directly on news9.com ↗
        </a>
      </p>
    </div>
  );
}

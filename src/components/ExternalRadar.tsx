interface Props {
  url: string;
  label: string;
  title: string;
}

export default function ExternalRadar({ url, label, title }: Props) {
  return (
    <div className="external-radar">
      <div className="radar-map-wrap">
        <iframe
          src={url}
          title={title}
          className="external-radar-iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="radar-caption">
        Live from {label}. If the map above doesn't load, {label} may not allow it to be embedded
        here — <a href={url} target="_blank" rel="noopener noreferrer">open it directly ↗</a>
      </p>
    </div>
  );
}

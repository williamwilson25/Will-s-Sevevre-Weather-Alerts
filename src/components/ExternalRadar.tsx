interface Props {
  url: string;
  label: string;
  title: string;
}

export default function ExternalRadar({ url, label, title }: Props) {
  return (
    <section className="radar-section">
      <div className="radar-header">
        <h2>{title}</h2>
        <span className="radar-badge radar-badge-live">{label}</span>
      </div>

      <div className="radar-map-wrap">
        <iframe
          src={url}
          className="radar-map external-radar-iframe"
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="radar-caption">
        Live radar from News 9. If it doesn't load,{' '}
        <a href={url} target="_blank" rel="noreferrer">
          open it directly
        </a>
        .
      </p>
    </section>
  );
}

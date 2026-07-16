export default function LoadingSkeleton() {
  return (
    <div className="skeleton" aria-live="polite" aria-busy="true">
      <div className="skeleton-hero">
        <div className="skel skel-pill skel-center" style={{ width: '40%', height: 16 }} />
        <div className="skel skel-circle" style={{ width: 88, height: 88, margin: '18px auto' }} />
        <div className="skel skel-pill skel-center" style={{ width: '30%', height: 56 }} />
        <div className="skel skel-pill skel-center" style={{ width: '24%', height: 16, marginTop: 10 }} />
      </div>
      <div className="skel skel-pill" style={{ height: 44, borderRadius: 999 }} />
      <div className="skel skel-block" style={{ height: 90 }} />
      <div className="skel skel-block" style={{ height: 140 }} />
      <span className="sr-only">Loading weather…</span>
    </div>
  );
}

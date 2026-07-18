import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { StormReport, StormReportType } from '../types';
import {
  moderateStormReport,
  submitStormReport,
  watchApprovedReports,
  watchPendingReports,
} from '../api/stormReports';
import {
  TornadoIcon,
  HailIcon,
  WindIcon,
  WaveIcon,
  PlugIcon,
  DotsIcon,
  CameraIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from './icons';

interface Props {
  uid: string;
  email: string;
  locationName: string;
  isOwner: boolean;
}

const REPORT_TYPES: { type: StormReportType; label: string; icon: typeof TornadoIcon }[] = [
  { type: 'tornado', label: 'Tornado', icon: TornadoIcon },
  { type: 'hail', label: 'Hail', icon: HailIcon },
  { type: 'wind', label: 'Wind Damage', icon: WindIcon },
  { type: 'flooding', label: 'Flooding', icon: WaveIcon },
  { type: 'power_outage', label: 'Power Outage', icon: PlugIcon },
  { type: 'other', label: 'Other', icon: DotsIcon },
];

const TYPE_LABEL: Record<StormReportType, string> = Object.fromEntries(
  REPORT_TYPES.map((t) => [t.type, t.label]),
) as Record<StormReportType, string>;

const TYPE_ICON: Record<StormReportType, typeof TornadoIcon> = Object.fromEntries(
  REPORT_TYPES.map((t) => [t.type, t.icon]),
) as Record<StormReportType, typeof TornadoIcon>;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.round(hr / 24)} d ago`;
}

export default function StormReportsTab({ uid, email, locationName, isOwner }: Props) {
  const [type, setType] = useState<StormReportType>('tornado');
  const [locationText, setLocationText] = useState(locationName);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [approved, setApproved] = useState<StormReport[]>([]);
  const [pending, setPending] = useState<StormReport[]>([]);

  useEffect(() => watchApprovedReports(setApproved), []);
  useEffect(() => {
    if (!isOwner) return;
    return watchPendingReports(setPending);
  }, [isOwner]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!locationText.trim()) {
      setSubmitError('Add a location for the report.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitStormReport({
        uid,
        email,
        type,
        locationName: locationText.trim(),
        description: description.trim(),
        photo,
      });
      setDescription('');
      setPhoto(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setSubmitError("Couldn't submit the report. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleModerate(id: string, status: 'approved' | 'rejected') {
    try {
      await moderateStormReport(id, status);
    } catch {
      // the owner will just see it still sitting in the pending list
    }
  }

  return (
    <>
      <section className="storm-report-form-card">
        <h2>Submit a Report</h2>
        <form onSubmit={handleSubmit} className="storm-report-form">
          <div className="report-type-grid">
            {REPORT_TYPES.map(({ type: t, label, icon: Icon }) => (
              <button
                type="button"
                key={t}
                className={`report-type-button${type === t ? ' active' : ''}`}
                onClick={() => setType(t)}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Location</span>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Mustang, OK"
            />
          </label>
          <label className="field">
            <span>Details (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 1.25 inch hail, tree down on house"
              rows={2}
            />
          </label>
          <label className="report-photo-input">
            <CameraIcon size={16} />
            {photo ? photo.name : 'Attach a photo (optional)'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              hidden
            />
          </label>
          {submitError && <p className="form-error">{submitError}</p>}
          {submitted && (
            <p className="report-submitted-flash">
              <CheckCircleIcon size={14} /> Report submitted — pending approval.
            </p>
          )}
          <button type="submit" className="report-submit-button" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </section>

      {isOwner && pending.length > 0 && (
        <section className="storm-report-moderation-card">
          <h2>Pending Approval ({pending.length})</h2>
          <ul className="storm-report-list">
            {pending.map((report) => {
              const Icon = TYPE_ICON[report.type];
              return (
                <li key={report.id} className="storm-report-item">
                  {report.photoUrl && (
                    <img src={report.photoUrl} alt="" className="storm-report-photo" />
                  )}
                  <div className="storm-report-main">
                    <div className="storm-report-title">
                      <Icon size={16} />
                      {TYPE_LABEL[report.type]}
                      <span className="storm-report-time">{timeAgo(report.createdAt)}</span>
                    </div>
                    <div className="storm-report-location">{report.locationName}</div>
                    {report.description && <p className="storm-report-desc">{report.description}</p>}
                    <div className="storm-report-mod-actions">
                      <button type="button" onClick={() => handleModerate(report.id, 'approved')}>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="storm-report-reject"
                        onClick={() => handleModerate(report.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="storm-report-feed-card">
        <h2>Recent Reports</h2>
        {approved.length === 0 ? (
          <p className="empty-state">
            No reports yet — be the first to let others know what's happening near you.
          </p>
        ) : (
          <ul className="storm-report-list">
            {approved.map((report) => {
              const Icon = TYPE_ICON[report.type];
              return (
                <li key={report.id} className="storm-report-item">
                  {report.photoUrl && (
                    <img src={report.photoUrl} alt="" className="storm-report-photo" />
                  )}
                  <div className="storm-report-main">
                    <div className="storm-report-title">
                      <Icon size={16} />
                      {TYPE_LABEL[report.type]}
                      <span className="storm-report-time">{timeAgo(report.createdAt)}</span>
                    </div>
                    <div className="storm-report-location">{report.locationName}</div>
                    {report.description && <p className="storm-report-desc">{report.description}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="storm-report-disclaimer">
        <AlertTriangleIcon size={13} />
        Reports are submitted by app users, not verified by the National Weather Service — use
        official NWS alerts for life-safety decisions.
      </p>
    </>
  );
}
